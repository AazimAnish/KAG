import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { fal } from "@fal-ai/client";
import { supabase } from '@/lib/supabase/client';

// Configure fal.ai client
fal.config({
  credentials: process.env.FAL_KEY
});

export async function POST(request: Request) {
  try {
    const { userId, topImageUrl, bottomImageUrl, userImageUrl } = await request.json();

    if (!userId || !userImageUrl || (!topImageUrl && !bottomImageUrl)) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Process top outfit if provided
    let topResult = null;
    if (topImageUrl) {
      topResult = await fal.subscribe("fashn/tryon", {
        input: {
          model_image: userImageUrl,
          garment_image: topImageUrl,
          category: "tops",
          garment_photo_type: "auto",
          nsfw_filter: true,
          guidance_scale: 2.5, // Increased for better detail preservation
          timesteps: 60, // Increased for better quality
          seed: Math.floor(Math.random() * 1000), // Randomized seed for variety
          num_samples: 1,
          restore_clothes: true,
          restore_background: true, // Added to preserve background
          adjust_hands: true // Added to handle sleeves better
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            console.log("Processing top:", update.logs);
          }
        },
      });
    }

    // Process bottom outfit if provided
    let finalResult = null;
    if (bottomImageUrl) {
      finalResult = await fal.subscribe("fashn/tryon", {
        input: {
          model_image: topResult ? topResult.data.images[0].url : userImageUrl,
          garment_image: bottomImageUrl,
          category: "bottoms",
          garment_photo_type: "auto",
          nsfw_filter: true,
          guidance_scale: 2.5,
          timesteps: 60,
          seed: Math.floor(Math.random() * 1000),
          num_samples: 1,
          restore_clothes: true,
          restore_background: true,
          cover_feet: true // Added to handle long bottoms
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            console.log("Processing bottom:", update.logs);
          }
        },
      });
    }

    if (!topResult && !finalResult) {
      throw new Error('No results generated');
    }

    const resultUrl = finalResult ? finalResult.data.images[0].url : topResult!.data.images[0].url;
    
    // Save the result to Supabase with additional metadata
    const { data: savedTryOn, error: saveError } = await supabase
      .from('outfit_tryons')
      .insert({
        user_id: userId,
        top_image_url: topImageUrl,
        bottom_image_url: bottomImageUrl,
        result_image_url: resultUrl,
        created_at: new Date().toISOString(),
        metadata: {
          top_processed: !!topResult,
          bottom_processed: !!finalResult,
          processing_time: Date.now(),
          settings_used: {
            guidance_scale: 2.5,
            timesteps: 60
          }
        }
      })
      .select()
      .single();

    if (saveError) throw saveError;

    return NextResponse.json({
      success: true,
      tryOn: savedTryOn,
      resultImage: finalResult ? finalResult.data.images[0] : topResult!.data.images[0]
    });

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