export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  size: string;
  color: string;
  category: string;
  gender: string;
  style: string;
  pattern: string;
  fit: string;
  images: string[];
  image_url?: string;
  type?: string;
  brand?: string;
  stock: number;
  in_stock?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize: string;
  selectedColor: string;
  image_url?: string;
  type?: string;
  brand?: string;
}

export interface Order {
  id: string;
  user_id: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: string;
  created_at: string;
} 