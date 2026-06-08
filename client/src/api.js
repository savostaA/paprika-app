import { FALLBACK_CATEGORIES, FALLBACK_PRODUCTS } from './fallbackData';

const DEV_HOST = '192.168.0.8';
const PORT = '3001';

const getApiBase = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://localhost:${PORT}/api`;
    }
  }
  return `http://${DEV_HOST}:${PORT}/api`;
};

const API = getApiBase();

// Simple in-memory storage for client side if backend is down
let localOrders = [];
try {
  const saved = localStorage.getItem('paprika_orders');
  if (saved) localOrders = JSON.parse(saved);
} catch (e) {
  console.error(e);
}

function saveLocalOrders() {
  try {
    localStorage.setItem('paprika_orders', JSON.stringify(localOrders));
  } catch (e) {
    console.error(e);
  }
}

// Local cache and fallback persistence for products & categories
let localProducts = [];
let localCategories = [];

try {
  localProducts = JSON.parse(localStorage.getItem('paprika_local_products') || '[]');
} catch (e) {}

try {
  localCategories = JSON.parse(localStorage.getItem('paprika_local_categories') || '[]');
} catch (e) {}

// Populate local storage from fallback files if completely empty
if (localProducts.length === 0) {
  localProducts = [...FALLBACK_PRODUCTS];
  try {
    localStorage.setItem('paprika_local_products', JSON.stringify(localProducts));
  } catch (e) {}
}

if (localCategories.length === 0) {
  localCategories = [...FALLBACK_CATEGORIES];
  try {
    localStorage.setItem('paprika_local_categories', JSON.stringify(localCategories));
  } catch (e) {}
}

function saveLocalProducts() {
  try {
    localStorage.setItem('paprika_local_products', JSON.stringify(localProducts));
  } catch (e) {}
}

function saveLocalCategories() {
  try {
    localStorage.setItem('paprika_local_categories', JSON.stringify(localCategories));
  } catch (e) {}
}

export async function fetchCategories() {
  try {
    const res = await fetch(`${API}/categories`);
    if (!res.ok) throw new Error('Not ok');
    const categories = await res.json();
    localCategories = categories;
    saveLocalCategories();
    return categories;
  } catch (e) {
    console.warn('Backend offline, using local cached/fallback categories');
    return localCategories;
  }
}

export async function fetchProducts(params = {}) {
  let products = [];
  try {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API}/products${q ? '?' + q : ''}`);
    if (!res.ok) throw new Error('Not ok');
    products = await res.json();
    // Cache the products locally when fetching all of them
    if (Object.keys(params).length === 0) {
      localProducts = products;
      saveLocalProducts();
    }
  } catch (e) {
    console.warn('Backend offline, using local cached/fallback products');
    let prods = [...localProducts];
    if (params.category_id) {
      prods = prods.filter(p => Number(p.category_id) === Number(params.category_id));
    }
    if (params.search) {
      const s = params.search.toLowerCase();
      prods = prods.filter(p => p.name.toLowerCase().includes(s) || (p.description && p.description.toLowerCase().includes(s)));
    }
    products = prods;
  }

  // Merge locally uploaded images (Base64)
  try {
    const localImages = JSON.parse(localStorage.getItem('paprika_local_images') || '{}');
    products = products.map(p => {
      if (localImages[p.id]) {
        return { ...p, image_url: localImages[p.id] };
      }
      return p;
    });
  } catch (err) {
    console.error('Failed to merge local images', err);
  }
  return products;
}

export async function fetchProduct(id) {
  let product = null;
  try {
    const res = await fetch(`${API}/products/${id}`);
    if (!res.ok) throw new Error('Not ok');
    product = await res.json();
  } catch (e) {
    console.warn('Backend offline, using fallback product detail');
    const p = FALLBACK_PRODUCTS.find(p => p.id === Number(id));
    if (!p) throw new Error('Product not found');
    product = p;
  }

  // Merge locally uploaded image (Base64)
  try {
    const localImages = JSON.parse(localStorage.getItem('paprika_local_images') || '{}');
    if (localImages[id]) {
      product = { ...product, image_url: localImages[id] };
    }
  } catch (err) {
    console.error('Failed to merge local image', err);
  }
  return product;
}

export async function createOrder(data) {
  try {
    const res = await fetch(`${API}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Not ok');
    return await res.json();
  } catch (e) {
    console.warn('Backend offline, saving order locally');
    const orderNumber = 'PAP-LOCAL-' + Date.now().toString(36).toUpperCase();
    const newOrder = {
      id: Date.now(),
      order_number: orderNumber,
      client_name: data.client_name,
      client_phone: data.client_phone,
      event_type: data.event_type,
      event_date: data.event_date,
      event_time: data.event_time,
      delivery_address: data.delivery_address,
      comment: data.comment,
      status: 'new',
      total_amount: data.items.reduce((s, i) => s + (i.price * i.quantity), 0),
      items: data.items.map((item, idx) => ({
        id: idx,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price
      })),
      created_at: new Date().toISOString()
    };
    localOrders.unshift(newOrder);
    saveLocalOrders();
    return newOrder;
  }
}

export async function fetchOrders(status) {
  try {
    const q = status ? `?status=${status}` : '';
    const res = await fetch(`${API}/orders${q}`);
    if (!res.ok) throw new Error('Not ok');
    return await res.json();
  } catch (e) {
    console.warn('Backend offline, loading local orders');
    if (status) {
      return localOrders.filter(o => o.status === status);
    }
    return localOrders;
  }
}

export async function updateOrderStatus(id, status) {
  try {
    const res = await fetch(`${API}/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Not ok');
    return await res.json();
  } catch (e) {
    console.warn('Backend offline, updating local order status');
    localOrders = localOrders.map(o => o.id === Number(id) || o.id === id ? { ...o, status } : o);
    saveLocalOrders();
    return localOrders.find(o => o.id === Number(id) || o.id === id);
  }
}

export async function fetchStats() {
  try {
    const res = await fetch(`${API}/orders/stats/summary`);
    if (!res.ok) throw new Error('Not ok');
    return await res.json();
  } catch (e) {
    console.warn('Backend offline, computing stats from local orders');
    const today = new Date().toISOString().split('T')[0];
    const active = localOrders.filter(o => o.status !== 'cancelled');
    const todayOrders = localOrders.filter(o => o.created_at.startsWith(today));
    const todayRevenue = todayOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total_amount, 0);
    const totalRevenue = active.reduce((s, o) => s + o.total_amount, 0);
    return {
      total_orders: localOrders.length,
      new_orders: localOrders.filter(o => o.status === 'new').length,
      today_orders: todayOrders.length,
      today_revenue: todayRevenue,
      total_revenue: totalRevenue
    };
  }
}

export async function createProduct(data) {
  try {
    const res = await fetch(`${API}/products`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Not ok');
    const product = await res.json();
    localProducts.push(product);
    saveLocalProducts();
    return product;
  } catch (e) {
    console.warn('Backend offline, creating product locally');
    const newProduct = {
      ...data,
      id: Date.now(),
      category_id: Number(data.category_id),
      is_active: data.is_active !== undefined ? Number(data.is_active) : 1,
      created_at: new Date().toISOString()
    };
    localProducts.push(newProduct);
    saveLocalProducts();
    return newProduct;
  }
}

export async function updateProduct(id, data) {
  try {
    const res = await fetch(`${API}/products/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Not ok');
    const product = await res.json();
    localProducts = localProducts.map(p => p.id === Number(id) || p.id === id ? product : p);
    saveLocalProducts();
    return product;
  } catch (e) {
    console.warn('Backend offline, updating product locally');
    localProducts = localProducts.map(p => {
      if (p.id === Number(id) || p.id === id) {
        return {
          ...p,
          ...data,
          category_id: Number(data.category_id),
          is_active: data.is_active !== undefined ? Number(data.is_active) : p.is_active
        };
      }
      return p;
    });
    saveLocalProducts();
    return localProducts.find(p => p.id === Number(id) || p.id === id);
  }
}

export async function deleteProduct(id) {
  try {
    const res = await fetch(`${API}/products/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Not ok');
    localProducts = localProducts.filter(p => p.id !== Number(id) && p.id !== id);
    saveLocalProducts();
    return await res.json();
  } catch (e) {
    console.warn('Backend offline, deleting product locally');
    localProducts = localProducts.filter(p => p.id !== Number(id) && p.id !== id);
    saveLocalProducts();
    return { success: true };
  }
}

export async function uploadImage(file, productId) {
  try {
    const fd = new FormData();
    fd.append('image', file);
    if (productId) fd.append('product_id', productId);
    const res = await fetch(`${API}/upload`, { method: 'POST', body: fd });
    if (!res.ok) throw new Error('Upload failed');
    return await res.json();
  } catch (e) {
    console.warn('Backend upload failed, converting to local Base64 storage');
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        try {
          const localImages = JSON.parse(localStorage.getItem('paprika_local_images') || '{}');
          localImages[productId] = base64;
          localStorage.setItem('paprika_local_images', JSON.stringify(localImages));
          resolve({ success: true, image_url: base64 });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export async function createCategory(data) {
  try {
    const res = await fetch(`${API}/categories`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Not ok');
    const category = await res.json();
    localCategories.push(category);
    saveLocalCategories();
    return category;
  } catch (e) {
    console.warn('Backend offline, creating category locally');
    const newCategory = {
      ...data,
      id: Date.now(),
      sort_order: Number(data.sort_order) || 0
    };
    localCategories.push(newCategory);
    saveLocalCategories();
    return newCategory;
  }
}

export async function updateCategory(id, data) {
  try {
    const res = await fetch(`${API}/categories/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Not ok');
    const category = await res.json();
    localCategories = localCategories.map(c => c.id === Number(id) || c.id === id ? category : c);
    saveLocalCategories();
    return category;
  } catch (e) {
    console.warn('Backend offline, updating category locally');
    localCategories = localCategories.map(c => {
      if (c.id === Number(id) || c.id === id) {
        return {
          ...c,
          ...data,
          sort_order: Number(data.sort_order) || 0
        };
      }
      return c;
    });
    saveLocalCategories();
    return localCategories.find(c => c.id === Number(id) || c.id === id);
  }
}

export async function deleteCategory(id) {
  try {
    const res = await fetch(`${API}/categories/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Not ok');
    localCategories = localCategories.filter(c => c.id !== Number(id) && c.id !== id);
    saveLocalCategories();
    return await res.json();
  } catch (e) {
    console.warn('Backend offline, deleting category locally');
    const linked = localProducts.some(p => Number(p.category_id) === Number(id) || p.category_id === id);
    if (linked) {
      return { error: 'ForeignKeyConstraint' };
    }
    localCategories = localCategories.filter(c => c.id !== Number(id) && c.id !== id);
    saveLocalCategories();
    return { success: true };
  }
}

export function getImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:image/')) return path;
  if (path.startsWith('/uploads/')) {
    const bundled = ['logo.png', 'dish-filet.png', 'dish-salmon.png', 'dish-bruschetta.png', 'dish-ribs.png', 'dish-tiramisu.png', 'dish-caesar.png'];
    const filename = path.replace('/uploads/', '');
    if (bundled.includes(filename)) {
      return path;
    }
  }
  return `${IMAGE_BASE}${path}`;
}

export const IMAGE_BASE = API.replace('/api', '');
