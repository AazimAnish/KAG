"use client";

import { useState, useEffect } from 'react';
import { styles } from '@/utils/constants';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from '@/lib/supabase/client';
import { OutfitSuggestion, OutfitEvent } from '@/types/wardrobe';
import Image from 'next/image';
import { OutfitChat } from '@/components/chat/OutfitChat';
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

interface OutfitRecommenderProps {
  userId: string;
}

export const OutfitRecommender = ({ userId }: OutfitRecommenderProps) => {
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<OutfitSuggestion | null>(null);
  const [pastSuggestions, setPastSuggestions] = useState<OutfitSuggestion[]>([]);
  const [events, setEvents] = useState<OutfitEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventDetails, setEventDetails] = useState({
    title: '',
    description: '',
    event_type: 'casual',
    date: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState<string | null>(null);
  const [showNewEvent, setShowNewEvent] = useState(true);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    loadPastSuggestions();
    loadEvents();
  }, [userId]);

  const loadPastSuggestions = async () => {
    const { data } = await supabase
      .from('outfit_recommendations')
      .select('*, events(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) {
      setPastSuggestions(data);
      if (data.length > 0 && !recommendation) {
        setRecommendation(data[0]);
      }
    }
  };

  const loadEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) {
      setEvents(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setShowChat(false);

    try {
      // Save event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .insert({
          user_id: userId,
          ...eventDetails,
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Get outfit recommendation
      const response = await fetch('/api/outfit-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          eventId: eventData.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get recommendation');
      }

      const newRecommendation = await response.json();
      setRecommendation(newRecommendation);
      setShowChat(true);
      await loadPastSuggestions();
      setShowNewEvent(false);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSuggestion = async (suggestionId: string) => {
    try {
      // First get the event_id associated with this suggestion
      const { data: suggestion, error: fetchError } = await supabase
        .from('outfit_recommendations')
        .select('event_id')
        .eq('id', suggestionId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch suggestion details: ${fetchError.message}`);
      }

      if (!suggestion) {
        throw new Error('Suggestion not found');
      }

      // Delete in correct order to respect foreign key constraints

      // 1. Delete chat messages first
      const { data: chats, error: fetchChatsError } = await supabase
        .from('outfit_chats')
        .select('id')
        .eq('outfit_recommendation_id', suggestionId);  // Updated column name

      if (fetchChatsError) {
        throw new Error(`Failed to fetch chats: ${fetchChatsError.message}`);
      }

      if (chats && chats.length > 0) {
        // Delete all messages from all chats
        const { error: messagesError } = await supabase
          .from('chat_messages')
          .delete()
          .in('chat_id', chats.map(chat => chat.id));

        if (messagesError) {
          throw new Error(`Failed to delete chat messages: ${messagesError.message}`);
        }

        // Delete all chats
        const { error: chatsError } = await supabase
          .from('outfit_chats')
          .delete()
          .eq('outfit_recommendation_id', suggestionId);  // Updated column name

        if (chatsError) {
          throw new Error(`Failed to delete chats: ${chatsError.message}`);
        }
      }

      // 2. Delete the outfit recommendation
      const { error: outfitError } = await supabase
        .from('outfit_recommendations')
        .delete()
        .eq('id', suggestionId);

      if (outfitError) {
        throw new Error(`Failed to delete outfit recommendation: ${outfitError.message}`);
      }

      // 3. Finally delete the event
      const { error: eventError } = await supabase
        .from('events')
        .delete()
        .eq('id', suggestion.event_id);

      if (eventError) {
        throw new Error(`Failed to delete event: ${eventError.message}`);
      }

      // Refresh the suggestions list
      await loadPastSuggestions();
      
      // Reset current recommendation if it was deleted
      if (recommendation?.id === suggestionId) {
        setRecommendation(null);
        setShowNewEvent(true);
      }

      // Show success message
      setError('Successfully deleted outfit suggestion');
      setTimeout(() => setError(null), 3000);

    } catch (error) {
      console.error('Error deleting suggestion:', {
        error,
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        stack: error instanceof Error ? error.stack : undefined
      });
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  };

  return (
    <div className="grid md:grid-cols-[300px,1fr] gap-6">
      {/* Past Suggestions Sidebar */}
      <div className="col-span-1">
        <Card className={`${styles.glassmorph} ${styles.greekPattern} border-[#347928]/30`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className={styles.primaryText}>Past Events</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewEvent(true)}
                className={`${styles.glassmorph} hover:bg-[#347928]/20`}
              >
                New Event
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-2">
                {pastSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${recommendation?.id === suggestion.id
                      ? 'bg-[#347928]/20'
                      : 'hover:bg-[#347928]/10'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        onClick={() => {
                          setRecommendation(suggestion);
                          setShowNewEvent(false);
                        }}
                        className="flex-1"
                      >
                        <p className={`${styles.secondaryText} text-sm font-medium`}>
                          {suggestion.events?.[0]?.title}
                        </p>
                        <p className={`${styles.secondaryText} text-xs opacity-60 mt-1`}>
                          {new Date(suggestion.created_at).toLocaleDateString()}
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
                              Delete Outfit Suggestion
                            </AlertDialogTitle>
                            <AlertDialogDescription className={styles.secondaryText}>
                              This will permanently delete this outfit suggestion and its chat history.
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className={`${styles.glassmorph} hover:bg-[#347928]/20`}>
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteSuggestion(suggestion.id)}
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
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {error && (
          <div className="p-4 text-red-500 bg-red-500/10 rounded-lg">
            {error}
          </div>
        )}

        {showNewEvent ? (
          <Card className={`${styles.glassmorph} ${styles.greekPattern} border-[#347928]/30`}>
            <CardHeader>
              <CardTitle className={styles.primaryText}>New Event Outfit</CardTitle>
              <CardDescription className={styles.secondaryText}>
                Tell us about your event to get personalized outfit recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  placeholder="Event Title"
                  value={eventDetails.title}
                  onChange={(e) => setEventDetails(prev => ({ ...prev, title: e.target.value }))}
                  className={`${styles.glassmorph} border-[#347928]/30 text-[#FFFDEC]`}
                  required
                />

                <Textarea
                  placeholder="Describe your event..."
                  value={eventDetails.description}
                  onChange={(e) => setEventDetails(prev => ({ ...prev, description: e.target.value }))}
                  className={`${styles.glassmorph} border-[#347928]/30 text-[#FFFDEC]`}
                  required
                />

                <Select
                  value={eventDetails.event_type}
                  onValueChange={(value) => setEventDetails(prev => ({ ...prev, event_type: value }))}
                >
                  <SelectTrigger className={`${styles.glassmorph} border-[#347928]/30 text-[#FFFDEC]`}>
                    <SelectValue placeholder="Event Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="party">Party</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="date"
                  value={eventDetails.date}
                  onChange={(e) => setEventDetails(prev => ({ ...prev, date: e.target.value }))}
                  className={`${styles.glassmorph} border-[#347928]/30 text-[#FFFDEC]`}
                />

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#347928] hover:bg-[#347928]/80 text-[#FFFDEC]"
                >
                  {loading ? "Generating..." : "Get Recommendations"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : recommendation && (
          <div className="space-y-6">
            <Card className={`${styles.glassmorph} ${styles.greekPattern} border-[#347928]/30`}>
              <CardHeader>
                <CardTitle className={styles.primaryText}>Your Perfect Outfit</CardTitle>
                {showChat && (
                  <CardDescription className={styles.secondaryText}>
                    Need help with alternatives or styling tips? Use the chat below!
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <p className={styles.secondaryText}>{recommendation.recommendation.description}</p>

                  <div className="grid grid-cols-2 gap-4">
                    {recommendation.recommendation.items.map((item: any, index: number) => (
                      <div key={index} className="space-y-2">
                        {item.image_url && (
                          <div className="aspect-square relative rounded-lg overflow-hidden">
                            <Image
                              src={item.image_url}
                              alt={item.type || 'Wardrobe item'}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <p className={`text-sm ${styles.secondaryText}`}>{item.styling_notes}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <h4 className={`font-semibold ${styles.primaryText}`}>Styling Tips:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {recommendation.recommendation.styling_tips.map((tip: string, index: number) => (
                        <li key={index} className={styles.secondaryText}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {showChat && (
              <OutfitChat 
                userId={userId} 
                outfitId={recommendation.id}
                outfitDetails={recommendation.recommendation}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};