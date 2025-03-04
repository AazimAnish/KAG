"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { styles } from "@/utils/constants";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type SignInFormValues = z.infer<typeof signInSchema>;

export const SignInForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInFormValues) => {
    try {
      setIsLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      // Force a page refresh to ensure auth state is recognized across the app
      if (redirectPath.startsWith('/')) {
        // First navigate to the destination
        window.location.href = redirectPath;
      } else {
        // If it's an encoded URL, decode it first
        window.location.href = decodeURIComponent(redirectPath);
      }
    } catch (error) {
      console.error('Error:', error);
      form.setError('root', {
        message: error instanceof Error ? error.message : 'Invalid credentials',
      });
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={styles.primaryText}>Email</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  className={`${styles.glassmorph} border-[#D98324 ]/30 text-[#FFFDEC]`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={styles.primaryText}>Password</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  className={`${styles.glassmorph} border-[#D98324 ]/30 text-[#FFFDEC]`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full bg-[#D98324 ] hover:bg-[#D98324 ]/80 text-[#FFFDEC]"
          disabled={isLoading}
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>

        {form.formState.errors.root && (
          <p className="text-red-500 text-center">
            {form.formState.errors.root.message}
          </p>
        )}

        <p className={`text-center ${styles.secondaryText}`}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#D98324 ] hover:underline">
            Sign Up
          </Link>
        </p>
      </form>
    </Form>
  );
};
