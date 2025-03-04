"use client";

import { styles } from '@/utils/constants';
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export const HeroSection = () => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Wait until mounted to avoid hydration mismatch 
  useEffect(() => {
    setMounted(true);
  }, []);

  // Default to dark theme video until client-side renders
  const videoSrc = !mounted ? '/night.mp4' : theme === 'dark' ? '/night.mp4' : '/day.mp4';
  
  // Determine if dark mode is active for styling
  const isDark = mounted && theme === 'dark';

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
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
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
                className={`
                  ${styles.primaryFont} 
                  ${styles.glassmorph} 
                  border-[#D98324] 
                  ${isDark 
                    ? 'text-[#EFDCAB] hover:bg-[#D98324]/10' 
                    : 'text-[#443627] hover:bg-[#D98324]/20'
                  }
                `}
              >
                Explore Features
              </Button>
            </div>
          </motion.div>
          
          <motion.div 
            className="flex justify-center"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative">
              {/* Glowing border container */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                {/* Animated glowing border that moves around the perimeter */}
                <motion.div
                  className="absolute"
                  initial={{ pathLength: 0, pathOffset: 0 }}
                  animate={{ 
                    pathLength: 1, 
                    pathOffset: [0, 1],
                  }}
                  transition={{ 
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  style={{
                    width: "100%",
                    height: "100%",
                    top: 0,
                    left: 0,
                  }}
                >
                  <svg 
                    width="100%" 
                    height="100%" 
                    viewBox="0 0 100 100" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg" 
                    preserveAspectRatio="none"
                  >
                    <motion.path
                      d="M 0,0 L 100,0 L 100,100 L 0,100 Z"
                      stroke={isDark ? "#D98324" : "#D98324"}
                      strokeWidth="1"
                      strokeDasharray="0 1"
                      fill="none"
                      initial={{ pathLength: 0 }}
                      animate={{ 
                        pathLength: 1,
                      }}
                      style={{
                        filter: `drop-shadow(0 0 8px ${isDark ? "#D98324" : "#D98324"})`,
                      }}
                    />
                  </svg>
                </motion.div>
              </div>

              <motion.div 
                className={`
                  ${styles.glassmorph} 
                  rounded-2xl 
                  p-5
                  overflow-hidden
                  relative
                  backdrop-blur-md
                  ${isDark ? 'bg-[#1a1a1a]/40' : 'bg-[#f8f8f8]/40'}
                  border border-[#D98324]/30
                `}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                {/* Main video content */}
                <div className={`
                  relative
                  rounded-xl
                  p-4
                  mt-2
                  ${isDark ? 'bg-[#1a1a1a]/50' : 'bg-[#f8f8f8]/40'}
                  overflow-hidden
                `}>
                  {/* Border pattern */}
                  <div className={`
                    absolute inset-0 
                    ${styles.greekPattern} 
                    opacity-30
                  `}></div>
                  
                  {/* Subtle video overlay gradient */}
                  <div className={`
                    absolute inset-0 
                    rounded-lg
                    ${isDark 
                      ? 'bg-gradient-to-tr from-[#D98324]/10 to-transparent' 
                      : 'bg-gradient-to-bl from-[#D98324]/20 to-transparent'
                    }
                  `}></div>
                  
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="relative z-10"
                  >
                    <video 
                      src="/AImodel.mp4"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="h-[600px] w-auto object-cover rounded-lg shadow-lg"
                    />
                  </motion.div>

                  {/* KAG-AI Chip in top center with sparkle animation */}
                  <motion.div
                    className={`
                      absolute -top-12 left-1/2 transform -translate-x-1/2 z-20
                      ${styles.glassmorph}
                      px-4 py-2 rounded-full
                      ${isDark ? 'bg-[#1a1a1a]/70' : 'bg-[#f8f8f8]/70'}
                      border border-[#D98324]/50
                      flex items-center gap-2
                      shadow-lg
                    `}
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 1 }}
                    whileHover={{ y: -3, boxShadow: "0 0 15px rgba(217, 131, 36, 0.5)" }}
                  >
                    <motion.div
                      animate={{ 
                        rotate: [0, 5, 0, -5, 0],
                        scale: [1, 1.1, 1, 1.1, 1]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "loop"
                      }}
                    >
                      <Sparkles 
                        className={`w-5 h-5 ${isDark ? 'text-[#D98324]' : 'text-[#D98324]'}`} 
                      />
                    </motion.div>
                    
                    <motion.span 
                      className={`${styles.kagaiFont} ${styles.gradientText} font-bold`}
                      animate={{
                        textShadow: [
                          "0 0 5px rgba(217, 131, 36, 0.5)",
                          "0 0 15px rgba(217, 131, 36, 0.8)",
                          "0 0 5px rgba(217, 131, 36, 0.5)",
                        ]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "loop"
                      }}
                    >
                      KAG-AI
                    </motion.span>
                  </motion.div>
                </div>
                
                {/* Floating sparkles around the chip */}
                <motion.div 
                  className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10"
                  animate={{ 
                    y: [0, -8, 0],
                    opacity: [0, 0.8, 0],
                    scale: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "loop",
                    delay: 0.5
                  }}
                >
                  <div className="w-1 h-1 bg-[#D98324] rounded-full" />
                </motion.div>
                
                <motion.div 
                  className="absolute top-12 left-1/3 transform -translate-x-1/2 z-10"
                  animate={{ 
                    y: [0, -10, 0],
                    opacity: [0, 0.6, 0],
                    scale: [0.3, 0.8, 0.3]
                  }}
                  transition={{ 
                    duration: 1.8,
                    repeat: Infinity,
                    repeatType: "loop",
                    delay: 1.2
                  }}
                >
                  <div className="w-1 h-1 bg-[#EFDCAB] rounded-full" />
                </motion.div>
                
                <motion.div 
                  className="absolute top-10 left-2/3 transform -translate-x-1/2 z-10"
                  animate={{ 
                    y: [0, -6, 0],
                    opacity: [0, 0.7, 0],
                    scale: [0.4, 0.9, 0.4]
                  }}
                  transition={{ 
                    duration: 2.2,
                    repeat: Infinity,
                    repeatType: "loop",
                    delay: 0.8
                  }}
                >
                  <div className="w-1 h-1 bg-[#D98324] rounded-full" />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};