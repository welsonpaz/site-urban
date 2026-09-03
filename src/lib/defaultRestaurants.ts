import { Restaurant, MenuItem, AdditionalOption } from '../types';
import { MENU_ITEMS, MOCK_LOGO_URL } from '../data';

export const PIZZARIA_LOGO_URL = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=400&auto=format&fit=crop';
export const PIZZARIA_COVER_URL = 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=1200&auto=format&fit=crop';

export const DEFAULT_RESTAURANTS: Restaurant[] = [
  {
    id: 'urbanburguer',
    name: 'Urbano Burguer',
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
  },
  {
    id: 'pizzariateste',
    name: 'Pizzaria Bella Massa',
    slug: 'pizzariateste',
    subtitle: 'Autêntica pizza italiana com massa de fermentação natural de 48h assada em forno de pedra a 450°C.',
    tag: 'TRADIÇÃO • FORNO A LENHA • SABOR',
    segment: 'Pizzaria',
    logoUrl: PIZZARIA_LOGO_URL,
    coverUrl: PIZZARIA_COVER_URL,
    phone: '(86) 99803-0143',
    whatsapp: '5586998030143',
    address: 'Rua das Pizzas Artesanais, 450',
    neighborhood: 'Bela Vista',
    city: 'Teresina',
    state: 'PI',
    openingTime: '18:30',
    closingTime: '23:59',
    daysText: 'Quarta a Segunda',
    statusMode: 'auto',
    openDays: [0, 1, 3, 4, 5, 6], // Terça fecha
    status: 'active',
    plan: 'Profissional',
    categories: ['Pizzas Salgadas', 'Pizzas Especiais', 'Pizzas Doces', 'Calzones', 'Bebidas'],
    defaultDeliveryFee: 6.0,
    deliveryFees: [
      { neighborhood: 'Centro', fee: 6.0 },
      { neighborhood: 'Bela Vista', fee: 5.0 },
      { neighborhood: 'Jardins', fee: 7.0 },
      { neighborhood: 'Ininga', fee: 8.0 },
      { neighborhood: 'Horto', fee: 7.5 }
    ],
    paymentMethods: {
      pix: true,
      creditCard: true,
      debitCard: true,
      cash: true,
      pixKey: '86998030143'
    },
    createdAt: '2026-02-01T12:00:00.000Z',
    updatedAt: new Date().toISOString()
  }
];

// Pizza items for Pizzaria Bella Massa
export const PIZZARIA_ITEMS: MenuItem[] = [
  {
    id: 'pizza-margherita-especial',
    restaurantId: 'pizzariateste',
    name: 'Margherita DOC Especial',
    description: 'Molho de tomate San Marzano pelado italiano, mozzarella fior di latte artesanal, manjericão fresco e azeite extravirgem.',
    price: 54.90,
    imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?q=80&w=800&auto=format&fit=crop',
    category: 'Pizzas Salgadas',
    rating: 4.9,
    ratingCount: '48',
    isPopular: true,
    ingredients: [
      { name: 'Tomate San Marzano', icon: 'Leaf' },
      { name: 'Fior di Latte', icon: 'Layers' },
      { name: 'Manjericão', icon: 'Leaf' }
    ]
  },
  {
    id: 'pizza-pepperoni-supremo',
    restaurantId: 'pizzariateste',
    name: 'Pepperoni Supremo & Mel Picante',
    description: 'Fatias generosas de pepperoni artesanal crocante, mozzarella gratinada e fio de mel com pimenta dedo de moça.',
    price: 59.90,
    imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=800&auto=format&fit=crop',
    category: 'Pizzas Especiais',
    rating: 5.0,
    ratingCount: '62',
    isPopular: true,
    ingredients: [
      { name: 'Pepperoni Artesanal', icon: 'Beef' },
      { name: 'Mel Picante', icon: 'Cookie' },
      { name: 'Mozzarella', icon: 'Layers' }
    ]
  },
  {
    id: 'pizza-quatro-queijos-nobre',
    restaurantId: 'pizzariateste',
    name: 'Quattro Formaggi Imperial',
    description: 'Combinação requintada de Mozzarella especial, Gorgonzola Dolce, Provolone defumado e Catupiry Original.',
    price: 58.00,
    imageUrl: 'https://images.unsplash.com/photo-1573821663912-569905455b1c?q=80&w=800&auto=format&fit=crop',
    category: 'Pizzas Salgadas',
    rating: 4.8,
    ratingCount: '37',
    isPopular: false,
    ingredients: [
      { name: 'Gorgonzola Dolce', icon: 'Layers' },
      { name: 'Provolone Defumado', icon: 'Layers' },
      { name: 'Catupiry Original', icon: 'Layers' }
    ]
  },
  {
    id: 'pizza-nutella-morango',
    restaurantId: 'pizzariateste',
    name: 'Nutella Pura com Morangos Frescos',
    description: 'Base crocante coberta com calda de chocolate meio amargo, generosa camada de Nutella original e lâminas de morangos frescos.',
    price: 49.90,
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=800&auto=format&fit=crop',
    category: 'Pizzas Doces',
    rating: 4.9,
    ratingCount: '54',
    isPopular: true,
    ingredients: [
      { name: 'Nutella Avelã', icon: 'Cookie' },
      { name: 'Morangos Frescos', icon: 'Leaf' }
    ]
  },
  {
    id: 'calzone-da-casa',
    restaurantId: 'pizzariateste',
    name: 'Calzone Clássico Napolitano',
    description: 'Massa fechada recheada com presunto de parma, ricota cremosa temperada, mozzarella e toque de orégano fresco.',
    price: 45.00,
    imageUrl: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?q=80&w=800&auto=format&fit=crop',
    category: 'Calzones',
    rating: 4.7,
    ratingCount: '21',
    isPopular: false,
    ingredients: [
      { name: 'Ricota Cremosa', icon: 'Layers' },
      { name: 'Presunto Parma', icon: 'Beef' }
    ]
  },
  {
    id: 'coca-cola-2l',
    restaurantId: 'pizzariateste',
    name: 'Coca-Cola Original 2 Litros',
    description: 'Garrafa de 2 litros bem gelada, perfeita para acompanhar a sua pizza em família.',
    price: 14.00,
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=800&auto=format&fit=crop',
    category: 'Bebidas',
    rating: 5.0,
    ratingCount: '19',
    isPopular: false,
    ingredients: []
  }
];

// Additionals per restaurant
export const DEFAULT_ADDITIONALS: AdditionalOption[] = [
  // Urbano Burguer additionals
  { id: 'add-bacon-urban', restaurantId: 'urbanburguer', name: 'Bacon Artesanal Defumado Extra', price: 6.00, category: 'Hambúrgueres', isActive: true },
  { id: 'add-cheddar-urban', restaurantId: 'urbanburguer', name: 'Cheddar Inglês Melt Duplo', price: 5.50, category: 'Hambúrgueres', isActive: true },
  { id: 'add-hamburguer-urban', restaurantId: 'urbanburguer', name: 'Carne Extra 160g na Brasa', price: 9.00, category: 'Hambúrgueres', isActive: true },
  { id: 'add-cebola-urban', restaurantId: 'urbanburguer', name: 'Cebola Caramelizada na Cerveja', price: 4.00, category: 'Hambúrgueres', isActive: true },
  { id: 'add-molho-urban', restaurantId: 'urbanburguer', name: 'Pote Extra de Maionese da Casa', price: 3.50, category: 'Hambúrgueres', isActive: true },

  // Pizzaria additionals
  { id: 'add-borda-catupiry', restaurantId: 'pizzariateste', name: 'Borda Recheada Catupiry Original', price: 8.00, category: 'Pizzas Salgadas', isActive: true },
  { id: 'add-borda-cheddar', restaurantId: 'pizzariateste', name: 'Borda Recheada Cheddar Cremoso', price: 8.00, category: 'Pizzas Salgadas', isActive: true },
  { id: 'add-borda-chocolate', restaurantId: 'pizzariateste', name: 'Borda Recheada Chocolate ao Leite', price: 9.50, category: 'Pizzas Doces', isActive: true },
  { id: 'add-queijo-extra', restaurantId: 'pizzariateste', name: 'Queijo Mozzarella Extra 150g', price: 7.00, category: 'Pizzas Salgadas', isActive: true },
  { id: 'add-azeite-trufas', restaurantId: 'pizzariateste', name: 'Azeite de Oliva com Trufas Brancas', price: 6.50, category: 'Pizzas Salgadas', isActive: true }
];
