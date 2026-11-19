import {
  Inquiry,
  Order,
  OrderStatus,
  Product,
  Review,
  Supplier,
  SupplierType,
  User,
  UserRole,
} from '../types';

const TOKEN_KEY = 'hc_auth_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  // Auth
  signup: (payload: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    city?: string;
    phone?: string;
  }) =>
    apiFetch<{ user: User; token: string }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    apiFetch<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  logout: () => apiFetch<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),

  me: () => apiFetch<{ user: User }>('/api/auth/me'),

  // Catalog & Suppliers
  getProducts: () => apiFetch<{ products: Product[] }>('/api/products'),

  getSuppliers: (params?: { city?: string; type?: string; search?: string; sort?: string }) => {
    const qs = new URLSearchParams();
    if (params?.city && params.city !== 'All') qs.set('city', params.city);
    if (params?.type && params.type !== 'All') qs.set('type', params.type);
    if (params?.search) qs.set('search', params.search);
    if (params?.sort) qs.set('sort', params.sort);
    const query = qs.toString();
    return apiFetch<{ suppliers: Supplier[] }>(`/api/suppliers${query ? `?${query}` : ''}`);
  },

  createSupplier: (payload: {
    businessName: string;
    supplierType: SupplierType;
    city: string;
    zone: string;
    phone: string;
    deliveryEta: string;
    minOrder: number;
    acceptsCod: boolean;
    acceptsPickup: boolean;
    stockedFlavours: string[];
    description: string;
  }) =>
    apiFetch<{ supplier: Supplier; user: User }>('/api/suppliers', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateSupplier: (
    id: string,
    payload: Partial<{
      inStock: boolean;
      deliveryEta: string;
      minOrder: number;
      stockedFlavours: string[];
      description: string;
    }>
  ) =>
    apiFetch<{ supplier: Supplier }>(`/api/suppliers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // Reviews
  getReviews: (supplierId: string) =>
    apiFetch<{ reviews: Review[] }>(`/api/suppliers/${supplierId}/reviews`),

  createReview: (
    supplierId: string,
    payload: {
      rating: number;
      freshnessRating: number;
      deliveryRating: number;
      title: string;
      comment: string;
      flavourTried: string;
    }
  ) =>
    apiFetch<{ review: Review; supplier: Supplier }>(`/api/suppliers/${supplierId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteReview: (reviewId: string) =>
    apiFetch<{ ok: boolean; supplier: Supplier | null }>(`/api/reviews/${reviewId}`, {
      method: 'DELETE',
    }),

  // Orders
  createOrder: (payload: {
    supplierId: string;
    items: Array<{ productId: string; quantity: number }>;
    fulfillmentType: 'delivery' | 'pickup';
    paymentMethod: 'upi' | 'cod';
    customerName: string;
    phone: string;
    addressOrCampus: string;
    notes?: string;
  }) =>
    apiFetch<{ order: Order }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getOrders: () => apiFetch<{ customerOrders: Order[]; supplierOrders: Order[] }>('/api/orders'),

  updateOrderStatus: (orderId: string, status: OrderStatus) =>
    apiFetch<{ order: Order }>(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Inquiries (Connect)
  createInquiry: (payload: {
    supplierId: string;
    senderName: string;
    senderContact: string;
    inquiryType: 'hostel_drop' | 'bulk_canteen' | 'campus_event' | 'retail_stock';
    message: string;
  }) =>
    apiFetch<{ inquiry: Inquiry }>('/api/inquiries', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getInquiries: () => apiFetch<{ incoming: Inquiry[]; sent: Inquiry[] }>('/api/inquiries'),

  replyInquiry: (inquiryId: string, reply: string) =>
    apiFetch<{ inquiry: Inquiry }>(`/api/inquiries/${inquiryId}/reply`, {
      method: 'PATCH',
      body: JSON.stringify({ reply }),
    }),
};
