import { MenuItem } from './types';
import urbanBurguerLogo from './assets/images/urban_burguer_logo_final.jpg';

export const MOCK_LOGO_URL = `${urbanBurguerLogo}?v=41`;
export const MOCK_LOGO_INVERSE_URL = `${urbanBurguerLogo}?v=41`;
export const MOCK_MAP_IMAGE_URL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBney2gg2oEnLqykoJoUvS8FF3fICGEPTpxev-ZwgJJwKetCUAncedonfnVFuAP4sMXPfkFuEARlXs5dYh8-ZOmC_HUJwN30YPmib3v6d5-BuMmG-uRnM-hRvf6gikKQeiL1N2chtlJVi20NOJkdQdVruxrLyHMJEHVbnkDlFrR8D9qZW8fwxWZWiovqz5fFEnB30P-IGGayrwBK9zKhuUT513S4A80ZA7OJDcPNZS_MGKipfvPaHHJdqEwu_nkguYQtGsm5KKo4R1F';

export interface ExtraOption {
  id: string;
  name: string;
  price: number;
}

export const EXTRA_OPTIONS: ExtraOption[] = [
  { id: 'extra-blend', name: 'Blend Carne / Blend Frango', price: 5.00 },
  { id: 'extra-desfiada', name: 'Carne Desfiada', price: 5.00 },
  { id: 'extra-bacon', name: 'Bacon', price: 3.00 },
  { id: 'extra-queijo', name: 'Queijo', price: 3.00 },
  { id: 'extra-ovo', name: 'Ovo', price: 2.00 },
  { id: 'extra-salada', name: 'Salada', price: 2.00 },
  { id: 'extra-presunto', name: 'Presunto', price: 2.00 },
  { id: 'extra-calabresa', name: 'Calabresa', price: 2.00 },
  { id: 'extra-cebola', name: 'Cebola Caramelizada', price: 2.00 },
  { id: 'extra-molho', name: 'Maionese 7 / Molho 7', price: 2.00 }
];

export const MENU_ITEMS: MenuItem[] = [
  // Categoria: Hambúrgueres -> Especiais
  {
    id: 'o-chefao',
    name: 'O Chefão',
    description: 'Pão de cajuna. 2 blends 130g. 2 queijos. 2 presunto. 2 ovos. calabresa. bacon. milho. salada. batata palha. molho 7',
    price: 34.00,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop',
    category: 'Hambúrgueres',
    burgerType: 'Especiais',
    rating: 4.9,
    ratingCount: '254',
    ingredients: [
      { name: 'Pão de Cajuna', icon: 'Cookie' },
      { name: '2 Blends 130g', icon: 'Beef' },
      { name: '2 Queijos e 2 Presunto', icon: 'Layers' },
      { name: '2 Ovos, Calabresa e Bacon', icon: 'Egg' },
      { name: 'Milho, Salada e Batata Palha', icon: 'Leaf' },
      { name: 'Molho 7', icon: 'Flame' }
    ],
    isPopular: true
  },
  {
    id: 'o-magnata',
    name: 'O Magnata',
    description: 'Pão de cajuna. blend 130g. queijo. presunto. fatia de abacaxi. assado.carne desfiada. molho barbecue',
    price: 32.00,
    imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?q=80&w=800&auto=format&fit=crop',
    category: 'Hambúrgueres',
    burgerType: 'Especiais',
    rating: 4.8,
    ratingCount: '192',
    ingredients: [
      { name: 'Pão de Cajuna', icon: 'Cookie' },
      { name: 'Blend 130g e Queijo', icon: 'Beef' },
      { name: 'Presunto e Carne Desfiada', icon: 'Beef' },
      { name: 'Fatia de Abacaxi Assado', icon: 'Leaf' },
      { name: 'Molho Barbecue', icon: 'Flame' }
    ],
    isPopular: true
  },
  {
    id: 'o-patrao',
    name: 'O Patrão',
    description: 'Pão de cajuna. blend 130g. queijo. presunto. ovo. salada. geleia de abacaxi com pimenta. maionese 7',
    price: 26.00,
    imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?q=80&w=800&auto=format&fit=crop',
    category: 'Hambúrgueres',
    burgerType: 'Especiais',
    rating: 4.7,
    ratingCount: '115',
    ingredients: [
      { name: 'Pão de Cajuna', icon: 'Cookie' },
      { name: 'Blend 130g e Queijo', icon: 'Beef' },
      { name: 'Presunto e Ovo', icon: 'Egg' },
      { name: 'Salada e Geleia de Abacaxi com Pimenta', icon: 'Leaf' },
      { name: 'Maionese 7', icon: 'Flame' }
    ],
    isPopular: false
  },

  // Categoria: Hambúrgueres -> Clássicos
  {
    id: 'o-padrinho',
    name: 'O Padrinho',
    description: 'Pão de cajuna. blend 130g. queijo. salada coleslaw. bacon. molho 7',
    price: 24.00,
    imageUrl: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?q=80&w=800&auto=format&fit=crop',
    category: 'Hambúrgueres',
    burgerType: 'Clássicos',
    rating: 4.8,
    ratingCount: '98',
    ingredients: [
      { name: 'Pão de Cajuna', icon: 'Cookie' },
      { name: 'Blend 130g e Queijo', icon: 'Beef' },
      { name: 'Salada Coleslaw', icon: 'Leaf' },
      { name: 'Bacon e Molho 7', icon: 'Flame' }
    ],
    isPopular: true
  },
  {
    id: 'o-comandante',
    name: 'O Comandante',
    description: 'Pão de cajuna. blend de frango 130g. queijo. calabresa. cebola caramelizada. molho 7',
    price: 22.00,
    imageUrl: 'https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?q=80&w=800&auto=format&fit=crop',
    category: 'Hambúrgueres',
    burgerType: 'Clássicos',
    rating: 4.6,
    ratingCount: '74',
    ingredients: [
      { name: 'Pão de Cajuna', icon: 'Cookie' },
      { name: 'Blend de Frango 130g', icon: 'Beef' },
      { name: 'Queijo e Calabresa', icon: 'Layers' },
      { name: 'Cebola Caramelizada e Molho 7', icon: 'Flame' }
    ],
    isPopular: false
  },

  // Categoria: Hambúrgueres -> Tradicionais
  {
    id: 'o-classico-bacon',
    name: 'O Clássico Bacon',
    description: 'Pão de cajuna. blend 90g. queijo. bacon e maionese da casa.',
    price: 15.00,
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800&auto=format&fit=crop',
    category: 'Hambúrgueres',
    burgerType: 'Tradicionais',
    rating: 4.7,
    ratingCount: '184',
    ingredients: [
      { name: 'Pão de Cajuna', icon: 'Cookie' },
      { name: 'Blend 90g e Queijo', icon: 'Beef' },
      { name: 'Bacon e Maionese da Casa', icon: 'Flame' }
    ],
    isPopular: false
  },
  {
    id: 'o-classico-egg',
    name: 'O Clássico Egg',
    description: 'Pão de cajuna. blend 90g. queijo. ovo e maionese da casa.',
    price: 14.00,
    imageUrl: 'https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?q=80&w=500&auto=format&fit=crop',
    category: 'Hambúrgueres',
    burgerType: 'Tradicionais',
    rating: 4.6,
    ratingCount: '139',
    ingredients: [
      { name: 'Pão de Cajuna', icon: 'Cookie' },
      { name: 'Blend 90g e Queijo', icon: 'Beef' },
      { name: 'Ovo e Maionese da Casa', icon: 'Egg' }
    ],
    isPopular: false
  },
  {
    id: 'o-classico-salad',
    name: 'O Clássico Salada',
    description: 'Pão de cajuna. blend 90g. queijo. alface. tomate e maionese da casa.',
    price: 13.00,
    imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?q=80&w=500&auto=format&fit=crop',
    category: 'Hambúrgueres',
    burgerType: 'Tradicionais',
    rating: 4.5,
    ratingCount: '98',
    ingredients: [
      { name: 'Pão de Cajuna', icon: 'Cookie' },
      { name: 'Blend 90g e Queijo', icon: 'Beef' },
      { name: 'Alface, Tomate e Maionese da Casa', icon: 'Leaf' }
    ],
    isPopular: false
  },

  // Categoria: Combos
  {
    id: 'combo-o-magnata',
    name: 'Combo O Magnata',
    description: 'Desfiado nervoso + Batata Simples + Guaraná Lata.',
    price: 45.00,
    imageUrl: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?q=80&w=800&auto=format&fit=crop',
    category: 'Combos',
    rating: 4.9,
    ratingCount: '312',
    isPopular: true
  },
  {
    id: 'combo-o-padrinho',
    name: 'Combo O Padrinho',
    description: 'Coleslouco + Coca-Cola.',
    price: 35.00,
    imageUrl: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?q=80&w=800&auto=format&fit=crop',
    category: 'Combos',
    rating: 4.8,
    ratingCount: '240',
    isPopular: true
  },
  {
    id: 'combo-classico-bacon',
    name: 'Combo Clássico Bacon',
    description: 'O Clássico Bacon + Guaraná Lata.',
    price: 23.00,
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800&auto=format&fit=crop',
    category: 'Combos',
    rating: 4.8,
    ratingCount: '198',
    isPopular: false
  },
  {
    id: 'combo-classico-egg',
    name: 'Combo Clássico Egg',
    description: 'O Clássico Egg + Batata Pequena + Coca-Cola Lata.',
    price: 22.00,
    imageUrl: 'https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?q=80&w=800&auto=format&fit=crop',
    category: 'Combos',
    rating: 4.7,
    ratingCount: '143',
    isPopular: false
  },
  {
    id: 'combo-classico-salad',
    name: 'Combo Clássico Salada',
    description: 'O Clássico Salada + Batata Pequena + Guaraná Lata.',
    price: 21.00,
    imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?q=80&w=800&auto=format&fit=crop',
    category: 'Combos',
    rating: 4.6,
    ratingCount: '112',
    isPopular: false
  },

  // Categoria: Batatas Recheadas
  {
    id: 'batata-recheada-carne-requeijao',
    name: 'Carne e Requeijão',
    description: 'Carne desfiada com requeijão cremoso.',
    price: 26.00,
    imageUrl: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?q=80&w=500&auto=format&fit=crop',
    category: 'Batatas Recheadas',
    rating: 4.8,
    ratingCount: '87',
    isPopular: true
  },
  {
    id: 'batata-recheada-frango-bacon-queijo',
    name: 'Frango, Bacon e Queijo',
    description: 'Frango desfiado, bacon e queijo muçarela.',
    price: 26.00,
    imageUrl: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?q=80&w=500&auto=format&fit=crop',
    category: 'Batatas Recheadas',
    rating: 4.7,
    ratingCount: '92',
    isPopular: false
  },
  {
    id: 'batata-recheada-pizza',
    name: 'Pizza',
    description: 'Queijo, presunto e milho.',
    price: 25.00,
    imageUrl: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?q=80&w=500&auto=format&fit=crop',
    category: 'Batatas Recheadas',
    rating: 4.6,
    ratingCount: '64',
    isPopular: false
  },

  // Categoria: Porções
  {
    id: 'batata-simples',
    name: 'Batata Simples',
    description: 'Porção grande de batatas fritas tradicionais sequinhas, douradas e crocantes.',
    price: 15.00,
    imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=500&auto=format&fit=crop',
    category: 'Porções',
    rating: 4.7,
    ratingCount: '293'
  },
  {
    id: 'batata-bacon-e-cheddar',
    name: 'Batata Bacon e Cheddar',
    description: 'Porção generosa de batatas fritas cobertas com cheddar cremoso derretido e pedaços crocantes de bacon.',
    price: 22.00,
    imageUrl: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?q=80&w=500&auto=format&fit=crop',
    category: 'Porções',
    rating: 4.9,
    ratingCount: '468',
    isPopular: true
  },
  {
    id: 'porcao-de-pastezinhos-10-unid',
    name: 'Porção de Pastezinhos (10 unid.)',
    description: '10 deliciosos pastezinhos fritos na hora, super sequinhos e crocantes.',
    price: 18.00,
    imageUrl: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?q=80&w=500&auto=format&fit=crop',
    category: 'Porções',
    rating: 4.8,
    ratingCount: '154',
    isPopular: false
  },
  {
    id: 'tirinhas-de-frango',
    name: 'Tirinhas de Frango',
    description: 'Tiras de peito de frango empanadas com casquinha crocante e dourada.',
    price: 24.00,
    imageUrl: 'https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=500&auto=format&fit=crop',
    category: 'Porções',
    rating: 4.7,
    ratingCount: '138',
    isPopular: false
  },

  // Categoria: Bebidas
  {
    id: 'guarana-lata',
    name: 'Guaraná Lata',
    description: 'Refrigerante Guaraná Antarctica em lata 350ml gelada.',
    price: 8.00,
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=500&auto=format&fit=crop',
    category: 'Bebidas',
    rating: 4.8,
    ratingCount: '412'
  },
  {
    id: 'coca-zero',
    name: 'Coca Zero',
    description: 'Refrigerante Coca-Cola sem açúcar em lata 350ml.',
    price: 8.00,
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=500&auto=format&fit=crop',
    category: 'Bebidas',
    rating: 4.8,
    ratingCount: '584'
  },
  {
    id: 'coca-cola',
    name: 'Coca-Cola',
    description: 'Refrigerante Coca-Cola original em lata 350ml trincando de gelada.',
    price: 8.00,
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=500&auto=format&fit=crop',
    category: 'Bebidas',
    rating: 4.9,
    ratingCount: '782'
  },
  {
    id: 'fanta-laranja',
    name: 'Fanta Laranja',
    description: 'Refrigerante Fanta Laranja lata 350ml gelado.',
    price: 8.00,
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=500&auto=format&fit=crop',
    category: 'Bebidas',
    rating: 4.6,
    ratingCount: '194'
  },
  {
    id: 'fanta-uva',
    name: 'Fanta Uva',
    description: 'Refrigerante Fanta Uva lata 350ml bem gelada.',
    price: 8.00,
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=500&auto=format&fit=crop',
    category: 'Bebidas',
    rating: 4.6,
    ratingCount: '156'
  }
];

export const SUGGESTED_SIDES: MenuItem[] = [];

export const MOCK_COUPONS: Record<string, number> = {
  'URBAN15': 0.15, // 15% discount for Urban Burguer
  'SABOR7': 0.15, // Legacy discount code
  'MONSTRO20': 0.20,
  'QUEROCOMER': 15.00 // R$ 15 discount
};
