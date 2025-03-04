"use client";

import { SignInForm } from "@/components/ui/auth/SignInForm";
import { styles } from "@/utils/constants";
import { Suspense } from "react";

export default function SignInPage() {
  return (
    <div className={`min-h-screen ${styles.darkBg} flex items-center justify-center p-4`}>
      <div className="fixed inset-0 z-0 opacity-20">
        <div className="absolute inset-0 bg-[url('/patterns/greek-pattern.png')] animate-slide-slow"></div>
      </div>
      
      <div className={`${styles.glassmorph} ${styles.greekPattern} p-8 rounded-lg w-full max-w-md relative z-10`}>
        <h1 className={`text-3xl font-bold mb-8 text-center ${styles.primaryText}`}>
          Welcome Back
        </h1>
        <Suspense fallback={<div className="text-center p-4">Loading...</div>}>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
}
