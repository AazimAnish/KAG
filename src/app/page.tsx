"use client";

import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  X, 
  Upload, 
  Calendar, 
  Sparkles,
  Instagram,
  Twitter,
  Linkedin
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Custom hook for scroll animation
const useScrollAnimation = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return scrolled;
};

const LandingPage = () => {
  const scrolled = useScrollAnimation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Updated custom styles incorporating Greek aesthetics with new color scheme
  const styles = {
    glassmorph: "backdrop-filter backdrop-blur-lg bg-opacity-10 bg-[#1A1A19]",
    greekPattern: "border-double border-4 border-[#347928]/30",
    neonGlow: "shadow-[0_0_15px_rgba(52,121,40,0.1)]",
    gradientText: "bg-gradient-to-r from-[#FFFDEC] to-[#347928] bg-clip-text text-transparent",
    // New color-specific styles
    primaryText: "text-[#FFFDEC]",
    secondaryText: "text-[#FFFDEC]/80",
    accentText: "text-[#347928]",
    darkBg: "bg-[#1A1A19]",
  };

  return (
    <div className={`min-h-screen ${styles.darkBg} ${styles.primaryText} font-['Cinzel']`}>
      {/* Animated background with Greek patterns */}
      <div className="fixed inset-0 z-0 opacity-20">
        <div className="absolute inset-0 bg-[url('/greek-pattern.svg')] animate-slide-slow"></div>
      </div>

      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'py-2' : 'py-4'} ${styles.glassmorph}`}>
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <h1 className={`text-2xl font-bold ${styles.primaryText}`}>Chic AI</h1>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-6">
              <NavLink href="#features">Features</NavLink>
              <NavLink href="#pricing">Pricing</NavLink>
              <NavLink href="#testimonials">Testimonials</NavLink>
              <NavLink href="#about">About Us</NavLink>
            </div>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button 
              variant="ghost" 
              className={`${styles.glassmorph} hover:text-[#347928]`}
            >
              Sign In
            </Button>
            <Button 
              className="bg-[#347928] hover:bg-[#347928]/80 text-[#FFFDEC] shadow-[#347928]/50 hover:shadow-[#347928]/70 transition-all duration-300"
            >
              Sign Up
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center">
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          src="/blackBG.mp4"
        />
        <div className="container mx-auto px-4 py-32 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                Transform Your Wardrobe,
                <span className={styles.gradientText}> Effortlessly</span>
              </h1>
              <p className={`text-xl ${styles.secondaryText}`}>
                Your personal stylist, powered by AI. Perfect outfits for every occasion,
                tailored to your unique style and body type.
              </p>
              <div className="flex space-x-4">
                <Button 
                  size="lg" 
                  className="bg-[#347928] hover:bg-[#347928]/80 text-[#FFFDEC]"
                >
                  Get Started
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className={`${styles.glassmorph} border-[#347928] text-[#FFFDEC] hover:bg-[#347928]/10`}
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

      {/* How It Works Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <h2 className={`text-4xl font-bold text-center mb-16 ${styles.primaryText}`}>
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Upload Your Wardrobe",
                icon: <Upload className="w-12 h-12 text-[#347928]" />,
                description: "Upload your clothes and measurements for personalized styling"
              },
              {
                title: "Specify the Occasion",
                icon: <Calendar className="w-12 h-12 text-[#347928]" />,
                description: "Tell us where you're going and let AI do the magic"
              },
              {
                title: "Get Recommendations",
                icon: <Sparkles className="w-12 h-12 text-[#347928]" />,
                description: "Receive AI-curated outfits perfect for your event"
              }
            ].map((step, index) => (
              <Card 
                key={index} 
                className={`${styles.glassmorph} ${styles.greekPattern} border-[#347928]/30`}
              >
                <CardHeader>
                  <div className="mb-4">{step.icon}</div>
                  <CardTitle className={styles.primaryText}>{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={styles.secondaryText}>{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="container mx-auto px-4">
          <h2 className={`text-4xl font-bold text-center mb-16 ${styles.primaryText}`}>
            Key Features
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Wardrobe Integration",
                description: "Seamlessly upload and organize your entire wardrobe"
              },
              {
                title: "AI Body Fit",
                description: "Get recommendations perfectly tailored to your measurements"
              },
              {
                title: "Occasion Styling",
                description: "Perfect outfits for every event and occasion"
              },
              {
                title: "Visual Try-On",
                description: "See yourself in AI-generated outfit combinations"
              }
            ].map((feature, index) => (
              <Card 
                key={index} 
                className={`${styles.glassmorph} ${styles.greekPattern} border-[#347928]/30`}
              >
                <CardHeader>
                  <CardTitle className={styles.primaryText}>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={styles.secondaryText}>{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`${styles.glassmorph} py-12`}>
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className={`text-xl font-bold mb-4 ${styles.primaryText}`}>Chic AI</h3>
              <p className={styles.secondaryText}>
                Redefining personal styling with the power of AI
              </p>
            </div>
            <div>
              <h4 className={`font-bold mb-4 ${styles.primaryText}`}>Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#features" className={styles.secondaryText}>Features</a></li>
                <li><a href="#pricing" className={styles.secondaryText}>Pricing</a></li>
                <li><a href="#about" className={styles.secondaryText}>About Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className={`font-bold mb-4 ${styles.primaryText}`}>Legal</h4>
              <ul className="space-y-2">
                <li><a href="/privacy" className={styles.secondaryText}>Privacy Policy</a></li>
                <li><a href="/terms" className={styles.secondaryText}>Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className={`font-bold mb-4 ${styles.primaryText}`}>Stay Updated</h4>
              <div className="flex space-x-4">
                <Input 
                  type="email" 
                  placeholder="Enter your email" 
                  className={`${styles.glassmorph} border-[#347928]/30 text-[#FFFDEC]`}
                />
                <Button className="bg-[#347928] text-[#FFFDEC]">Subscribe</Button>
              </div>
              <div className="flex space-x-4 mt-4">
                <Instagram className="w-6 h-6 text-[#347928]" />
                <Twitter className="w-6 h-6 text-[#347928]" />
                <Linkedin className="w-6 h-6 text-[#347928]" />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Helper component for navigation links
const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a 
    href={href} 
    className={`text-[#FFFDEC]/80 hover:text-[#347928] transition-colors duration-200`}
  >
    {children}
  </a>
);

export default LandingPage;