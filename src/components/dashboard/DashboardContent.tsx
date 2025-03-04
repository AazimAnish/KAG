"use client";

import { useState } from 'react';
import { User } from '@/types/auth';
import { styles } from '@/utils/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Pencil, Save, X, Upload } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DashboardContentProps {
  user: User | null;
}

export const DashboardContent = ({ user }: DashboardContentProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<User | null>(user);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  if (!user || !formData) return null;

  const formatValue = (key: string, value: number): string => {
    switch (key) {
      case 'height':
        return `${value} cm`;
      case 'weight':
        return `${value} kg`;
      default:
        return `${value} cm`;
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  };

  const handleMeasurementChange = (field: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    
    setFormData(prev => {
      if (!prev || !prev.measurements) return prev;
      return {
        ...prev,
        measurements: {
          ...prev.measurements,
          [field]: numValue,
        },
      };
    });
  };

  const handleCancel = () => {
    setFormData(user);
    setIsEditing(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File size validation (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "File size should be less than 5MB"
      });
      return;
    }

    try {
      setIsUploading(true);
      
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      const publicUrl = urlData.publicUrl;
      
      // Update user data with new avatar URL
      setFormData(prev => prev ? { ...prev, avatar_url: publicUrl } : prev);

      toast({
        title: "Success",
        description: "Avatar uploaded successfully"
      });
      
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload avatar"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          avatar_url: formData.avatar_url,
          gender: formData.gender,
          body_type: formData.bodyType,
          measurements: formData.measurements,
        })
        .eq('id', user.id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile"
      });
    }
  };

  return (
    <main className="container mx-auto px-4 pt-24">
      <div className="flex justify-end mb-4">
        {isEditing ? (
          <div className="space-x-2">
            <Button onClick={handleSaveProfile} className="bg-[#D98324]">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        ) : (
          <Button onClick={() => setIsEditing(true)} variant="outline">
            <Pencil className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className={`${styles.glassmorph} ${styles.greekPattern} border-[#D98324 ]/30`}>
          <CardHeader>
            <CardTitle className={styles.primaryText}>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="relative w-24 h-24">
                  {formData.avatar_url ? (
                    <Image
                      src={formData.avatar_url}
                      alt={formData.name || 'Profile'}
                      fill
                      className="rounded-full object-cover border-2 border-[#D98324 ]/30"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-[#D98324]/20 flex items-center justify-center border-2 border-[#D98324 ]/30">
                      <span className={`text-2xl ${styles.primaryText}`}>
                        {formData.name ? formData.name.charAt(0).toUpperCase() : '?'}
                      </span>
                    </div>
                  )}
                  
                  {isEditing && (
                    <div className="absolute -bottom-2 -right-2">
                      <Label
                        htmlFor="avatar-upload"
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-[#D98324] text-white cursor-pointer"
                      >
                        {isUploading ? (
                          <span className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></span>
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </Label>
                      <Input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={isUploading}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                {isEditing ? (
                  <>
                    <div className="space-y-1">
                      <Label htmlFor="name" className={styles.secondaryText}>Name</Label>
                      <Input
                        id="name"
                        value={formData.name || ''}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className={`${styles.glassmorph} border-[#D98324 ]/30 ${styles.secondaryText}`}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <p className={styles.secondaryText}>Name: {formData.name || 'Not set'}</p>
                    <p className={styles.secondaryText}>Email: {formData.email}</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${styles.glassmorph} ${styles.greekPattern} border-[#D98324 ]/30`}>
          <CardHeader>
            <CardTitle className={styles.primaryText}>Measurements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {isEditing ? (
                <div className="grid grid-cols-2 gap-4">
                  {formData.measurements && Object.entries(formData.measurements).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <Label htmlFor={key} className={styles.secondaryText}>
                        {key.charAt(0).toUpperCase() + key.slice(1)} (cm/kg)
                      </Label>
                      <Input
                        id={key}
                        type="number"
                        value={value}
                        onChange={(e) => handleMeasurementChange(key, e.target.value)}
                        className={`${styles.glassmorph} border-[#D98324 ]/30 ${styles.secondaryText}`}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {formData.measurements && Object.entries(formData.measurements).map(([key, value]) => (
                    <p key={key} className={styles.secondaryText}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}: {formatValue(key, value)}
                    </p>
                  ))}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className={`${styles.glassmorph} ${styles.greekPattern} border-[#D98324 ]/30`}>
          <CardHeader>
            <CardTitle className={styles.primaryText}>Style Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isEditing ? (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="body-type" className={styles.secondaryText}>Body Type</Label>
                    <Select 
                      value={formData.bodyType || ''}
                      onValueChange={(value) => handleInputChange('bodyType', value)}
                    >
                      <SelectTrigger id="body-type" className={`${styles.glassmorph} border-[#D98324 ]/30 ${styles.secondaryText}`}>
                        <SelectValue placeholder="Select body type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="slim">Slim</SelectItem>
                        <SelectItem value="athletic">Athletic</SelectItem>
                        <SelectItem value="average">Average</SelectItem>
                        <SelectItem value="plus">Plus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="gender" className={styles.secondaryText}>Gender</Label>
                    <Select 
                      value={formData.gender || ''} 
                      onValueChange={(value) => handleInputChange('gender', value)}
                    >
                      <SelectTrigger id="gender" className={`${styles.glassmorph} border-[#D98324 ]/30 ${styles.secondaryText}`}>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <p className={styles.secondaryText}>
                    Body Type: {formData.bodyType ? formData.bodyType.charAt(0).toUpperCase() + formData.bodyType.slice(1) : 'Not set'}
                  </p>
                  <p className={styles.secondaryText}>
                    Gender: {formData.gender ? formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1) : 'Not set'}
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}; 