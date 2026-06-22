import type { SeasonName } from './rule-engine';

export type StyleCategory = 'hair' | 'makeup' | 'jewelry' | 'accessories' | 'patterns' | 'wardrobe';

export type StyleRecommendation = {
  category: StyleCategory;
  label: string;
  best: string[];
  avoid: string;
};

const SPRING_STYLE: StyleRecommendation[] = [
  {
    category: 'hair',
    label: 'Hair',
    best: ['Golden blonde', 'Warm chestnut', 'Honey highlights', 'Peachy copper'],
    avoid: 'Ash, cool-toned, or jet-black shades',
  },
  {
    category: 'makeup',
    label: 'Makeup',
    best: ['Peach blush', 'Coral lipstick', 'Warm nude', 'Golden bronze eyeshadow'],
    avoid: 'Cool berry, dark plum, or grey-based tones',
  },
  {
    category: 'jewelry',
    label: 'Jewelry',
    best: ['Yellow gold', 'Rose gold', 'Warm copper', 'Pearl'],
    avoid: 'Silver or platinum metals',
  },
  {
    category: 'accessories',
    label: 'Accessories',
    best: ['Warm beige bag', 'Camel belt', 'Light tan shoes', 'Floral scarf'],
    avoid: 'Black or cool-grey accessories',
  },
  {
    category: 'patterns',
    label: 'Patterns',
    best: ['Florals', 'Soft stripes', 'Ditsy prints', 'Watercolor motifs'],
    avoid: 'Bold geometric or high-contrast black-and-white',
  },
  {
    category: 'wardrobe',
    label: 'Wardrobe',
    best: ['Coral tops', 'Warm ivory blouses', 'Light peach dresses', 'Sage green knits'],
    avoid: 'Black-dominant outfits or icy cool tones',
  },
];

const SUMMER_STYLE: StyleRecommendation[] = [
  {
    category: 'hair',
    label: 'Hair',
    best: ['Ash blonde', 'Cool brown', 'Lavender tint', 'Soft rose highlights'],
    avoid: 'Warm golden or brassy tones',
  },
  {
    category: 'makeup',
    label: 'Makeup',
    best: ['Mauve blush', 'Rose lipstick', 'Soft plum', 'Lilac eyeshadow'],
    avoid: 'Orange, warm bronze, or earthy tones',
  },
  {
    category: 'jewelry',
    label: 'Jewelry',
    best: ['Silver', 'Rose gold', 'Lavender amethyst', 'Pearl'],
    avoid: 'Yellow gold or copper',
  },
  {
    category: 'accessories',
    label: 'Accessories',
    best: ['Dusty rose bag', 'Soft grey shoes', 'Lavender scarf', 'Cool taupe belt'],
    avoid: 'Orange-brown or warm camel tones',
  },
  {
    category: 'patterns',
    label: 'Patterns',
    best: ['Watercolor floral', 'Soft paisley', 'Delicate lace', 'Muted plaid'],
    avoid: 'Loud, high-contrast, or warm-toned prints',
  },
  {
    category: 'wardrobe',
    label: 'Wardrobe',
    best: ['Powder blue blouses', 'Dusty rose dresses', 'Soft grey knits', 'Lavender midi skirts'],
    avoid: 'Bright orange, warm yellow, or very dark black',
  },
];

const AUTUMN_STYLE: StyleRecommendation[] = [
  {
    category: 'hair',
    label: 'Hair',
    best: ['Auburn', 'Deep copper', 'Warm brown', 'Chestnut'],
    avoid: 'Platinum blonde, ash, or cool highlights',
  },
  {
    category: 'makeup',
    label: 'Makeup',
    best: ['Terracotta blush', 'Warm brick lipstick', 'Olive eyeshadow', 'Bronze highlighter'],
    avoid: 'Cool pink, frosty silver, or icy nudes',
  },
  {
    category: 'jewelry',
    label: 'Jewelry',
    best: ['Yellow gold', 'Copper', 'Bronze', 'Amber stone'],
    avoid: 'Silver or bright white metals',
  },
  {
    category: 'accessories',
    label: 'Accessories',
    best: ['Rust bag', 'Chocolate brown boots', 'Olive scarf', 'Cognac belt'],
    avoid: 'Black or cool-toned accessories',
  },
  {
    category: 'patterns',
    label: 'Patterns',
    best: ['Plaid', 'Houndstooth', 'Paisley', 'Animal print'],
    avoid: 'Icy pastels or stark black-and-white',
  },
  {
    category: 'wardrobe',
    label: 'Wardrobe',
    best: ['Burnt orange tops', 'Olive green trousers', 'Camel coats', 'Deep teal dresses'],
    avoid: 'Hot pink, electric blue, or icy grey',
  },
];

const WINTER_STYLE: StyleRecommendation[] = [
  {
    category: 'hair',
    label: 'Hair',
    best: ['Jet black', 'Dark espresso', 'Cool dark brown', 'Platinum blonde'],
    avoid: 'Warm golden, brassy, or red-brown tones',
  },
  {
    category: 'makeup',
    label: 'Makeup',
    best: ['Berry lipstick', 'Wine red', 'Cool pink blush', 'Charcoal eyeshadow'],
    avoid: 'Warm peachy or orange-based tones',
  },
  {
    category: 'jewelry',
    label: 'Jewelry',
    best: ['Silver', 'Platinum', 'White gold', 'Diamond or sapphire'],
    avoid: 'Yellow gold or copper',
  },
  {
    category: 'accessories',
    label: 'Accessories',
    best: ['Black bag', 'White sneakers', 'Silver-toned belt', 'Deep navy scarf'],
    avoid: 'Warm brown or camel tones',
  },
  {
    category: 'patterns',
    label: 'Patterns',
    best: ['Graphic prints', 'Bold stripes', 'High-contrast geometric', 'Abstract'],
    avoid: 'Soft, muted, or warm-toned prints',
  },
  {
    category: 'wardrobe',
    label: 'Wardrobe',
    best: ['Crisp white shirts', 'True black blazers', 'Royal blue dresses', 'Fuchsia tops'],
    avoid: 'Warm beige, camel, or muted earth tones',
  },
];

const SEASON_STYLE_MAP: Record<string, StyleRecommendation[]> = {
  Spring: SPRING_STYLE,
  Summer: SUMMER_STYLE,
  Autumn: AUTUMN_STYLE,
  Winter: WINTER_STYLE,
};

export function getStyleGuide(baseSeason: string): StyleRecommendation[] {
  return SEASON_STYLE_MAP[baseSeason] ?? SPRING_STYLE;
}

export const SEASON_DESCRIPTIONS_EN: Record<SeasonName, string> = {
  'Light Spring': 'Your coloring is light, warm, and delicately luminous. Soft warm peaches, light yellows, and coral pinks illuminate your face and enhance your natural glow.',
  'True Spring': 'Your coloring is warm, clear, and energetic. Golden yellows, fresh greens, and warm coral shades revitalize your complexion and bring out your natural radiance.',
  'Bright Spring': 'Your features are high-contrast and vivid. Clear, bright colors like coral red, vivid pink, and electric blue make your coloring come alive.',
  'Light Summer': 'Your coloring is soft, light, and cool-toned. Lavender, powder blue, and soft rose enhance your natural femininity and gentle appearance.',
  'True Summer': 'Your coloring is cool, muted, and refined. Rose pink, dusty blue, and soft mauve harmonize beautifully with your cool undertones.',
  'Soft Summer': 'Your coloring is softly muted with low contrast. Greyed lavender, dusty blue, and soft rose complement your understated, elegant appearance.',
  'Soft Autumn': 'Your coloring is warm and gently muted. Soft browns, dusty greens, and warm yellows create a balanced, natural harmony with your features.',
  'True Autumn': 'Your coloring is rich, warm, and earthy. Copper, olive green, and golden amber tones celebrate your natural warmth and depth.',
  'Dark Autumn': 'Your coloring is deep, warm, and dramatic. Dark brown, forest green, and wine red tones accentuate your richly intense coloring.',
  'Cool Winter': 'Your coloring is cool, clear, and striking. Icy blue, bright magenta, and pure white highlight the crispness and precision of your features.',
  'Bright Winter': 'Your coloring is high-contrast and vivid. True red, electric blue, and black-and-white combinations amplify the clarity and drama of your look.',
  'Dark Winter': 'Your coloring is deep, cool, and commanding. Deep burgundy, charcoal navy, and coal black give power and elegance to your strong presence.',
};
