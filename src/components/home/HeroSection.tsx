import { styles } from '@/utils/constants';
import { Button } from "@/components/ui/button";

export const HeroSection = () => {
  return (
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
  );
}; 