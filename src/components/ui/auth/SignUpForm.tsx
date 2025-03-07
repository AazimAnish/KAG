"use client";

import { useState, useCallback } from "react";
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
  FormDescription,
} from "@/components/ui/form";
import { styles } from "@/utils/constants";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";

type MeasurementField = 'height' | 'weight' | 'chest' | 'waist' | 'hips';

const measurementHints = {
  height: 'Height in centimeters (cm)',
  weight: 'Weight in kilograms (kg)',
  chest: 'Chest circumference in centimeters (cm)',
  waist: 'Waist circumference in centimeters (cm)',
  hips: 'Hip circumference in centimeters (cm)',
};

export const SignUpForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const { toast } = useToast();

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

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      setUploadingAvatar(true);
      const file = acceptedFiles[0];

      if (!file) {
        toast({
          variant: "destructive",
          title: "Upload Error",
          description: "No file selected"
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File size too large",
          description: "File size must be less than 5MB"
        });
        return;
      }

      // Validate file type using both extension and mime type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please use JPG, PNG or GIF');
      }

      // Get file extension from mime type
      const fileExt = file.type.split('/')[1];
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload with proper content type
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        if (uploadError.message.includes('storage quota')) {
          throw new Error('Storage quota exceeded');
        }
        throw new Error(uploadError.message || 'Failed to upload image');
      }

      if (!data?.path) {
        throw new Error('No upload path returned');
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      if (!publicUrl) {
        throw new Error('Failed to get public URL');
      }

      setAvatarUrl(publicUrl);

      toast({
        variant: "success",
        title: "Success",
        description: "Profile picture uploaded successfully"
      });
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: error instanceof Error ? error.message : "Failed to upload avatar"
      });
    } finally {
      setUploadingAvatar(false);
    }
  }, [form, toast]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif']
    },
    maxFiles: 1,
    multiple: false,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  const onSubmit = async (data: SignUpFormValues) => {
    try {
      setIsLoading(true);

      // Sign up the user with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            full_name: data.name
          }
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          form.setError('email', {
            message: 'Email already registered. Please sign in instead.'
          });
          return;
        }
        throw authError;
      }

      if (!authData.user?.id) {
        throw new Error('Failed to create user account');
      }

      // Create profile with name and avatar
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          name: data.name,
          gender: data.gender,
          body_type: data.bodyType,
          avatar_url: avatarUrl,
          measurements: {
            height: Number(data.measurements.height),
            weight: Number(data.measurements.weight),
            chest: Number(data.measurements.chest),
            waist: Number(data.measurements.waist),
            hips: Number(data.measurements.hips),
          }
        }, { onConflict: 'id' });

      if (profileError) {
        throw new Error('Failed to create profile: ' + profileError.message);
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Signup error:', error);
      
      // Handle known error types
      if (error instanceof Error) {
        if (error.message.includes('duplicate key')) {
          form.setError('email', {
            message: 'Email already registered'
          });
        } else if (error.message.includes('invalid email')) {
          form.setError('email', {
            message: 'Invalid email format'
          });
        } else if (error.message.includes('password')) {
          form.setError('password', {
            message: 'Password must be at least 6 characters'
          });
        } else {
          form.setError('root', {
            message: error.message
          });
        }
      } else {
        form.setError('root', {
          message: 'An unexpected error occurred'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <label className={styles.primaryText}>Profile Picture</label>
          <div
            {...getRootProps()}
            className={`${styles.glassmorph} border-2 border-dashed border-[#D98324 ]/30 
              rounded-lg p-4 text-center cursor-pointer hover:border-[#D98324 ]/50 transition-colors`}
          >
            <input {...getInputProps()} />
            {avatarUrl ? (
              <div className="relative w-24 h-24 mx-auto">
                <Image
                  src={avatarUrl}
                  alt="Avatar"
                  fill
                  className="rounded-full object-cover"
                />
              </div>
            ) : (
              <p className={styles.secondaryText}>
                {uploadingAvatar ? 'Uploading...' : 'Drop or click to upload profile picture'}
              </p>
            )}
          </div>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={styles.primaryText}>Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className={`${styles.glassmorph} border-[#D98324 ]/30 text-[#FFFDEC]`}
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={styles.primaryText}>Gender</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className={`${styles.glassmorph} border-[#D98324 ]/30 text-[#FFFDEC]`}>
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
                    <SelectTrigger className={`${styles.glassmorph} border-[#D98324 ]/30 text-[#FFFDEC]`}>
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
                        className={`${styles.glassmorph} border-[#D98324 ]/30 text-[#FFFDEC]`}
                        placeholder={measurementHints[measurement]}
                      />
                    </FormControl>
                    <FormDescription className="text-[#FFFDEC]/60">
                      {measurementHints[measurement]}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          variant="default"
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
          <Link href="/signin" className="text-[#D98324 ] hover:underline">
            Sign In
          </Link>
        </p>
      </form>
    </Form>
  );
};
