"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { CartItem } from '@/types/store';
import { 
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, ImageOff, ShoppingBag } from 'lucide-react';
import { styles } from '@/utils/constants';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [shippingAddress, setShippingAddress] = useState('');
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const [processingOrder, setProcessingOrder] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadCartItems();
  }, []);

  const loadCartItems = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({
          variant: "destructive",
          title: "Not signed in",
          description: "Please sign in to view your cart"
        });
        router.push('/signin?redirect=/cart');
        return;
      }

      // Load cart from local storage
      const cartData = localStorage.getItem(`cart_${session.user.id}`);
      if (cartData) {
        setCartItems(JSON.parse(cartData));
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load cart items"
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId: string) => {
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({
          variant: "destructive",
          title: "Not signed in",
          description: "Please sign in to modify your cart"
        });
        return;
      }

      // Update cart
      const updatedCart = cartItems.filter(item => item.id !== productId);
      setCartItems(updatedCart);
      
      // Update local storage
      localStorage.setItem(`cart_${session.user.id}`, JSON.stringify(updatedCart));
      
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart"
      });
    } catch (error) {
      console.error('Error removing item:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove item from cart"
      });
    }
  };

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({
          variant: "destructive",
          title: "Not signed in",
          description: "Please sign in to modify your cart"
        });
        return;
      }

      // Update cart
      const updatedCart = cartItems.map(item => 
        item.id === productId ? { ...item, quantity: newQuantity } : item
      );
      setCartItems(updatedCart);
      
      // Update local storage
      localStorage.setItem(`cart_${session.user.id}`, JSON.stringify(updatedCart));
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update item quantity"
      });
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCheckout = (items: CartItem[] = cartItems) => {
    setCheckoutItems(items);
    setCheckoutDialogOpen(true);
  };

  const processOrder = async () => {
    try {
      setProcessingOrder(true);
      
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({
          variant: "destructive",
          title: "Not signed in",
          description: "Please sign in to complete your purchase"
        });
        return;
      }

      if (!shippingAddress) {
        toast({
          variant: "destructive",
          title: "Missing information",
          description: "Please provide a shipping address"
        });
        return;
      }

      const orderItems = checkoutItems.length > 0 ? checkoutItems : cartItems;
      
      // Create the order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            user_id: session.user.id,
            items: orderItems,
            total: orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            status: 'pending',
            shipping_address: shippingAddress,
            created_at: new Date().toISOString()
          }
        ])
        .select();

      if (orderError) throw orderError;

      // Add items to user's wardrobe
      for (const item of orderItems) {
        // Ensure we have an image URL for the wardrobe item
        const imageUrl = item.image_url || (item.images && item.images.length > 0 ? item.images[0] : null);
        
        const { error: wardrobeError } = await supabase
          .from('wardrobe_items')
          .insert([
            {
              user_id: session.user.id,
              name: item.name,
              description: item.description,
              category: item.category,
              type: item.type || item.category,
              color: item.selectedColor || item.color,
              size: item.selectedSize,
              brand: item.brand || '',
              image_url: imageUrl,
              source: 'purchased',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]);

        if (wardrobeError) console.error('Error adding to wardrobe:', wardrobeError);
      }

      // Clear the items from cart if all items were purchased
      if (checkoutItems.length === 0 || checkoutItems.length === cartItems.length) {
        localStorage.removeItem(`cart_${session.user.id}`);
        setCartItems([]);
      } else {
        // Remove only purchased items
        const remainingItems = cartItems.filter(
          cartItem => !checkoutItems.some(checkoutItem => checkoutItem.id === cartItem.id)
        );
        localStorage.setItem(`cart_${session.user.id}`, JSON.stringify(remainingItems));
        setCartItems(remainingItems);
      }

      setCheckoutDialogOpen(false);
      setShippingAddress('');
      setCheckoutItems([]);
      
      toast({
        title: "Order placed successfully",
        description: "Your items have been added to your wardrobe"
      });

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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen pt-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 pt-24">
      <h1 className={`text-3xl font-bold mb-8 ${styles.primaryText}`}>Shopping Cart</h1>
      
      {cartItems.length === 0 ? (
        <div className="text-center py-8">
          <div className="flex flex-col items-center gap-4">
            <ShoppingBag className="h-16 w-16 text-muted-foreground" />
            <p className="text-xl text-muted-foreground">Your cart is empty</p>
            <Button onClick={() => router.push('/store')} className="mt-4">
              Browse Store
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cartItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-4">
                            <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                              {(item.images && item.images[0]) || item.image_url ? (
                                <Image
                                  src={(item.images && item.images[0]) || item.image_url || '/placeholder.jpg'}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageOff className="w-6 h-6 text-muted-foreground/50" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Size: {item.selectedSize}, Color: {item.selectedColor}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>${item.price.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              -
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              +
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          ${(item.price * item.quantity).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-0">
                <Button 
                  className="w-full bg-primary hover:bg-primary/80"
                  onClick={() => handleCheckout()}
                >
                  Checkout
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}

      {/* Checkout Dialog */}
      <Dialog open={checkoutDialogOpen} onOpenChange={setCheckoutDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Complete Your Purchase</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            <div>
              <h3 className="font-medium mb-2">Order Summary</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(checkoutItems.length > 0 ? checkoutItems : cartItems).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.selectedSize}, {item.selectedColor}
                        </p>
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>${(item.price * item.quantity).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="flex justify-between font-medium mt-4">
                <span>Total</span>
                <span>
                  ${(checkoutItems.length > 0 
                      ? checkoutItems.reduce((total, item) => total + (item.price * item.quantity), 0) 
                      : calculateTotal()
                    ).toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="shipping-address">Shipping Address</Label>
              <Input 
                id="shipping-address" 
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Enter your full shipping address"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={processOrder} 
              className="bg-primary hover:bg-primary/80"
              disabled={processingOrder}
            >
              {processingOrder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 