"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { styles } from '@/utils/constants';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

interface OutfitTryOnProps {
  userId: string;
  outfitImageUrl: string;
  userImageUrl: string;
}

export const OutfitTryOn = ({ userId, outfitImageUrl, userImageUrl }: OutfitTryOnProps) => {
  const [tryOnImage, setTryOnImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateTryOn = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/outfit-tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          outfitImageUrl,
          userImageUrl
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate try-on image');
      }

      const data = await response.json();
      setTryOnImage(data.images[0].url);
    } catch (error) {
      console.error('Try-on error:', error);
      setError('Failed to generate try-on image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={generateTryOn}
        disabled={loading}
        className={`w-full ${styles.glassmorph} hover:bg-[#347928]/20`}
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

      {error && (
        <p className="text-red-500 text-sm text-center">{error}</p>
      )}

      {tryOnImage && (
        <div className="relative aspect-square rounded-lg overflow-hidden">
          <Image
            src={tryOnImage}
            alt="Virtual Try-On"
            fill
            className="object-cover"
          />
        </div>
      )}
    </div>
  );
}; 