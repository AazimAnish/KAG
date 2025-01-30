import Groq from "groq-sdk";
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function validateUserProfile(userId: string) {
  interface Profile {
    id: string;
    body_type: string;
    gender: string;
  }

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

  const requiredFields = ['body_type', 'gender'] as (keyof Profile)[];
  const missingFields = requiredFields.filter(field => !profile[field]);

  if (missingFields.length > 0) {
    throw new Error('PROFILE_INCOMPLETE');
  }

  return profile as Profile;
}

async function validateWardrobe(userId: string) {
  const { data: items, error } = await supabase
    .from('wardrobe_items')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed');

  if (error) throw error;
  if (!items?.length) throw new Error('WARDROBE_EMPTY');
  
  return items;
}

export async function POST(request: Request) {
  try {
    const { eventId, userId } = await request.json();

    if (!eventId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    try {
      // Validate user profile first
      const profile = await validateUserProfile(userId);
      console.log('Profile validated successfully');

      // Fetch event details
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) {
        console.error('Error fetching event:', eventError);
        return NextResponse.json(
          { error: 'Event not found' },
          { status: 404 }
        );
      }

      // Validate wardrobe
      const wardrobeItems = await validateWardrobe(userId);
      console.log(`Found ${wardrobeItems.length} wardrobe items`);

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: `As a fashion expert, create an outfit recommendation based on the following:

Event Details:
${event.description}
Type: ${event.event_type}
Date: ${event.date}

User Profile:
Body Type: ${profile.body_type}
Gender: ${profile.gender}

Available Wardrobe Items:
${JSON.stringify(wardrobeItems, null, 2)}

Provide recommendations in the following JSON format:
{
  "outfit": {
    "items": [
      {
        "id": "item_id",
        "type": "item_type",
        "styling_notes": "how to wear",
        "image_url": "url_from_wardrobe_items"
      }
    ],
    "description": "overall outfit description",
    "styling_tips": ["tip1", "tip2", "tip3"]
  }
}`
          }
        ],
        model: "mixtral-8x7b-32768",
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
        stream: false,
      });

      const response = completion.choices[0]?.message?.content || '';
      let recommendation;
      
      try {
        recommendation = JSON.parse(response);
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        return NextResponse.json(
          { error: 'Failed to generate recommendation' },
          { status: 500 }
        );
      }

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