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
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

  const handleDeleteChat = async (chatId: string) => {
    try {
      // Delete chat messages first
      const { error: messagesError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('chat_id', chatId);

      if (messagesError) throw messagesError;

      // Delete the chat
      const { error: chatError } = await supabase
        .from('outfit_chats')
        .delete()
        .eq('id', chatId);

      if (chatError) throw chatError;

      // Refresh chat list
      await loadChats();
      
      // Reset current chat if it was deleted
      if (activeChatId === chatId) {
        setActiveChatId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
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
        <div className="grid grid-cols-4 gap-4" style={{ height: 'calc(60vh - 100px)' }}>
          {/* Chat History Sidebar */}
          <div className="col-span-1 border-r border-[#347928]/20 pr-4 h-full">
            <ScrollArea className="h-full">
              <div className="space-y-2 pr-2">
                {chats.map(chat => (
                  <div
                    key={chat.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      activeChatId === chat.id 
                        ? 'bg-[#347928]/20' 
                        : 'hover:bg-[#347928]/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        onClick={() => setActiveChatId(chat.id)}
                        className="flex-1"
                      >
                        <p className={`${styles.secondaryText} truncate text-sm font-medium`}>
                          {chat.title}
                        </p>
                        <p className={`${styles.secondaryText} text-xs opacity-60 mt-1`}>
                          {new Date(chat.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-red-500/10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className={`${styles.glassmorph} border-[#347928]/30`}>
                          <AlertDialogHeader>
                            <AlertDialogTitle className={styles.primaryText}>
                              Delete Chat History
                            </AlertDialogTitle>
                            <AlertDialogDescription className={styles.secondaryText}>
                              This will permanently delete this chat history.
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className={`${styles.glassmorph} hover:bg-[#347928]/20`}>
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteChat(chat.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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
            <div className="border-t border-[#347928]/20 p-4">
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