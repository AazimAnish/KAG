"use client";

import { useState, useEffect } from 'react';
import { styles } from '@/utils/constants';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from '@/lib/supabase/client';
import { OutfitSuggestion, OutfitEvent } from '@/types/wardrobe';
import Image from 'next/image';
import { OutfitChat } from '@/components/chat/OutfitChat';
import { Trash2, Loader2, ShoppingBag } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { OutfitTryOn } from './OutfitTryOn';
import { User } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Progress } from "@/components/ui/progress";
import { ImageViewer } from '@/components/ui/ImageViewer';
import { Badge } from "@/components/ui/badge";

interface OutfitRecommenderProps {
  userId: string;
}

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  color: string;
  image_url: string;
  type: string;
  styling_notes?: string;
  styling_tips?: string[];
  isStoreItem?: boolean;
  price?: number;
}

export const OutfitRecommender = ({ userId }: OutfitRecommenderProps) => {
  const [loading, setLoading] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [recommendation, setRecommendation] = useState<ClothingItem[]>([]);
  const [pastSuggestions, setPastSuggestions] = useState<OutfitSuggestion[]>([]);
  const [events, setEvents] = useState<OutfitEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventDetails, setEventDetails] = useState({
    title: '',
    description: '',
    event_type: 'casual',
    date: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState<string | null>(null);
  const [showNewEvent, setShowNewEvent] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [wardrobeItems, setWardrobeItems] = useState<ClothingItem[]>([]);
  const [storeItems, setStoreItems] = useState<ClothingItem[]>([]);
  const { toast } = useToast();
  const [outfitDescription, setOutfitDescription] = useState('');
  const [outfit, setOutfit] = useState<any>(null);
  const [recommendationId, setRecommendationId] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentViewImage, setCurrentViewImage] = useState<string>('');

  // Event form state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [eventType, setEventType] = useState<string>('');
  const [eventDescription, setEventDescription] = useState<string>('');

  useEffect(() => {
    loadPastSuggestions();
    loadEvents();
    loadUser();
    fetchWardrobeAndStoreItems();
  }, [userId]);

  const loadPastSuggestions = async () => {
    const { data } = await supabase
      .from('outfit_recommendations')
      .select('*, events(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) {
      setPastSuggestions(data);
      if (data.length > 0 && !recommendation.length) {
        setRecommendation(data[0].recommendation.items);
      }
    }
  };

  const loadEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) {
      setEvents(data);
    }
  };

  const loadUser = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setUser({
        id: data.id,
        email: '', // You might want to get this from auth.getUser()
        name: data.name,
        avatar_url: data.avatar_url,
        gender: data.gender,
        bodyType: data.body_type,
        measurements: data.measurements,
      });
    }
  };

  const fetchWardrobeAndStoreItems = async () => {
    try {
      // Check if tables exist first
      const { data: tables } = await supabase
        .from('pg_tables')
        .select('tablename')
        .in('tablename', ['wardrobe_items', 'products']);

      // Fetch wardrobe items with error handling
      const wardrobeResult = await supabase
        .from('wardrobe_items')
        .select('id, type, image_url, category, color')
        .eq('user_id', userId);

      if (wardrobeResult.error) {
        console.error('Wardrobe fetch error:', wardrobeResult.error.message);
      } else {
        setWardrobeItems(wardrobeResult.data?.map(item => ({
          id: item.id,
          name: item.type,
          category: item.category || item.type,
          color: item.color || '',
          image_url: item.image_url,
          type: item.type
        })) || []);
      }

      // Fetch store items with error handling
      const storeResult = await supabase
        .from('products')
        .select('id, name, description, price, image_url, category, color')
        .eq('in_stock', true);

      if (storeResult.error) {
        console.error('Store fetch error:', storeResult.error.message);
      } else {
        setStoreItems(storeResult.data?.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          color: item.color || '',
          image_url: item.image_url,
          type: item.category,
          price: item.price,
          isStoreItem: true
        })) || []);
      }

    } catch (error) {
      console.error('Database connection error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to connect to database"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setOutfit(null);
    setError(null);
    setLoading(true);
    setGenerationStep("Saving event details...");
    setGenerationProgress(10);

    try {
      // Save the event first
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .insert({
          date: eventDetails.date,
          event_type: eventDetails.event_type,
          description: eventDetails.description,
          title: eventDetails.title,
          user_id: userId,
        })
        .select()
        .single();

      if (eventError) {
        setError('Failed to save event');
        setLoading(false);
        return;
      }

      setGenerationStep("Analyzing your wardrobe...");
      setGenerationProgress(30);

      // Set a timeout for the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      try {
        // Call the outfit recommendation endpoint
        setGenerationStep("Generating recommendations...");
        setGenerationProgress(50);

        const response = await fetch('/api/outfit-recommendations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventId: eventData.id,
            userId: userId,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        setGenerationProgress(80);
        setGenerationStep("Processing response...");

        if (!response.ok) {
          const errorData = await response.json();
          // Handle specific API error codes without throwing exceptions
          if (errorData.code === 'PROFILE_NOT_FOUND') {
            setError('Please create your profile before getting recommendations.');
          } else if (errorData.code === 'PROFILE_INCOMPLETE') {
            setError('Please complete your profile details before getting recommendations.');
          } else if (errorData.code === 'WARDROBE_EMPTY') {
            setError('No items available for outfit recommendations. Please add items to your wardrobe or wait for store products to be available.');
          } else {
            setError(errorData.error || 'Failed to get recommendations');
          }
          setLoading(false);
          return;
        }

        const responseData = await response.json();
        setGenerationProgress(100);
        setGenerationStep("Complete!");
        
        // Process the response
        processRecommendation(responseData);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          setError('Request timed out. Please try again.');
        } else {
          setError(fetchError instanceof Error ? fetchError.message : 'An unexpected error occurred');
        }
        setLoading(false);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleDeleteSuggestion = async (suggestionId: string) => {
    try {
      // First get the event_id associated with this suggestion
      const { data: suggestion, error: fetchError } = await supabase
        .from('outfit_recommendations')
        .select('event_id')
        .eq('id', suggestionId)
        .single();

      if (fetchError) {
        setError(`Failed to fetch suggestion details: ${fetchError.message}`);
        return;
      }

      if (!suggestion) {
        setError('Suggestion not found');
        return;
      }

      // Delete in correct order to respect foreign key constraints

      // 1. Delete chat messages first
      const { data: chats, error: fetchChatsError } = await supabase
        .from('outfit_chats')
        .select('id')
        .eq('outfit_recommendation_id', suggestionId);  // Updated column name

      if (fetchChatsError) {
        setError(`Failed to fetch chats: ${fetchChatsError.message}`);
        return;
      }

      if (chats && chats.length > 0) {
        // Delete all messages from all chats
        const { error: messagesError } = await supabase
          .from('chat_messages')
          .delete()
          .in('chat_id', chats.map(chat => chat.id));

        if (messagesError) {
          setError(`Failed to delete chat messages: ${messagesError.message}`);
          return;
        }

        // Delete all chats
        const { error: chatsError } = await supabase
          .from('outfit_chats')
          .delete()
          .eq('outfit_recommendation_id', suggestionId);  // Updated column name

        if (chatsError) {
          setError(`Failed to delete chats: ${chatsError.message}`);
          return;
        }
      }

      // 2. Delete the outfit recommendation
      const { error: outfitError } = await supabase
        .from('outfit_recommendations')
        .delete()
        .eq('id', suggestionId);

      if (outfitError) {
        setError(`Failed to delete outfit recommendation: ${outfitError.message}`);
        return;
      }

      // 3. Finally delete the event
      const { error: eventError } = await supabase
        .from('events')
        .delete()
        .eq('id', suggestion.event_id);

      if (eventError) {
        setError(`Failed to delete event: ${eventError.message}`);
        return;
      }

      // Refresh the suggestions list
      await loadPastSuggestions();
      
      // Reset current recommendation if it was deleted
      if (recommendation.length === 1 && recommendation[0].id === suggestionId) {
        setRecommendation([]);
        setShowNewEvent(true);
      }

      // Show success message
      toast({
        title: "Success",
        description: "Outfit suggestion deleted successfully",
        variant: "default"
      });

    } catch (error) {
      console.error('Error deleting suggestion:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  };

  const generateRecommendation = async () => {
    setLoading(true);
    try {
      // Combine wardrobe and store items for recommendation
      const allItems = [...wardrobeItems, ...storeItems];
      
      // Your existing recommendation logic here
      // For example, randomly selecting items from different categories
      const categories = ['top', 'bottom', 'outerwear', 'shoes', 'accessories'];
      const outfit: ClothingItem[] = [];

      categories.forEach(category => {
        const categoryItems = allItems.filter(item => item.category.toLowerCase() === category);
        if (categoryItems.length > 0) {
          const randomItem = categoryItems[Math.floor(Math.random() * categoryItems.length)];
          outfit.push(randomItem);
        }
      });

      setRecommendation(outfit);
    } catch (error) {
      console.error('Error generating recommendation:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate recommendation"
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to process the recommendation data
  const processRecommendation = (responseData: any) => {
    if (!responseData?.outfit?.items) {
      throw new Error('Invalid recommendation format received');
    }
    
    // Save the recommendation ID if available
    if (responseData.recommendationId) {
      setRecommendationId(responseData.recommendationId);
    }
    
    // Save the outfit description if available
    setOutfitDescription(responseData.outfit.description || '');
    
    // Map the items to our expected format with enhanced store/wardrobe distinction
    setRecommendation(responseData.outfit.items.map((item: any) => ({
      id: item.id || '',
      name: item.type || '',
      category: item.type || '',
      color: item.color || '',
      image_url: item.image_url || '',
      type: item.type || '',
      styling_notes: item.styling_notes || '',
      styling_tips: responseData.outfit.styling_tips || [],
      // Handle store vs wardrobe flags
      isStoreItem: item.isStoreItem === true,
      isWardrobeItem: item.isWardrobeItem === true,
      source: item.source || (item.isStoreItem ? 'store' : 'wardrobe'),
      // Include price information for store items
      price: item.isStoreItem ? (parseFloat(item.price) || 0) : 0
    })));
    
    // Set the outfit data for display
    setOutfit({
      description: responseData.outfit.description,
      items: responseData.outfit.items,
      styling_tips: responseData.outfit.styling_tips
    });
    
    setShowChat(true);
    setShowNewEvent(false);
    
    // Load past suggestions if needed
    loadPastSuggestions();
    
    // Complete the loading state
    setLoading(false);
  };

  // Function to add item to cart
  const addToCart = async (item: ClothingItem) => {
    try {
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({
          variant: "destructive",
          title: "Not signed in",
          description: "Please sign in to add items to your cart"
        });
        window.location.href = '/signin?redirect=/dashboard/wardrobe';
        return;
      }
      
      // Get current cart from local storage
      const currentCart = JSON.parse(localStorage.getItem(`cart_${session.user.id}`) || '[]');
      
      // Check if item already exists in cart
      const existingItemIndex = currentCart.findIndex((cartItem: any) => cartItem.id === item.id);
      
      if (existingItemIndex >= 0) {
        // Increment quantity if item exists
        currentCart[existingItemIndex].quantity += 1;
      } else {
        // Add new item with quantity 1
        currentCart.push({
          ...item,
          quantity: 1,
          selectedSize: 'M', // Default size
          selectedColor: item.color || 'Default'
        });
      }
      
      // Save updated cart to local storage with user ID in key
      localStorage.setItem(`cart_${session.user.id}`, JSON.stringify(currentCart));
      
      // Show success message
      toast({
        title: "Added to Cart",
        description: `${item.name} has been added to your cart`,
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add item to cart"
      });
    }
  };

  // Function to handle buy now action
  const buyNow = async (item: ClothingItem) => {
    try {
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({
          variant: "destructive",
          title: "Not signed in",
          description: "Please sign in to purchase items"
        });
        window.location.href = '/signin?redirect=/dashboard/wardrobe';
        return;
      }
      
      await addToCart(item);
      // Navigate to cart page
      window.location.href = '/cart';
    } catch (error) {
      console.error('Error with buy now:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process your request"
      });
    }
  };

  // Handle opening image in fullscreen viewer
  const handleOpenImage = (imageUrl: string) => {
    setCurrentViewImage(imageUrl);
    setViewerOpen(true);
  };

  return (
    <div className="grid md:grid-cols-[300px,1fr] gap-6">
      {/* Past Suggestions Sidebar */}
      <div className="col-span-1">
        <Card className={`${styles.glassmorph} ${styles.greekPattern} border-[#D98324 ]/30`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className={styles.primaryText}>Past Events</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewEvent(true)}
                className={`${styles.glassmorph} hover:bg-[#D98324 ]/20`}
              >
                New Event
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-2">
                {pastSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${recommendation.length === 1 && recommendation[0].id === suggestion.id
                      ? 'bg-[#D98324 ]/20'
                      : 'hover:bg-[#D98324 ]/10'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        onClick={() => {
                          setRecommendation(suggestion.recommendation.items.map(item => ({
                            ...item,
                            name: item.type,
                            category: item.type,
                            color: '',  // Add default values for required fields
                          })));
                          setShowNewEvent(false);
                        }}
                        className="flex-1"
                      >
                        <p className={`${styles.secondaryText} text-sm font-medium`}>
                          {suggestion.events?.[0]?.title}
                        </p>
                        <p className={`${styles.secondaryText} text-xs opacity-60 mt-1`}>
                          {new Date(suggestion.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-red-500/10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className={`${styles.glassmorph} border-[#D98324 ]/30`}>
                          <AlertDialogHeader>
                            <AlertDialogTitle className={styles.primaryText}>
                              Delete Outfit Suggestion
                            </AlertDialogTitle>
                            <AlertDialogDescription className={styles.secondaryText}>
                              This will permanently delete this outfit suggestion and its chat history.
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className={`${styles.glassmorph} hover:bg-[#D98324 ]/20`}>
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteSuggestion(suggestion.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {error && (
          <div className="p-4 text-red-500 bg-red-500/10 rounded-lg">
            {error}
          </div>
        )}

        {showNewEvent ? (
          <Card className={`${styles.glassmorph} ${styles.greekPattern} border-[#D98324 ]/30`}>
            <CardHeader>
              <CardTitle className={styles.primaryText}>New Event Outfit</CardTitle>
              <CardDescription className={styles.secondaryText}>
                Tell us about your event to get personalized outfit recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  placeholder="Event Title"
                  value={eventDetails.title}
                  onChange={(e) => setEventDetails(prev => ({ ...prev, title: e.target.value }))}
                  className={`${styles.glassmorph} border-[#D98324 ]/30 text-[#FFFDEC]`}
                  required
                />

                <Textarea
                  placeholder="Describe your event..."
                  value={eventDetails.description}
                  onChange={(e) => setEventDetails(prev => ({ ...prev, description: e.target.value }))}
                  className={`${styles.glassmorph} border-[#D98324 ]/30 text-[#FFFDEC]`}
                  required
                />

                <Select
                  value={eventDetails.event_type}
                  onValueChange={(value) => setEventDetails(prev => ({ ...prev, event_type: value }))}
                >
                  <SelectTrigger className={`${styles.glassmorph} border-[#D98324 ]/30 text-[#FFFDEC]`}>
                    <SelectValue placeholder="Event Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="party">Party</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="date"
                  value={eventDetails.date}
                  onChange={(e) => setEventDetails(prev => ({ ...prev, date: e.target.value }))}
                  className={`${styles.glassmorph} border-[#D98324 ]/30 text-[#FFFDEC]`}
                />

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#D98324 ] hover:bg-[#D98324 ]/80 text-[#FFFDEC]"
                >
                  {loading ? "Generating..." : "Get Recommendations"}
                </Button>
                
                {loading && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between">
                      <p className={styles.secondaryText}>{generationStep}</p>
                      <p className={styles.secondaryText}>{generationProgress}%</p>
                    </div>
                    <Progress value={generationProgress} className="h-2" />
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        ) : recommendation.length > 0 && (
          <div className="space-y-6">
            <Card className={`${styles.glassmorph} ${styles.greekPattern} border-[#D98324 ]/30`}>
              <CardHeader>
                <CardTitle className={styles.primaryText}>Your Perfect Outfit</CardTitle>
                {showChat && (
                  <CardDescription className={styles.secondaryText}>
                    Need help with alternatives or styling tips? Use the chat below!
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <p className={styles.secondaryText}>{recommendation.map(item => item.styling_notes).join('\n')}</p>

                  <div className="grid grid-cols-2 gap-4">
                    {recommendation.map((item, index) => (
                      <div key={index} className="space-y-2">
                        {item.image_url && (
                          <div className="aspect-square relative rounded-lg overflow-hidden">
                            <Image
                              src={item.image_url}
                              alt={item.name}
                              fill
                              className="object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => handleOpenImage(item.image_url)}
                            />
                            {/* Item source badge */}
                            <div className="absolute top-2 right-2 z-10">
                              {item.isStoreItem ? (
                                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Store Item</Badge>
                              ) : (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Your Wardrobe</Badge>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="space-y-2">
                          <p className={`text-sm ${styles.secondaryText}`}>{item.styling_notes}</p>
                          
                          {/* Add buy/cart buttons for store items */}
                          {item.isStoreItem && (
                            <div className="pt-2">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-[#D98324] font-bold">${(item.price || 0).toFixed(2)}</span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 border-[#D98324] text-[#D98324] hover:bg-[#D98324]/10"
                                  onClick={() => addToCart(item)}
                                >
                                  <ShoppingBag className="h-4 w-4 mr-2" />
                                  Add to Cart
                                </Button>
                                <Button
                                  size="sm"
                                  className="flex-1 bg-[#D98324] hover:bg-[#D98324]/80"
                                  onClick={() => buyNow(item)}
                                >
                                  Buy Now
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <h4 className={`font-semibold ${styles.primaryText}`}>Styling Tips:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {recommendation
                        .map(item => item.styling_tips)
                        .flat()
                        .filter((tip): tip is string => tip !== undefined)
                        .map((tip, index) => (
                          <li key={index} className={styles.secondaryText}>{tip}</li>
                        ))}
                    </ul>
                  </div>
                </div>

                {user?.avatar_url && recommendation[0]?.image_url && (
                  <CardContent className="pt-4 border-t border-[#D98324 ]/20">
                    <OutfitTryOn
                      userId={userId}
                      outfitImageUrl={recommendation[0].image_url}
                      userImageUrl={user.avatar_url}
                    />
                  </CardContent>
                )}
              </CardContent>
            </Card>

            {showChat && recommendationId && (
              <OutfitChat 
                userId={userId} 
                outfitId={recommendationId}
                outfitDetails={{
                  description: outfitDescription,
                  items: recommendation,
                  styling_tips: recommendation[0]?.styling_tips || []
                }}
              />
            )}
            {showChat && !recommendationId && (
              <div className="p-4 bg-yellow-50 rounded-md shadow my-4">
                <p className="text-amber-800">Unable to access outfit details. Please try generating a new recommendation.</p>
                <Button 
                  onClick={() => setShowChat(false)} 
                  variant="outline"
                  className="mt-2"
                >
                  Go Back
                </Button>
              </div>
            )}
          </div>
        )}

        <Button
          onClick={generateRecommendation}
          className={`${styles.glassmorph} hover:bg-[#D98324 ]/20`}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Outfit'
          )}
        </Button>
        
        {loading && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <p className={styles.secondaryText}>{generationStep}</p>
              <p className={styles.secondaryText}>{generationProgress}%</p>
            </div>
            <Progress value={generationProgress} className="h-2" />
          </div>
        )}

        {recommendation.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendation.map((item, index) => (
              <div key={index} className={`${styles.glassmorph} p-4 rounded-lg`}>
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-48 object-cover rounded-md mb-2"
                  />
                )}
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-sm text-gray-400">{item.category}</p>
                
                {item.styling_notes && (
                  <p className="text-sm my-2 italic">{item.styling_notes}</p>
                )}
                
                {item.isStoreItem && (
                  <div className="mt-2 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[#D98324] font-bold">${(item.price || 0).toFixed(2)}</span>
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">Store Item</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-[#D98324] text-[#D98324] hover:bg-[#D98324]/10"
                        onClick={() => addToCart(item)}
                      >
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Add to Cart
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-[#D98324] hover:bg-[#D98324]/80"
                        onClick={() => buyNow(item)}
                      >
                        Buy Now
                      </Button>
                    </div>
                  </div>
                )}
                
                {!item.isStoreItem && (
                  <div className="mt-2">
                    <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">From Your Wardrobe</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {viewerOpen && (
          <ImageViewer
            isOpen={viewerOpen}
            onClose={() => setViewerOpen(false)}
            imageUrl={currentViewImage}
            alt="Outfit item"
          />
        )}
      </div>
    </div>
  );
};