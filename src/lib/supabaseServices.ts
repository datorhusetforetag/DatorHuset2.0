import { supabase } from '@/lib/supabaseClient';

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
    canPreorder: inventory.allow_preorder,
    preorderDate: inventory.preorder_available_date,
  };
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
        product:product_id (name, price_cents)
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
