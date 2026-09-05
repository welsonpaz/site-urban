export type RestaurantPlan = 'Básico' | 'Profissional' | 'Premium';
export type RestaurantStatus = 'active' | 'inactive';
export type StoreStatusMode = 'auto' | 'open' | 'closed';

export interface DeliveryFeeRule {
  neighborhood: string;
  fee: number;
}

export interface RestaurantPaymentMethods {
  pix: boolean;
  creditCard: boolean;
  debitCard: boolean;
  cash: boolean;
  pixKey?: string;
  pixKeyType?: string;
  pixReceiverName?: string;
}

export interface Restaurant {
  id: string; // e.g. 'urbanburguer' or 'pizzariateste'
  name: string; // 'Urban Burguer'
  slug: string; // 'urbanburguer'
  subtitle?: string;
  tag?: string;
  segment?: 'Hamburgueria' | 'Pizzaria' | 'Lanchonete' | 'Açaí' | 'Restaurante' | 'Outro';
  logoUrl: string;
  coverUrl?: string;
  phone: string;
  whatsapp: string; // digits e.g. '5586998030143'
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  openingTime: string;
  closingTime: string;
  daysText: string;
  statusMode: StoreStatusMode;
  openDays: number[];
  status: RestaurantStatus;
  plan: RestaurantPlan;
  deliveryFees: DeliveryFeeRule[];
  paymentMethods: RestaurantPaymentMethods;
  defaultDeliveryFee: number;
  deliveryEstimatedTime?: string;
  categories: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AdditionalOption {
  id: string;
  restaurantId: string;
  name: string;
  price: number;
  category?: string; // Optional target category
  isActive: boolean;
}

export interface MenuItem {
  id: string;
  restaurantId?: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  burgerType?: string;
  rating: number;
  ratingCount: string;
  ingredients?: Array<{ name: string; icon: string }>;
  isPopular?: boolean;
  isActive?: boolean;
}

export interface CartItem {
  id: string; // unique cart item id
  menuItem: MenuItem;
  quantity: number;
  selectedSides?: MenuItem[];
  notes?: string;
}

export interface UserAddress {
  street: string;
  details: string;
  neighborhood: string;
  cityState: string;
  cep?: string;
}

export type OrderStatus = 
  | 'NOVO' 
  | 'CONFIRMADO' 
  | 'EM PREPARO' 
  | 'SAIU PARA ENTREGA' 
  | 'PRONTO PARA RETIRADA' 
  | 'FINALIZADO' 
  | 'CANCELADO'
  | 'Pendente' 
  | 'Preparando' 
  | 'A caminho' 
  | 'Entregue';

export interface Order {
  id: string;
  restaurantId?: string;
  restaurantName?: string;
  date: string;
  customerName?: string;
  customerPhone?: string;
  deliveryType?: 'delivery' | 'pickup';
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  address: UserAddress;
  paymentMethod: 'credit' | 'debit' | 'pix' | 'cash';
  estimatedTime: string;
  changeFor?: string;
  createdAt?: string;
}

export type ScreenType = 'menu' | 'detail' | 'cart' | 'register' | 'checkout' | 'orders' | 'favorites' | 'profile' | 'dashboard' | 'superadmin';

export interface Coupon {
  id: string;
  restaurantId?: string;
  code: string;
  discount: number;
  type: 'percent' | 'fixed';
  description?: string;
  minOrderValue?: number;
  updatedAt?: string;
}


