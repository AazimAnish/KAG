import { Button } from "@/components/ui/button";
import { Grid2X2, Plus, Filter, Wand2 } from "lucide-react";
import { styles } from "@/utils/constants";

interface WardrobeNavProps {
  view: 'grid' | 'upload' | 'recommend';
  onViewChange: (view: 'grid' | 'upload' | 'recommend') => void;
  onToggleFilters: () => void;
  showFilters: boolean;
}

export const WardrobeNav = ({ view, onViewChange, onToggleFilters, showFilters }: WardrobeNavProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className={`text-3xl font-bold ${styles.primaryText}`}>My Wardrobe</h1>

      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToggleFilters()}
          className={`${styles.glassmorph} hover:bg-[#347928]/20 ${showFilters ? 'bg-[#347928]/20' : ''}`}
        >
          <Filter className="h-5 w-5 text-[#FFFDEC]" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onViewChange('grid')}
          className={`${styles.glassmorph} hover:bg-[#347928]/20 ${view === 'grid' ? 'bg-[#347928]/20' : ''}`}
        >
          <Grid2X2 className="h-5 w-5 text-[#FFFDEC]" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onViewChange('upload')}
          className={`${styles.glassmorph} hover:bg-[#347928]/20 ${view === 'upload' ? 'bg-[#347928]/20' : ''}`}
        >
          <Plus className="h-5 w-5 text-[#FFFDEC]" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onViewChange('recommend')}
          className={`${styles.glassmorph} hover:bg-[#347928]/20 ${view === 'recommend' ? 'bg-[#347928]/20' : ''}`}
        >
          <Wand2 className="h-5 w-5 text-[#FFFDEC]" />
        </Button>
      </div>
    </div>
  );
}; 