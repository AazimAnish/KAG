"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from "@/components/ui/button";
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
import { Order } from '@/types/store';
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrderWithUser extends Order {
  user: {
    name: string;
    email: string;
  };
  profiles?: {
    name: string | null;
  };
}

export const OrderManagement = () => {
  const [orders, setOrders] = useState<OrderWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithUser | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles!user_id(
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match the expected OrderWithUser interface
      const ordersWithUserInfo = data?.map(order => ({
        ...order,
        user: {
          name: order.profiles?.name || 'Unknown',
          email: '' // Email is stored in auth.users, not accessible in this query
        }
      })) || [];

      setOrders(ordersWithUserInfo);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load orders"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Order status updated to ${status}`
      });

      loadOrders(); // Reload orders to show updated status
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update order status"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500 text-white';
      case 'processing':
        return 'bg-blue-500 text-white';
      case 'shipped':
        return 'bg-purple-500 text-white';
      case 'delivered':
        return 'bg-green-500 text-white';
      case 'cancelled':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <h2 className={`text-2xl font-bold ${styles.primaryText}`}>Order Management</h2>
      
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id.substring(0, 8)}...</TableCell>
                  <TableCell>{order.user?.name || 'Unknown'}</TableCell>
                  <TableCell>{formatDate(order.created_at)}</TableCell>
                  <TableCell>${order.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            onClick={() => setSelectedOrder(order)}
                            variant="outline" 
                            className={`${styles.glassmorph} hover:bg-primary/20`}
                          >
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Order Details</DialogTitle>
                          </DialogHeader>
                          {selectedOrder && (
                            <div className="mt-4 space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h3 className="font-semibold text-lg mb-2">Customer Information</h3>
                                  <p><span className="font-medium">Name:</span> {selectedOrder.user?.name || 'Unknown'}</p>
                                  <p><span className="font-medium">Email:</span> {selectedOrder.user?.email || 'Not available'}</p>
                                </div>
                                <div>
                                  <h3 className="font-semibold text-lg mb-2">Order Information</h3>
                                  <p><span className="font-medium">Order ID:</span> {selectedOrder.id}</p>
                                  <p><span className="font-medium">Date:</span> {formatDate(selectedOrder.created_at)}</p>
                                  <p><span className="font-medium">Status:</span> {selectedOrder.status}</p>
                                  <p><span className="font-medium">Total:</span> ${selectedOrder.total.toFixed(2)}</p>
                                </div>
                              </div>
                              
                              <div>
                                <h3 className="font-semibold text-lg mb-2">Shipping Address</h3>
                                <p>{selectedOrder.shipping_address}</p>
                              </div>
                              
                              <div>
                                <h3 className="font-semibold text-lg mb-2">Order Items</h3>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Product</TableHead>
                                      <TableHead>Size</TableHead>
                                      <TableHead>Color</TableHead>
                                      <TableHead>Quantity</TableHead>
                                      <TableHead>Price</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {selectedOrder.items.map((item, index) => (
                                      <TableRow key={index}>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell>{item.selectedSize}</TableCell>
                                        <TableCell>{item.selectedColor}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>${item.price.toFixed(2)}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                              
                              <div>
                                <h3 className="font-semibold text-lg mb-2">Update Status</h3>
                                <div className="flex items-center space-x-2">
                                  <Select 
                                    defaultValue={selectedOrder.status}
                                    onValueChange={(value) => updateOrderStatus(selectedOrder.id, value)}
                                  >
                                    <SelectTrigger className="w-[200px]">
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="processing">Processing</SelectItem>
                                      <SelectItem value="shipped">Shipped</SelectItem>
                                      <SelectItem value="delivered">Delivered</SelectItem>
                                      <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {orders.length === 0 && (
            <div className="text-center py-8 text-foreground/70">
              No orders found
            </div>
          )}
        </>
      )}
    </div>
  );
}; 