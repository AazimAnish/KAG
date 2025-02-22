"use client";

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { styles } from '@/utils/constants';

const LandingPage = () => {
  return (
    <div className={`min-h-screen ${styles.darkBg} ${styles.overlay} ${styles.primaryText} font-candal transition-all duration-300`}>
      {/* Greek pattern overlay */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[url('/patterns/greek-pattern.png')] opacity-20 animate-slide-slow"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <main>
          <HeroSection />
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10 dark:to-black/30" />
            <HowItWorksSection />
            <FeaturesSection />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default LandingPage;