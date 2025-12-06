import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getCart, addToCart, removeFromCart, clearCart } from '@/lib/supabaseServices';

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  product?: any;
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Load cart when user logs in
  useEffect(() => {
    if (user) {
      loadCart();
    } else {
      setItems([]);
    }
  }, [user?.id]);

  const loadCart = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const cartItems = await getCart(user.id);
      setItems(cartItems);
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId: string, quantity: number) => {
    if (!user) {
      // User should be logged in to add to cart
      alert('Logga in för att lägga till i kundvagn');
      return;
    }

    try {
      await addToCart(user.id, productId, quantity);
      await loadCart(); // Refresh cart
    } catch (error) {
      console.error('Failed to add to cart:', error);
      throw error;
    }
  };

  const handleRemoveFromCart = async (cartItemId: string) => {
    try {
      await removeFromCart(cartItemId);
      await loadCart(); // Refresh cart
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      throw error;
    }
  };

  const handleUpdateQuantity = async (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      await handleRemoveFromCart(cartItemId);
      return;
    }

    try {
      await addToCart(user!.id, items.find(i => i.id === cartItemId)?.product_id!, quantity);
      await loadCart(); // Refresh cart
    } catch (error) {
      console.error('Failed to update quantity:', error);
      throw error;
    }
  };

  const handleClearCart = async () => {
    if (!user) return;
    try {
      await clearCart(user.id);
      setItems([]);
    } catch (error) {
      console.error('Failed to clear cart:', error);
      throw error;
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + ((item.product?.price_cents || 0) * item.quantity),
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        addToCart: handleAddToCart,
        removeFromCart: handleRemoveFromCart,
        updateQuantity: handleUpdateQuantity,
        clearCart: handleClearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
