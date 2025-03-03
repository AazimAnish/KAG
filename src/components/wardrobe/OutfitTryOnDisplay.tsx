"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import { styles } from '@/utils/constants';
import { useToast } from '@/hooks/use-toast';

interface OutfitTryOnDisplayProps {
  userId: string;
  userImage: string;
  topOutfit?: {
    id: string;
    image_url: string;
  };
  bottomOutfit?: {
    id: string;
    image_url: string;
  };
}

export const OutfitTryOnDisplay = ({ userId, userImage, topOutfit, bottomOutfit }: OutfitTryOnDisplayProps) => {
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateTryOn = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if we have the required data
      if (!userId || !userImage || (!topOutfit?.image_url && !bottomOutfit?.image_url)) {
        throw new Error('Missing required data for try-on');
      }

      const response = await fetch('/api/outfit-tryon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          userImageUrl: userImage,
          topImageUrl: topOutfit?.image_url,
          bottomImageUrl: bottomOutfit?.image_url,
        }),
      }).catch(err => {
        throw new Error('Network error: Failed to connect to the server');
      });

      if (!response) {
        throw new Error('No response from server');
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate try-on');
      }

      if (!result.resultImage?.url) {
        throw new Error('Invalid response format from server');
      }

      setResultImage(result.resultImage.url);
      toast({
        title: "Success!",
        description: "Virtual try-on completed successfully.",
        variant: "success",
      });

    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred while generating the try-on';
      
      console.error('Try-on error:', error);
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {userImage && (
          <div className={`${styles.glassmorph} rounded-lg p-6`}>
            <h3 className={`${styles.primaryText} font-semibold mb-4`}>Your Photo</h3>
            <div className="relative aspect-[3/4] w-full">
              <Image
                src={userImage}
                alt="User"
                fill
                className="rounded-lg object-cover"
              />
            </div>
          </div>
        )}
        
        {(topOutfit || bottomOutfit) && (
          <div className={`${styles.glassmorph} rounded-lg p-6`}>
            <h3 className={`${styles.primaryText} font-semibold mb-4`}>Selected Outfits</h3>
            <div className="space-y-4">
              {topOutfit && (
                <div className="relative aspect-[3/4] w-full">
                  <Image
                    src={topOutfit.image_url}
                    alt="Top"
                    fill
                    className="rounded-lg object-cover"
                  />
                </div>
              )}
              {bottomOutfit && (
                <div className="relative aspect-[3/4] w-full">
                  <Image
                    src={bottomOutfit.image_url}
                    alt="Bottom"
                    fill
                    className="rounded-lg object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {resultImage && (
          <div className={`${styles.glassmorph} rounded-lg p-6`}>
            <h3 className={`${styles.primaryText} font-semibold mb-4`}>Result</h3>
            <div className="relative aspect-[3/4] w-full">
              <Image
                src={resultImage}
                alt="Try-on Result"
                fill
                className="rounded-lg object-cover"
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="text-red-500 text-sm mt-2">
          {error}
        </div>
      )}

      <Button
        onClick={generateTryOn}
        disabled={loading || !userImage || (!topOutfit && !bottomOutfit)}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          'Generate Try-On'
        )}
      </Button>
    </div>
  );
};