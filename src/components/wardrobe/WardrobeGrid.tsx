"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
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

interface WardrobeGridProps {
  userId?: string;
  showFilters: boolean;
}

export const WardrobeGrid = ({ userId, showFilters }: WardrobeGridProps) => {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({});

  useEffect(() => {
    if (!userId) return;

    const fetchItems = async () => {
      try {
        let query = supabase
          .from('wardrobe_items')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'completed');

        if (filters.type) {
          query = query.eq('type', filters.type);
        }
        if (filters.occasion) {
          query = query.contains('tags', [filters.occasion]);
        }
        if (filters.season) {
          query = query.contains('tags', [filters.season]);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        setItems(data || []);
      } catch (error) {
        console.error('Error fetching wardrobe items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [userId, filters]);

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  if (loading) {
    return <div className={styles.secondaryText}>Loading wardrobe...</div>;
  }

  return (
    <div className="space-y-6">
      {showFilters && <WardrobeFilter onFilterChange={handleFilterChange} />}
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((item) => (
          <Card 
            key={item.id}
            className={`${styles.glassmorph} ${styles.greekPattern} border-[#347928]/30`}
          >
            <CardHeader>
              <CardTitle className={`text-sm ${styles.primaryText}`}>
                {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-square relative overflow-hidden rounded-md">
                <Image
                  src={item.image_url}
                  alt={item.type}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {item.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-xs px-2 py-1 rounded-full bg-[#347928]/20 text-[#FFFDEC]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}; 