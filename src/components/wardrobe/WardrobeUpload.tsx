"use client";

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { styles } from '@/utils/constants';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface WardrobeUploadProps {
  userId?: string;
  onSuccess?: () => void;
}

export const WardrobeUpload = ({ userId, onSuccess }: WardrobeUploadProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const analyzeImage = async (imageUrl: string) => {
    try {
      const response = await fetch('/api/analyze-clothing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      return await response.json();
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw error;
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User not authenticated"
      });
      return;
    }

    try {
      setUploading(true);
      setProgress(0);

      for (const file of acceptedFiles) {
        if (file.size > 10 * 1024 * 1024) {
          toast({
            variant: "destructive",
            title: "Upload Error",
            description: "File size must be less than 10MB"
          });
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('wardrobe')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('wardrobe')
          .getPublicUrl(uploadData.path);

        // Analyze the image using Llama Vision
        const analysis = await analyzeImage(publicUrl);

        // Save to database with analysis results
        const { error: dbError } = await supabase
          .from('wardrobe_items')
          .insert({
            user_id: userId,
            image_url: publicUrl,
            type: analysis.type,
            tags: analysis.tags,
            status: 'completed',
          });

        if (dbError) throw dbError;

        setProgress((prev) => prev + (100 / acceptedFiles.length));

        toast({
          variant: "success",
          title: "Success",
          description: "Item uploaded successfully"
        });
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: error instanceof Error ? error.message : "Failed to upload item"
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [userId, onSuccess, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    disabled: uploading,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  return (
    <Card className={`${styles.glassmorph} ${styles.greekPattern} border-[#D98324 ]/30`}>
      <CardHeader>
        <CardTitle className={styles.primaryText}>Add New Items</CardTitle>
        <CardDescription className={styles.secondaryText}>
          Upload photos of your clothing items
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed border-[#D98324 ]/30 rounded-lg p-8
            text-center cursor-pointer hover:border-[#D98324 ]/50 transition-colors
            ${isDragActive ? 'border-[#D98324 ]' : ''}
          `}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 text-[#D98324 ] mx-auto mb-4" />
          <p className={styles.primaryText}>
            {uploading 
              ? 'Uploading...' 
              : 'Drag & drop images here, or click to select files'}
          </p>
          <p className={`${styles.secondaryText} mt-2`}>
            Supported formats: JPG, PNG (max 10MB)
          </p>
        </div>
        {uploading && (
          <div className="mt-4 space-y-2">
            <Progress value={progress} className="h-2" />
            <p className={`text-center ${styles.secondaryText}`}>
              Uploading and processing images...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 