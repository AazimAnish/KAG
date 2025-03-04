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
import { useToast } from "@/hooks/use-toast";

interface OutfitChatProps {
  userId: string;
  outfitId?: string;
  outfitDetails?: any;
}

export const OutfitChat = ({ userId, outfitId, outfitDetails }: OutfitChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<OutfitChatType[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Determine if this is a general fashion chat or outfit-specific chat
  const isGeneralChat = !outfitId;
  
  // Set initial welcome message for a new chat
  useEffect(() => {
    if (messages.length === 0 && !activeChatId) {
      // Add system welcome message based on chat type
      const welcomeMessage = isGeneralChat 
        ? "Hello! I'm your fashion assistant. Ask me any fashion-related questions." 
        : "Hello! I'm your outfit stylist. Ask me questions about styling this outfit, alternatives, or accessories.";
      
      setMessages([{
        role: 'assistant',
        content: welcomeMessage,
        created_at: new Date().toISOString()
      }]);
    }
  }, [isGeneralChat, messages.length, activeChatId]);
  
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChats = async () => {
    try {
      const { data, error } = await supabase
        .from('outfit_chats')
        .select('*')
        .eq('user_id', userId)
        // For general chats, look for null outfit_recommendation_id
        // For specific chats, filter by the outfitId
        .eq(isGeneralChat ? 'outfit_recommendation_id' : 'id', isGeneralChat ? null : outfitId)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      setChats(data || []);
      
      // If we found chats and don't have an active one, set the first one active
      if (data?.length && !activeChatId) {
        setActiveChatId(data[0].id);
        loadMessages(data[0].id);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      if (data) {
        setMessages(data);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error loading messages",
        description: "Could not retrieve chat history. Please try again.",
        variant: "destructive"
      });
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

    // Store the message to send
    const messageToSend = input;
    
    try {
      setLoading(true);
      
      // Add user message to the UI immediately
      const userMessage: ChatMessage = {
        role: 'user',
        content: messageToSend,
        created_at: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInput('');
      
      // Determine if an outfit link is required for this chat
      const requireOutfitLink = !!outfitId;
      
      // Create a safe version of outfitDetails with checks to prevent null/undefined errors
      let safeOutfitDetails = null;
      
      if (outfitDetails) {
        // Check if outfitDetails has valid data structure before using it
        const hasValidItems = outfitDetails.items && Array.isArray(outfitDetails.items) && outfitDetails.items.length > 0;
        
        safeOutfitDetails = {
          description: outfitDetails.description || '',
          items: hasValidItems ? outfitDetails.items : [],
          styling_tips: Array.isArray(outfitDetails.styling_tips) ? outfitDetails.styling_tips : [],
          requireOutfitLink
        };
      }
      
      // Send the message to the API
      const response = await fetch('/api/outfit-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          outfitId,
          message: messageToSend,
          previousMessages: messages,
          chatId: activeChatId,
          outfitDetails: safeOutfitDetails
        }),
      });

      // Parse the response JSON only once
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('API error:', responseData);
        toast({
          title: "Error sending message",
          description: responseData.error || "Failed to send message. Please try again.",
          variant: "destructive"
        });
        
        // Add the error as a system message instead of throwing error
        // This allows the user to continue the conversation
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `I'm sorry, I encountered an error: ${responseData.error || "Failed to process your message"}. Please try again or ask a different question.`,
          created_at: new Date().toISOString(),
        }]);
        return; // Return instead of throwing to keep the UI responsive
      }
      
      if (!activeChatId && responseData.chatId) {
        setActiveChatId(responseData.chatId);
      }

      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: responseData.message,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, aiMessage]);
      scrollToBottom();

      // Update chat list
      loadChats();
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Chat Error",
        description: error instanceof Error ? error.message : "Something went wrong with the chat",
        variant: "destructive"
      });
      
      // Add a fallback message to the UI
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, something went wrong. Please try again in a moment.",
        created_at: new Date().toISOString(),
      }]);
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
    <Card className={`${styles.glassmorph} ${styles.greekPattern} border-[#D98324 ]/30`}>
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className={styles.primaryText}>Chat with AI Stylist</CardTitle>
          <Button
            onClick={startNewChat}
            variant="ghost"
            size="sm"
            className={`${styles.glassmorph} hover:bg-[#D98324 ]/20`}
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
          <div className="col-span-1 border-r border-[#D98324 ]/20 pr-4 h-full">
            <ScrollArea className="h-full">
              <div className="space-y-2 pr-2">
                {chats.map(chat => (
                  <div
                    key={chat.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      activeChatId === chat.id 
                        ? 'bg-[#D98324 ]/20' 
                        : 'hover:bg-[#D98324 ]/10'
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
                        <AlertDialogContent className={`${styles.glassmorph} border-[#D98324 ]/30`}>
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
                            <AlertDialogCancel className={`${styles.glassmorph} hover:bg-[#D98324 ]/20`}>
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
                        ? 'bg-[#D98324 ]/20 ml-auto' 
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
            <div className="border-t border-[#D98324 ]/20 p-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your outfit..."
                  className={`${styles.glassmorph} border-[#D98324 ]/30 text-[#FFFDEC]`}
                  disabled={loading}
                />
                <Button 
                  type="submit" 
                  className="bg-[#D98324 ] hover:bg-[#D98324 ]/80 px-6"
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