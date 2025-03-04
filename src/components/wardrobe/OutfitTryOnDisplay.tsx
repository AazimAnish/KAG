"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from 'lucide-react';
import { styles } from '@/utils/constants';
import { useToast } from '@/hooks/use-toast';
import { Badge } from "@/components/ui/badge";

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
  const [processingStage, setProcessingStage] = useState<string>('');
  const { toast } = useToast();

  const generateTryOn = async () => {
    try {
      setLoading(true);
      setError(null);
      setProcessingStage('Starting try-on process...');

      // Check if we have the required data
      if (!userId || !userImage || (!topOutfit?.image_url && !bottomOutfit?.image_url)) {
        throw new Error('Missing required data for try-on');
      }

      console.log('Generating try-on for:', {
        userId,
        userImage: userImage.substring(0, 50) + '...',
        topOutfit: topOutfit?.image_url ? topOutfit.image_url.substring(0, 50) + '...' : 'none',
        bottomOutfit: bottomOutfit?.image_url ? bottomOutfit.image_url.substring(0, 50) + '...' : 'none'
      });

      setProcessingStage('Sending request to API...');
      
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
        console.error('Network error:', err);
        throw new Error('Network error: Failed to connect to the server');
      });

      if (!response) {
        throw new Error('No response from server');
      }

      setProcessingStage('Processing AI response...');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();

      if (!result.resultImage?.url) {
        throw new Error('Invalid response format from server');
      }

      setResultImage(result.resultImage.url);
      setProcessingStage('');
      
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
      setProcessingStage('');
      
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

        {(resultImage || loading) && (
          <div className={`${styles.glassmorph} rounded-lg p-6`}>
            <h3 className={`${styles.primaryText} font-semibold mb-4`}>
              Result
              {loading && <Badge className="ml-2 bg-blue-500">Processing</Badge>}
            </h3>
            <div className="relative aspect-[3/4] w-full">
              {resultImage ? (
                <Image
                  src={resultImage}
                  alt="Try-on Result"
                  fill
                  className="rounded-lg object-cover"
                />
              ) : loading ? (
                <div className="flex flex-col items-center justify-center h-full bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                  <p className="text-sm text-center max-w-[250px]">{processingStage}</p>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="text-red-500 text-sm mt-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error: {error}</p>
            <p className="mt-1">Please try again or contact support if the problem persists.</p>
          </div>
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
            Generating Try-On...
          </>
        ) : resultImage ? (
          'Generate Again'
        ) : (
          'Generate Try-On'
        )}
      </Button>
    </div>
  );
};