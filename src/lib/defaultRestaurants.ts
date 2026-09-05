import { Restaurant, AdditionalOption } from '../types';
import { MOCK_LOGO_URL } from '../data';

export const DEFAULT_RESTAURANTS: Restaurant[] = [
  {
    id: 'urbanburguer',
    name: 'Urban Burguer',
    slug: 'urbanburguer',
    subtitle: 'Hamburgueria artesanal premium com burgers grelhados na brasa, ingredientes selecionados e muito sabor.',
    tag: 'SABOR • ATITUDE • QUALIDADE',
    segment: 'Hamburgueria',
    logoUrl: MOCK_LOGO_URL,
    coverUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1200&auto=format&fit=crop',
    phone: '(86) 99803-0143',
    whatsapp: '5586998030143',
    address: 'Av. Principal dos Sabores, 1000',
    neighborhood: 'Centro',
    city: 'Teresina',
    state: 'PI',
    openingTime: '18:00',
    closingTime: '23:30',
    daysText: 'Terça a Domingo',
    statusMode: 'auto',
    openDays: [0, 2, 3, 4, 5, 6],
    status: 'active',
    plan: 'Premium',
    categories: ['Hambúrgueres', 'Combos', 'Batatas Recheadas', 'Porções', 'Bebidas'],
    defaultDeliveryFee: 5.0,
    deliveryFees: [
      { neighborhood: 'Centro', fee: 5.0 },
      { neighborhood: 'Jardins', fee: 6.0 },
      { neighborhood: 'Bela Vista', fee: 7.0 },
      { neighborhood: 'São Cristóvão', fee: 8.0 },
      { neighborhood: 'Fátima', fee: 7.5 },
      { neighborhood: 'Ilhotas', fee: 6.5 }
    ],
    paymentMethods: {
      pix: true,
      creditCard: true,
      debitCard: true,
      cash: true,
      pixKey: '86998030143'
    },
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: new Date().toISOString()
  }
];

// Additionals for Urban Burguer
export const DEFAULT_ADDITIONALS: AdditionalOption[] = [
  { id: 'add-bacon-urban', restaurantId: 'urbanburguer', name: 'Bacon Artesanal Defumado Extra', price: 6.00, category: 'Hambúrgueres', isActive: true },
  { id: 'add-cheddar-urban', restaurantId: 'urbanburguer', name: 'Cheddar Inglês Melt Duplo', price: 5.50, category: 'Hambúrgueres', isActive: true },
  { id: 'add-hamburguer-urban', restaurantId: 'urbanburguer', name: 'Carne Extra 160g na Brasa', price: 9.00, category: 'Hambúrgueres', isActive: true },
  { id: 'add-cebola-urban', restaurantId: 'urbanburguer', name: 'Cebola Caramelizada na Cerveja', price: 4.00, category: 'Hambúrgueres', isActive: true },
  { id: 'add-molho-urban', restaurantId: 'urbanburguer', name: 'Pote Extra de Maionese da Casa', price: 3.50, category: 'Hambúrgueres', isActive: true }
];
