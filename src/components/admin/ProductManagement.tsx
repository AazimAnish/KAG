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
import { Progress } from "@/components/ui/progress"; // Import Progress component

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  size: string;
  color: string;
  category: string;
  type: string;
  brand: string;
  image_url: string;
  in_stock: boolean;
  created_at: string;
  updated_at: string;
}

interface UploadStatus {
  stage: 'idle' | 'uploading' | 'analyzing' | 'saving';
  progress: number;
  message: string;
}

export const ProductManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    stage: 'idle',
    progress: 0,
    message: '',
  });
  const { toast } = useToast();
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    size: '',
    color: '',
    category: '',
    type: '',
    brand: '',
    in_stock: true,
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editProductId, setEditProductId] = useState<string | null>(null);

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

  const updateUploadStatus = (stage: UploadStatus['stage'], progress: number, message: string) => {
    setUploadStatus({ stage, progress, message });
  };

  const handleImageUpload = async (file: File) => {
    try {
      // First verify user is authenticated and admin
      updateUploadStatus('uploading', 10, 'Verifying authorization...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Unauthorized');

      updateUploadStatus('uploading', 20, 'Checking admin status...');
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

      // Validate file type
      const validImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validImageTypes.includes(file.type)) {
        throw new Error('File must be a JPEG, PNG, or WebP image');
      }

      updateUploadStatus('uploading', 30, 'Preparing file for upload...');
      
      // Ensure we have a proper file extension
      let fileExt = file.name.split('.').pop()?.toLowerCase();
      // Validate and normalize file extension
      if (!fileExt || !['jpg', 'jpeg', 'png', 'webp'].includes(fileExt)) {
        // Default to jpg if extension is invalid
        fileExt = file.type === 'image/png' ? 'png' : 
                  file.type === 'image/webp' ? 'webp' : 'jpg';
      }
      
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `store/${fileName}`;

      // Upload to Supabase Storage
      updateUploadStatus('uploading', 40, 'Uploading to storage...');
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
      updateUploadStatus('uploading', 60, 'Getting public URL...');
      const { data: { publicUrl } } = supabase.storage
        .from('wardrobe')
        .getPublicUrl(uploadData.path);

      if (!publicUrl) {
        throw new Error('Failed to get public URL');
      }

      // Validate the URL format
      if (!publicUrl.startsWith('http')) {
        throw new Error('Invalid URL format returned from storage');
      }

      // Analyze the image using the analyze-clothing API
      updateUploadStatus('analyzing', 70, 'Analyzing image with AI...');
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

      updateUploadStatus('analyzing', 90, 'Processing AI results...');
      const analysis = await response.json();
      
      // Destructure tags array with default values
      const [color = 'unknown'] = analysis.tags || [];

      updateUploadStatus('saving', 100, 'Successfully processed image!');
      return { 
        url: publicUrl, 
        category: analysis.type || 'unknown',
        color
      };

    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  };

  const handleEditClick = (product: Product) => {
    setEditMode(true);
    setEditProductId(product.id);
    setNewProduct({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      size: product.size,
      color: product.color,
      category: product.category,
      type: product.type || '',
      brand: product.brand || '',
      in_stock: product.in_stock !== undefined ? product.in_stock : true,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setNewProduct({
      name: '',
      description: '',
      price: '',
      size: '',
      color: '',
      category: '',
      type: '',
      brand: '',
      in_stock: true,
    });
    setSelectedImage(null);
    setEditMode(false);
    setEditProductId(null);
    updateUploadStatus('idle', 0, '');
  };

  const handleDialogClose = () => {
    resetForm();
    setDialogOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate form data
      if (!newProduct.name || !newProduct.price) {
        throw new Error('Please fill in all required fields');
      }

      // If in edit mode and no image selected, update product without image upload
      if (editMode && !selectedImage) {
        const { error: updateError } = await supabase
          .from('products')
          .update({
            name: newProduct.name,
            description: newProduct.description || '',
            price: parseFloat(newProduct.price),
            size: newProduct.size,
            color: newProduct.color,
            category: newProduct.category,
            type: newProduct.type,
            brand: newProduct.brand || '',
            in_stock: newProduct.in_stock,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editProductId);

        if (updateError) {
          console.error('Database update error:', updateError);
          throw new Error(updateError.message || 'Failed to update product');
        }

        toast({
          title: "Success",
          description: "Product updated successfully"
        });

        resetForm();
        setDialogOpen(false);
        loadProducts();
        return;
      }

      // If new product or edit with image upload
      if (!selectedImage && !editMode) {
        throw new Error('Please select an image');
      }

      updateUploadStatus('uploading', 0, 'Starting upload process...');

      let imageData = { url: '', category: '', color: '' };
      
      // Upload image if provided
      if (selectedImage) {
        imageData = await handleImageUpload(selectedImage);
      }

      if (editMode && editProductId) {
        // Update existing product with new image if provided
        const { error: updateError } = await supabase
          .from('products')
          .update({
            name: newProduct.name,
            description: newProduct.description || '',
            price: parseFloat(newProduct.price),
            size: newProduct.size,
            color: selectedImage ? imageData.color : newProduct.color,
            category: selectedImage ? imageData.category : newProduct.category,
            type: newProduct.type,
            brand: newProduct.brand || '',
            image_url: selectedImage ? imageData.url : undefined, // Only update if new image
            in_stock: newProduct.in_stock,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editProductId);

        if (updateError) {
          console.error('Database update error:', updateError);
          throw new Error(updateError.message || 'Failed to update product');
        }

        toast({
          title: "Success",
          description: "Product updated successfully"
        });
      } else {
        // Create new product
        const { error: insertError } = await supabase
          .from('products')
          .insert([
            {
              name: newProduct.name,
              description: newProduct.description || '',
              price: parseFloat(newProduct.price),
              size: newProduct.size,
              color: imageData.color,
              category: imageData.category,
              type: newProduct.type,
              brand: newProduct.brand || '',
              image_url: imageData.url,
              in_stock: newProduct.in_stock,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
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
      }

      // Reset form and reload products
      resetForm();
      setDialogOpen(false);
      loadProducts();

    } catch (error) {
      console.error('Submission error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process product"
      });
      updateUploadStatus('idle', 0, '');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className={`text-2xl font-bold ${styles.primaryText}`}>Product Management</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#D98324 ] hover:bg-[#D98324 ]/80">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editMode ? 'Edit Product' : 'Add New Product'}</DialogTitle>
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
                value={newProduct.category}
                onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Accessories', 'Shoes'].map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={newProduct.type}
                onValueChange={(value) => setNewProduct({ ...newProduct, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {['T-Shirt', 'Shirt', 'Blouse', 'Sweater', 'Jeans', 'Pants', 'Skirt', 'Dress', 'Jacket', 'Coat'].map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Brand"
                value={newProduct.brand}
                onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
              />
              <Select
                value={newProduct.in_stock.toString()}
                onValueChange={(value) => setNewProduct({ ...newProduct, in_stock: value === 'true' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Stock Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">In Stock</SelectItem>
                  <SelectItem value="false">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                required={!editMode}
              />
              
              {uploadStatus.stage !== 'idle' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{uploadStatus.message}</span>
                    <span>{uploadStatus.progress}%</span>
                  </div>
                  <Progress value={uploadStatus.progress} className="h-2" />
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleDialogClose}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#D98324 ] hover:bg-[#D98324 ]/80"
                  disabled={uploadStatus.stage !== 'idle'}
                >
                  {uploadStatus.stage !== 'idle' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : editMode ? 'Update Product' : 'Add Product'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>In Stock</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              </TableCell>
            </TableRow>
          ) : products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4">
                No products found
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.name}</TableCell>
                <TableCell>${product.price}</TableCell>
                <TableCell>{product.in_stock ? 'Yes' : 'No'}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>{product.type}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    className={`${styles.glassmorph} hover:bg-[#D98324 ]/20`}
                    onClick={() => handleEditClick(product)}
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};