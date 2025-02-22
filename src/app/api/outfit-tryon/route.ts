import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { fal } from "@fal-ai/client";

// Configure fal.ai client
fal.config({
  credentials: process.env.FAL_KEY
});

export async function POST(request: Request) {
  try {
    const { userId, outfitImageUrl, userImageUrl } = await request.json();

    if (!userId || !outfitImageUrl || !userImageUrl) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Call the fal.ai API
    const result = await fal.subscribe("fashn/tryon", {
      input: {
        model_image: userImageUrl,
        garment_image: outfitImageUrl,
        category: "tops", // You might want to make this dynamic based on the outfit type
        garment_photo_type: "auto",
        nsfw_filter: true,
        guidance_scale: 2,
        timesteps: 50,
        seed: 42,
        num_samples: 1
      }
    });

    return NextResponse.json(result.data);

  } catch (error) {
    console.error('Error in outfit try-on:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate try-on image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 