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
    <div className={`min-h-screen ${styles.darkBg} ${styles.primaryText} font-['Cinzel']`}>
      {/* Background */}
      <div className="fixed inset-0 z-0 opacity-20">
        <div className="absolute inset-0 bg-[url('/patterns/greek-pattern.png')] animate-slide-slow"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* <Navbar /> */}
        <main>
          <HeroSection />
          <HowItWorksSection />
          <FeaturesSection />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default LandingPage;