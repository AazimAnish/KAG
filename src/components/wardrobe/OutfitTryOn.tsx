"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { styles } from '@/utils/constants';
import { useToast } from '@/hooks/use-toast';
import { Badge } from "@/components/ui/badge";

interface OutfitTryOnProps {
  userId: string;
  outfitImageUrl: string;
  userImageUrl: string;
}

export const OutfitTryOn = ({ userId, outfitImageUrl, userImageUrl }: OutfitTryOnProps) => {
  const [loading, setLoading] = useState(false);
  const [tryOnImage, setTryOnImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingStage, setProcessingStage] = useState<string>('');
  const { toast } = useToast();

  const generateTryOn = async () => {
    try {
      setLoading(true);
      setError(null);
      setProcessingStage('Starting try-on process...');

      // Validate URLs before making the request
      if (!userImageUrl || !outfitImageUrl) {
        throw new Error('Missing image URLs for try-on');
      }

      // Log the start of the request
      console.log('Generating try-on for:', {
        userId,
        outfitUrl: outfitImageUrl.substring(0, 50) + '...',
        userUrl: userImageUrl.substring(0, 50) + '...'
      });

      setProcessingStage('Sending request to AI service...');
      
      const response = await fetch('/api/outfit-tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userImageUrl,
          topImageUrl: outfitImageUrl, // We're treating all outfit images as tops for simplicity
        }),
      });

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      setProcessingStage('Processing AI response...');
      const result = await response.json();

      // Validate the result structure
      if (!result.resultImage?.url) {
        throw new Error('Invalid response format from server');
      }

      // Set the try-on image and show success notification
      setTryOnImage(result.resultImage.url);
      setProcessingStage('');
      toast({
        title: "Success!",
        description: "Virtual try-on completed successfully.",
        variant: "success",
      });
    } catch (error) {
      // Handle errors gracefully
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      setProcessingStage('');
      
      console.error('Try-on error:', error);
      
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
        <div className={`${styles.glassmorph} rounded-lg p-6`}>
          <h3 className={`${styles.primaryText} font-semibold mb-4`}>Your Photo</h3>
          <div className="relative aspect-[3/4] w-full">
            {userImageUrl ? (
              <Image
                src={userImageUrl}
                alt="User"
                fill
                className="rounded-lg object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800 rounded-lg">
                <AlertCircle className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
        </div>

        <div className={`${styles.glassmorph} rounded-lg p-6`}>
          <h3 className={`${styles.primaryText} font-semibold mb-4`}>Selected Outfit</h3>
          <div className="relative aspect-[3/4] w-full">
            {outfitImageUrl ? (
              <Image
                src={outfitImageUrl}
                alt="Outfit"
                fill
                className="rounded-lg object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800 rounded-lg">
                <AlertCircle className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
        </div>

        {(tryOnImage || loading) && (
          <div className={`${styles.glassmorph} rounded-lg p-6`}>
            <h3 className={`${styles.primaryText} font-semibold mb-4`}>
              Result
              {loading && <Badge className="ml-2 bg-blue-500">Processing</Badge>}
            </h3>
            <div className="relative aspect-[3/4] w-full">
              {tryOnImage ? (
                <Image
                  src={tryOnImage}
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

      <div className="flex gap-4">
        <Button
          onClick={generateTryOn}
          disabled={loading || !userImageUrl || !outfitImageUrl}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Try-On...
            </>
          ) : tryOnImage ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </>
          ) : (
            'Try On This Outfit'
          )}
        </Button>
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
    </div>
  );
}; 