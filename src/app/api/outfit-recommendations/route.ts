import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Groq from "groq-sdk";
import { UserProfile } from '@/types/profile'; // Adjust the import path as necessary

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function validateUserProfile(userId: string): Promise<UserProfile> {
  const supabase = createRouteHandlerClient({ cookies });

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

  // Check wardrobe items
  const { data: wardrobeItems, error: wardrobeError } = await supabase
    .from('wardrobe_items')
    .select('*')
    .eq('user_id', userId);

  if (wardrobeError) throw wardrobeError;

  // Check store items (products)
  const { data: storeItems, error: storeError } = await supabase
    .from('products')
    .select('*')
    .eq('in_stock', true);

  if (storeError) throw storeError;

  const hasWardrobeItems = wardrobeItems?.length > 0;
  const hasStoreItems = storeItems?.length > 0;

  if (!hasWardrobeItems && !hasStoreItems) {
    throw new Error('WARDROBE_EMPTY');
  }

  return wardrobeItems ?? [];
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
      
      // Get store items for recommendations
      const { data: storeItems, error: storeError } = await supabase
        .from('products')
        .select('*')
        .eq('in_stock', true);
      
      if (storeError) throw storeError;
      
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) {
        throw new Error('Event not found');
      }

      // Check if we have wardrobe items and/or store items
      const hasWardrobeItems = wardrobeItems?.length > 0;
      const hasStoreItems = storeItems?.length > 0;
      
      // Process wardrobe items to have consistent fields
      const processedWardrobeItems = wardrobeItems?.map(item => ({
        id: item.id,
        type: item.type,
        name: item.name,
        category: item.category,
        color: item.color,
        image_url: item.image_url,
        isWardrobeItem: true
      })) || [];
      
      // Process store items to have consistent fields
      const processedStoreItems = (storeItems || []).map(item => ({
        id: item.id,
        type: item.type || item.category,
        name: item.name,
        category: item.category,
        color: item.color,
        image_url: item.image_url,
        price: item.price,
        isStoreItem: true
      }));
      
      console.log(`Found ${processedWardrobeItems.length} wardrobe items and ${processedStoreItems.length} store items`);
      
      // Remove redundancy - filter out store items that are too similar to wardrobe items
      const filteredStoreItems = processedStoreItems.filter(storeItem => {
        // Consider items redundant if they have the same category/type AND (color OR similar name)
        return !processedWardrobeItems.some(wardrobeItem => {
          // Check if types/categories match
          const sameType = 
            (wardrobeItem.type === storeItem.type) || 
            (wardrobeItem.category === storeItem.category);
          
          // Check if colors match (handle null or undefined values)
          const sameColor = 
            wardrobeItem.color && 
            storeItem.color && 
            wardrobeItem.color.toLowerCase() === storeItem.color.toLowerCase();
          
          // Check if names are similar (if both exist)
          const similarName = 
            wardrobeItem.name && 
            storeItem.name && 
            (wardrobeItem.name.toLowerCase().includes(storeItem.name.toLowerCase()) || 
             storeItem.name.toLowerCase().includes(wardrobeItem.name.toLowerCase()));
          
          // Consider redundant if type matches AND (color or name matches)
          const isRedundant = sameType && (sameColor || similarName);
          
          if (isRedundant) {
            console.log(`Filtered out redundant store item: ${storeItem.name} (${storeItem.type}) that matches wardrobe item: ${wardrobeItem.name} (${wardrobeItem.type})`);
          }
          
          return isRedundant;
        });
      });
      
      console.log(`After filtering, ${filteredStoreItems.length} unique store items remain`);

      // Simplified and more structured prompt with fixed template syntax
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

Rules:
1. Create a stylish outfit appropriate for the event
${hasStoreItems ? '2. Include at least 1 store item in your recommendations' : '2. Create the outfit from the available items'}
3. Provide detailed styling notes for each item
4. Include 3 styling tips for the overall outfit
5. Avoid redundant items - don't recommend similar items that serve the same purpose

Available Wardrobe Items:
${JSON.stringify(processedWardrobeItems, null, 2)}

Available Store Items:
${JSON.stringify(filteredStoreItems, null, 2)}`;

      console.log('Sending prompt to Groq API...');
      const startTime = Date.now();

      try {
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
          temperature: 0.5,
          max_tokens: 1024,
          top_p: 1,
          stream: false,
          response_format: { type: "json_object" }
        });

        const completion = await Promise.race([completionPromise, timeoutPromise]) as any;

        console.log(`Groq API responded in ${Date.now() - startTime}ms`);

        const response = completion.choices[0]?.message?.content || '';
        let recommendation;

        try {
          const cleanedResponse = response
            .replace(/```json\s*|\s*```/g, '')
            .replace(/\n/g, ' ')
            .trim();

          recommendation = JSON.parse(cleanedResponse);

          if (!recommendation?.outfit?.items?.length) {
            throw new Error('Invalid outfit structure');
          }

          recommendation.outfit.items.forEach((item: { id: string; type: string; styling_notes: string; image_url: string }) => {
            if (!item.id || !item.type || !item.styling_notes || !item.image_url) {
              throw new Error('Missing required item fields');
            }
          });

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

          try {
            const fixedResponse = response
              .replace(/\\/g, '')
              .replace(/"\s*\+\s*"/g, '')
              .replace(/,\s*([}\]])/g, '$1')
              .replace(/([{\[]\s*),/g, '$1')
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
                error: 'No items available for outfit recommendations. Please add items to your wardrobe or wait for store products to be available.',
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