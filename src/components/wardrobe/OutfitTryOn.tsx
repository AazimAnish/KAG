"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, AlertCircle, History } from 'lucide-react';
import { styles } from '@/utils/constants';
import { useToast } from '@/hooks/use-toast';
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/lib/supabase/client';
import { ImageViewer } from '@/components/ui/ImageViewer';

interface OutfitTryOnProps {
  userId: string;
  outfitImageUrl: string;
  userImageUrl: string;
}

interface TryOnHistory {
  id: string;
  result_image_url: string;
  created_at: string;
  top_image_url: string | null;
  bottom_image_url: string | null;
}

export const OutfitTryOn = ({ userId, outfitImageUrl, userImageUrl }: OutfitTryOnProps) => {
  const [loading, setLoading] = useState(false);
  const [tryOnImage, setTryOnImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [tryOnHistory, setTryOnHistory] = useState<TryOnHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const { toast } = useToast();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentViewImage, setCurrentViewImage] = useState<string>('');

  useEffect(() => {
    fetchTryOnHistory();
  }, [userId]);

  const fetchTryOnHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('outfit_tryons')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTryOnHistory(data || []);
    } catch (error) {
      console.error('Error fetching try-on history:', error);
      toast({
        title: "Error",
        description: "Failed to load try-on history",
        variant: "destructive",
      });
    }
  };

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

      // Refresh history after successful generation
      await fetchTryOnHistory();

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

  // Handle opening image in fullscreen viewer
  const handleOpenImage = (imageUrl: string) => {
    setCurrentViewImage(imageUrl);
    setViewerOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`${styles.glassmorph} rounded-lg p-6 space-y-4`}>
          <h3 className={`${styles.primaryText} font-semibold`}>Your Photo</h3>
          <div className="aspect-[3/4] relative">
            <Image
              src={userImageUrl}
              alt="Your photo"
              fill
              className="rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => handleOpenImage(userImageUrl)}
            />
          </div>
        </div>

        <div className={`${styles.glassmorph} rounded-lg p-6 space-y-4`}>
          <h3 className={`${styles.primaryText} font-semibold`}>Selected Outfit</h3>
          <div className="aspect-[3/4] relative">
            <Image
              src={outfitImageUrl}
              alt="Outfit image"
              fill
              className="rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => handleOpenImage(outfitImageUrl)}
            />
          </div>
        </div>
      </div>
      
      {tryOnImage && !loading && !error && (
        <div className={`${styles.glassmorph} rounded-lg p-6 space-y-4`}>
          <h3 className={`${styles.primaryText} font-semibold`}>Result</h3>
          <div className="aspect-[3/4] relative">
            <Image
              src={tryOnImage}
              alt="Try-on result"
              fill
              className="rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => handleOpenImage(tryOnImage)}
            />
          </div>
        </div>
      )}

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

        <Button
          onClick={() => setShowHistory(!showHistory)}
          variant="outline"
          className={`${styles.glassmorph} hover:bg-[#D98324]/20`}
        >
          <History className="h-4 w-4 mr-2" />
          {showHistory ? 'Hide History' : 'Show History'}
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

      {showHistory && tryOnHistory.length > 0 && (
        <div className={`${styles.glassmorph} rounded-lg p-6 mt-6`}>
          <h3 className={`${styles.primaryText} font-semibold mb-4`}>Try-On History</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tryOnHistory.map((item) => (
              <div key={item.id} className="relative aspect-[3/4]">
                <Image
                  src={item.result_image_url}
                  alt={`Try-on from ${new Date(item.created_at).toLocaleDateString()}`}
                  fill
                  className="rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => handleOpenImage(item.result_image_url)}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 rounded-b-lg">
                  {new Date(item.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewerOpen && (
        <ImageViewer
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
          imageUrl={currentViewImage}
          alt="Enlarged image"
        />
      )}
    </div>
  );
};