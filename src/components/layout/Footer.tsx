import { Instagram, Twitter, Linkedin } from 'lucide-react';
import { styles } from '@/utils/constants';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Footer = () => {
  return (
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
                className={`${styles.glassmorph} border-[#D98324 ]/30 text-[#FFFDEC]`}
              />
              <Button className="bg-[#D98324 ] text-[#FFFDEC]">Subscribe</Button>
            </div>
            <div className="flex space-x-4 mt-4">
              <Instagram className="w-6 h-6 text-[#D98324 ]" />
              <Twitter className="w-6 h-6 text-[#D98324 ]" />
              <Linkedin className="w-6 h-6 text-[#D98324 ]" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
