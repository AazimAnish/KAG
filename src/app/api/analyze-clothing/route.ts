import Groq from "groq-sdk";
import { NextResponse } from 'next/server';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function fetchImageAsBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error('Error fetching image:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing image URL' },
        { status: 400 }
      );
    }

    try {
      const base64Image = await fetchImageAsBase64(imageUrl);
      
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
        max_tokens: 100, // Reduced for more concise responses
      });

      const response = completion.choices[0]?.message?.content || '';

      try {
        // Extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*?\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : null;
        
        if (!jsonString) {
          throw new Error('No JSON found in response');
        }

        const analysisResult = JSON.parse(jsonString);
        
        // Ensure the response has the correct structure
        if (!analysisResult.type || !Array.isArray(analysisResult.tags)) {
          throw new Error('Invalid response structure');
        }

        // Clean and format the response
        return NextResponse.json({
          type: analysisResult.type.toLowerCase().trim(),
          tags: analysisResult.tags.map((tag: string) => 
            typeof tag === 'string' ? tag.toLowerCase().trim() : ''
          ).filter(Boolean).slice(0, 4) // Ensure max 4 tags
        });
      } catch (parseError) {
        console.error('Error parsing Groq response:', parseError);
        // Fallback parsing for non-JSON responses
        const type = response.match(/type["'\s:]+([^"'\n,}\]]+)/i)?.[1]?.trim().toLowerCase() || "unknown";
        const tagsMatch = response.match(/tags["'\s:]+\[(.*?)\]/)?.[1];
        const tags = tagsMatch ? 
          tagsMatch.split(',')
            .map(t => t.trim().toLowerCase().replace(/['"]/g, ''))
            .filter(Boolean)
            .slice(0, 4) : 
          [];
        
        return NextResponse.json({ type, tags });
      }
    } catch (imageError) {
      console.error('Error processing image:', imageError);
      return NextResponse.json(
        {
          error: 'Failed to process image',
          details: imageError instanceof Error ? imageError.message : 'Unknown error'
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}