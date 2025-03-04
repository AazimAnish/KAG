"use client";

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon, Check, AlertCircle } from 'lucide-react';
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
import { cn } from "@/lib/utils";

interface WardrobeUploadProps {
  userId?: string;
  onSuccess?: () => void;
}

interface FileStatus {
  file: File;
  id: string;
  status: 'queued' | 'uploading' | 'analyzing' | 'saving' | 'complete' | 'error';
  progress: number;
  error?: string;
  result?: any;
}

export const WardrobeUpload = ({ userId, onSuccess }: WardrobeUploadProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const processingRef = useRef(false);
  
  // Calculate overall progress
  const updateOverallProgress = useCallback(() => {
    if (fileStatuses.length === 0) {
      setOverallProgress(0);
      return;
    }
    
    const totalProgress = fileStatuses.reduce((sum, file) => sum + file.progress, 0);
    const newProgress = Math.floor(totalProgress / fileStatuses.length);
    setOverallProgress(newProgress);
    
    // Check if all complete
    const allComplete = fileStatuses.every(f => 
      f.status === 'complete' || f.status === 'error'
    );
    
    if (allComplete && processingRef.current) {
      processingRef.current = false;
      setUploading(false);
      
      const successCount = fileStatuses.filter(f => f.status === 'complete').length;
      if (successCount > 0) {
        toast({
          variant: "success",
          title: "Upload Complete",
          description: `Successfully uploaded ${successCount} of ${fileStatuses.length} items`
        });
        
        if (onSuccess) {
          onSuccess();
        }
      }
    }
  }, [fileStatuses, onSuccess, toast]);
  
  // Update a single file's status
  const updateFileStatus = useCallback((id: string, updates: Partial<FileStatus>) => {
    setFileStatuses(prev => {
      const newStatuses = prev.map(fileStatus => 
        fileStatus.id === id ? { ...fileStatus, ...updates } : fileStatus
      );
      return newStatuses;
    });
  }, []);
  
  // Process a single file
  const processFile = useCallback(async (fileStatus: FileStatus) => {
    const { file, id } = fileStatus;
    
    try {
      // Step 1: Prepare for upload
      updateFileStatus(id, { status: 'uploading', progress: 10 });
      
      // Step 2: Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${id}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('wardrobe')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (uploadError) throw uploadError;
      
      updateFileStatus(id, { status: 'analyzing', progress: 40 });
      
      // Step 3: Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('wardrobe')
        .getPublicUrl(uploadData.path);
      
      // Step 4: Analyze with AI
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/analyze-clothing', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }
      
      const analysis = await response.json();
      updateFileStatus(id, { status: 'saving', progress: 80 });
      
      // Step 5: Save to database
      const { error: dbError } = await supabase
        .from('wardrobe_items')
        .insert({
          user_id: userId,
          image_url: publicUrl,
          type: analysis.type,
          category: analysis.type,
          color: analysis.tags[0] || 'unknown',
          name: `${analysis.tags[0] || 'Unknown'} ${analysis.type}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (dbError) throw dbError;
      
      // Step 6: Complete
      updateFileStatus(id, { 
        status: 'complete', 
        progress: 100,
        result: {
          imageUrl: publicUrl,
          ...analysis
        }
      });
      
    } catch (error) {
      console.error(`Error processing ${file.name}:`, error);
      updateFileStatus(id, { 
        status: 'error', 
        progress: 100,
        error: error instanceof Error ? error.message : "Processing failed" 
      });
    }
  }, [userId, updateFileStatus]);

  // Process all files with controlled concurrency
  const processFiles = useCallback(async (files: File[]) => {
    if (!userId || files.length === 0) return;
    
    try {
      processingRef.current = true;
      setUploading(true);
      
      // Create initial file statuses
      const newFileStatuses = files.map(file => ({
        file,
        id: Math.random().toString(36).substring(2),
        status: 'queued' as const,
        progress: 0
      }));
      
      setFileStatuses(newFileStatuses);
      
      // Process files with limited concurrency
      const concurrencyLimit = 2; // Only process 2 at a time to avoid overwhelming the API
      let activePromises: Promise<void>[] = [];
      let queueIndex = 0;
      
      const startNextFile = (): Promise<void> | null => {
        if (queueIndex >= newFileStatuses.length) return null;
        const nextFile = newFileStatuses[queueIndex++];
        return processFile(nextFile).then(() => {
          updateOverallProgress();
          const next: Promise<void> | null = startNextFile();
          return next ?? Promise.resolve();
        });
      };
      
      // Start initial batch
      for (let i = 0; i < Math.min(concurrencyLimit, newFileStatuses.length); i++) {
        const promise = startNextFile();
        if (promise) activePromises.push(promise);
      }
      
      // Wait for all to complete
      await Promise.all(activePromises);
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: error instanceof Error ? error.message : "Failed to upload items"
      });
      setUploading(false);
      processingRef.current = false;
    }
  }, [userId, processFile, toast, updateOverallProgress]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User not authenticated"
      });
      return;
    }

    // Filter out files that are too large
    const validFiles = acceptedFiles.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Upload Error",
          description: `${file.name} is too large (max 10MB)`
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;
    
    processFiles(validFiles);
  }, [userId, processFiles, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    disabled: uploading,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'complete': return <Check className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <ImageIcon className="h-4 w-4 text-gray-500" />;
    }
  };

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
            ${uploading ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 text-[#D98324 ] mx-auto mb-4" />
          <p className={styles.primaryText}>
            {uploading 
              ? 'Processing your images...' 
              : 'Drag & drop images here, or click to select files'}
          </p>
          <p className={`${styles.secondaryText} mt-2`}>
            Supported formats: JPG, PNG (max 10MB)
          </p>
        </div>
        
        {uploading && (
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className={styles.secondaryText}>Overall progress</span>
                <span className={styles.secondaryText}>{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto mt-4">
              {fileStatuses.map((fileStatus) => (
                <div key={fileStatus.id} className="flex items-center space-x-2 text-sm">
                  {getStatusIcon(fileStatus.status)}
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between">
                      <span className="truncate max-w-[200px]">{fileStatus.file.name}</span>
                      <span>{fileStatus.status === 'error' ? 'Failed' : 
                             fileStatus.status === 'complete' ? 'Complete' : 
                             `${fileStatus.progress}%`}</span>
                    </div>
                    <Progress 
                      value={fileStatus.progress} 
                      className={cn(
                        "h-1 mt-1",
                        fileStatus.status === 'error' ? "bg-destructive/20 [&>div]:bg-destructive" : ""
                      )}
                    />
                    {fileStatus.status === 'error' && (
                      <p className="text-xs text-red-500 mt-1 truncate">{fileStatus.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};