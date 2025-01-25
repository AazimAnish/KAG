"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema, type SignUpFormValues } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useRouter } from "next/navigation";

type MeasurementField = 'height' | 'weight' | 'chest' | 'waist' | 'hips';

export const SignUpForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      gender: "other",
      bodyType: "average",
      measurements: {
        height: 170,
        weight: 70,
        chest: 90,
        waist: 80,
        hips: 90,
      },
    },
  });

  const onSubmit = async (data: SignUpFormValues) => {
    try {
      setIsLoading(true);

      // 1. Create auth user with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            gender: data.gender,
            bodyType: data.bodyType,
            height: data.measurements.height,
            weight: data.measurements.weight,
            chest: data.measurements.chest,
            waist: data.measurements.waist,
            hips: data.measurements.hips
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // 2. Automatically signed in after sign up
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) throw signInError;

      router.push('/dashboard');
    } catch (error) {
      console.error('Signup Error:', error);
      form.setError('root', {
        message: error instanceof Error ? error.message : 'Something went wrong'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={styles.primaryText}>Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className={`${styles.glassmorph} border-[#347928]/30 text-[#FFFDEC]`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                  className={`${styles.glassmorph} border-[#347928]/30 text-[#FFFDEC]`}
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
                  className={`${styles.glassmorph} border-[#347928]/30 text-[#FFFDEC]`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={styles.primaryText}>Gender</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className={`${styles.glassmorph} border-[#347928]/30 text-[#FFFDEC]`}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bodyType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={styles.primaryText}>Body Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className={`${styles.glassmorph} border-[#347928]/30 text-[#FFFDEC]`}>
                      <SelectValue placeholder="Select body type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="slim">Slim</SelectItem>
                    <SelectItem value="athletic">Athletic</SelectItem>
                    <SelectItem value="average">Average</SelectItem>
                    <SelectItem value="plus">Plus Size</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className={`text-lg font-semibold ${styles.primaryText}`}>Measurements</h3>
          <div className="grid grid-cols-2 gap-4">
            {(['height', 'weight', 'chest', 'waist', 'hips'] as MeasurementField[]).map((measurement) => (
              <FormField
                key={measurement}
                control={form.control}
                name={`measurements.${measurement}`}
                render={({ field: { onChange, value, ...field } }) => (
                  <FormItem>
                    <FormLabel className={styles.primaryText}>
                      {measurement.charAt(0).toUpperCase() + measurement.slice(1)}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        value={value?.toString() || ''}
                        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                        className={`${styles.glassmorph} border-[#347928]/30 text-[#FFFDEC]`}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-[#347928] hover:bg-[#347928]/80 text-[#FFFDEC]"
          disabled={isLoading}
        >
          {isLoading ? "Creating account..." : "Sign Up"}
        </Button>

        {form.formState.errors.root && (
          <p className="text-red-500 text-center">
            {form.formState.errors.root.message}
          </p>
        )}

        <p className={`text-center ${styles.secondaryText}`}>
          Already have an account?{" "}
          <Link href="/signin" className="text-[#347928] hover:underline">
            Sign In
          </Link>
        </p>
      </form>
    </Form>
  );
};
