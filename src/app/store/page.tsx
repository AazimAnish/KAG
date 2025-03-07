"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Product, CartItem } from '@/types/store';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ImageOff, ShoppingCart, CreditCard } from 'lucide-react';
import { styles } from '@/utils/constants';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageViewer } from '@/components/ui/ImageViewer';

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [quickBuyProduct, setQuickBuyProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [shippingAddress, setShippingAddress] = useState('');
  const [processingOrder, setProcessingOrder] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentViewImage, setCurrentViewImage] = useState<string>('');
  const [currentProductName, setCurrentProductName] = useState<string>('');
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadProducts();
    updateCartCount();
  }, []);

  const updateCartCount = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const cartData = localStorage.getItem(`cart_${session.user.id}`);
        if (cartData) {
          const cartItems = JSON.parse(cartData);
          setCartCount(cartItems.length);
        }
      }
    } catch (error) {
      console.error('Error loading cart count:', error);
    }
  };

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

  const addToCart = async (product: Product) => {
    try {
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({
          variant: "destructive",
          title: "Not signed in",
          description: "Please sign in to add items to your cart"
        });
        router.push('/signin?redirect=/store');
        return;
      }

      // Check if size and color are provided
      if (!selectedSize || !selectedColor) {
        toast({
          variant: "destructive",
          title: "Selection needed",
          description: "Please select a size and color"
        });
        return;
      }

      // Prepare cart item
      const cartItem: CartItem = {
        ...product,
        quantity: quantity,
        selectedSize: selectedSize,
        selectedColor: selectedColor
      };

      // Get current cart
      const existingCart = localStorage.getItem(`cart_${session.user.id}`);
      let cart = existingCart ? JSON.parse(existingCart) : [];

      // Check if item already exists in cart
      const existingItemIndex = cart.findIndex((item: CartItem) => 
        item.id === product.id && 
        item.selectedSize === selectedSize && 
        item.selectedColor === selectedColor
      );

      if (existingItemIndex !== -1) {
        // Update quantity if item exists
        cart[existingItemIndex].quantity += quantity;
      } else {
        // Add new item
        cart.push(cartItem);
      }

      // Save to localStorage
      localStorage.setItem(`cart_${session.user.id}`, JSON.stringify(cart));
      
      // Update cart count
      setCartCount(cart.length);

      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`
      });

      // Reset selections
      setSelectedSize('');
      setSelectedColor('');
      setQuantity(1);
      setQuickBuyProduct(null);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add item to cart"
      });
    }
  };

  const handleQuickBuy = async (product: Product) => {
    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast({
        variant: "destructive",
        title: "Not signed in",
        description: "Please sign in to make a purchase"
      });
      router.push('/signin?redirect=/store');
      return;
    }
    
    setQuickBuyProduct(product);
    setSelectedSize('');
    setSelectedColor('');
    setQuantity(1);
    setShippingAddress('');
  };

  const processQuickBuyOrder = async () => {
    try {
      if (!quickBuyProduct) return;
      
      setProcessingOrder(true);
      
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({
          variant: "destructive",
          title: "Not signed in",
          description: "Please sign in to complete your purchase"
        });
        router.push('/signin?redirect=/store');
        return;
      }

      // Validate selections
      if (!selectedSize || !selectedColor || !shippingAddress) {
        toast({
          variant: "destructive",
          title: "Missing information",
          description: "Please select size, color, and provide shipping address"
        });
        return;
      }

      // Prepare order item
      const orderItem: CartItem = {
        ...quickBuyProduct,
        quantity: quantity,
        selectedSize: selectedSize,
        selectedColor: selectedColor
      };

      // Create the order
      const { error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            user_id: session.user.id,
            items: [orderItem],
            total: orderItem.price * quantity,
            status: 'pending',
            shipping_address: shippingAddress,
            created_at: new Date().toISOString()
          }
        ]);

      if (orderError) throw orderError;

      // Add item to user's wardrobe
      const { error: wardrobeError } = await supabase
        .from('wardrobe_items')
        .insert([
          {
            user_id: session.user.id,
            name: orderItem.name,
            description: orderItem.description,
            category: orderItem.category,
            type: orderItem.category, // Default to category if type not available
            color: orderItem.color,
            size: orderItem.selectedSize,
            brand: '',
            image_url: orderItem.images[0] || orderItem.image_url || '',
            source: 'purchased',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);

      if (wardrobeError) console.error('Error adding to wardrobe:', wardrobeError);

      // Reset state
      setQuickBuyProduct(null);
      setSelectedSize('');
      setSelectedColor('');
      setQuantity(1);
      setShippingAddress('');
      
      toast({
        title: "Purchase successful",
        description: "Your item has been added to your wardrobe"
      });

      // Redirect to wardrobe page
      router.push('/dashboard/wardrobe');
    } catch (error) {
      console.error('Error processing order:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process your order"
      });
    } finally {
      setProcessingOrder(false);
    }
  };

  // Handle opening image in fullscreen viewer
  const handleOpenImage = (imageUrl: string | null, productName: string) => {
    if (!imageUrl) return;
    setCurrentViewImage(imageUrl);
    setCurrentProductName(productName);
    setViewerOpen(true);
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
      <div className="flex justify-between items-center mb-8">
        <h1 className={`text-3xl font-bold ${styles.primaryText}`}>Store</h1>
        <Button 
          onClick={() => router.push('/cart')}
          variant="outline"
          className="relative"
        >
          <ShoppingCart className="h-5 w-5 mr-2" />
          Cart
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </Button>
      </div>
      
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
                    className="object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    onError={() => handleImageError(product.id)}
                    onClick={() => handleOpenImage(getProductImageSrc(product), product.name)}
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
            <CardFooter className="p-4 pt-0 flex gap-2">
              <Button 
                variant="outline"
                className="flex-1"
                onClick={() => handleQuickBuy(product)}
                disabled={product.stock <= 0}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Buy Now
              </Button>
              <Button 
                className="flex-1 bg-primary hover:bg-primary/80 text-primary-foreground"
                onClick={() => handleQuickBuy(product)}
                disabled={product.stock <= 0}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Quick Buy / Add to Cart Dialog */}
      <Dialog open={!!quickBuyProduct} onOpenChange={(open) => {
        if (!open) setQuickBuyProduct(null);
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{quickBuyProduct?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  {quickBuyProduct && getProductImageSrc(quickBuyProduct) ? (
                    <Image
                      src={getProductImageSrc(quickBuyProduct)!}
                      alt={quickBuyProduct.name || 'Product image'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                      <ImageOff className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm">No image</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-lg font-bold text-primary">
                    ${quickBuyProduct?.price.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {quickBuyProduct?.stock && quickBuyProduct.stock > 0 ? 'In Stock' : 'Out of Stock'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="size">Size</Label>
                  <Select
                    value={selectedSize}
                    onValueChange={setSelectedSize}
                  >
                    <SelectTrigger id="size">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                        <SelectItem key={size} value={size}>{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Select
                    value={selectedColor}
                    onValueChange={setSelectedColor}
                  >
                    <SelectTrigger id="color">
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      {['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Gray', 'Brown'].map((color) => (
                        <SelectItem key={color} value={color}>{color}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      -
                    </Button>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="w-16 text-center"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Only show shipping address for quick buy */}
            <div id="shipping-section" className="space-y-2">
              <Label htmlFor="shipping-address">Shipping Address</Label>
              <Input 
                id="shipping-address" 
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Enter your full shipping address"
              />
            </div>
          </div>
          
          <DialogFooter className="flex gap-2 flex-wrap sm:flex-nowrap">
            <Button 
              variant="outline" 
              onClick={() => setQuickBuyProduct(null)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (quickBuyProduct) addToCart(quickBuyProduct);
              }}
              className="w-full sm:w-auto bg-primary hover:bg-primary/80"
              disabled={!selectedSize || !selectedColor || processingOrder}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
            <Button 
              onClick={processQuickBuyOrder}
              className="w-full sm:w-auto bg-primary hover:bg-primary/80"
              disabled={!selectedSize || !selectedColor || !shippingAddress || processingOrder}
            >
              {processingOrder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <CreditCard className="h-4 w-4 mr-2" />
              Buy Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {viewerOpen && (
        <ImageViewer
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
          imageUrl={currentViewImage}
          alt={currentProductName}
        />
      )}
    </div>
  );
} 