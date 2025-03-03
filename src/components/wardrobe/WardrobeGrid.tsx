"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { styles } from '@/utils/constants';
import { WardrobeFilter } from './WardrobeFilter';
import { WardrobeItem, FilterOptions } from '@/types/wardrobe';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

interface WardrobeGridProps {
  userId?: string;
  showFilters: boolean;
}

export const WardrobeGrid = ({ userId, showFilters }: WardrobeGridProps) => {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchItems();
    }
  }, [userId, filters]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!userId) {
        throw new Error('User ID is required');
      }

      const supabase = createClient();

      // Verify auth status first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Authentication required');
      }

      // Build the query based on the actual schema
      let query = supabase
        .from('wardrobe_items')
        .select(`
          id,
          user_id,
          name,
          description,
          category,
          type,
          color,
          size,
          brand,
          image_url,
          created_at,
          updated_at
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Apply filters if they exist
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.occasion) {
        query = query.eq('category', filters.occasion);
      }
      // Note: Since there's no direct season column, we might need to 
      // handle season filtering differently based on your requirements

      const { data, error: queryError } = await query;

      if (queryError) {
        console.error('Supabase query error:', queryError);
        throw new Error(queryError.message);
      }

      if (!data) {
        setItems([]);
        return;
      }

      // Transform the data to match your WardrobeItem interface
      const validItems = data.map(item => ({
        id: item.id,
        user_id: item.user_id,
        name: item.name,
        description: item.description,
        category: item.category,
        type: item.type,
        color: item.color,
        size: item.size,
        brand: item.brand,
        image_url: item.image_url,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

      setItems(validItems);

    } catch (error) {
      let errorMessage: string;
      
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      } else {
        errorMessage = 'An unexpected error occurred while fetching wardrobe items';
        console.error('Unknown error type:', error);
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#D98324]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-4">
        <p className="font-semibold">Error loading wardrobe items</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showFilters && (
        <WardrobeFilter onFilterChange={handleFilterChange} />
      )}

      {items.length === 0 ? (
        <div className={`text-center py-8 ${styles.secondaryText}`}>
          No items found in your wardrobe.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div 
              key={item.id} 
              className={`${styles.glassmorph} rounded-lg p-4 aspect-square relative group`}
            >
              <div className="relative w-full h-full">
                <Image
                  src={item.image_url}
                  alt={item.name || item.type}
                  fill
                  className="rounded-lg object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <div className={`text-white text-center p-2 ${styles.primaryText}`}>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm mt-1">{item.type}</p>
                    {item.color && <p className="text-sm">{item.color}</p>}
                    {item.brand && <p className="text-sm">{item.brand}</p>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 