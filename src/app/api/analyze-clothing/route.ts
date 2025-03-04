import Groq from "groq-sdk";
import { NextResponse } from 'next/server';
import crypto from 'crypto';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Simple in-memory cache to avoid repeated analysis
// In production, consider using Redis or a database
const analysisCache = new Map<string, any>();

// Create hash from image data to use as cache key
async function generateImageHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return crypto.createHash('md5').update(Buffer.from(buffer)).digest('hex');
}

// More efficient base64 conversion with smaller chunks
async function streamToBase64(file: File): Promise<string> {
  // Resize if image is too large (optional step if image sizes are causing issues)
  if (file.size > 5 * 1024 * 1024) {
    // For extremely large images, we could implement resizing here
    console.log("Large image detected", file.size);
  }
  
  const arrayBuffer = await file.arrayBuffer();
  const contentType = file.type || 'image/jpeg';
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  return `data:${contentType};base64,${base64}`;
}

export async function POST(request: Request) {
  const startTime = Date.now();
  console.log("API processing started");
  
  try {
    const formData = await request.formData();
    const image = formData.get('image');

    if (!image || !(image instanceof File)) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    console.log(`Image received: ${image.name}, size: ${image.size} bytes`);
    
    // Check cache first (optional, remove if not needed)
    const imageHash = await generateImageHash(image);
    if (analysisCache.has(imageHash)) {
      console.log("Cache hit! Returning cached analysis");
      return NextResponse.json(analysisCache.get(imageHash));
    }
    
    console.log("Converting image to base64");
    const base64Image = await streamToBase64(image);
    console.log(`Base64 conversion completed in ${Date.now() - startTime}ms`);
    
    console.log("Sending to Groq API");
    const groqStartTime = Date.now();
    
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this clothing item and output ONLY a JSON object with two fields:
1. "type": a single word or short phrase describing the main clothing type
2. "tags": an array with exactly 4 elements: [color, pattern, style, fit]

Example:
{
  "type": "hoodie",
  "tags": ["black", "solid", "casual", "regular-fit"]
}`
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image
              }
            }
          ]
        }
      ],
      model: "llama-3.2-90b-vision-preview",
      temperature: 0.1,
      max_tokens: 100,
      response_format: { type: "json_object" }
    });

    console.log(`Groq API response received in ${Date.now() - groqStartTime}ms`);
    
    const response = completion.choices[0]?.message?.content || '';

    try {
      // Parse the JSON response
      const analysisResult = JSON.parse(response);
      
      // Validate response structure
      if (!analysisResult.type || !Array.isArray(analysisResult.tags)) {
        throw new Error('Invalid response structure');
      }

      // Clean up and standardize the response
      const result = {
        type: analysisResult.type.toLowerCase().trim(),
        tags: analysisResult.tags
          .map((tag: string) => typeof tag === 'string' ? tag.toLowerCase().trim() : '')
          .filter(Boolean)
          .slice(0, 4)
      };
      
      // Save to cache
      analysisCache.set(imageHash, result);
      
      // Clear old cache entries if cache gets too large
      if (analysisCache.size > 100) {
        const oldestKey = analysisCache.keys().next().value;
        if (oldestKey) {
          analysisCache.delete(oldestKey);
        }
      }
      
      console.log(`Total processing time: ${Date.now() - startTime}ms`);
      return NextResponse.json(result);
    } catch (parseError) {
      console.error('Error parsing Groq response:', parseError, response);
      // Provide fallback data
      const fallbackResult = { 
        type: "unknown", 
        tags: ["unidentified", "item", "clothing", "unknown"] 
      };
      return NextResponse.json(fallbackResult, { status: 200 });
    }
  } catch (error) {
    const errorTime = Date.now() - startTime;
    console.error(`Analysis error after ${errorTime}ms:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze image' },
      { status: 500 }
    );
  }
}