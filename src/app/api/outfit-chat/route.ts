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

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Create new chat if chatId is not provided
    if (!chatId) {
      const { data: chat, error: chatError } = await supabase
        .from('outfit_chats')
        .insert({
          user_id: userId,
          outfit_id: outfitId,
          title: message.slice(0, 50) + '...',
          created_at: new Date().toISOString(),
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      if (chatError) throw chatError;
      chatId = chat.id;
    }

    // Save user message
    await supabase.from('chat_messages').insert({
      chat_id: chatId,
      user_id: userId,
      content: message,
      role: 'user',
      created_at: new Date().toISOString()
    });

    // Get AI response
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a fashion assistant helping with outfit recommendations. Keep responses concise and focused on the current outfit:
${JSON.stringify(outfitDetails, null, 2)}

Focus on:
- Styling advice for the recommended outfit
- Answering questions about outfit combinations
- Suggesting alternatives
- Practical wearing and accessorizing tips`
        },
        ...previousMessages.map((msg: { role: string; content: string }) => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: "user",
          content: message
        }
      ],
      model: "mixtral-8x7b-32768",
      temperature: 0.7,
      max_tokens: 256,
    });

    const aiResponse = completion.choices[0]?.message?.content || '';

    // Save AI response
    await supabase.from('chat_messages').insert({
      chat_id: chatId,
      user_id: userId,
      content: aiResponse,
      role: 'assistant',
      created_at: new Date().toISOString()
    });

    // Update last_message_at
    await supabase
      .from('outfit_chats')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', chatId);

    return NextResponse.json({
      chatId,
      message: aiResponse
    });

  } catch (error) {
    console.error('Error in outfit chat:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
} 