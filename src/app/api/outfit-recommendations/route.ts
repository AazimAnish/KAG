import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Groq from "groq-sdk";
import { UserProfile } from '@/types/profile'; // Adjust the import path as necessary

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function validateUserProfile(userId: string): Promise<UserProfile> {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, body_type, gender')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('PROFILE_NOT_FOUND');
    }
    throw error;
  }

  const requiredFields: (keyof UserProfile)[] = ['body_type', 'gender'];
  const missingFields = requiredFields.filter(field => !profile[field]);

  if (missingFields.length > 0) {
    throw new Error('PROFILE_INCOMPLETE');
  }

  return profile;
}

async function validateWardrobe(userId: string) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const { data: wardrobeItems, error } = await supabase
    .from('wardrobe_items')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;

  if (!wardrobeItems?.length) {
    throw new Error('WARDROBE_EMPTY');
  }

  return wardrobeItems;
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { eventId, userId } = await request.json();

    if (!eventId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    try {
      const profile = await validateUserProfile(userId);
      const wardrobeItems = await validateWardrobe(userId);
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) {
        throw new Error('Event not found');
      }

      // Simplified and more structured prompt
      const systemPrompt = `You are a fashion expert creating outfit recommendations. 
Format your response as a valid JSON object with this exact structure:
{
  "outfit": {
    "description": "Brief outfit description",
    "items": [
      {
        "id": "ID from available items",
        "type": "Type of item",
        "styling_notes": "How to wear this piece",
        "image_url": "URL from available items"
      }
    ],
    "styling_tips": ["tip1", "tip2", "tip3"]
  }
}

Event Context:
- Description: ${event.description}
- Type: ${event.event_type}
- Date: ${event.date}

User Profile:
- Body Type: ${profile.body_type}
- Gender: ${profile.gender}

Available Items:
${JSON.stringify(wardrobeItems.map(item => ({
  id: item.id,
  type: item.type,
  image_url: item.image_url
})), null, 2)}`;

      console.log('Sending prompt to Groq API...');
      const startTime = Date.now();
          
      try {
        // Set a timeout for the Groq API call - 30 seconds
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('AI request timed out')), 30000);
        });
        
        const completionPromise = groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: systemPrompt
            }
          ],
          model: "mixtral-8x7b-32768",
          temperature: 0.5, // Reduced for more consistent output
          max_tokens: 1024,
          top_p: 1,
          stream: false,
          response_format: { type: "json_object" }
        });
        
        const completion = await Promise.race([
          completionPromise,
          timeoutPromise
        ]) as any; // Type assertion needed here
        
        console.log(`Groq API responded in ${Date.now() - startTime}ms`);
        
        const response = completion.choices[0]?.message?.content || '';
        let recommendation;

        try {
          // Clean and validate the response
          const cleanedResponse = response
            .replace(/```json\s*|\s*```/g, '') // Remove markdown code blocks
            .replace(/\n/g, ' ') // Remove newlines
            .trim();

          recommendation = JSON.parse(cleanedResponse);

          // Validate the structure
          if (!recommendation?.outfit?.items?.length) {
            throw new Error('Invalid outfit structure');
          }

          // Validate each item has required fields
          recommendation.outfit.items.forEach((item: { id: string; type: string; styling_notes: string; image_url: string }) => {
            if (!item.id || !item.type || !item.styling_notes || !item.image_url) {
              throw new Error('Missing required item fields');
            }
          });

          // Save recommendation to database
          const { error: saveError } = await supabase
            .from('outfit_recommendations')
            .insert({
              event_id: eventId,
              user_id: userId,
              recommendation: recommendation.outfit,
              created_at: new Date().toISOString()
            });

          if (saveError) {
            console.error('Error saving recommendation:', saveError);
          }

          return NextResponse.json(recommendation);

        } catch (parseError) {
          console.error('Error parsing AI response:', parseError);
          console.error('Raw response:', response);
          
          // Attempt to recover from common formatting issues
          try {
            const fixedResponse = response
              .replace(/\\/g, '') // Remove escaped characters
              .replace(/"\s*\+\s*"/g, '') // Fix concatenated strings
              .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas
              .replace(/([{\[]\s*),/g, '$1') // Remove leading commas
              .trim();
            
            recommendation = JSON.parse(fixedResponse);
            return NextResponse.json(recommendation);
          } catch (recoveryError) {
            return NextResponse.json(
              { 
                error: 'Failed to generate recommendation',
                details: 'Invalid response format'
              },
              { status: 500 }
            );
          }
        }
      } catch (aiError) {
        console.error('AI service error:', aiError);
        return NextResponse.json(
          { 
            error: 'Failed to generate recommendation from AI service',
            details: aiError instanceof Error ? aiError.message : 'AI service error'
          },
          { status: 500 }
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        switch (error.message) {
          case 'PROFILE_NOT_FOUND':
            return NextResponse.json(
              { 
                error: 'Please create your profile in the dashboard before getting recommendations',
                code: 'PROFILE_NOT_FOUND'
              },
              { status: 404 }
            );
          case 'PROFILE_INCOMPLETE':
            return NextResponse.json(
              { 
                error: 'Please complete your profile details in the dashboard before getting recommendations',
                code: 'PROFILE_INCOMPLETE'
              },
              { status: 400 }
            );
          case 'WARDROBE_EMPTY':
            return NextResponse.json(
              { 
                error: 'Please add some items to your wardrobe before getting recommendations',
                code: 'WARDROBE_EMPTY'
              },
              { status: 400 }
            );
          default:
            throw error;
        }
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in outfit recommendation:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate outfit recommendation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}