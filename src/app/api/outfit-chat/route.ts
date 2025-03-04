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
      const { data: chat, error: chatError } = await supabase
        .from('outfit_chats')
        .insert({
          user_id: userId,
          outfit_recommendation_id: outfitId,
          title: message.slice(0, 50) + '...',
          created_at: new Date().toISOString(),
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      if (chatError) {
        console.error('Chat creation error:', chatError);
        throw chatError;
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
      throw userMessageError;
    }

    // Include outfit context in the prompt
    const contextPrompt = `As an AI fashion stylist, help with this outfit: ${outfitDetails.description}. 
The outfit includes: ${outfitDetails.items.map((item: any) => item.type).join(', ')}. 
Previous styling tips: ${outfitDetails.styling_tips.join(', ')}. 

User question: ${message}

Provide specific advice considering the existing outfit components.`;

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
      max_tokens: 256,
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
} 