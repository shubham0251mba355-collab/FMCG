export type UserRole = 'customer' | 'supplier';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  city?: string;
  phone?: string;
  supplierId?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: 'Trial Pack' | 'Campus Bundle';
  weight: string;
  price: number;
  mrp: number;
  calories: string;
  spiceLevel: 'Mild' | 'Medium' | 'Bold' | 'Assorted';
  description: string;
  image: string;
  inStock: boolean;
}

export type SupplierType =
  | 'College Canteen'
  | 'Local Store'
  | 'Student Ambassador'
  | 'Regional Distributor';

export interface Supplier {
  id: string;
  ownerUserId: string;
  businessName: string;
  supplierType: SupplierType;
  city: 'Dehradun' | 'Delhi-NCR' | string;
  zone: string;
  phone: string;
  whatsappEnabled: boolean;
  deliveryEta: string;
  minOrder: number;
  acceptsCod: boolean;
  acceptsPickup: boolean;
  stockedFlavours: string[];
  description: string;
  verified: boolean;
  inStock: boolean;
  createdAt: string;
  avgRating: number;
  avgFreshness: number;
  avgDelivery: number;
  reviewCount: number;
}

export interface Review {
  id: string;
  supplierId: string;
  userId: string;
  userName: string;
  userCity?: string;
  rating: number;
  freshnessRating: number;
  deliveryRating: number;
  title: string;
  comment: string;
  flavourTried: string;
  verifiedOrder: boolean;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  weight: string;
}

export type OrderStatus = 'confirmed' | 'packing' | 'dispatched' | 'delivered';

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  supplierId: string;
  supplierName: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  fulfillmentType: 'delivery' | 'pickup';
  paymentMethod: 'upi' | 'cod';
  customerName: string;
  phone: string;
  addressOrCampus: string;
  notes?: string;
  status: OrderStatus;
  createdAt: string;
}

export interface Inquiry {
  id: string;
  supplierId: string;
  supplierName: string;
  userId?: string;
  senderName: string;
  senderContact: string;
  inquiryType: 'hostel_drop' | 'bulk_canteen' | 'campus_event' | 'retail_stock';
  message: string;
  reply?: string;
  repliedAt?: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
