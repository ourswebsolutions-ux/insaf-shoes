// Demo catalog for PunjabShop. Used by prisma/seed.mjs (products) and
// scripts/fetch-images.mjs (downloads each product's photos into public/imgs/).
//
// photos: 'px:<id>' = Pexels (Pexels License), 'us:<id>' = Unsplash (Unsplash License),
//         'own:<file>' = the shop's own photo from public/images/ (cropped copy).
// Both licenses allow free commercial use without attribution; sources are listed in public/imgs/CREDITS.md.

export const MEN = ['39', '40', '41', '42', '43', '44', '45'];
export const WOMEN = ['36', '37', '38', '39', '40', '41'];
export const KIDS = ['20', '21', '22', '23', '24', '25', '26', '27', '28'];

export const COLORS = {
  White: '#f5f5f5', Black: '#1d1d1d', Brown: '#7a4a24', Tan: '#b07a45', Beige: '#d9c3a5', Maroon: '#6d1f2b',
  Olive: '#5c6440', Grey: '#9aa0a6', Red: '#c62828', Pink: '#f2a9bf', Navy: '#1f2a4d', Cream: '#efe6d8',
  Green: '#3f8f4a', Blue: '#2f6fb2', 'Sky Blue': '#8ec5e8', Teal: '#2a9d8f', Silver: '#c0c0c0', Nude: '#e3bc9a',
  Purple: '#7b3fa0', Orange: '#e8742a', Yellow: '#e9c13b', Mustard: '#c99a2e', Multi: '#8e7cc3', Rust: '#b5532a',
};

// key, name, menu label, parent key, homepage card, menu, photo for the category card
export const CATEGORIES = [
  { key: 'men', name: "Men's Shoes", menu: 'Men', menuOn: true, home: true, sort: 1, desc: 'Sneakers, formal shoes, casual slip-ons, sports shoes and sandals for men.' },
  { key: 'women', name: "Women's Shoes", menu: 'Women', menuOn: true, home: true, sort: 2, desc: 'Heels, sandals, flats and sneakers for women.' },
  { key: 'kids', name: "Kids' Footwear", menu: 'Kids', menuOn: true, home: false, sort: 3, desc: 'Comfortable, soft shoes for babies and growing kids.' },
  { key: 'chappals-sandals', name: 'Chappals & Sandals', home: true, sort: 4, desc: 'Everyday chappals, sandals and slides for men and women.' },
  { key: 'traditional-footwear', name: 'Traditional Footwear', home: true, sort: 5, desc: 'Classic leather formal shoes and loafers for every occasion.' },
  { key: 'men-sneakers', parent: 'men', name: 'Sneakers', sort: 1 },
  { key: 'men-sports-shoes', parent: 'men', name: 'Sports Shoes', sort: 2 },
  { key: 'men-formal-shoes', parent: 'men', name: 'Formal Shoes', sort: 3 },
  { key: 'men-casual-shoes', parent: 'men', name: 'Casual Shoes & Loafers', sort: 4 },
  { key: 'men-sandals-chappals', parent: 'men', name: 'Sandals & Chappals', sort: 5 },
  { key: 'women-heels', parent: 'women', name: 'Heels', sort: 1 },
  { key: 'women-sandals-flats', parent: 'women', name: 'Sandals & Flats', sort: 2 },
  { key: 'women-sneakers', parent: 'women', name: 'Sneakers', sort: 3 },
];

// Category card images: [category key, product slug whose first photo is used]
export const CATEGORY_IMAGES = {
  men: 'black-canvas-high-tops',
  women: 'nude-pointed-pumps',
  kids: 'pink-suede-kids-sneakers',
  'chappals-sandals': 'olive-toe-loop-leather-sandals',
  'traditional-footwear': 'tan-penny-loafers',
  'men-sneakers': 'white-leather-trainers',
  'men-sports-shoes': 'green-trail-runners',
  'men-formal-shoes': 'tan-cap-toe-oxfords',
  'men-casual-shoes': 'rust-suede-tassel-drivers',
  'men-sandals-chappals': 'black-toe-ring-chappal',
  'women-heels': 'classic-black-stilettos',
  'women-sandals-flats': 'pink-leather-mules',
  'women-sneakers': 'pink-knit-slip-on-sneakers',
};

const p = (slug, name, cats, price, sale, sizes, colors, photos, desc, flags = {}) => ({ slug, name, cats, price, sale, sizes, colors, photos, desc, ...flags });

const MS = ['men', 'men-sneakers'];
const SP = ['men', 'men-sports-shoes'];
const FO = ['men', 'men-formal-shoes', 'traditional-footwear'];
const CA = ['men', 'men-casual-shoes'];
const LO = ['men', 'men-casual-shoes', 'traditional-footwear'];
const SA = ['men', 'men-sandals-chappals', 'chappals-sandals'];
const HE = ['women', 'women-heels'];
const WS = ['women', 'women-sandals-flats', 'chappals-sandals'];
const WF = ['women', 'women-sandals-flats'];
const WN = ['women', 'women-sneakers'];
const KI = ['kids'];

export const PRODUCTS = [
  // ---------------------------------------------------------------- shop's own stock (public/images)
  p('grey-mesh-lace-up-sneakers', 'Grey Mesh Lace-Up Sneakers', [...MS, 'men-sports-shoes'], 3999, 3299, MEN, ['Grey'], ['own:WhatsApp Image 2026-10-31 at 9.03.51 PM.jpeg'], 'Lightweight knit-mesh upper that keeps feet cool, a cushioned midsole and a grippy rubber outsole. A comfortable everyday sneaker for walking, college and work.', { best: true, featured: true }),
  p('grey-elastic-strap-slip-ons', 'Grey Elastic-Strap Slip-Ons', CA, 3799, 3199, MEN, ['Grey'], ['own:WhatsApp Image 2026-10-31 at 9.04.11 PM.jpeg'], 'Easy slip-on shoe with a wide elastic strap for a snug, lace-free fit. Soft lining and a flexible sole make it perfect for long days on your feet.', { best: true }),
  p('brown-memory-foam-walking-shoes', 'Brown Memory-Foam Walking Shoes', CA, 5499, 4699, MEN, ['Brown'], ['own:WhatsApp Image 2026-10-31 at 9.04.30 PM.jpeg'], 'Slip-on walking shoe with a cushioned memory-foam insole and durable outsole. All-day comfort for office, travel and errands.', { best: true, newA: true }),
  p('tan-suede-slip-on-loafers', 'Tan Suede Slip-On Loafers', LO, 4499, 3799, MEN, ['Tan'], ['own:WhatsApp Image 2026-10-31 at 9.04.54 PM.jpeg'], 'Soft tan suede-finish loafer with neat stitching and a comfortable rubber sole. Looks smart with jeans, chinos or shalwar kameez.', { featured: true }),
  p('brown-leather-comfort-slip-ons', 'Brown Leather Comfort Slip-Ons', FO, 4999, 4299, MEN, ['Brown'], ['own:WhatsApp Image 2026-10-31 at 9.05.17 PM.jpeg'], 'Polished brown leather slip-on with a padded footbed and metal side badge. A dependable office and dawat shoe.', { best: true }),
  p('brown-velcro-strap-sandals', 'Brown Velcro-Strap Sandals', SA, 2999, 2499, MEN, ['Brown'], ['own:WhatsApp Image 2026-10-31 at 9.08.35 PM.jpeg'], 'Three-strap sandal with adjustable velcro back strap and a moulded, textured footbed. Built for Pakistani summers.', { best: true }),
  p('sport-cross-strap-sandals', 'Sport Cross-Strap Sandals', SA, 2799, 2299, MEN, ['Brown'], ['own:WhatsApp Image 2026-10-31 at 9.09.09 PM.jpeg'], 'Rugged textured straps with an adjustable back strap and cushioned sole. Comfortable for daily wear and outings.', { newA: true }),
  p('grey-triple-strap-sandals', 'Grey Triple-Strap Sandals', SA, 2999, 2599, MEN, ['Grey'], ['own:WhatsApp Image 2026-10-31 at 9.09.19 PM.jpeg'], 'Three wide straps for a secure fit, adjustable back strap and a soft, shock-absorbing sole.', { best: true }),
  p('navy-knit-slip-in-sneakers', 'Navy Knit Slip-In Sneakers', MS, 4299, 3599, MEN, ['Navy'], ['own:WhatsApp Image 2026-10-31 at 9.11.17 PM.jpeg'], 'Hands-free slip-in knit sneaker with a supportive heel and memory-foam insole. Just step in and go.', { newA: true, featured: true }),

  // ---------------------------------------------------------------- men's sneakers
  p('white-leather-trainers', 'White Leather Trainers', MS, 5499, 4499, MEN, ['White'], ['px:11324518', 'px:11324516', 'px:11324546'], 'Chunky white trainers with layered leather panels and contrast laces. A modern street look that goes with everything.', { best: true }),
  p('white-court-sneakers-red-stripe', 'White Court Sneakers – Red Stripe', MS, 3999, 3399, MEN, ['White'], ['px:39525839'], 'Clean white court sneaker with red and navy side stripes and a cushioned cupsole.'),
  p('grey-canvas-sneakers', 'Grey Canvas Sneakers', MS, 2499, 1999, MEN, ['Grey'], ['px:7916058'], 'Classic low-top canvas sneaker with a vulcanised rubber sole. Light, breathable and easy to wear.'),
  p('black-canvas-high-tops', 'Black Canvas High-Tops', MS, 2999, null, MEN, ['Black'], ['px:20547378'], 'Retro canvas high-tops with a padded collar and cream rubber sole.', { newA: true }),
  p('navy-leather-low-top-sneakers', 'Navy Leather Low-Top Sneakers', MS, 5999, 4999, MEN, ['Navy'], ['px:20755674'], 'Smooth navy leather upper on a crisp white sole. Smart-casual and comfortable.', { featured: true }),
  p('black-canvas-low-tops', 'Black Canvas Low-Tops', MS, 2299, null, MEN, ['Black'], ['px:19845610'], 'Everyday black canvas plimsolls with white toe cap and rubber sole.'),
  p('navy-suede-casual-sneakers', 'Navy Suede Casual Sneakers', MS, 4499, 3799, MEN, ['Navy'], ['px:8159359'], 'Soft navy suede lace-ups with a white sole – dressier than a trainer, comfier than a formal shoe.'),
  p('tan-suede-chukka-sneakers', 'Tan Suede Chukka Sneakers', MS, 4999, null, MEN, ['Tan'], ['px:29999842'], 'Mid-height tan suede chukka with a padded collar and grippy sole.', { newA: true }),
  p('cream-retro-runners', 'Cream Retro Runners', MS, 4799, 3999, MEN, ['Cream'], ['px:13536939'], 'Retro-inspired runner with suede overlays and a ridged sole.'),

  // ---------------------------------------------------------------- sports shoes
  p('navy-mesh-running-shoes', 'Navy Mesh Running Shoes', SP, 3999, 3299, MEN, ['Navy'], ['px:17931134', 'px:17931250'], 'Breathable mesh runners with a lightweight foam sole for running, gym and long walks.', { best: true }),
  p('navy-gradient-sports-shoes', 'Navy Gradient Sports Shoes', SP, 4299, null, MEN, ['Navy'], ['px:29342147'], 'Bold gradient knit upper with a cushioned air-style sole.'),
  p('grey-knit-training-shoes', 'Grey Knit Training Shoes', SP, 3799, 2999, MEN, ['Grey'], ['px:5526492'], 'Sock-like knit upper with a supportive heel counter and flexible sole.', { best: true }),
  p('sky-blue-air-sole-runners', 'Sky Blue Air-Sole Runners', SP, 4499, 3799, MEN, ['Sky Blue'], ['px:29342144'], 'Eye-catching blue-to-white fade with visible air-cushion heel.'),
  p('white-knit-performance-runners', 'White Knit Performance Runners', SP, 4999, null, MEN, ['White'], ['px:23491456'], 'Featherweight engineered knit with a springy midsole for fast runs.', { newA: true }),
  p('mint-knit-running-shoes', 'Mint Knit Running Shoes', SP, 4299, 3599, MEN, ['Green'], ['px:9207813'], 'Breathable mint knit runners with reflective striping.'),
  p('black-green-road-runners', 'Black & Green Road Runners', SP, 4799, null, MEN, ['Black'], ['px:28375818'], 'Sleek black runners with a neon-green heel insert and responsive foam.'),
  p('grey-chunky-trainers', 'Grey Chunky Trainers', SP, 5499, 4699, MEN, ['Grey'], ['px:40071339', 'px:40071338'], 'Layered mesh-and-suede chunky trainer with yellow laces.', { featured: true }),
  p('orange-sole-chunky-trainers', 'Orange-Sole Chunky Trainers', SP, 5499, null, MEN, ['White'], ['px:40231615'], 'Statement chunky trainer with a bright orange sole and mesh upper.', { newA: true }),
  p('green-trail-runners', 'Green Trail Runners', SP, 5999, 4999, MEN, ['Green'], ['px:40054152', 'px:40054144', 'px:40054145'], 'Grippy green sole with breathable mesh – made for parks, tracks and trails.', { best: true }),
  p('white-red-cushion-runners', 'White & Red Cushion Runners', SP, 4599, null, MEN, ['White'], ['px:6540973'], 'Cushioned white runner with red heel accent and supportive cage.'),
  p('grey-everyday-trainers', 'Grey Everyday Trainers', SP, 3499, 2799, MEN, ['Grey'], ['px:19537610'], 'Comfortable all-round trainer for walking and light workouts.'),

  // ---------------------------------------------------------------- formal shoes
  p('black-cap-toe-oxfords', 'Black Cap-Toe Oxfords', FO, 6999, 5999, MEN, ['Black'], ['px:15557049'], 'Polished black cap-toe oxfords – the essential shoe for office, weddings and formal events.', { best: true }),
  p('black-wingtip-brogues', 'Black Wingtip Brogues', FO, 7499, 6499, MEN, ['Black'], ['px:15557047', 'px:15557045'], 'Classic black wingtips with full brogue detailing and leather lining.', { featured: true }),
  p('black-plain-toe-formal-shoes', 'Black Plain-Toe Formal Shoes', FO, 5999, null, MEN, ['Black'], ['px:37465528'], 'Sleek plain-toe formal shoe with a slim profile for suits and sherwanis.'),
  p('brown-wingtip-brogues', 'Brown Wingtip Brogues', FO, 7499, 6299, MEN, ['Brown'], ['px:4637874'], 'Rich brown brogues with wingtip toe and stitched sole.', { best: true }),
  p('tan-cap-toe-oxfords', 'Tan Cap-Toe Oxfords', FO, 6999, null, MEN, ['Tan'], ['px:6766308'], 'Warm tan leather oxfords with a clean cap toe.', { newA: true }),
  p('chestnut-longwing-brogues', 'Chestnut Longwing Brogues', FO, 7999, 6999, MEN, ['Brown'], ['px:6765524'], 'Hand-finished chestnut longwings with perforated detailing.'),
  p('brown-leather-derby-shoes', 'Brown Leather Derby Shoes', FO, 6499, 5499, MEN, ['Brown'], ['px:28387105'], 'Comfortable open-lace derby in smooth brown leather.'),
  p('dark-brown-wingtip-shoes', 'Dark Brown Wingtip Shoes', FO, 6799, null, MEN, ['Brown'], ['px:15059775'], 'Dark brown wingtips with a sturdy rubber sole for daily wear.'),
  p('tan-leather-derby-shoes', 'Tan Leather Derby Shoes', FO, 5999, 4999, MEN, ['Tan'], ['px:12210270'], 'Burnished tan derby shoes that go from office to evening.'),
  p('tan-textured-oxfords', 'Tan Textured Oxfords', FO, 6499, null, MEN, ['Tan'], ['px:26587826'], 'Tan oxfords with a subtle textured vamp and leather sole.'),
  p('black-formal-slip-ons', 'Black Formal Slip-Ons', FO, 5499, 4699, MEN, ['Black'], ['px:31844638'], 'Lace-free black formal slip-ons with elastic gussets for an easy fit.', { best: true }),
  p('black-cap-toe-lace-ups', 'Black Cap-Toe Lace-Ups', FO, 6299, null, MEN, ['Black'], ['us:1552422554-0d5af0c79fc6'], 'Glossy black cap-toe lace-ups with a slim silhouette.'),

  // ---------------------------------------------------------------- casual shoes & loafers
  p('black-apron-toe-slip-ons', 'Black Apron-Toe Slip-Ons', CA, 4999, null, MEN, ['Black'], ['px:34871894'], 'Glossy black slip-ons with apron toe and saddle detail.'),
  p('black-leather-loafers', 'Black Leather Loafers', LO, 5499, 4699, MEN, ['Black'], ['px:10259873'], 'Minimal black leather loafers with a cushioned insole.', { best: true }),
  p('tan-penny-loafers', 'Tan Penny Loafers', LO, 5999, 4999, MEN, ['Tan'], ['px:25381178'], 'Tan penny loafers on a lightweight white sole – smart and comfortable.', { featured: true }),
  p('black-tassel-loafers', 'Black Tassel Loafers', LO, 6499, null, MEN, ['Black'], ['px:7608463'], 'Polished black loafers with tassels and brogue trim.'),
  p('blue-suede-lace-ups', 'Blue Suede Lace-Ups', CA, 4499, 3799, MEN, ['Blue'], ['px:40539397'], 'Soft blue suede lace-ups with a contrast sole.', { newA: true }),
  p('sky-blue-suede-slip-ons', 'Sky Blue Suede Slip-Ons', CA, 3999, null, MEN, ['Sky Blue'], ['px:15059773'], 'Light suede slip-ons for relaxed summer days.'),
  p('rust-suede-tassel-drivers', 'Rust Suede Tassel Drivers', LO, 4999, 4299, MEN, ['Rust'], ['px:32776950'], 'Rust suede driving moccasins with tassels and grippy pebble sole.', { newA: true }),
  p('blue-suede-desert-boots', 'Blue Suede Desert Boots', CA, 5799, null, MEN, ['Blue'], ['px:7795373'], 'Ankle-height desert boots in blue suede with a crepe-style sole.'),
  p('olive-suede-loafers', 'Olive Suede Loafers', LO, 4799, 3999, MEN, ['Olive'], ['px:9003700'], 'Unlined olive suede loafers – soft, light and easy to slip on.'),
  p('brown-suede-moccasins', 'Brown Suede Moccasins', CA, 4299, null, MEN, ['Brown'], ['px:27256415'], 'Hand-stitched suede moccasins with a chunky comfort sole.'),
  p('tan-driving-loafers', 'Tan Driving Loafers', LO, 4599, 3899, MEN, ['Tan'], ['us:1662541089338-c7d53b88be70'], 'Tan leather drivers with metal bit detail and flexible sole.'),
  p('brown-penny-loafers', 'Brown Penny Loafers', LO, 5799, null, MEN, ['Brown'], ['us:1777987601447-266e128de448'], 'Classic brown penny loafers with a stacked heel.'),
  p('brown-double-monk-straps', 'Brown Double Monk Straps', LO, 6999, 5999, MEN, ['Brown'], ['us:1533867617858-e7b97e060509'], 'Statement double monk straps in rich brown leather.'),

  // ---------------------------------------------------------------- men's sandals & chappals
  p('black-strap-leather-sandals', 'Black Strap Leather Sandals', SA, 3499, 2999, MEN, ['Black'], ['px:31129841'], 'Two-strap black leather sandals with an adjustable buckle back strap.'),
  p('olive-toe-loop-leather-sandals', 'Olive Toe-Loop Leather Sandals', SA, 3299, null, MEN, ['Olive', 'Brown'], ['px:26925248', 'px:26925256'], 'Handmade leather toe-loop sandals with a crossover strap and stitched sole.', { featured: true }),
  p('black-back-strap-sandals', 'Black Back-Strap Sandals', SA, 3299, 2799, MEN, ['Black'], ['px:26965812'], 'Wide-front leather sandals with a secure buckled back strap.'),
  p('black-cushion-slides', 'Black Cushion Slides', SA, 1499, 1199, MEN, ['Black'], ['px:18186215'], 'Ultra-soft one-piece slides with a chunky cushioned sole. Perfect for home and wudu.', { best: true }),
  p('brown-cushion-slides', 'Brown Cushion Slides', SA, 1499, null, MEN, ['Brown'], ['px:13698233'], 'Comfortable moulded slides in earthy brown.'),
  p('black-toe-ring-chappal', 'Black Toe-Ring Chappal', SA, 2499, 1999, MEN, ['Black'], ['us:1585120824848-8a5cd41493d2'], 'Classic leather chappal with toe ring and brown accent strap.', { best: true }),
  p('black-buckle-double-strap-sandals', 'Black Buckle Double-Strap Sandals', SA, 2999, null, MEN, ['Black'], ['us:1625318880107-49baad6765fd'], 'Two buckled straps on a contoured cork footbed.', { newA: true }),

  // ---------------------------------------------------------------- heels
  p('nude-pointed-pumps', 'Nude Pointed Pumps', HE, 4499, 3699, WOMEN, ['Nude'], ['px:9080069'], 'Versatile nude pumps with a slim heel that goes with every outfit.', { best: true, featured: true }),
  p('black-leather-pumps', 'Black Leather Pumps', HE, 4299, null, WOMEN, ['Black'], ['px:27204296'], 'Classic black pointed pumps with a cushioned insole.'),
  p('classic-black-stilettos', 'Classic Black Stilettos', HE, 4799, 3999, WOMEN, ['Black'], ['px:27204280', 'px:27204295'], 'Elegant 4-inch black stilettos for weddings, dawats and parties.', { best: true }),
  p('red-patent-stilettos', 'Red Patent Stilettos', HE, 4999, 4299, WOMEN, ['Red'], ['px:5713293', 'px:5713310'], 'Glossy red patent stilettos that make a statement.', { featured: true }),
  p('beige-pointed-heels', 'Beige Pointed Heels', HE, 4299, null, WOMEN, ['Beige'], ['px:18935118'], 'Soft beige heels with a pointed toe and slender heel.'),
  p('powder-blue-pumps', 'Powder Blue Pumps', HE, 4499, 3799, WOMEN, ['Sky Blue'], ['px:34294446'], 'Pretty powder-blue pumps – perfect for mehndi and summer events.', { newA: true }),
  p('purple-satin-heels', 'Purple Satin Heels', HE, 5299, null, WOMEN, ['Purple'], ['px:11845497'], 'Rich purple satin pumps for festive occasions.', { newA: true }),
  p('cream-classic-pumps', 'Cream Classic Pumps', HE, 4499, 3699, WOMEN, ['Cream'], ['us:1535043934128-cf0b28d52f95'], 'Timeless cream pumps with a comfortable mid-high heel.'),
  p('floral-print-stilettos', 'Floral Print Stilettos', HE, 4999, null, WOMEN, ['Multi'], ['us:1543163521-1bf539c55dd2'], 'Vibrant floral stilettos to brighten any outfit.'),
  p('black-pointed-court-heels', 'Black Pointed Court Heels', HE, 3999, 3299, WOMEN, ['Black'], ['us:1596703263926-eb0762ee17e4'], 'Sleek black court heels for office and evening.'),
  p('clear-pearl-heels', 'Clear Pearl Heels', HE, 5999, 4999, WOMEN, ['White'], ['us:1718312267162-df826f8ce45f'], 'Transparent heels with pearl detailing – made for brides and bridesmaids.', { featured: true }),
  p('black-ankle-strap-heels', 'Black Ankle-Strap Heels', HE, 4799, null, WOMEN, ['Black'], ['us:1789110519471-74ac17dd1cf6'], 'Strappy black patent heeled sandals with back zip.'),
  p('nude-bow-heeled-sandals', 'Nude Bow Heeled Sandals', HE, 4599, 3899, WOMEN, ['Nude'], ['us:1590099033615-be195f8d575c'], 'Delicate nude heeled sandals with a pearl bow.'),
  p('burgundy-patent-heels', 'Burgundy Patent Heels', HE, 4699, null, WOMEN, ['Maroon'], ['px:27113446'], 'Deep burgundy patent heels with a pointed toe.'),

  // ---------------------------------------------------------------- women's sandals & flats
  p('white-block-heel-mules', 'White Block-Heel Mules', WS, 3999, 3299, WOMEN, ['White'], ['px:27046150'], 'Two-strap mules on a stacked block heel – easy to walk in all day.', { best: true }),
  p('sky-blue-flat-slides', 'Sky Blue Flat Slides', WS, 2499, null, WOMEN, ['Sky Blue'], ['px:9267585'], 'Simple wide-strap flat slides with a padded footbed.'),
  p('leopard-studded-sandals', 'Leopard Studded Sandals', WS, 3799, 3199, WOMEN, ['Brown'], ['px:31450994'], 'Leopard-print strap sandals with gold studs and buckle.', { newA: true }),
  p('pink-leather-mules', 'Pink Leather Mules', WS, 3299, null, WOMEN, ['Pink'], ['px:27204307'], 'Soft pink leather mules with a low heel.', { featured: true }),
  p('red-cross-strap-platforms', 'Red Cross-Strap Platforms', WS, 3999, 3399, WOMEN, ['Red'], ['px:27174531'], 'Crossed red straps on a lightweight platform sole.'),
  p('two-tone-block-heel-sandals', 'Two-Tone Block-Heel Sandals', WS, 3699, null, WOMEN, ['White', 'Black'], ['px:26796156'], 'Open-toe block-heel sandals in black or white.'),
  p('black-strappy-flat-sandals', 'Black Strappy Flat Sandals', WS, 2999, 2499, WOMEN, ['Black'], ['px:31129840'], 'Minimal black strappy sandals with a buckled ankle strap.', { best: true }),
  p('metallic-slide-sandals', 'Metallic Slide Sandals', WS, 2799, null, WOMEN, ['Silver'], ['px:27204297'], 'Shimmering metallic slides with a low stacked heel.'),
  p('tan-cross-strap-ballet-flats', 'Tan Cross-Strap Ballet Flats', WF, 2999, 2499, WOMEN, ['Tan'], ['px:37853534'], 'Soft tan ballet flats with elastic cross straps.', { newA: true }),
  p('silver-sparkle-flats', 'Silver Sparkle Flats', WF, 2799, null, WOMEN, ['Silver'], ['px:10743774'], 'Glittering silver flats for parties and festive days.'),
  p('blue-bow-ballet-flats', 'Blue Bow Ballet Flats', WF, 2499, 1999, WOMEN, ['Blue'], ['px:12043898'], 'Comfortable blue ballet flats with a dainty bow.'),
  p('pink-mary-jane-flats', 'Pink Mary Jane Flats', WF, 2699, null, WOMEN, ['Pink'], ['px:34334686'], 'Glossy pink Mary Janes with a buckled strap.'),
  p('black-white-wedge-sandals', 'Black & White Wedge Sandals', WS, 4299, 3599, WOMEN, ['Black', 'Beige'], ['px:27046121'], 'Ankle-strap wedge sandals with a comfy platform.'),
  p('maroon-platform-sandals', 'Maroon Platform Sandals', WS, 3499, 2999, WOMEN, ['Maroon'], ['us:1562273138-f46be4ebdf33'], 'Cross-strap maroon sandals on a light wooden-look platform.', { best: true }),
  p('golden-kolhapuri-chappals', 'Golden Kolhapuri Chappals', WS, 2299, 1899, WOMEN, ['Mustard'], ['us:1777979925976-723230e37453'], 'Handcrafted toe-ring chappals with woven golden straps.', { featured: true }),

  // ---------------------------------------------------------------- women's sneakers
  p('maroon-butterfly-knit-sneakers', 'Maroon Butterfly Knit Sneakers', WN, 3499, 2899, WOMEN, ['Maroon'], ['px:29699304'], 'Slip-on knit sneakers with embroidered butterfly detail.', { newA: true }),
  p('white-teal-sports-sneakers', 'White & Teal Sports Sneakers', WN, 3799, null, WOMEN, ['White'], ['px:24702077'], 'Lightweight mesh sneakers with teal accents for walks and gym.'),
  p('retro-suede-trainers', 'Retro Suede Trainers', WN, 4299, 3599, WOMEN, ['Maroon', 'Olive'], ['px:31451018'], 'Retro suede trainers on a gum sole in two colours.', { featured: true }),
  p('pink-knit-slip-on-sneakers', 'Pink Knit Slip-On Sneakers', WN, 3299, 2799, WOMEN, ['Pink'], ['px:38154585', 'px:38154586', 'px:38154577'], 'Soft pink knit slip-ons with a cushioned wave sole.', { best: true }),
  p('blue-leather-sneakers', 'Blue Leather Sneakers', WN, 3999, null, WOMEN, ['Blue'], ['px:27113469'], 'Denim-blue leather lace-ups with a white sole.'),
  p('cream-platform-sneakers', 'Cream Platform Sneakers', WN, 4199, 3499, WOMEN, ['Cream'], ['px:27516982'], 'Perforated cream sneakers with mustard laces and a platform sole.'),
  p('beige-lace-up-sneakers', 'Beige Lace-Up Sneakers', WN, 3499, null, WOMEN, ['Beige'], ['px:8669225'], 'Everyday beige sneakers that go with any outfit.'),
  p('black-leather-platform-sneakers', 'Black Leather Platform Sneakers', WN, 4299, 3699, WOMEN, ['Black'], ['px:27008320'], 'Sleek black leather sneakers on a chunky white sole.'),
  p('silver-metallic-sneakers', 'Silver Metallic Sneakers', WN, 4499, null, WOMEN, ['Silver'], ['px:26954377'], 'Shiny silver lace-ups for a fun, modern look.', { newA: true }),
  p('silver-low-top-sneakers', 'Silver Low-Top Sneakers', WN, 3999, 3299, WOMEN, ['Silver'], ['px:27988923'], 'Clean silver low-tops with a cushioned sole.'),
  p('grey-pink-stripe-slip-ons', 'Grey Pink-Stripe Slip-Ons', WN, 2999, 2499, WOMEN, ['Grey'], ['px:27385022'], 'Lightweight grey slip-ons with pink stripes.'),

  // ---------------------------------------------------------------- kids
  p('brown-leather-baby-shoes', 'Brown Leather Baby Shoes', KI, 1999, 1599, KIDS, ['Brown'], ['px:13822967'], 'Soft brown leather lace-ups for first steps.', { best: true }),
  p('brown-suede-kids-sneakers', 'Brown Suede Kids Sneakers', KI, 2499, null, KIDS, ['Brown'], ['px:30395128'], 'Durable suede sneakers with bright red laces.'),
  p('black-bow-mary-janes', 'Black Bow Mary Janes', KI, 2299, 1899, KIDS, ['Black'], ['px:39256094'], 'Party-ready black Mary Janes with a big bow and strap.', { featured: true }),
  p('pink-heart-baby-shoes', 'Pink Heart Baby Shoes', KI, 1299, null, KIDS, ['Pink'], ['px:792797'], 'Cute pink baby shoes with heart print.'),
  p('teal-floral-baby-sneakers', 'Teal Floral Baby Sneakers', KI, 1499, 1199, KIDS, ['Teal'], ['px:15844906'], 'Soft-sole floral sneakers for crawlers and toddlers.', { newA: true }),
  p('white-bow-baby-shoes', 'White Bow Baby Shoes', KI, 1599, null, KIDS, ['White'], ['px:35119986'], 'White buckle shoes with bows – perfect for special occasions.'),
  p('white-lace-up-baby-shoes', 'White Lace-Up Baby Shoes', KI, 1399, null, KIDS, ['White'], ['px:22484668'], 'Classic white lace-ups with a soft, flexible sole.'),
  p('pink-bow-baby-shoes', 'Pink Bow Baby Shoes', KI, 1499, 1199, KIDS, ['Pink'], ['px:32161391'], 'Pastel pink shoes with sparkly bows and velcro strap.', { best: true }),
  p('knitted-baby-booties', 'Knitted Baby Booties', KI, 999, null, KIDS, ['Purple'], ['px:12426614'], 'Warm hand-knitted booties for newborns.'),
  p('tan-baby-high-tops', 'Tan Baby High-Tops', KI, 1799, 1499, KIDS, ['Tan'], ['px:15668369'], 'Mini high-top sneakers with a padded collar.'),
  p('white-soft-sole-baby-shoes', 'White Soft-Sole Baby Shoes', KI, 1199, null, KIDS, ['White'], ['px:19763375'], 'Lightweight white shoes with a non-slip soft sole.'),
  p('teal-velcro-kids-sneakers', 'Teal Velcro Kids Sneakers', KI, 1999, 1699, KIDS, ['Teal'], ['us:1678192568478-9488ee55def6'], 'Easy velcro sneakers in a cheerful teal print.'),
  p('pink-suede-kids-sneakers', 'Pink Suede Kids Sneakers', KI, 2799, 2299, KIDS, ['Pink'], ['us:1742390671609-9811019fe538'], 'Pink suede high-tops with metallic stripes.', { featured: true, newA: true }),
];

// Homepage banners. image = [source, local file under public/imgs/banners/]
export const BANNERS = [
  { placement: 'hero', badge: 'PunjabShop', title: 'Step Into', highlight: 'Style', subtitle: 'Discover Your Perfect Pair', description: 'Trendy Shoes • Premium Quality • Unbeatable Prices', offer_text: 'Up To', offer_highlight: '50% OFF', button_text: 'Shop Now', button_link: '/shop', photo: 'px:20755674', file: 'hero-sneakers', theme: 'light', sort: 1 },
  { placement: 'hero', badge: 'For Her', title: 'Elegant', highlight: 'Heels', subtitle: 'Made for Every Occasion', description: 'Stilettos • Pumps • Party Wear', offer_text: 'Starting', offer_highlight: 'Rs. 3,299', button_text: 'Shop Heels', button_link: '/category/women-heels', photo: 'px:27204280', file: 'hero-heels', theme: 'light', sort: 2 },
  { placement: 'hero', badge: 'Formal Edit', title: 'Crafted in', highlight: 'Leather', subtitle: 'Classic Shoes for Every Occasion', description: 'Oxfords • Brogues • Loafers', offer_text: 'Save', offer_highlight: '20% OFF', button_text: 'Shop Formal', button_link: '/category/men-formal-shoes', photo: 'px:15557049', file: 'hero-formal', theme: 'light', sort: 3 },
  { placement: 'promo', title: 'Flat', highlight: '50% OFF', subtitle: 'On Selected Shoes', button_text: 'Shop Sale', button_link: '/sale', photo: 'px:23491456', file: 'promo-sale', theme: 'dark', sort: 1 },
  { placement: 'promo', title: 'Trendy Styles for Everyone', subtitle: 'Step Up Your Fashion Game', button_text: 'Shop Women', button_link: '/category/women', photo: 'px:27204307', file: 'promo-women', theme: 'light', sort: 2 },
];

export const CATEGORY_OF = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));

/** Folder under public/imgs/ for a product (its most specific category). */
export function imageFolder(product) {
  return product.cats.find((c) => CATEGORY_OF[c]?.parent) || product.cats[0];
}

/** Local public paths for a product's photos. */
export function productImagePaths(product) {
  return product.photos.map((_, i) => `/imgs/${imageFolder(product)}/${product.slug}-${i + 1}.jpg`);
}
