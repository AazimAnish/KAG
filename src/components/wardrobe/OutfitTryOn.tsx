"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from 'lucide-react';
import { styles } from '@/utils/constants';
import { useToast } from '@/hooks/use-toast';

interface OutfitTryOnProps {
  userId: string;
  outfitImageUrl: string;
  userImageUrl: string;
}

export const OutfitTryOn = ({ userId, outfitImageUrl, userImageUrl }: OutfitTryOnProps) => {
  const [loading, setLoading] = useState(false);
  const [tryOnImage, setTryOnImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateTryOn = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/outfit-tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userImageUrl,
          topImageUrl: outfitImageUrl,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to generate try-on');

      setTryOnImage(result.resultImage.url);
      toast({
        title: "Success!",
        description: "Virtual try-on completed successfully.",
        variant: "success",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
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
        <div className={`${styles.glassmorph} rounded-lg p-6`}>
          <h3 className={`${styles.primaryText} font-semibold mb-4`}>Your Photo</h3>
          <div className="relative aspect-[3/4] w-full">
            <Image
              src={userImageUrl}
              alt="User"
              fill
              className="rounded-lg object-cover"
            />
          </div>
        </div>

        <div className={`${styles.glassmorph} rounded-lg p-6`}>
          <h3 className={`${styles.primaryText} font-semibold mb-4`}>Selected Outfit</h3>
          <div className="relative aspect-[3/4] w-full">
            <Image
              src={outfitImageUrl}
              alt="Outfit"
              fill
              className="rounded-lg object-cover"
            />
          </div>
        </div>

        {tryOnImage && (
          <div className={`${styles.glassmorph} rounded-lg p-6`}>
            <h3 className={`${styles.primaryText} font-semibold mb-4`}>Result</h3>
            <div className="relative aspect-[3/4] w-full">
              <Image
                src={tryOnImage}
                alt="Try-on Result"
                fill
                className="rounded-lg object-cover"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <Button
          onClick={generateTryOn}
          disabled={loading}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Try-On...
            </>
          ) : (
            'Try On This Outfit'
          )}
        </Button>

        {tryOnImage && (
          <Button
            onClick={generateTryOn}
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
      </div>

      {error && (
        <div className="text-red-500 text-sm mt-2">
          {error}
        </div>
      )}
    </div>
  );
}; 