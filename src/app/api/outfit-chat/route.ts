import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export async function POST(request: Request) {
  try {
    const { userId, outfitId, message, previousMessages = [], chatId: existingChatId, outfitDetails } = await request.json();
    let chatId = existingChatId;

    const supabase = createRouteHandlerClient({ cookies });

    // Create new chat if chatId is not provided
    if (!chatId) {
      // First verify that the outfit recommendation exists if outfitId is provided
      let outfitValid = true;
      if (outfitId) {
        const { data: outfitExists, error: outfitCheckError } = await supabase
          .from('outfit_recommendations')
          .select('id')
          .eq('id', outfitId)
          .single();
        
        if (outfitCheckError || !outfitExists) {
          console.error('Outfit recommendation not found:', outfitId);
          outfitValid = false;
          
          // Only return an error if the client specifically requires an outfit link
          if (outfitDetails?.requireOutfitLink) {
            return NextResponse.json(
              { error: 'Outfit recommendation not found. The recommendation may have been deleted.' },
              { status: 404 }
            );
          }
          // Otherwise, we'll continue but create a chat without the outfit_recommendation_id
        }
      }

      // Proceed with chat creation
      const chatData = {
        user_id: userId,
        title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
        created_at: new Date().toISOString(),
        last_message_at: new Date().toISOString()
      };
      
      // Only include outfit_recommendation_id if it's valid
      if (outfitId && outfitValid) {
        // @ts-ignore - We're adding this dynamically
        chatData.outfit_recommendation_id = outfitId;
      }
      
      const { data: chat, error: chatError } = await supabase
        .from('outfit_chats')
        .insert(chatData)
        .select()
        .single();

      if (chatError) {
        console.error('Chat creation error:', chatError);
        // Return a specific error response instead of throwing
        return NextResponse.json(
          { error: 'Failed to create chat', details: chatError },
          { status: 500 }
        );
      }
      chatId = chat.id;
    }

    // Save user message
    const { error: userMessageError } = await supabase
      .from('chat_messages')
      .insert({
        chat_id: chatId,
        user_id: userId,
        content: message,
        role: 'user',
        created_at: new Date().toISOString()
      });

    if (userMessageError) {
      console.error('User message error:', userMessageError);
      return NextResponse.json(
        { error: 'Failed to save user message', details: userMessageError },
        { status: 500 }
      );
    }

    // Only include outfit context if outfitDetails is provided and valid
    let contextPrompt = "";
    
    if (outfitDetails) {
      try {
        // Start with a base prompt
        contextPrompt = "As an AI fashion stylist, ";
        
        // Add outfit description if available
        if (outfitDetails.description) {
          contextPrompt += `help with this outfit: ${outfitDetails.description}. `;
        } else {
          contextPrompt += "help with fashion advice. ";
        }
        
        // Add items if available
        if (outfitDetails.items && Array.isArray(outfitDetails.items)) {
          contextPrompt += `\nThe outfit includes: ${outfitDetails.items.map((item: any) => item.type || 'item').join(', ')}. `;
        }
        
        // Add styling tips if available
        if (outfitDetails.styling_tips && Array.isArray(outfitDetails.styling_tips)) {
          contextPrompt += `\nPrevious styling tips: ${outfitDetails.styling_tips.join(', ')}. `;
        }
        
        // Add user question
        contextPrompt += `\n\nUser question: ${message}`;
        
        // Add final instruction
        contextPrompt += `\n\nProvide specific advice considering the existing outfit components.`;
      } catch (error) {
        console.error("Error building context prompt:", error);
        // Fall back to a simple prompt if there was an error
        contextPrompt = `As an AI fashion stylist, help with this fashion question: ${message}`;
      }
    } else {
      // Simple prompt for general fashion questions
      contextPrompt = `As an AI fashion stylist, please provide advice on this fashion question: ${message}`;
    }

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a helpful fashion stylist assistant. Provide specific advice about outfit modifications, alternatives, and styling tips."
          },
          ...previousMessages.map((msg: any) => ({
            role: msg.role,
            content: msg.content
          })),
          {
            role: "user",
            content: contextPrompt
          }
        ],
        model: "mixtral-8x7b-32768",
        temperature: 0.7,
        max_tokens: 800,
        top_p: 1,
        stream: false
      });

      const aiResponse = completion.choices[0]?.message?.content || '';

      // Save AI response
      const { error: aiMessageError } = await supabase
        .from('chat_messages')
        .insert({
          chat_id: chatId,
          user_id: userId,
          content: aiResponse,
          role: 'assistant',
          created_at: new Date().toISOString()
        });

      if (aiMessageError) {
        console.error('AI message error:', aiMessageError);
        throw aiMessageError;
      }

      // Update last_message_at
      const { error: updateError } = await supabase
        .from('outfit_chats')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', chatId);

      if (updateError) {
        console.error('Update chat error:', updateError);
        throw updateError;
      }

      return NextResponse.json({
        chatId,
        message: aiResponse
      });

    } catch (error) {
      console.error('Error in outfit chat:', error);
      return NextResponse.json(
        { 
          error: 'Failed to process chat message',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in outfit chat:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process chat message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 