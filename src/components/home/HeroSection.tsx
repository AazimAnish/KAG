"use client";

import { styles } from '@/utils/constants';
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useEffect, useState } from 'react';

export const HeroSection = () => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Wait until mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Default to dark theme video until client-side renders
  const videoSrc = !mounted ? '/night.mp4' : theme === 'dark' ? '/night.mp4' : '/day.mp4';

  return (
    <section className="relative min-h-screen flex items-center">
      <video
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        src={videoSrc}
        key={theme} // Force video reload when theme changes
      />
      <div className="container mx-auto px-4 py-32 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className={`${styles.heading} text-5xl md:text-7xl leading-tight`}>
              Transform Your 
              <span className={`${styles.heading} block`}>
                Wardrobe
              </span>
              <span className={`${styles.kagaiFont} ${styles.gradientText} pl-1`}>Effortlessly</span>
            </h1>
            <p className={`${styles.secondaryFont} text-xl ${styles.secondaryText} leading-relaxed`}>
              Your personal stylist, powered by 
              <span className={styles.kagaiFont}> KAG-AI</span>. 
              Perfect outfits for every occasion, tailored to your unique style and body type.
            </p>
            <div className="flex space-x-4">
              <Button 
                size="lg" 
                className={`${styles.primaryFont} bg-[#D98324] hover:bg-[#D98324]/80 text-[#F2F6D0]`}
              >
                Get Started
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className={`${styles.primaryFont} ${styles.glassmorph} border-[#D98324] text-[#EFDCAB] hover:bg-[#D98324]/10`}
              >
                Explore Features
              </Button>
            </div>
          </div>
          <div className={`rounded-lg flex justify-center`}>
            <div className={`${styles.glassmorph} ${styles.greekPattern} rounded-lg p-4`}>
              <video 
                src="/AImodel.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="h-[650px] w-auto object-cover rounded"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}; 