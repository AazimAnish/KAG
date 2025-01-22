import { Upload, Calendar, Sparkles } from 'lucide-react';
import { styles } from '@/utils/constants';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const steps = [
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
];

export const HowItWorksSection = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <h2 className={`text-4xl font-bold text-center mb-16 ${styles.primaryText}`}>
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
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
  );
}; 