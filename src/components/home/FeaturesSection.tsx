import { styles } from '@/utils/constants';
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import {
  Shirt,
  Brain,
  Sparkles,
  Camera,
  Palette,
  Calendar,
  ShoppingBag
} from 'lucide-react';

const features = [
  {
    title: "AI Wardrobe Analysis",
    description: "Smart organization and categorization of your clothing items",
    header: <div className={`${styles.glassmorph} w-full h-full rounded-xl flex items-center justify-center`}>
      <Shirt className="w-12 h-12 text-[#D98324]" />
    </div>,
    icon: <Shirt className="h-4 w-4 text-[#D98324]" />,
  },
  {
    title: "Style Recommendations",
    description: "Personalized outfit suggestions based on your preferences",
    header: <div className={`${styles.glassmorph} w-full h-full rounded-xl flex items-center justify-center`}>
      <Brain className="w-12 h-12 text-[#D98324]" />
    </div>,
    icon: <Brain className="h-4 w-4 text-[#D98324]" />,
  },
  {
    title: "Virtual Try-On",
    description: "See how outfits look on you before making decisions",
    header: <div className={`${styles.glassmorph} w-full h-full rounded-xl flex items-center justify-center`}>
      <Camera className="w-12 h-12 text-[#D98324]" />
    </div>,
    icon: <Camera className="h-4 w-4 text-[#D98324]" />,
  },
  {
    title: "Occasion-based Styling",
    description: "Perfect outfits for every event and occasion in your calendar",
    header: <div className={`${styles.glassmorph} w-full h-full rounded-xl flex items-center justify-center`}>
      <Calendar className="w-12 h-12 text-[#D98324]" />
    </div>,
    icon: <Calendar className="h-4 w-4 text-[#D98324]" />,
    className: "md:col-span-2"
  },
  {
    title: "Color Analysis",
    description: "Find the perfect color combinations that work for you",
    header: <div className={`${styles.glassmorph} w-full h-full rounded-xl flex items-center justify-center`}>
      <Palette className="w-12 h-12 text-[#D98324]" />
    </div>,
    icon: <Palette className="h-4 w-4 text-[#D98324]" />,
  },
  {
    title: "Smart Shopping",
    description: "Get personalized recommendations for new purchases",
    header: <div className={`${styles.glassmorph} w-full h-full rounded-xl flex items-center justify-center`}>
      <ShoppingBag className="w-12 h-12 text-[#D98324]" />
    </div>,
    icon: <ShoppingBag className="h-4 w-4 text-[#D98324]" />,
  },
  {
    title: "AI Style Evolution",
    description: "Watch your style evolve with smart AI-powered suggestions",
    header: <div className={`${styles.glassmorph} w-full h-full rounded-xl flex items-center justify-center`}>
      <Sparkles className="w-12 h-12 text-[#D98324]" />
    </div>,
    icon: <Sparkles className="h-4 w-4 text-[#D98324]" />,
    className: "md:col-span-2"
  },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 relative backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <h2 className={`text-4xl font-bold text-center mb-16 ${styles.heading}`}>
          Key Features
        </h2>
        <BentoGrid className="max-w-7xl mx-auto">
          {features.map((item, i) => (
            <BentoGridItem
              key={i}
              title={item.title}
              description={item.description}
              header={item.header}
              icon={item.icon}
              className={item.className || ''}
              titleClassName={styles.primaryText}
              descriptionClassName={styles.secondaryText}
            />
          ))}
        </BentoGrid>
      </div>
    </section>
  );
}; 