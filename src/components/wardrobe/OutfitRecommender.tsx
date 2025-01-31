"use client";

import { useState } from 'react';
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
import { supabase } from '@/lib/supabase/client';
import { WardrobeItem } from '@/types/wardrobe';
import Image from 'next/image';
import { OutfitChat } from '@/components/chat/OutfitChat';

interface OutfitRecommenderProps {
  userId: string;
}

export const OutfitRecommender = ({ userId }: OutfitRecommenderProps) => {
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [eventDetails, setEventDetails] = useState({
    title: '',
    description: '',
    event_type: 'casual',
    date: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!eventDetails.title.trim() || !eventDetails.description.trim()) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

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

      if (eventError) {
        console.error('Event error:', eventError);
        setError('Failed to save event details');
        return;
      }

      // Get outfit recommendation
      const response = await fetch('/api/outfit-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: eventData.id,
          userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          // Handle specific cases
          if (data.error.includes('complete your profile')) {
            setError('Please complete your profile in the dashboard before getting recommendations');
          } else if (data.error.includes('add some items')) {
            setError('Please add some items to your wardrobe before getting recommendations');
          } else {
            setError(data.error);
          }
        } else {
          throw new Error(data.error || 'Failed to get recommendation');
        }
        return;
      }

      setRecommendation(data.outfit);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card className={`${styles.glassmorph} ${styles.greekPattern} border-[#347928]/30`}>
          <CardHeader>
            <CardTitle className={styles.primaryText}>Get Outfit Recommendation</CardTitle>
            <CardDescription className={styles.secondaryText}>
              Tell us about your event and we'll suggest the perfect outfit
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-sm">
                {error}
              </div>
            )}
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

        {recommendation && (
          <Card className={`${styles.glassmorph} ${styles.greekPattern} border-[#347928]/30`}>
            <CardHeader>
              <CardTitle className={styles.primaryText}>Your Perfect Outfit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p className={styles.secondaryText}>{recommendation.description}</p>
                
                <div className="grid grid-cols-2 gap-4">
                  {recommendation.items.map((item: any, index: number) => (
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
                    {recommendation.styling_tips.map((tip: string, index: number) => (
                      <li key={index} className={styles.secondaryText}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {recommendation && (
        <OutfitChat 
          userId={userId} 
          outfitId={recommendation.id}
          outfitDetails={recommendation}
        />
      )}
    </div>
  );
};