import React from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { styles } from "@/utils/constants";

interface ImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt: string;
}

export const ImageViewer = ({ isOpen, onClose, imageUrl, alt }: ImageViewerProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[95vw] max-h-[95vh] p-0 bg-transparent border-none shadow-none overflow-hidden flex items-center justify-center">
        <DialogTitle className="sr-only">Image Preview: {alt}</DialogTitle>
        <DialogClose className="absolute right-4 top-4 z-50 rounded-full bg-background/80 backdrop-blur-sm p-2 text-foreground hover:bg-background/60">
          <X className="h-6 w-6" />
          <span className="sr-only">Close</span>
        </DialogClose>
        <div className="relative w-full h-full max-h-[95vh] flex items-center justify-center">
          <div className="relative max-w-full max-h-full">
            <Image
              src={imageUrl}
              alt={alt}
              className={`${styles.glassmorph} rounded-lg object-contain max-h-[90vh]`}
              width={1200}
              height={900}
              style={{ objectFit: 'contain' }}
              priority
              unoptimized={imageUrl.startsWith('data:')}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 