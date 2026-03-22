import { supabase } from '@/lib/supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const apiRequest = async (path: string, options: RequestInit = {}) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error('Missing auth token');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || 'Request failed');
  }
  return payload;
};

// ============================================================
// PRODUCTS SERVICE
// ============================================================

export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*');
  
  if (error) throw error;
  return data || [];
}

export async function getProductBySlug(slug: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getProductsByTier(tier: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('tier', tier);
  
  if (error) throw error;
  return data || [];
}

// ============================================================
// INVENTORY SERVICE
// ============================================================

export async function getInventory(productId: string) {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('product_id', productId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function checkStock(productId: string) {
  const inventory = await getInventory(productId);
  return {
    inStock: inventory.quantity_in_stock > 0,
    quantity: inventory.quantity_in_stock,
    canPreorder: Boolean(inventory.is_preorder ?? inventory.allow_preorder),
    etaDays: inventory.eta_days ?? null,
    etaNote: inventory.eta_note ?? null,
    preorderDate: inventory.preorder_available_date ?? null,
  };
}

export async function getAllInventory() {
  const { data, error } = await supabase
    .from('inventory')
    .select('*');

  if (error) throw error;
  return data || [];
}

export async function getListingTagsMap() {
  const { data, error } = await supabase
    .from('ui_settings')
    .select('key, value')
    .like('key', 'listing_tags:%');

  if (error) throw error;

  const map: Record<string, string[]> = {};
  (data || []).forEach((row: any) => {
    const key = String(row?.key || '');
    const productId = key.startsWith('listing_tags:') ? key.slice('listing_tags:'.length).trim() : '';
    if (!productId) return;
    const rawValue = row?.value;
    const tags = Array.isArray(rawValue?.tags)
      ? rawValue.tags
      : Array.isArray(rawValue)
        ? rawValue
        : [];
    map[productId] = tags.map((tag: unknown) => String(tag || '').trim()).filter(Boolean);
  });
  return map;
}

// ============================================================
// UI SETTINGS SERVICE
// ============================================================

export type FpsSettings = {
  dlssMultiplier: number;
  frameGenMultiplier: number;
};

export async function getFpsSettings() {
  const { data, error } = await supabase
    .from('ui_settings')
    .select('value')
    .eq('key', 'fps')
    .single();

  if (error) {
    return null;
  }

  return data?.value as FpsSettings | null;
}

// ============================================================
// CART SERVICE
// ============================================================

export async function getCart(userId: string) {
  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      *,
      product:product_id (*)
    `)
    .eq('user_id', userId);
  
  if (error) throw error;
  return data || [];
}

export async function addToCart(userId: string, productId: string, quantity: number) {
  const { data, error } = await supabase
    .from('cart_items')
    .upsert(
      {
        user_id: userId,
        product_id: productId,
        quantity,
      },
      { onConflict: 'user_id,product_id' }
    )
    .select();
  
  if (error) throw error;
  return data?.[0];
}

export async function removeFromCart(cartItemId: string) {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', cartItemId);
  
  if (error) throw error;
}

export async function clearCart(userId: string) {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId);
  
  if (error) throw error;
}

// ============================================================
// ORDERS SERVICE
// ============================================================

export async function getUserOrders(userId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        product:product_id (name, price_cents, image_url)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function getOrder(orderId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        product:product_id (name, price_cents, cpu, gpu, ram, storage)
      )
    `)
    .eq('id', orderId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function createOrder(orderData: {
  user_id: string;
  total_cents: number;
  customer_email: string;
  stripe_session_id?: string;
}) {
  const { data, error } = await supabase
    .from('orders')
    .insert([
      {
        ...orderData,
        status: 'pending',
        currency: 'SEK',
      },
    ])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateOrderStatus(orderId: string, status: string) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date() })
    .eq('id', orderId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============================================================
// ORDER ITEMS SERVICE
// ============================================================

export async function addOrderItem(orderItem: {
  order_id: string;
  product_id: string;
  unit_price_cents: number;
  quantity: number;
}) {
  const { data, error } = await supabase
    .from('order_items')
    .insert([orderItem])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function requestOrderCancel(orderId: string) {
  return apiRequest(`/api/orders/${orderId}/cancel-request`, {
    method: 'POST',
  });
}

export async function requestAccountDeleteCode() {
  return apiRequest('/api/account-delete/request', {
    method: 'POST',
  });
}

export async function confirmAccountDelete(code: string) {
  return apiRequest('/api/account-delete/confirm', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

// ============================================================
// ADDRESS SERVICE
// ============================================================

export async function getUserAddresses(userId: string) {
  return apiRequest('/api/addresses');
}

export async function createUserAddress(address: {
  user_id: string;
  label?: string | null;
  full_name?: string | null;
  phone?: string | null;
  address_line1: string;
  address_line2?: string | null;
  postal_code: string;
  city: string;
  country?: string | null;
  is_default?: boolean;
}) {
  return apiRequest('/api/addresses', {
    method: 'POST',
    body: JSON.stringify(address),
  });
}

export async function updateUserAddress(addressId: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from('user_addresses')
    .update({ ...updates, updated_at: new Date() })
    .eq('id', addressId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function setDefaultAddress(userId: string, addressId: string) {
  return apiRequest(`/api/addresses/${addressId}/default`, {
    method: 'POST',
  });
}

export async function deleteUserAddress(addressId: string) {
  await apiRequest(`/api/addresses/${addressId}`, {
    method: 'DELETE',
  });
}
