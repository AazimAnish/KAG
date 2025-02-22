"use client";

import { styles } from '@/utils/constants';
import { CardStack } from "@/components/ui/card-stack";
import { Upload, Wand2, Sparkles } from 'lucide-react';

const steps = [
  {
    id: 1,
    name: "Step 1",
    designation: "Getting Started",
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Upload className="w-8 h-8 text-[#D98324]" />
          <h3 className={`${styles.primaryText} text-lg font-bold`}>Upload Your Wardrobe</h3>
        </div>
        <p className={styles.secondaryText}>
          Start by uploading photos of your clothing items. Our AI will analyze and categorize each piece, creating your digital wardrobe.
        </p>
      </div>
    ),
  },
  {
    id: 2,
    name: "Step 2",
    designation: "AI Analysis",
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Wand2 className="w-8 h-8 text-[#D98324]" />
          <h3 className={`${styles.primaryText} text-lg font-bold`}>Get Personalized Insights</h3>
        </div>
        <p className={styles.secondaryText}>
          Our AI analyzes your style preferences, body type, and existing wardrobe to create a personalized fashion profile.
        </p>
      </div>
    ),
  },
  {
    id: 3,
    name: "Step 3",
    designation: "Smart Recommendations",
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-[#D98324]" />
          <h3 className={`${styles.primaryText} text-lg font-bold`}>Discover Perfect Outfits</h3>
        </div>
        <p className={styles.secondaryText}>
          Receive AI-curated outfit suggestions for any occasion, complete with styling tips and recommendations.
        </p>
      </div>
    ),
  },
];

export const HowItWorksSection = () => {
  return (
    <section className="py-24 relative backdrop-blursm">
      <div className="container mx-auto px-4">
        <h2 className={`text-4xl font-bold text-center mb-16 ${styles.heading}`}>
          How It Works
        </h2>
        <div className="flex justify-center items-center">
          <CardStack 
            items={steps}
            offset={20}
            scaleFactor={0.08}
          />
        </div>
      </div>
    </section>
  );
};