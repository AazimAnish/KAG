import { useState } from 'react';
import { WARDROBE_CATEGORIES } from '@/types/wardrobe';
import { styles } from '@/utils/constants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WardrobeFilterProps {
  onFilterChange: (filters: { type: string; occasion: string; season: string }) => void;
}

export const WardrobeFilter = ({ onFilterChange }: WardrobeFilterProps) => {
  const [filters, setFilters] = useState({
    type: 'all',
    style: 'all',
    fit: 'all'
  });

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange({
      type: newFilters.type === 'all' ? '' : newFilters.type,
      occasion: newFilters.style === 'all' ? '' : newFilters.style,
      season: newFilters.fit === 'all' ? '' : newFilters.fit,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Select
        value={filters.type}
        onValueChange={(value) => handleFilterChange('type', value)}
      >
        <SelectTrigger className={`${styles.glassmorph} border-[#D98324 ]/30 text-[#FFFDEC]`}>
          <SelectValue placeholder="Filter by Type" />
        </SelectTrigger>
        <SelectContent className={`${styles.glassmorph} border-[#D98324 ]/30`}>
          <SelectItem value="all" className="text-[#FFFDEC] hover:bg-[#D98324 ]/20">
            All Types
          </SelectItem>
          {WARDROBE_CATEGORIES.types.map((type) => (
            <SelectItem 
              key={type} 
              value={type}
              className="text-[#FFFDEC] hover:bg-[#D98324 ]/20"
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.style}
        onValueChange={(value) => handleFilterChange('style', value)}
      >
        <SelectTrigger className={`${styles.glassmorph} border-[#D98324 ]/30 text-[#FFFDEC]`}>
          <SelectValue placeholder="Filter by Style" />
        </SelectTrigger>
        <SelectContent className={`${styles.glassmorph} border-[#D98324 ]/30`}>
          <SelectItem value="all" className="text-[#FFFDEC] hover:bg-[#D98324 ]/20">
            All Styles
          </SelectItem>
          {WARDROBE_CATEGORIES.styles.map((style) => (
            <SelectItem 
              key={style} 
              value={style}
              className="text-[#FFFDEC] hover:bg-[#D98324 ]/20"
            >
              {style.charAt(0).toUpperCase() + style.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.fit}
        onValueChange={(value) => handleFilterChange('fit', value)}
      >
        <SelectTrigger className={`${styles.glassmorph} border-[#D98324 ]/30 text-[#FFFDEC]`}>
          <SelectValue placeholder="Filter by Fit" />
        </SelectTrigger>
        <SelectContent className={`${styles.glassmorph} border-[#D98324 ]/30`}>
          <SelectItem value="all" className="text-[#FFFDEC] hover:bg-[#D98324 ]/20">
            All Fits
          </SelectItem>
          {WARDROBE_CATEGORIES.fits.map((fit) => (
            <SelectItem 
              key={fit} 
              value={fit}
              className="text-[#FFFDEC] hover:bg-[#D98324 ]/20"
            >
              {fit.charAt(0).toUpperCase() + fit.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}; 