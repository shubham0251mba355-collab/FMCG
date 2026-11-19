import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');
const SECRET_PATH = path.join(DATA_DIR, '.auth_secret');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getAuthSecret(): string {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16) {
    return process.env.SESSION_SECRET;
  }
  if (fs.existsSync(SECRET_PATH)) {
    return fs.readFileSync(SECRET_PATH, 'utf8').trim();
  }
  const generated = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(SECRET_PATH, generated, 'utf8');
  return generated;
}

const AUTH_SECRET = getAuthSecret();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, keyHex] = storedHash.split(':');
  if (!salt || !keyHex) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

interface TokenPayload {
  userId: string;
  email: string;
  exp: number;
}

function signToken(payload: TokenPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyToken(token: string): TokenPayload | null {
  try {
    const [encoded, sig] = token.split('.');
    if (!encoded || !sig) return null;
    const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(encoded).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const decoded = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as TokenPayload;
    if (!decoded.userId || Date.now() > decoded.exp) return null;
    return decoded;
  } catch {
    return null;
  }
}

interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'customer' | 'supplier';
  city?: string;
  phone?: string;
  supplierId?: string;
  createdAt: string;
}

interface StoredProduct {
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

interface StoredSupplier {
  id: string;
  ownerUserId: string;
  businessName: string;
  supplierType: 'College Canteen' | 'Local Store' | 'Student Ambassador' | 'Regional Distributor';
  city: string;
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
}

interface StoredReview {
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

interface StoredOrder {
  id: string;
  orderNumber: string;
  userId?: string;
  supplierId: string;
  supplierName: string;
  items: Array<{ productId: string; name: string; price: number; quantity: number; weight: string }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  fulfillmentType: 'delivery' | 'pickup';
  paymentMethod: 'upi' | 'cod';
  customerName: string;
  phone: string;
  addressOrCampus: string;
  notes?: string;
  status: 'confirmed' | 'packing' | 'dispatched' | 'delivered';
  createdAt: string;
}

interface StoredInquiry {
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

interface StoreData {
  users: StoredUser[];
  products: StoredProduct[];
  suppliers: StoredSupplier[];
  reviews: StoredReview[];
  orders: StoredOrder[];
  inquiries: StoredInquiry[];
}

function createInitialData(): StoreData {
  const now = new Date().toISOString();
  const demoCustomerId = 'usr-demo-student';
  const demoSupplierUserId = 'usr-demo-partner';

  return {
    users: [
      {
        id: demoCustomerId,
        name: 'Aarav Rawat',
        email: 'student@dehradun.edu',
        passwordHash: hashPassword('crunch49'),
        role: 'customer',
        city: 'Dehradun',
        phone: '+91 98970 11223',
        createdAt: now,
      },
      {
        id: demoSupplierUserId,
        name: 'Vikram Negi',
        email: 'partner@bidholimart.in',
        passwordHash: hashPassword('partner49'),
        role: 'supplier',
        city: 'Dehradun',
        phone: '+91 98371 42019',
        supplierId: 'sup-bidholi-mart',
        createdAt: now,
      },
    ],
    products: [
      {
        id: 'hc-peri-peri',
        name: 'Himalayan Peri Peri',
        category: 'Trial Pack',
        weight: '35g',
        price: 49,
        mrp: 65,
        calories: '124 kcal',
        spiceLevel: 'Bold',
        description:
          'Slow-roasted foxnuts dusted with fiery mountain chilli, smoked paprika, and tangy citrus spice.',
        image: '/src/assets/images/pack_peri_peri_1795096799454.jpg',
        inStock: true,
      },
      {
        id: 'hc-salt-pepper',
        name: 'Dehradun Rock Salt & Pepper',
        category: 'Trial Pack',
        weight: '35g',
        price: 49,
        mrp: 65,
        calories: '118 kcal',
        spiceLevel: 'Mild',
        description:
          'Clean, everyday crunch seasoned with mineral-rich pink Himalayan salt and cracked black peppercorns.',
        image: '/src/assets/images/pack_salt_pepper_1795096798689.jpg',
        inStock: true,
      },
      {
        id: 'hc-pudina-zing',
        name: 'Mountain Pudina Zing',
        category: 'Trial Pack',
        weight: '35g',
        price: 49,
        mrp: 65,
        calories: '120 kcal',
        spiceLevel: 'Medium',
        description:
          'Refreshing garden mint, roasted jeera, and bright amchur chaat notes built for afternoon lecture breaks.',
        image: '/src/assets/images/pack_pudina_herb_1795096799978.jpg',
        inStock: true,
      },
      {
        id: 'hc-cream-herb',
        name: 'Cream & Himalayan Herb',
        category: 'Trial Pack',
        weight: '35g',
        price: 49,
        mrp: 65,
        calories: '126 kcal',
        spiceLevel: 'Mild',
        description:
          'Savoury cream and wild oregano seasoning—the crisp, non-greasy swap for fried potato chips.',
        image: '/src/assets/images/hero_himalayan_makhana_1795096799261.jpg',
        inStock: true,
      },
      {
        id: 'hc-campus-trio',
        name: 'Campus 3-Pack Trio',
        category: 'Campus Bundle',
        weight: '3 × 35g',
        price: 139,
        mrp: 195,
        calories: '362 kcal total',
        spiceLevel: 'Assorted',
        description:
          'One pack each of Peri Peri, Rock Salt & Pepper, and Pudina Zing—designed for hostel desks and backpacks.',
        image: '/src/assets/images/pack_campus_combo_1795096799807.jpg',
        inStock: true,
      },
      {
        id: 'hc-hostel-box',
        name: 'Hostel Study 6-Pack',
        category: 'Campus Bundle',
        weight: '6 × 35g',
        price: 279,
        mrp: 390,
        calories: '728 kcal total',
        spiceLevel: 'Assorted',
        description:
          'Full weekly stash across all four signature flavours for exam prep, late-night coding, and group study.',
        image: '/src/assets/images/pack_campus_combo_1795096799807.jpg',
        inStock: true,
      },
    ],
    suppliers: [
      {
        id: 'sup-bidholi-mart',
        ownerUserId: demoSupplierUserId,
        businessName: 'Bidholi Campus Canteen & Mart',
        supplierType: 'College Canteen',
        city: 'Dehradun',
        zone: 'Bidholi · DGU & UPES Campus Belt',
        phone: '+91 98371 42019',
        whatsappEnabled: true,
        deliveryEta: '20 mins campus drop',
        minOrder: 49,
        acceptsCod: true,
        acceptsPickup: true,
        stockedFlavours: [
          'Himalayan Peri Peri',
          'Dehradun Rock Salt & Pepper',
          'Mountain Pudina Zing',
          'Cream & Himalayan Herb',
        ],
        description:
          'Main campus snack counter serving hostel blocks, library breaks, and evening student orders with fresh ₹49 trial packs.',
        verified: true,
        inStock: true,
        createdAt: '2026-10-02T10:00:00.000Z',
      },
      {
        id: 'sup-prem-nagar',
        ownerUserId: 'usr-seed-2',
        businessName: 'Prem Nagar Student Provisions',
        supplierType: 'Local Store',
        city: 'Dehradun',
        zone: 'Prem Nagar · Wing 4 & Tea Estate Road',
        phone: '+91 97604 88120',
        whatsappEnabled: true,
        deliveryEta: '30 mins PG & hostel drop',
        minOrder: 98,
        acceptsCod: true,
        acceptsPickup: true,
        stockedFlavours: [
          'Himalayan Peri Peri',
          'Dehradun Rock Salt & Pepper',
          'Mountain Pudina Zing',
        ],
        description:
          'Neighbourhood kirana & student mart open till 11 PM for quick ₹49 single packs, 3-pack trios, and UPI/COD pickup.',
        verified: true,
        inStock: true,
        createdAt: '2026-10-05T11:30:00.000Z',
      },
      {
        id: 'sup-rajpur-depot',
        ownerUserId: 'usr-seed-3',
        businessName: 'Rajpur Road Crunch Depot',
        supplierType: 'Regional Distributor',
        city: 'Dehradun',
        zone: 'Rajpur Road · Jakhan & Pacific Mall Belt',
        phone: '+91 94120 33915',
        whatsappEnabled: true,
        deliveryEta: '45 mins express / bulk same-day',
        minOrder: 49,
        acceptsCod: true,
        acceptsPickup: true,
        stockedFlavours: [
          'Himalayan Peri Peri',
          'Dehradun Rock Salt & Pepper',
          'Mountain Pudina Zing',
          'Cream & Himalayan Herb',
        ],
        description:
          'Primary Dehradun D2C & B2B micro-hub supplying retail cafés, co-working spaces, and college fests across town.',
        verified: true,
        inStock: true,
        createdAt: '2026-10-08T09:15:00.000Z',
      },
      {
        id: 'sup-clement-collective',
        ownerUserId: 'usr-seed-4',
        businessName: 'Clement Town Campus Collective',
        supplierType: 'Student Ambassador',
        city: 'Dehradun',
        zone: 'Clement Town · Graphic Era & Subhash Nagar',
        phone: '+91 81715 60442',
        whatsappEnabled: true,
        deliveryEta: '15 mins hostel gate handover',
        minOrder: 49,
        acceptsCod: true,
        acceptsPickup: true,
        stockedFlavours: ['Himalayan Peri Peri', 'Mountain Pudina Zing', 'Cream & Himalayan Herb'],
        description:
          'Student-run campus distribution point offering blind taste samplers, ₹49 trial packs, and hostel group bundles.',
        verified: true,
        inStock: true,
        createdAt: '2026-10-11T14:20:00.000Z',
      },
      {
        id: 'sup-delhi-ncr',
        ownerUserId: 'usr-seed-5',
        businessName: 'Hudson Lane & North Campus Hub',
        supplierType: 'Regional Distributor',
        city: 'Delhi-NCR',
        zone: 'North Campus · GTB Nagar & Kamla Nagar',
        phone: '+91 98114 75290',
        whatsappEnabled: true,
        deliveryEta: 'Same-day NCR dispatch',
        minOrder: 139,
        acceptsCod: false,
        acceptsPickup: true,
        stockedFlavours: [
          'Himalayan Peri Peri',
          'Dehradun Rock Salt & Pepper',
          'Mountain Pudina Zing',
          'Cream & Himalayan Herb',
        ],
        description:
          'Delhi-NCR partner serving DU North Campus PGs, young working professionals, and office pantry subscriptions.',
        verified: true,
        inStock: true,
        createdAt: '2026-10-15T12:00:00.000Z',
      },
    ],
    reviews: [
      {
        id: 'rev-1',
        supplierId: 'sup-bidholi-mart',
        userId: demoCustomerId,
        userName: 'Aarav Rawat',
        userCity: 'Dehradun',
        rating: 5,
        freshnessRating: 5,
        deliveryRating: 5,
        title: 'Delivered between lectures in 15 mins',
        comment:
          'Picked up two Peri Peri ₹49 packs before our afternoon seminar. Super crisp, zero oily fingers while using laptops, and way more affordable than ₹150 supermarket jars.',
        flavourTried: 'Himalayan Peri Peri',
        verifiedOrder: true,
        createdAt: '2026-11-10T14:30:00.000Z',
      },
      {
        id: 'rev-2',
        supplierId: 'sup-bidholi-mart',
        userId: 'usr-seed-r2',
        userName: 'Ananya Joshi',
        userCity: 'Dehradun',
        rating: 5,
        freshnessRating: 5,
        deliveryRating: 4,
        title: 'Best hostel evening snack swap',
        comment:
          'Used to buy fried chips every evening from the canteen. Switched to Pudina Zing and Rock Salt packs—Vikram always keeps fresh stock right near the gate.',
        flavourTried: 'Mountain Pudina Zing',
        verifiedOrder: true,
        createdAt: '2026-11-12T18:10:00.000Z',
      },
      {
        id: 'rev-3',
        supplierId: 'sup-prem-nagar',
        userId: 'usr-seed-r3',
        userName: 'Rohan Bisht',
        userCity: 'Dehradun',
        rating: 4,
        freshnessRating: 5,
        deliveryRating: 4,
        title: 'Fresh batch and easy UPI payment',
        comment:
          'Ordered the Campus 3-Pack Trio at 9:30 PM. Arrived sealed and crunchy within 25 minutes.',
        flavourTried: 'Campus 3-Pack Trio',
        verifiedOrder: true,
        createdAt: '2026-11-13T21:45:00.000Z',
      },
      {
        id: 'rev-4',
        supplierId: 'sup-rajpur-depot',
        userId: 'usr-seed-r4',
        userName: 'Meera Kapoor',
        userCity: 'Dehradun',
        rating: 5,
        freshnessRating: 5,
        deliveryRating: 5,
        title: 'Handled our 60-pack college fest stall smoothly',
        comment:
          'Connected with Rajpur Road Depot for our entrepreneurship club pop-up. Consistent ₹49 trial pack pricing and zero crushed puffs.',
        flavourTried: 'Hostel Study 6-Pack',
        verifiedOrder: true,
        createdAt: '2026-11-14T11:00:00.000Z',
      },
      {
        id: 'rev-5',
        supplierId: 'sup-clement-collective',
        userId: 'usr-seed-r5',
        userName: 'Siddharth Verma',
        userCity: 'Dehradun',
        rating: 5,
        freshnessRating: 5,
        deliveryRating: 5,
        title: 'Taste test sold our entire hostel wing',
        comment:
          'Tried the Cream & Herb sample outside the library and immediately ordered a 6-pack box. Great initiative by student ambassadors.',
        flavourTried: 'Cream & Himalayan Herb',
        verifiedOrder: true,
        createdAt: '2026-11-15T16:20:00.000Z',
      },
      {
        id: 'rev-6',
        supplierId: 'sup-delhi-ncr',
        userId: 'usr-seed-r6',
        userName: 'Niharika Sharma',
        userCity: 'Delhi-NCR',
        rating: 4,
        freshnessRating: 5,
        deliveryRating: 4,
        title: 'Healthy desk snack for work breaks',
        comment:
          'Ordered two Campus Trios to Hudson Lane. Great spice balance on Peri Peri and clean packaging.',
        flavourTried: 'Himalayan Peri Peri',
        verifiedOrder: true,
        createdAt: '2026-11-16T13:15:00.000Z',
      },
    ],
    orders: [
      {
        id: 'ord-seed-1',
        orderNumber: 'HC-1042',
        userId: demoCustomerId,
        supplierId: 'sup-bidholi-mart',
        supplierName: 'Bidholi Campus Canteen & Mart',
        items: [
          {
            productId: 'hc-peri-peri',
            name: 'Himalayan Peri Peri',
            price: 49,
            quantity: 2,
            weight: '35g',
          },
          {
            productId: 'hc-pudina-zing',
            name: 'Mountain Pudina Zing',
            price: 49,
            quantity: 1,
            weight: '35g',
          },
        ],
        subtotal: 147,
        deliveryFee: 0,
        total: 147,
        fulfillmentType: 'delivery',
        paymentMethod: 'upi',
        customerName: 'Aarav Rawat',
        phone: '+91 98970 11223',
        addressOrCampus: 'DGU Hostel Block B, Room 214, Bidholi',
        status: 'delivered',
        createdAt: '2026-11-10T14:00:00.000Z',
      },
    ],
    inquiries: [
      {
        id: 'inq-seed-1',
        supplierId: 'sup-bidholi-mart',
        supplierName: 'Bidholi Campus Canteen & Mart',
        userId: demoCustomerId,
        senderName: 'Aarav Rawat',
        senderContact: '+91 98970 11223',
        inquiryType: 'campus_event',
        message: 'Hi! Can you supply 35 trial packs of Peri Peri and Pudina Zing for Friday MBA case club meetup?',
        reply: 'Yes! All 35 packs are reserved at ₹49/pack with complimentary campus gate delivery at 3 PM.',
        repliedAt: '2026-11-11T10:20:00.000Z',
        createdAt: '2026-11-11T09:45:00.000Z',
      },
    ],
  };
}

function loadStore(): StoreData {
  if (!fs.existsSync(STORE_PATH)) {
    const initial = createInitialData();
    saveStore(initial);
    return initial;
  }
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    return JSON.parse(raw) as StoreData;
  } catch {
    const initial = createInitialData();
    saveStore(initial);
    return initial;
  }
}

function saveStore(data: StoreData): void {
  const tmp = `${STORE_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, STORE_PATH);
}

let store = loadStore();

function sanitizeUser(u: StoredUser) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    city: u.city,
    phone: u.phone,
    supplierId: u.supplierId,
    createdAt: u.createdAt,
  };
}

function enrichSupplier(s: StoredSupplier) {
  const relReviews = store.reviews.filter((r) => r.supplierId === s.id);
  const count = relReviews.length;
  const avgRating = count
    ? Number((relReviews.reduce((acc, r) => acc + r.rating, 0) / count).toFixed(1))
    : 0;
  const avgFreshness = count
    ? Number((relReviews.reduce((acc, r) => acc + r.freshnessRating, 0) / count).toFixed(1))
    : 0;
  const avgDelivery = count
    ? Number((relReviews.reduce((acc, r) => acc + r.deliveryRating, 0) / count).toFixed(1))
    : 0;
  return {
    ...s,
    avgRating,
    avgFreshness,
    avgDelivery,
    reviewCount: count,
  };
}

interface AuthedRequest extends Request {
  authUser?: StoredUser;
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const parts = cookieHeader.split(';').map((p) => p.trim());
    for (const part of parts) {
      if (part.startsWith('hc_token=')) {
        return decodeURIComponent(part.slice('hc_token='.length));
      }
    }
  }
  return null;
}

function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      const user = store.users.find((u) => u.id === payload.userId);
      if (user) req.authUser = user;
    }
  }
  next();
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  optionalAuth(req, res, () => {
    if (!req.authUser) {
      res.status(401).json({ error: 'Please sign in to continue.' });
      return;
    }
    next();
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, brand: 'Himalayan Crunch' });
  });

  // --- AUTH ---
  app.post('/api/auth/signup', (req, res) => {
    const { name, email, password, role, city, phone } = req.body ?? {};
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanPassword = typeof password === 'string' ? password : '';
    const cleanRole = role === 'supplier' ? 'supplier' : 'customer';

    if (cleanName.length < 2 || cleanName.length > 80) {
      res.status(400).json({ error: 'Please enter your full name (2–80 characters).' });
      return;
    }
    if (!cleanEmail.includes('@') || cleanEmail.length < 5) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (cleanPassword.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }
    if (store.users.some((u) => u.email === cleanEmail)) {
      res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
      return;
    }

    const newUser: StoredUser = {
      id: `usr-${crypto.randomUUID().slice(0, 8)}`,
      name: cleanName,
      email: cleanEmail,
      passwordHash: hashPassword(cleanPassword),
      role: cleanRole,
      city: typeof city === 'string' && city.trim() ? city.trim() : 'Dehradun',
      phone: typeof phone === 'string' ? phone.trim() : '',
      createdAt: new Date().toISOString(),
    };

    store.users.push(newUser);
    saveStore(store);

    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('hc_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(201).json({ user: sanitizeUser(newUser), token });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body ?? {};
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanPassword = typeof password === 'string' ? password : '';

    const user = store.users.find((u) => u.email === cleanEmail);
    if (!user || !verifyPassword(cleanPassword, user.passwordHash)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('hc_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ user: sanitizeUser(user), token });
  });

  app.post('/api/auth/logout', (_req, res) => {
    res.clearCookie('hc_token');
    res.json({ ok: true });
  });

  app.get('/api/auth/me', optionalAuth, (req: AuthedRequest, res) => {
    if (!req.authUser) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    res.json({ user: sanitizeUser(req.authUser) });
  });

  // --- PRODUCTS ---
  app.get('/api/products', (_req, res) => {
    res.json({ products: store.products });
  });

  // --- SUPPLIERS ---
  app.get('/api/suppliers', (req, res) => {
    const { city, type, search, sort } = req.query;
    let list = store.suppliers.map(enrichSupplier);

    if (typeof city === 'string' && city !== 'All' && city.trim() !== '') {
      list = list.filter((s) => s.city.toLowerCase() === city.toLowerCase());
    }
    if (typeof type === 'string' && type !== 'All' && type.trim() !== '') {
      list = list.filter((s) => s.supplierType === type);
    }
    if (typeof search === 'string' && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.businessName.toLowerCase().includes(q) ||
          s.zone.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
      );
    }
    if (sort === 'rating') {
      list.sort((a, b) => b.avgRating - a.avgRating || b.reviewCount - a.reviewCount);
    } else if (sort === 'newest') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      list.sort((a, b) => b.reviewCount - a.reviewCount || b.avgRating - a.avgRating);
    }

    res.json({ suppliers: list });
  });

  app.post('/api/suppliers', requireAuth, (req: AuthedRequest, res) => {
    const user = req.authUser!;
    const {
      businessName,
      supplierType,
      city,
      zone,
      phone,
      deliveryEta,
      minOrder,
      acceptsCod,
      acceptsPickup,
      stockedFlavours,
      description,
    } = req.body ?? {};

    const cleanName = typeof businessName === 'string' ? businessName.trim() : '';
    const cleanZone = typeof zone === 'string' ? zone.trim() : '';
    const cleanPhone = typeof phone === 'string' ? phone.trim() : '';
    const cleanDesc = typeof description === 'string' ? description.trim() : '';
    const validTypes = [
      'College Canteen',
      'Local Store',
      'Student Ambassador',
      'Regional Distributor',
    ];
    if (cleanName.length < 3) {
      res.status(400).json({ error: 'Business name must be at least 3 characters.' });
      return;
    }
    if (!validTypes.includes(supplierType)) {
      res.status(400).json({ error: 'Please select a valid distributor or supplier type.' });
      return;
    }
    if (cleanZone.length < 3) {
      res.status(400).json({ error: 'Please specify your campus or locality zone.' });
      return;
    }
    if (cleanPhone.length < 8) {
      res.status(400).json({ error: 'Please enter a valid contact phone number.' });
      return;
    }

    const existingOwn = store.suppliers.find((s) => s.ownerUserId === user.id);
    if (existingOwn) {
      res.status(409).json({ error: 'You already have an active supplier listing on your account.' });
      return;
    }

    const flavours =
      Array.isArray(stockedFlavours) && stockedFlavours.length > 0
        ? stockedFlavours.filter((f): f is string => typeof f === 'string').slice(0, 6)
        : ['Himalayan Peri Peri', 'Dehradun Rock Salt & Pepper'];

    const newSupplier: StoredSupplier = {
      id: `sup-${crypto.randomUUID().slice(0, 8)}`,
      ownerUserId: user.id,
      businessName: cleanName,
      supplierType,
      city: typeof city === 'string' && city.trim() ? city.trim() : 'Dehradun',
      zone: cleanZone,
      phone: cleanPhone,
      whatsappEnabled: true,
      deliveryEta:
        typeof deliveryEta === 'string' && deliveryEta.trim()
          ? deliveryEta.trim()
          : '30 mins local drop',
      minOrder: Math.max(49, Number(minOrder) || 49),
      acceptsCod: Boolean(acceptsCod ?? true),
      acceptsPickup: Boolean(acceptsPickup ?? true),
      stockedFlavours: flavours,
      description:
        cleanDesc ||
        'Local Himalayan Crunch partner offering fresh ₹49 trial packs and fast campus delivery.',
      verified: true,
      inStock: true,
      createdAt: new Date().toISOString(),
    };

    store.suppliers.push(newSupplier);
    user.role = 'supplier';
    user.supplierId = newSupplier.id;
    saveStore(store);

    res.status(201).json({
      supplier: enrichSupplier(newSupplier),
      user: sanitizeUser(user),
    });
  });

  app.patch('/api/suppliers/:id', requireAuth, (req: AuthedRequest, res) => {
    const user = req.authUser!;
    const supplier = store.suppliers.find((s) => s.id === req.params.id);
    if (!supplier) {
      res.status(404).json({ error: 'Supplier not found.' });
      return;
    }
    if (supplier.ownerUserId !== user.id) {
      res.status(403).json({ error: 'Only the business owner can update this listing.' });
      return;
    }

    const { inStock, deliveryEta, minOrder, stockedFlavours, description } = req.body ?? {};
    if (typeof inStock === 'boolean') supplier.inStock = inStock;
    if (typeof deliveryEta === 'string' && deliveryEta.trim()) {
      supplier.deliveryEta = deliveryEta.trim();
    }
    if (minOrder !== undefined) {
      supplier.minOrder = Math.max(49, Number(minOrder) || 49);
    }
    if (Array.isArray(stockedFlavours) && stockedFlavours.length > 0) {
      supplier.stockedFlavours = stockedFlavours.slice(0, 6);
    }
    if (typeof description === 'string' && description.trim()) {
      supplier.description = description.trim();
    }

    saveStore(store);
    res.json({ supplier: enrichSupplier(supplier) });
  });

  // --- REVIEWS ---
  app.get('/api/suppliers/:id/reviews', (req, res) => {
    const reviews = store.reviews
      .filter((r) => r.supplierId === req.params.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ reviews });
  });

  app.post('/api/suppliers/:id/reviews', requireAuth, (req: AuthedRequest, res) => {
    const user = req.authUser!;
    const supplier = store.suppliers.find((s) => s.id === req.params.id);
    if (!supplier) {
      res.status(404).json({ error: 'Supplier not found.' });
      return;
    }

    const { rating, freshnessRating, deliveryRating, title, comment, flavourTried } = req.body ?? {};
    const rOverall = Math.min(5, Math.max(1, Math.round(Number(rating) || 5)));
    const rFresh = Math.min(5, Math.max(1, Math.round(Number(freshnessRating) || rOverall)));
    const rDeliv = Math.min(5, Math.max(1, Math.round(Number(deliveryRating) || rOverall)));
    const cleanTitle = typeof title === 'string' ? title.trim() : '';
    const cleanComment = typeof comment === 'string' ? comment.trim() : '';

    if (cleanComment.length < 10) {
      res.status(400).json({ error: 'Please share at least 10 characters in your review.' });
      return;
    }

    const hasOrdered = store.orders.some(
      (o) => o.userId === user.id && o.supplierId === supplier.id
    );

    const newReview: StoredReview = {
      id: `rev-${crypto.randomUUID().slice(0, 8)}`,
      supplierId: supplier.id,
      userId: user.id,
      userName: user.name,
      userCity: user.city || 'Dehradun',
      rating: rOverall,
      freshnessRating: rFresh,
      deliveryRating: rDeliv,
      title: cleanTitle || 'Customer Experience Review',
      comment: cleanComment,
      flavourTried:
        typeof flavourTried === 'string' && flavourTried.trim()
          ? flavourTried.trim()
          : 'Himalayan Peri Peri',
      verifiedOrder: hasOrdered,
      createdAt: new Date().toISOString(),
    };

    store.reviews.unshift(newReview);
    saveStore(store);

    res.status(201).json({
      review: newReview,
      supplier: enrichSupplier(supplier),
    });
  });

  app.delete('/api/reviews/:reviewId', requireAuth, (req: AuthedRequest, res) => {
    const user = req.authUser!;
    const idx = store.reviews.findIndex((r) => r.id === req.params.reviewId);
    if (idx === -1) {
      res.status(404).json({ error: 'Review not found.' });
      return;
    }
    if (store.reviews[idx].userId !== user.id) {
      res.status(403).json({ error: 'You can only remove your own review.' });
      return;
    }
    const supplierId = store.reviews[idx].supplierId;
    store.reviews.splice(idx, 1);
    saveStore(store);
    const supplier = store.suppliers.find((s) => s.id === supplierId);
    res.json({ ok: true, supplier: supplier ? enrichSupplier(supplier) : null });
  });

  // --- ORDERS ---
  app.post('/api/orders', optionalAuth, (req: AuthedRequest, res) => {
    const {
      supplierId,
      items,
      fulfillmentType,
      paymentMethod,
      customerName,
      phone,
      addressOrCampus,
      notes,
    } = req.body ?? {};

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Your bag is empty.' });
      return;
    }

    const supplier =
      store.suppliers.find((s) => s.id === supplierId) || store.suppliers[0];

    const cleanName = typeof customerName === 'string' ? customerName.trim() : '';
    const cleanPhone = typeof phone === 'string' ? phone.trim() : '';
    const cleanAddress = typeof addressOrCampus === 'string' ? addressOrCampus.trim() : '';

    if (cleanName.length < 2 || cleanPhone.length < 8 || cleanAddress.length < 4) {
      res.status(400).json({
        error: 'Please enter your name, phone number, and hostel/campus or delivery address.',
      });
      return;
    }

    const normalizedItems = items
      .map((item: { productId?: string; quantity?: number }) => {
        const prod = store.products.find((p) => p.id === item.productId);
        if (!prod) return null;
        const qty = Math.max(1, Math.min(50, Math.round(Number(item.quantity) || 1)));
        return {
          productId: prod.id,
          name: prod.name,
          price: prod.price,
          quantity: qty,
          weight: prod.weight,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    if (normalizedItems.length === 0) {
      res.status(400).json({ error: 'No valid products found in order.' });
      return;
    }

    const subtotal = normalizedItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
    const fulfillment = fulfillmentType === 'pickup' ? 'pickup' : 'delivery';
    const deliveryFee = fulfillment === 'pickup' || subtotal >= 147 ? 0 : 15;
    const total = subtotal + deliveryFee;

    const orderNumber = `HC-${Math.floor(1050 + Math.random() * 8900)}`;
    const newOrder: StoredOrder = {
      id: `ord-${crypto.randomUUID().slice(0, 8)}`,
      orderNumber,
      userId: req.authUser?.id,
      supplierId: supplier.id,
      supplierName: supplier.businessName,
      items: normalizedItems,
      subtotal,
      deliveryFee,
      total,
      fulfillmentType: fulfillment,
      paymentMethod: paymentMethod === 'cod' ? 'cod' : 'upi',
      customerName: cleanName,
      phone: cleanPhone,
      addressOrCampus: cleanAddress,
      notes: typeof notes === 'string' ? notes.trim() : undefined,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    store.orders.unshift(newOrder);
    saveStore(store);

    res.status(201).json({ order: newOrder });
  });

  app.get('/api/orders', requireAuth, (req: AuthedRequest, res) => {
    const user = req.authUser!;
    const ownedSupplier = store.suppliers.find((s) => s.ownerUserId === user.id);

    const customerOrders = store.orders.filter((o) => o.userId === user.id);
    const supplierOrders = ownedSupplier
      ? store.orders.filter((o) => o.supplierId === ownedSupplier.id)
      : [];

    res.json({ customerOrders, supplierOrders });
  });

  app.patch('/api/orders/:id/status', requireAuth, (req: AuthedRequest, res) => {
    const user = req.authUser!;
    const order = store.orders.find((o) => o.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    const supplier = store.suppliers.find((s) => s.id === order.supplierId);
    if (!supplier || supplier.ownerUserId !== user.id) {
      res.status(403).json({ error: 'Only the fulfilling supplier can update order status.' });
      return;
    }

    const { status } = req.body ?? {};
    const validStatuses = ['confirmed', 'packing', 'dispatched', 'delivered'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid order status.' });
      return;
    }
    order.status = status;
    saveStore(store);
    res.json({ order });
  });

  // --- CUSTOMER-SUPPLIER INQUIRIES (CONNECT) ---
  app.post('/api/inquiries', optionalAuth, (req: AuthedRequest, res) => {
    const { supplierId, senderName, senderContact, inquiryType, message } = req.body ?? {};
    const supplier = store.suppliers.find((s) => s.id === supplierId);
    if (!supplier) {
      res.status(404).json({ error: 'Supplier not found.' });
      return;
    }
    const cleanName = typeof senderName === 'string' ? senderName.trim() : '';
    const cleanContact = typeof senderContact === 'string' ? senderContact.trim() : '';
    const cleanMsg = typeof message === 'string' ? message.trim() : '';

    if (cleanName.length < 2 || cleanContact.length < 5 || cleanMsg.length < 8) {
      res.status(400).json({
        error: 'Please provide your name, phone/WhatsApp or email, and message.',
      });
      return;
    }

    const validInquiryTypes = ['hostel_drop', 'bulk_canteen', 'campus_event', 'retail_stock'];
    const newInquiry: StoredInquiry = {
      id: `inq-${crypto.randomUUID().slice(0, 8)}`,
      supplierId: supplier.id,
      supplierName: supplier.businessName,
      userId: req.authUser?.id,
      senderName: cleanName,
      senderContact: cleanContact,
      inquiryType: validInquiryTypes.includes(inquiryType) ? inquiryType : 'hostel_drop',
      message: cleanMsg,
      createdAt: new Date().toISOString(),
    };

    store.inquiries.unshift(newInquiry);
    saveStore(store);
    res.status(201).json({ inquiry: newInquiry });
  });

  app.get('/api/inquiries', requireAuth, (req: AuthedRequest, res) => {
    const user = req.authUser!;
    const ownedSupplier = store.suppliers.find((s) => s.ownerUserId === user.id);

    const incoming = ownedSupplier
      ? store.inquiries.filter((i) => i.supplierId === ownedSupplier.id)
      : [];
    const sent = store.inquiries.filter((i) => i.userId === user.id);

    res.json({ incoming, sent });
  });

  app.patch('/api/inquiries/:id/reply', requireAuth, (req: AuthedRequest, res) => {
    const user = req.authUser!;
    const inquiry = store.inquiries.find((i) => i.id === req.params.id);
    if (!inquiry) {
      res.status(404).json({ error: 'Inquiry not found.' });
      return;
    }
    const supplier = store.suppliers.find((s) => s.id === inquiry.supplierId);
    if (!supplier || supplier.ownerUserId !== user.id) {
      res.status(403).json({ error: 'Only the recipient supplier can reply.' });
      return;
    }
    const { reply } = req.body ?? {};
    const cleanReply = typeof reply === 'string' ? reply.trim() : '';
    if (cleanReply.length < 2) {
      res.status(400).json({ error: 'Please enter a reply message.' });
      return;
    }
    inquiry.reply = cleanReply;
    inquiry.repliedAt = new Date().toISOString();
    saveStore(store);
    res.json({ inquiry });
  });

  // Vite middleware in dev, static assets in production
  if (process.env.NODE_ENV === 'production') {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Himalayan Crunch server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
