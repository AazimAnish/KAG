export const styles = {
  primaryText: "text-foreground",
  secondaryText: "text-foreground/80 font-semibold",
  accentText: "text-primary",
  darkBg: "bg-background before:fixed before:inset-0 before:z-[-2] before:bg-[url('/lightBg.jpg')] dark:before:bg-[url('/darkBg.jpg')] before:bg-cover before:bg-center before:bg-fixed before:content-['']",
  overlay: "after:fixed after:inset-0 after:z-[-1] after:bg-background/70 after:content-['']",
  glassmorph: "bg-secondary/10 dark:bg-muted/50 backdrop-blur-lg",
  greekPattern: "border border-primary/30",
  neonGlow: "shadow-[0_0_15px_rgba(var(--primary),0.1)]",
  gradientText: "bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent",
  primaryFont: "font-candal tracking-wide",
  secondaryFont: "font-sriracha",
  kagaiFont: "font-satisfy font-bold",
  heading: "text-foreground font-candal tracking-wide",
  subheading: "font-sriracha font-medium",
  bodyText: "font-sriracha text-base",
  kagaiText: "font-satisfy text-primary",
};

export const navigationLinks = [
  { href: "/", label: "Home" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#testimonials", label: "Testimonials" },
  { href: "#about", label: "About Us" },
]; 