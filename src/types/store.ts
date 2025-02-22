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
  stock: number;
  created_at: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize: string;
  selectedColor: string;
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