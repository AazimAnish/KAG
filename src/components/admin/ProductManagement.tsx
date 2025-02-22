"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { styles } from '@/utils/constants';
import { Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  size: string;
  color: string;
  category: string;
  gender: string;
  images: string[];
  stock: number;
  created_at: string;
}

export const ProductManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    size: '',
    color: '',
    category: '',
    gender: '',
    stock: '',
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load products"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      // First verify user is authenticated and admin
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Unauthorized');

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') throw new Error('Unauthorized');

      // Validate file size and type
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `store/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('wardrobe')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(uploadError.message);
      }

      if (!uploadData?.path) {
        throw new Error('No upload path returned');
      }

      // Get public URL and analyze image
      const { data: { publicUrl } } = supabase.storage
        .from('wardrobe')
        .getPublicUrl(uploadData.path);

      if (!publicUrl) {
        throw new Error('Failed to get public URL');
      }

      // Analyze the image using the analyze-clothing API
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/analyze-clothing', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze image');
      }

      const analysis = await response.json();
      
      // Destructure tags array with default values
      const [color = 'unknown', pattern = 'solid', style = 'casual', fit = 'regular'] = analysis.tags || [];

      return { 
        url: publicUrl, 
        category: analysis.type || 'unknown',
        color,
        pattern,
        style,
        fit
      };

    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!selectedImage) {
        throw new Error('Please select an image');
      }

      // Validate form data
      if (!newProduct.name || !newProduct.price || !newProduct.stock) {
        throw new Error('Please fill in all required fields');
      }

      setUploading(true);

      // Upload and analyze image
      const { url, category, color, pattern, style, fit } = await handleImageUpload(selectedImage);

      // Create product with uploaded image URL and analysis results
      const { error: insertError } = await supabase
        .from('products')
        .insert([
          {
            name: newProduct.name,
            description: newProduct.description || '',
            price: parseFloat(newProduct.price),
            size: newProduct.size,
            color: color,
            category: category,
            gender: newProduct.gender,
            pattern: pattern,
            style: style,
            fit: fit,
            images: [url],
            stock: parseInt(newProduct.stock),
            created_at: new Date().toISOString(),
          }
        ]);

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw new Error(insertError.message || 'Failed to add product');
      }

      toast({
        title: "Success",
        description: "Product added successfully"
      });

      // Reset form and reload products
      setNewProduct({
        name: '',
        description: '',
        price: '',
        size: '',
        color: '',
        category: '',
        gender: '',
        stock: '',
      });
      setSelectedImage(null);
      loadProducts();

    } catch (error) {
      console.error('Submission error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add product"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className={`text-2xl font-bold ${styles.primaryText}`}>Product Management</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-[#347928] hover:bg-[#347928]/80">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Product Name"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                required
              />
              <Textarea
                placeholder="Description"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                required
              />
              <Input
                type="number"
                placeholder="Price"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                required
              />
              <Select
                value={newProduct.size}
                onValueChange={(value) => setNewProduct({ ...newProduct, size: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                    <SelectItem key={size} value={size}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Color"
                value={newProduct.color}
                onChange={(e) => setNewProduct({ ...newProduct, color: e.target.value })}
                required
              />
              <Select
                value={newProduct.gender}
                onValueChange={(value) => setNewProduct({ ...newProduct, gender: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  {['Men', 'Women', 'Unisex'].map((gender) => (
                    <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Stock"
                value={newProduct.stock}
                onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                required
              />
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                required
              />
              <Button type="submit" className="w-full bg-[#347928] hover:bg-[#347928]/80">
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Add Product'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>{product.name}</TableCell>
              <TableCell>${product.price}</TableCell>
              <TableCell>{product.stock}</TableCell>
              <TableCell>{product.category}</TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  className={`${styles.glassmorph} hover:bg-[#347928]/20`}
                  onClick={() => {/* Add edit functionality */}}
                >
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}; 