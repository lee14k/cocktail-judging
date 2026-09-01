// Demo content for trying the prototype before real entries arrive.
// Everything here is fictional. Photos are generated SVG illustrations so the
// demo has no external image dependencies; real entries use uploaded photos.

export const DEFAULT_REGIONS = [
  'Northeast',
  'Southeast',
  'Midwest',
  'Southwest',
  'Mountain West',
  'Pacific',
]

export const SEED_ENTRIES = [
  {
    key: 'smoke-on-the-marsh',
    drinkName: 'Smoke on the Marsh',
    region: 'Southeast',
    ingredients: ['1.5 oz mezcal', '0.75 oz Ancho Reyes', '0.75 oz lime juice', '0.5 oz agave syrup', '3 drops saline solution'],
    method: 'Shake all ingredients hard with ice. Double strain into a chilled coupe. Garnish with a dehydrated lime wheel.',
    inspiration: 'A margarita that walked through a campfire on the way to the beach. The saline keeps the smoke from taking over.',
    entrantName: 'Dani Okafor', bar: 'Low Tide', city: 'Charleston, SC', email: 'dani@example.com',
    art: { glass: 'coupe', liquid: '#C98A3A', bg: '#22150F', garnish: '#7CB86A' },
  },
  {
    key: 'velvet-hour',
    drinkName: 'Velvet Hour',
    region: 'Southeast',
    ingredients: ['1.5 oz cognac', '0.5 oz Bénédictine', '0.5 oz Pedro Ximénez sherry', '2 dashes black walnut bitters', 'Lemon oil'],
    method: 'Stir with ice until well chilled. Strain over a large clear cube in a rocks glass. Express lemon peel and discard.',
    inspiration: 'Built for the slow hour after the dinner rush, when the room finally settles.',
    entrantName: 'Amara Johnson', bar: 'The Velvet Room', city: 'Atlanta, GA', email: 'amara@example.com',
    art: { glass: 'rocks', liquid: '#6B2E1E', bg: '#17110F', garnish: '#E3B23C' },
  },
  {
    key: 'tidewater',
    drinkName: 'Tidewater',
    region: 'Southeast',
    ingredients: ['1 oz Jamaican rum', '1 oz aged Barbados rum', '1 oz coconut cream', '1 oz pineapple juice', '0.75 oz lime juice', '2 dashes Angostura bitters'],
    method: 'Whip shake with a few pebbles of ice, pour into a highball and top with crushed ice. Garnish with a pineapple frond and grated nutmeg.',
    inspiration: 'Low-country tiki: the flavors of a coastal boil pushed through a Trader Vic lens.',
    entrantName: 'Yara Santos', bar: 'Salt Marsh', city: 'Savannah, GA', email: 'yara@example.com',
    art: { glass: 'highball', liquid: '#E8D48A', bg: '#132A2E', garnish: '#5E9E4A' },
  },
  {
    key: 'harbor-fog',
    drinkName: 'Harbor Fog',
    region: 'Northeast',
    ingredients: ['2 oz vodka', '0.75 oz Cocchi Americano', '0.5 oz cucumber juice', '0.25 oz lemon juice', 'Dill sprig'],
    method: 'Shake gently with ice, fine strain into a chilled coupe. Float a single dill frond.',
    inspiration: 'The morning marine layer over the harbor, cold and green and a little salty.',
    entrantName: 'Sinead Walsh', bar: 'Bell Street Social', city: 'Boston, MA', email: 'sinead@example.com',
    art: { glass: 'coupe', liquid: '#B9D9A8', bg: '#1A2A2E', garnish: '#3E7A46' },
  },
  {
    key: 'cold-brew-negroni',
    drinkName: 'Cold Brew Negroni',
    region: 'Northeast',
    ingredients: ['1 oz London dry gin', '1 oz Campari', '1 oz cold-brew-infused sweet vermouth', 'Orange peel'],
    method: 'Build in a rocks glass over a large cube, stir 20 rotations. Express orange peel over the top.',
    inspiration: 'Our house vermouth spends 12 hours with coarse-ground Ethiopian coffee. It turns the Negroni from bitter to bittersweet.',
    entrantName: 'Owen Park', bar: 'Quarry', city: 'Brooklyn, NY', email: 'owen@example.com',
    art: { glass: 'rocks', liquid: '#9A2B2B', bg: '#1C1214', garnish: '#E8863A' },
  },
  {
    key: 'ironwood',
    drinkName: 'Ironwood',
    region: 'Northeast',
    ingredients: ['1.5 oz blended Scotch', '0.75 oz Amaro Nonino', '0.5 oz fig syrup', '0.5 oz lemon juice', 'Rosemary sprig'],
    method: 'Shake with ice, strain over fresh ice in a rocks glass. Garnish with a lightly torched rosemary sprig.',
    inspiration: 'Late autumn in Maine: woodsmoke, dried fruit, and the last of the lemons.',
    entrantName: 'Fiona Grant', bar: 'The Ironwood', city: 'Portland, ME', email: 'fiona@example.com',
    art: { glass: 'rocks', liquid: '#7A4A24', bg: '#151A17', garnish: '#4F7A3B' },
  },
  {
    key: 'lakewind',
    drinkName: 'Lakewind',
    region: 'Midwest',
    ingredients: ['1.5 oz gin', '0.75 oz tart cherry shrub', '0.25 oz lemon juice', '3 oz tonic water', 'Thyme sprig'],
    method: 'Build in a highball over ice, top with tonic, stir once. Garnish with thyme and a skewered cherry.',
    inspiration: 'Northern Michigan cherries, picked in July and turned into a shrub that holds the season through winter.',
    entrantName: 'Priya Nair', bar: 'Northern Lights Tavern', city: 'Traverse City, MI', email: 'priya@example.com',
    art: { glass: 'highball', liquid: '#E39AA6', bg: '#1E2530', garnish: '#B0243A' },
  },
  {
    key: 'prairie-fire',
    drinkName: 'Prairie Fire',
    region: 'Midwest',
    ingredients: ['2 oz bourbon', '0.75 oz chile-infused honey', '0.5 oz grapefruit juice', '0.25 oz lemon juice', 'Smoked salt rim'],
    method: 'Shake with ice. Strain over a large cube into a rocks glass with a half smoked-salt rim. Garnish with a grapefruit twist.',
    inspiration: 'A hot summer wind across the prairie. Sweet, then heat, then a cool drink of grapefruit.',
    entrantName: 'Tom Lindqvist', bar: 'Grain & Gauge', city: 'Minneapolis, MN', email: 'tom@example.com',
    art: { glass: 'rocks', liquid: '#E07A2E', bg: '#1B1712', garnish: '#F5C8A0' },
  },
  {
    key: 'cellar-door',
    drinkName: 'Cellar Door',
    region: 'Midwest',
    ingredients: ['1.5 oz apple brandy', '0.5 oz amontillado sherry', '0.5 oz cinnamon syrup', '0.5 oz lemon juice', '1 oz dry cider'],
    method: 'Shake the first four ingredients, strain over ice in a rocks glass, top with cider. Garnish with an apple fan.',
    inspiration: 'What the root cellar smells like in October.',
    entrantName: 'Hannah Keller', bar: 'Threshold', city: 'Chicago, IL', email: 'hannah@example.com',
    art: { glass: 'rocks', liquid: '#C48A3C', bg: '#141C1A', garnish: '#9E3B3B' },
  },
  {
    key: 'saguaro-sour',
    drinkName: 'Saguaro Sour',
    region: 'Southwest',
    ingredients: ['2 oz sotol', '0.75 oz prickly pear syrup', '0.75 oz lime juice', '0.5 oz orgeat', '1 egg white'],
    method: 'Dry shake, then shake with ice. Double strain into a chilled coupe. Garnish with a line of chile-lime salt across the foam.',
    inspiration: 'Prickly pear fruit turns the whole drink magenta. Sotol brings the desert underneath it.',
    entrantName: 'Luis Herrera', bar: 'Copper Cactus', city: 'Tucson, AZ', email: 'luis@example.com',
    art: { glass: 'coupe', liquid: '#C43A7A', bg: '#1C1420', garnish: '#F0E3C3' },
  },
  {
    key: 'marigold',
    drinkName: 'Marigold',
    region: 'Southwest',
    ingredients: ['2 oz pisco', '1 oz passion fruit purée', '0.75 oz lime juice', '0.5 oz saffron syrup', '1 egg white', 'Angostura bitters'],
    method: 'Dry shake, shake with ice, double strain into a coupe. Dot the foam with bitters and drag a toothpick through to draw petals.',
    inspiration: 'Marigolds on the ofrenda. Saffron and passion fruit give it the same color.',
    entrantName: 'Camila Torres', bar: 'El Jardín', city: 'Santa Fe, NM', email: 'camila@example.com',
    art: { glass: 'coupe', liquid: '#E8A23B', bg: '#1E1A14', garnish: '#B23A2E' },
  },
  {
    key: 'dust-devil',
    drinkName: 'Dust Devil',
    region: 'Southwest',
    ingredients: ['1.5 oz reposado tequila', '0.5 oz Ancho Reyes', '0.75 oz tamarind syrup', '0.75 oz lime juice', 'Tajín rim'],
    method: 'Shake with ice, strain over fresh ice into a Tajín-rimmed rocks glass. Garnish with a dehydrated orange wheel.',
    inspiration: 'The tamarind candies from the corner store, grown up.',
    entrantName: 'Rafael Ochoa', bar: 'La Ventana', city: 'Austin, TX', email: 'rafael@example.com',
    art: { glass: 'rocks', liquid: '#8C4A1E', bg: '#1A1512', garnish: '#E8863A' },
  },
  {
    key: 'copper-ridge',
    drinkName: 'Copper Ridge',
    region: 'Mountain West',
    ingredients: ['2 oz rye whiskey', '0.75 oz Cynar', '0.25 oz maple syrup', '2 dashes walnut bitters', 'Orange peel'],
    method: 'Stir with ice for 30 seconds. Strain over a large cube in a rocks glass. Express and drop the orange peel.',
    inspiration: 'An old fashioned with the bitterness of high-altitude timber.',
    entrantName: 'Marcus Bell', bar: 'The Assay Office', city: 'Boulder, CO', email: 'marcus@example.com',
    art: { glass: 'rocks', liquid: '#A85A22', bg: '#141816', garnish: '#E8863A' },
  },
  {
    key: 'snowline',
    drinkName: 'Snowline',
    region: 'Mountain West',
    ingredients: ['1.5 oz aquavit', '0.5 oz pear brandy', '0.75 oz lemon juice', '0.5 oz honey syrup', '2 cardamom pods, cracked'],
    method: 'Shake with ice and the cardamom pods. Fine strain into a chilled coupe. Garnish with a thin pear slice.',
    inspiration: 'Skiing at dawn: cold air, spice, and the sweetness that shows up once you stop moving.',
    entrantName: 'Jonas Berg', bar: 'Fjell', city: 'Salt Lake City, UT', email: 'jonas@example.com',
    art: { glass: 'coupe', liquid: '#EFE3A6', bg: '#1A2230', garnish: '#B8C99A' },
  },
  {
    key: 'alpenglow',
    drinkName: 'Alpenglow',
    region: 'Mountain West',
    ingredients: ['1.5 oz gin', '0.75 oz génépy', '0.75 oz lemon juice', '0.5 oz honey syrup', 'Grapefruit oil'],
    method: 'Shake with ice, double strain into a coupe. Express grapefruit peel over the top and discard.',
    inspiration: 'Alpine herbs and the pink light on the peaks at the end of the day.',
    entrantName: 'Nate Whitfield', bar: 'Basecamp', city: 'Denver, CO', email: 'nate@example.com',
    art: { glass: 'coupe', liquid: '#F1C4B3', bg: '#1F1B26', garnish: '#7FA36B' },
  },
  {
    key: 'paper-lantern',
    drinkName: 'Paper Lantern',
    region: 'Pacific',
    ingredients: ['1.5 oz Japanese whisky', '0.75 oz yuzu juice', '0.5 oz honey syrup', '0.5 oz cold-brewed sencha', '1 egg white'],
    method: 'Dry shake, then shake with ice. Double strain into a chilled coupe. Garnish with a thin yuzu peel.',
    inspiration: 'A whisky sour that has been to Kyoto and come back quieter.',
    entrantName: 'Kenji Morita', bar: 'Ember & Ash', city: 'Seattle, WA', email: 'kenji@example.com',
    art: { glass: 'coupe', liquid: '#EBD27A', bg: '#141A1E', garnish: '#E2C044' },
  },
  {
    key: 'highline',
    drinkName: 'Highline',
    region: 'Pacific',
    ingredients: ['1.5 oz blanco tequila', '0.5 oz green Chartreuse', '0.5 oz celery juice', '0.5 oz lime juice', '3 oz soda water'],
    method: 'Shake the first four ingredients briefly, strain into a highball over ice, top with soda. Garnish with a celery ribbon.',
    inspiration: 'A savory highball for the end of a long shift.',
    entrantName: 'Elena Ruiz', bar: 'Persimmon', city: 'Portland, OR', email: 'elena@example.com',
    art: { glass: 'highball', liquid: '#C7DE8A', bg: '#16221C', garnish: '#7FB35B' },
  },
  {
    key: 'foghorn-fizz',
    drinkName: 'Foghorn Fizz',
    region: 'Pacific',
    ingredients: ['2 oz London dry gin', '0.75 oz Meyer lemon juice', '0.5 oz fennel honey syrup', '1 egg white', '2 oz soda water'],
    method: 'Dry shake, shake with ice, strain into a chilled highball without ice. Top slowly with soda so the foam rises. Garnish with fennel fronds.',
    inspiration: 'A Ramos-style fizz built around the Meyer lemons growing in every backyard in the Sunset.',
    entrantName: 'Grace Liu', bar: 'Foghorn', city: 'San Francisco, CA', email: 'grace@example.com',
    art: { glass: 'highball', liquid: '#F3E7B8', bg: '#1B1F26', garnish: '#8FBF6A' },
  },
]

// Renders an 800x1000 illustration of a glass with the drink's color.
export function glassSvg({ glass, liquid, bg, garnish }) {
  const common = `
  <defs>
    <radialGradient id="glow" cx="50%" cy="38%" r="55%">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.16"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="liq" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${liquid}" stop-opacity="0.95"/>
      <stop offset="1" stop-color="${liquid}" stop-opacity="0.75"/>
    </linearGradient>
  </defs>
  <rect width="800" height="1000" fill="${bg}"/>
  <rect width="800" height="1000" fill="url(#glow)"/>
  <ellipse cx="400" cy="742" rx="230" ry="26" fill="#000" opacity="0.35"/>`

  const glassStroke = 'stroke="#ffffff" stroke-opacity="0.75" stroke-width="6" stroke-linejoin="round"'
  const glassFill = 'fill="#ffffff" fill-opacity="0.06"'

  let body = ''
  if (glass === 'coupe') {
    body = `
  <clipPath id="bowl"><path d="M190,360 C190,530 610,530 610,360 Z"/></clipPath>
  <rect x="150" y="395" width="500" height="200" fill="url(#liq)" clip-path="url(#bowl)"/>
  <ellipse cx="400" cy="395" rx="197" ry="14" fill="#ffffff" opacity="0.25"/>
  <path d="M190,360 C190,530 610,530 610,360 Z" ${glassFill} ${glassStroke}/>
  <rect x="393" y="482" width="14" height="210" rx="7" fill="#ffffff" fill-opacity="0.55"/>
  <ellipse cx="400" cy="695" rx="130" ry="16" ${glassFill} ${glassStroke}/>
  <circle cx="575" cy="352" r="46" fill="${garnish}" stroke="#ffffff" stroke-opacity="0.8" stroke-width="5"/>
  <circle cx="575" cy="352" r="30" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="3"/>`
  } else if (glass === 'rocks') {
    body = `
  <clipPath id="tumbler"><path d="M240,380 L560,380 L540,720 L260,720 Z"/></clipPath>
  <rect x="200" y="450" width="400" height="300" fill="url(#liq)" clip-path="url(#tumbler)"/>
  <g clip-path="url(#tumbler)" fill="#ffffff" fill-opacity="0.22" stroke="#ffffff" stroke-opacity="0.6" stroke-width="4">
    <rect x="300" y="470" width="120" height="120" rx="10" transform="rotate(-8 360 530)"/>
    <rect x="410" y="560" width="110" height="110" rx="10" transform="rotate(12 465 615)"/>
  </g>
  <path d="M240,380 L560,380 L540,720 L260,720 Z" ${glassFill} ${glassStroke}/>
  <path d="M560,380 C640,420 620,520 560,560" fill="none" stroke="${garnish}" stroke-width="16" stroke-linecap="round"/>`
  } else {
    body = `
  <clipPath id="tall"><path d="M300,280 L500,280 L488,760 L312,760 Z"/></clipPath>
  <rect x="280" y="350" width="240" height="440" fill="url(#liq)" clip-path="url(#tall)"/>
  <g clip-path="url(#tall)" fill="#ffffff" fill-opacity="0.35">
    <circle cx="350" cy="700" r="6"/><circle cx="420" cy="640" r="9"/><circle cx="380" cy="540" r="5"/>
    <circle cx="455" cy="470" r="7"/><circle cx="335" cy="430" r="4"/><circle cx="410" cy="390" r="6"/>
  </g>
  <path d="M300,280 L500,280 L488,760 L312,760 Z" ${glassFill} ${glassStroke}/>
  <circle cx="500" cy="300" r="52" fill="${garnish}" stroke="#ffffff" stroke-opacity="0.8" stroke-width="5"/>
  <circle cx="500" cy="300" r="34" fill="none" stroke="#ffffff" stroke-opacity="0.5" stroke-width="3"/>`
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">${common}${body}
</svg>`
}

// Deterministic pseudo-random judging activity so the leaderboard has
// something to show. Judges 1-8 have favorites; judges 1-5 have submitted.
export function demoJudgeActivity(entryIds, judges, shortlistLimit) {
  let seed = 7
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
  const activity = {}
  judges.forEach((judge, index) => {
    if (index >= 8) return
    const shuffled = [...entryIds].sort(() => rand() - 0.5)
    // Bias toward the first few entries so a few clear leaders emerge.
    const favorites = shuffled.slice(0, 6 + Math.floor(rand() * 4))
    for (const id of entryIds.slice(0, 3)) {
      if (!favorites.includes(id) && rand() > 0.35) favorites.push(id)
    }
    const shortlist = favorites
      .slice()
      .sort((a, b) => entryIds.indexOf(a) - entryIds.indexOf(b) + (rand() - 0.5) * 6)
      .slice(0, shortlistLimit)
    const submitted = index < 5
    activity[judge.id] = {
      favorites,
      shortlist,
      submitted,
      submittedAt: submitted ? new Date(Date.now() - (8 - index) * 3600 * 1000).toISOString() : null,
    }
  })
  return activity
}
