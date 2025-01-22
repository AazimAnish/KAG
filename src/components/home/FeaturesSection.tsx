import { styles } from '@/utils/constants';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
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
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 relative">
      <div className="container mx-auto px-4">
        <h2 className={`text-4xl font-bold text-center mb-16 ${styles.primaryText}`}>
          Key Features
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
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
  );
}; 