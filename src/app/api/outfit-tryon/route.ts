import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { fal } from "@fal-ai/client";
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// Configure fal.ai client with proper error handling
if (!process.env.FAL_KEY) {
  console.error('FAL_KEY environment variable is not set');
}

fal.config({
  credentials: process.env.FAL_KEY
});

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    const { userId, topImageUrl, bottomImageUrl, userImageUrl } = await request.json();

    // Validate required parameters
    if (!userId || !userImageUrl || (!topImageUrl && !bottomImageUrl)) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    console.log('Starting outfit try-on process with:', {
      userId,
      userImageUrl: userImageUrl?.substring(0, 100) + '...',
      topImageUrl: topImageUrl?.substring(0, 100) + '...',
      bottomImageUrl: bottomImageUrl?.substring(0, 100) + '...',
    });

    // Process top outfit if provided
    let topResult = null;
    if (topImageUrl) {
      console.log('Processing top image...');
      try {
        topResult = await fal.subscribe("fashn/tryon", {
          input: {
            model_image: userImageUrl,
            garment_image: topImageUrl,
            category: "tops",
            garment_photo_type: "auto",
            nsfw_filter: true,
            guidance_scale: 2.5,
            timesteps: 50,
            seed: Math.floor(Math.random() * 1000),
            num_samples: 1,
            restore_clothes: true,
            restore_background: true,
            adjust_hands: true
          },
          logs: true,
          onQueueUpdate: (update) => {
            if (update.status === "IN_PROGRESS") {
              console.log("Processing top:", update.logs.map(log => log.message));
            }
          },
        });
        console.log('Top image processed successfully');
      } catch (topError) {
        console.error('Error processing top image:', topError);
        throw new Error(`Top image processing failed: ${topError instanceof Error ? topError.message : 'Unknown error'}`);
      }
    }

    // Process bottom outfit if provided
    let finalResult = null;
    if (bottomImageUrl) {
      console.log('Processing bottom image...');
      try {
        // Use the result from the top image processing or the original user image
        const inputImage = topResult ? topResult.data.images[0].url : userImageUrl;
        
        finalResult = await fal.subscribe("fashn/tryon", {
          input: {
            model_image: inputImage,
            garment_image: bottomImageUrl,
            category: "bottoms",
            garment_photo_type: "auto",
            nsfw_filter: true,
            guidance_scale: 2.5,
            timesteps: 50,
            seed: Math.floor(Math.random() * 1000),
            num_samples: 1,
            restore_clothes: true,
            restore_background: true,
            cover_feet: true
          },
          logs: true,
          onQueueUpdate: (update) => {
            if (update.status === "IN_PROGRESS") {
              console.log("Processing bottom:", update.logs.map(log => log.message));
            }
          },
        });
        console.log('Bottom image processed successfully');
      } catch (bottomError) {
        console.error('Error processing bottom image:', bottomError);
        throw new Error(`Bottom image processing failed: ${bottomError instanceof Error ? bottomError.message : 'Unknown error'}`);
      }
    }

    if (!topResult && !finalResult) {
      throw new Error('No results generated');
    }

    // Get the final result image URL
    const resultUrl = finalResult ? finalResult.data.images[0].url : topResult!.data.images[0].url;
    console.log('Final result URL:', resultUrl.substring(0, 100) + '...');
    
    // Define the try-on data to be saved
    const tryOnData = {
      user_id: userId,
      top_image_url: topImageUrl || null,
      bottom_image_url: bottomImageUrl || null,
      result_image_url: resultUrl,
      created_at: new Date().toISOString(),
      metadata: {
        top_processed: !!topResult,
        bottom_processed: !!finalResult,
        processing_time: Date.now(),
        settings_used: {
          guidance_scale: 2.5,
          timesteps: 50
        }
      }
    };

    // Save the result to Supabase
    console.log('Saving result to database...');
    const { data: savedTryOn, error: saveError } = await supabase
      .from('outfit_tryons')
      .insert(tryOnData)
      .select()
      .single();

    if (saveError) {
      console.error('Error saving try-on to database:', saveError);
      // Continue even if saving to DB fails, to at least return the generated image
    }

    console.log('Try-on process completed successfully');
    
    // Return the result
    return NextResponse.json({
      success: true,
      tryOn: savedTryOn || tryOnData,
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