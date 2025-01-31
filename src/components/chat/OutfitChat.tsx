"use client";

import { useState, useEffect, useRef } from 'react';
import { styles } from '@/utils/constants';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { supabase } from '@/lib/supabase/client';
import { ChatMessage, OutfitChat as OutfitChatType } from '@/types/chat';
import { ScrollArea } from "@/components/ui/scroll-area";

interface OutfitChatProps {
  userId: string;
  outfitId?: string;
  outfitDetails?: any;
}

export const OutfitChat = ({ userId, outfitId, outfitDetails }: OutfitChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState<OutfitChatType[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChats();
  }, [userId]);

  useEffect(() => {
    if (activeChatId) {
      loadMessages(activeChatId);
    }
  }, [activeChatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChats = async () => {
    const { data } = await supabase
      .from('outfit_chats')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (data) {
      setChats(data);
      if (data.length > 0 && !activeChatId) {
        setActiveChatId(data[0].id);
      }
    }
  };

  const loadMessages = async (chatId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    
    if (data) {
      setMessages(data);
    }
  };

  const startNewChat = async () => {
    setMessages([]);
    setActiveChatId(null);
    setInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/outfit-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          outfitId,
          message: input,
          chatId: activeChatId,
          previousMessages: messages,
          outfitDetails
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      if (!activeChatId) {
        setActiveChatId(data.chatId);
        await loadChats();
      }

      setMessages(prev => [
        ...prev,
        { role: 'user', content: input },
        { role: 'assistant', content: data.message }
      ]);
      setInput('');
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={`${styles.glassmorph} ${styles.greekPattern} border-[#347928]/30`}>
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className={styles.primaryText}>Chat with AI Stylist</CardTitle>
          <Button
            onClick={startNewChat}
            variant="ghost"
            size="sm"
            className={`${styles.glassmorph} hover:bg-[#347928]/20`}
          >
            New Chat
          </Button>
        </div>
        <CardDescription className={styles.secondaryText}>
          Ask questions about your outfit or get styling advice
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4" style={{ height: 'calc(70vh - 100px)' }}>
          {/* Chat History Sidebar */}
          <div className="col-span-1 border-r border-[#347928]/20 pr-4 h-full overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-2 pr-4">
                {chats.map(chat => (
                  <div
                    key={chat.id}
                    onClick={() => setActiveChatId(chat.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      activeChatId === chat.id 
                        ? 'bg-[#347928]/20' 
                        : 'hover:bg-[#347928]/10'
                    }`}
                  >
                    <p className={`${styles.secondaryText} truncate text-sm font-medium`}>
                      {chat.title}
                    </p>
                    <p className={`${styles.secondaryText} text-xs opacity-60 mt-1`}>
                      {new Date(chat.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Messages */}
          <div className="col-span-3 flex flex-col h-full">
            <ScrollArea className="flex-1">
              <div className="space-y-4 p-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-lg ${
                      msg.role === 'user' 
                        ? 'bg-[#347928]/20 ml-auto' 
                        : 'bg-[#1A1A19]/20'
                    }`}>
                      <p className={`${styles.secondaryText} text-sm`}>{msg.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Chat Input */}
            <div className="border-t border-[#347928]/20 p-4 mt-auto">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your outfit..."
                  className={`${styles.glassmorph} border-[#347928]/30 text-[#FFFDEC]`}
                  disabled={loading}
                />
                <Button 
                  type="submit" 
                  className="bg-[#347928] hover:bg-[#347928]/80 px-6"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 