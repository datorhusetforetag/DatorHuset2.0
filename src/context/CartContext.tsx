import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  getCart as getUserCartItems,
  addToCart as upsertUserCartItem,
  removeFromCart as removeUserCartItem,
  clearCart as clearUserCartItems,
} from '@/lib/supabaseServices';
import { supabase } from '@/lib/supabaseClient';

export interface CartItem {
  id: string;
  user_id?: string;
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

type GuestCartEntry = {
  product_id: string;
  quantity: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);
const GUEST_CART_STORAGE_KEY = 'datorhuset_guest_cart_v1';
const GUEST_ID_PREFIX = 'guest:';

const toGuestItemId = (productId: string) => `${GUEST_ID_PREFIX}${productId}`;

const getGuestProductIdFromItemId = (cartItemId: string) =>
  cartItemId.startsWith(GUEST_ID_PREFIX) ? cartItemId.slice(GUEST_ID_PREFIX.length) : cartItemId;

const readGuestCart = (): GuestCartEntry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(GUEST_CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => ({
        product_id: String(entry?.product_id || '').trim(),
        quantity: Math.max(1, Number(entry?.quantity) || 1),
      }))
      .filter((entry) => Boolean(entry.product_id));
  } catch (error) {
    console.error('Failed to parse guest cart:', error);
    return [];
  }
};

const writeGuestCart = (entries: GuestCartEntry[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(entries));
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadGuestCart = async () => {
    try {
      const guestEntries = readGuestCart();
      if (guestEntries.length === 0) {
        setItems([]);
        return;
      }

      const productIds = guestEntries.map((entry) => entry.product_id);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);

      if (error) {
        throw error;
      }

      const productsById = new Map((data || []).map((product: any) => [String(product.id), product]));
      const guestItems: CartItem[] = guestEntries.map((entry) => ({
        id: toGuestItemId(entry.product_id),
        user_id: 'guest',
        product_id: entry.product_id,
        quantity: entry.quantity,
        product: productsById.get(entry.product_id),
      }));

      setItems(guestItems);
    } catch (error) {
      console.error('Failed to load guest cart:', error);
      setItems([]);
    }
  };

  const loadUserCart = async (userId: string) => {
    const cartItems = await getUserCartItems(userId);
    setItems(cartItems);
  };

  const syncGuestCartToUser = async (userId: string) => {
    const guestEntries = readGuestCart();
    if (guestEntries.length === 0) return;

    const existingUserItems = await getUserCartItems(userId);
    const existingByProductId = new Map<string, number>();

    existingUserItems.forEach((item: CartItem) => {
      const productId = String(item.product_id || '').trim();
      if (!productId) return;
      existingByProductId.set(productId, Math.max(1, Number(item.quantity) || 1));
    });

    for (const guestEntry of guestEntries) {
      const productId = String(guestEntry.product_id || '').trim();
      if (!productId) continue;
      const existingQuantity = existingByProductId.get(productId) || 0;
      const mergedQuantity = Math.max(1, existingQuantity + Math.max(1, Number(guestEntry.quantity) || 1));
      await upsertUserCartItem(userId, productId, mergedQuantity);
    }

    writeGuestCart([]);
  };

  // Load cart and auto-merge guest cart when user logs in
  useEffect(() => {
    let isMounted = true;

    const initCart = async () => {
      try {
        setLoading(true);
        if (user?.id) {
          await syncGuestCartToUser(user.id);
          if (!isMounted) return;
          await loadUserCart(user.id);
        } else {
          if (!isMounted) return;
          await loadGuestCart();
        }
      } catch (error) {
        console.error('Failed to initialize cart:', error);
        if (isMounted) setItems([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initCart();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const refreshCart = async () => {
    if (user?.id) {
      await loadUserCart(user.id);
    } else {
      await loadGuestCart();
    }
  };

  const handleAddToCart = async (productId: string, quantity: number) => {
    try {
      const safeProductId = String(productId || '').trim();
      const safeQuantity = Math.max(1, Number(quantity) || 1);
      if (!safeProductId) return;

      if (user?.id) {
        await upsertUserCartItem(user.id, safeProductId, safeQuantity);
      } else {
        const guestEntries = readGuestCart();
        const existingIndex = guestEntries.findIndex((entry) => entry.product_id === safeProductId);
        if (existingIndex >= 0) {
          guestEntries[existingIndex] = {
            ...guestEntries[existingIndex],
            quantity: safeQuantity,
          };
        } else {
          guestEntries.push({ product_id: safeProductId, quantity: safeQuantity });
        }
        writeGuestCart(guestEntries);
      }

      await refreshCart();
    } catch (error) {
      console.error('Failed to add to cart:', error);
      throw error;
    }
  };

  const handleRemoveFromCart = async (cartItemId: string) => {
    try {
      if (user?.id) {
        await removeUserCartItem(cartItemId);
      } else {
        const productId = getGuestProductIdFromItemId(cartItemId);
        const guestEntries = readGuestCart().filter((entry) => entry.product_id !== productId);
        writeGuestCart(guestEntries);
      }

      await refreshCart();
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
      const safeQuantity = Math.max(1, Number(quantity) || 1);

      if (user?.id) {
        const existingItem = items.find((item) => item.id === cartItemId);
        if (!existingItem?.product_id) return;
        await upsertUserCartItem(user.id, existingItem.product_id, safeQuantity);
      } else {
        const productId = getGuestProductIdFromItemId(cartItemId);
        const guestEntries = readGuestCart();
        const existingIndex = guestEntries.findIndex((entry) => entry.product_id === productId);
        if (existingIndex < 0) return;
        guestEntries[existingIndex] = {
          ...guestEntries[existingIndex],
          quantity: safeQuantity,
        };
        writeGuestCart(guestEntries);
      }

      await refreshCart();
    } catch (error) {
      console.error('Failed to update quantity:', error);
      throw error;
    }
  };

  const handleClearCart = async () => {
    try {
      if (user?.id) {
        await clearUserCartItems(user.id);
      } else {
        writeGuestCart([]);
      }
      setItems([]);
    } catch (error) {
      console.error('Failed to clear cart:', error);
      throw error;
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + (item.product?.price_cents || 0) * item.quantity,
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
