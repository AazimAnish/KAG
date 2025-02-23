export const styles = {
  primaryText: "text-[#443627] dark:text-[#EFDCAB]",
  secondaryText: "text-[#443627]/80 dark:text-[#EFDCAB]/80 font-semibold",
  accentText: "text-[#D98324]",
  darkBg: "bg-[#F2F6D0] dark:bg-[#443627] before:fixed before:inset-0 before:z-[-2] before:bg-[url('/lightBg.jpg')] dark:before:bg-[url('/darkBg.jpg')] before:bg-cover before:bg-center before:bg-fixed before:content-['']",
  overlay: "after:fixed after:inset-0 after:z-[-1] after:bg-[#F2F6D0]/70 dark:after:bg-[#443627]/70 after:content-['']",
  glassmorph: "bg-[#EFDCAB]/10 dark:bg-[#443627]/50 backdrop-blur-lg",
  greekPattern: "border border-[#D98324]/30",
  neonGlow: "shadow-[0_0_15px_rgba(217,131,36,0.1)]",
  gradientText: "bg-gradient-to-r from-[#EFDCAB] to-[#D98324] bg-clip-text text-transparent",
  primaryFont: "font-candal tracking-wide",
  secondaryFont: "font-sriracha",
  kagaiFont: "font-satisfy font-bold",
  heading: "text-[#443627] dark:text-[#EFDCAB] font-candal tracking-wide",
  subheading: "font-sriracha font-medium",
  bodyText: "font-sriracha text-base",
  kagaiText: "font-satisfy text-[#D98324]",
};

export const navigationLinks = [
  { href: "/", label: "Home" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#testimonials", label: "Testimonials" },
  { href: "#about", label: "About Us" },
]; 