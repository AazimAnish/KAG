"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Product } from '@/types/store';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ImageOff } from 'lucide-react';
import { styles } from '@/utils/constants';

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;

      // Process products to handle both images array and image_url field
      const validProducts = (data || []).map(product => ({
        ...product,
        images: product.images || [] // Provide empty array as fallback
      }));

      setProducts(validProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Failed to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to determine the image source for a product
  const getProductImageSrc = (product: any): string | null => {
    // Skip if we've already determined this image has an error
    if (product.id && imageErrors[product.id]) {
      return null;
    }

    // First try image_url field
    if (product.image_url) {
      // Make sure the URL is valid and complete
      if (typeof product.image_url === 'string' && 
          (product.image_url.startsWith('http') || product.image_url.startsWith('/'))) {
        return product.image_url;
      }
    }
    
    // Then try the first item in the images array
    if (product.images && product.images.length > 0 && 
        typeof product.images[0] === 'string' &&
        (product.images[0].startsWith('http') || product.images[0].startsWith('/'))) {
      return product.images[0];
    }
    
    // No valid image available
    return null;
  };

  // Handle image loading errors
  const handleImageError = (productId: string) => {
    setImageErrors(prev => ({
      ...prev,
      [productId]: true
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen pt-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-4 pt-24">
        <p className="font-semibold">Error</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4 pt-24">
        <h1 className={`text-3xl font-bold mb-8 ${styles.primaryText}`}>Store</h1>
        <p className="text-center text-muted-foreground">No products available.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 pt-24">
      <h1 className={`text-3xl font-bold mb-8 ${styles.primaryText}`}>Store</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="relative aspect-square rounded-lg overflow-hidden mb-4 bg-muted">
                {getProductImageSrc(product) && !imageErrors[product.id] ? (
                  <Image
                    src={getProductImageSrc(product)!}
                    alt={product.name || 'Product image'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    onError={() => handleImageError(product.id)}
                    priority={true}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                    <ImageOff className="w-12 h-12 mb-2 opacity-50" />
                    <p>Image unavailable</p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">{product.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-primary">
                    ${product.price.toFixed(2)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-2 py-1 text-xs bg-secondary/50 text-secondary-foreground dark:bg-muted dark:text-muted-foreground rounded-full">{product.category}</span>
                  <span className="px-2 py-1 text-xs bg-secondary/50 text-secondary-foreground dark:bg-muted dark:text-muted-foreground rounded-full">{product.color}</span>
                  <span className="px-2 py-1 text-xs bg-secondary/50 text-secondary-foreground dark:bg-muted dark:text-muted-foreground rounded-full">{product.size}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Button 
                className="w-full bg-primary hover:bg-primary/80 text-primary-foreground"
                onClick={() => {
                  // Add to cart functionality
                  toast({
                    title: "Added to cart",
                    description: `${product.name} has been added to your cart.`
                  });
                }}
              >
                Add to Cart
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 