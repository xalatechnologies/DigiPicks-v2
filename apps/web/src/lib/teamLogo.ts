/**
 * Team logo lookup.
 *
 * Synchronous, side-effect-free seam used by EventCard / FeaturedEventCard.
 * Falls back to colored initials when no URL is found.
 *
 * For now this is a hand-curated mapping using stable open URLs (Wikimedia
 * Commons SVGs for soccer / cricket; ESPN's public CDN for US leagues). The
 * intent is to swap this for a Convex `teamLogos` table populated by a
 * backend action that hits TheSportsDB
 * (https://www.thesportsdb.com/documentation) and caches results. Frontend
 * stays synchronous; no client-side network calls.
 */

/**
 * Normalize a team name for matching:
 *  - Lowercase + strip accents.
 *  - Remove common org suffixes ("FC", "AFC", "Club", "United" → keep base, etc.)
 *  - Collapse whitespace.
 */
function normalize(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[.()]/g, '')
    .replace(/\b(fc|afc|cf|sc|ac|club|the)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Try direct key, then substring match in either direction so "Manchester
 * United" matches "manchester united" and "FC Bayern München" matches "bayern".
 */
function lookup(table: Record<string, string>, name: string): string | undefined {
  const key = normalize(name);
  if (table[key]) return table[key];
  // Substring fallback — first key that's contained in the name (or vice versa).
  for (const k of Object.keys(table)) {
    if (key.includes(k) || k.includes(key)) return table[k];
  }
  return undefined;
}

const SOCCER: Record<string, string> = {
  // EPL
  arsenal: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
  liverpool: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
  chelsea: 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
  'man city':
    'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
  'manchester city':
    'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
  'man united':
    'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg',
  'manchester united':
    'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg',
  tottenham: 'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg',
  newcastle:
    'https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg',
  'aston villa':
    'https://upload.wikimedia.org/wikipedia/en/9/9a/Aston_Villa_FC_new_crest.svg',
  brighton:
    'https://upload.wikimedia.org/wikipedia/en/f/fd/Brighton_%26_Hove_Albion_logo.svg',
  // La Liga
  'real madrid':
    'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
  barcelona:
    'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
  'atletico madrid':
    'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2024_logo.svg',
  sevilla: 'https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg',
  // Bundesliga
  leverkusen:
    'https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg',
  dortmund:
    'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg',
  bayern:
    'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg',
};

const CRICKET: Record<string, string> = {
  'mumbai indians':
    'https://upload.wikimedia.org/wikipedia/en/c/cd/Mumbai_Indians_Logo.svg',
  'chennai super kings':
    'https://upload.wikimedia.org/wikipedia/en/2/2b/Chennai_Super_Kings_Logo.svg',
  'royal challengers':
    'https://upload.wikimedia.org/wikipedia/en/2/2a/Royal_Challengers_Bengaluru_Logo.svg',
  'royal challengers bengaluru':
    'https://upload.wikimedia.org/wikipedia/en/2/2a/Royal_Challengers_Bengaluru_Logo.svg',
  'kolkata knight riders':
    'https://upload.wikimedia.org/wikipedia/en/4/4c/Kolkata_Knight_Riders_Logo.svg',
  'delhi capitals':
    'https://upload.wikimedia.org/wikipedia/en/4/4d/Delhi_Capitals.svg',
  'rajasthan royals':
    'https://upload.wikimedia.org/wikipedia/en/6/60/Rajasthan_Royals_Logo.svg',
};

function mapEspn(
  league: 'nfl' | 'nba' | 'mlb' | 'nhl',
  pairs: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, abbr] of Object.entries(pairs)) {
    out[name] = `https://a.espncdn.com/i/teamlogos/${league}/500/${abbr}.png`;
  }
  return out;
}

const NFL = mapEspn('nfl', {
  cardinals: 'ari', falcons: 'atl', ravens: 'bal', bills: 'buf', panthers: 'car',
  bears: 'chi', bengals: 'cin', browns: 'cle', cowboys: 'dal', broncos: 'den',
  lions: 'det', packers: 'gb', texans: 'hou', colts: 'ind', jaguars: 'jax',
  chiefs: 'kc', raiders: 'lv', chargers: 'lac', rams: 'lar', dolphins: 'mia',
  vikings: 'min', patriots: 'ne', saints: 'no', giants: 'nyg', jets: 'nyj',
  eagles: 'phi', steelers: 'pit', '49ers': 'sf', seahawks: 'sea',
  buccaneers: 'tb', titans: 'ten', commanders: 'wsh',
});

const NBA = mapEspn('nba', {
  hawks: 'atl', celtics: 'bos', nets: 'bkn', hornets: 'cha', bulls: 'chi',
  cavaliers: 'cle', mavericks: 'dal', nuggets: 'den', pistons: 'det',
  warriors: 'gs', rockets: 'hou', pacers: 'ind', clippers: 'lac', lakers: 'lal',
  grizzlies: 'mem', heat: 'mia', bucks: 'mil', timberwolves: 'min',
  pelicans: 'no', knicks: 'ny', thunder: 'okc', magic: 'orl', '76ers': 'phi',
  suns: 'phx', 'trail blazers': 'por', kings: 'sac', spurs: 'sa', raptors: 'tor',
  jazz: 'utah', wizards: 'wsh',
});

const MLB = mapEspn('mlb', {
  diamondbacks: 'ari', braves: 'atl', orioles: 'bal', 'red sox': 'bos',
  cubs: 'chc', 'white sox': 'chw', reds: 'cin', guardians: 'cle', rockies: 'col',
  tigers: 'det', astros: 'hou', royals: 'kc', angels: 'laa', dodgers: 'lad',
  marlins: 'mia', brewers: 'mil', twins: 'min', mets: 'nym', yankees: 'nyy',
  athletics: 'oak', phillies: 'phi', pirates: 'pit', padres: 'sd', mariners: 'sea',
  giants: 'sf', cardinals: 'stl', rays: 'tb', rangers: 'tex', 'blue jays': 'tor',
  nationals: 'wsh',
});

const NHL = mapEspn('nhl', {
  ducks: 'ana', bruins: 'bos', sabres: 'buf', flames: 'cgy', hurricanes: 'car',
  blackhawks: 'chi', avalanche: 'col', 'blue jackets': 'cbj', stars: 'dal',
  'red wings': 'det', oilers: 'edm', panthers: 'fla', kings: 'la', wild: 'min',
  canadiens: 'mtl', predators: 'nsh', devils: 'nj', islanders: 'nyi',
  rangers: 'nyr', senators: 'ott', flyers: 'phi', penguins: 'pit', sharks: 'sj',
  kraken: 'sea', blues: 'stl', lightning: 'tb', 'maple leafs': 'tor',
  canucks: 'van', knights: 'vgk', capitals: 'wsh', jets: 'wpg',
});

/**
 * Returns a logo URL for the given sport + team, or `undefined` if unknown.
 * Tennis is intentionally not mapped — it's player-vs-player and falls back
 * to colored initials.
 */
export function teamLogo(sport: string, name: string): string | undefined {
  switch (sport.toLowerCase()) {
    case 'soccer':
      return lookup(SOCCER, name);
    case 'cricket':
      return lookup(CRICKET, name);
    case 'football':
      return lookup(NFL, name);
    case 'basketball':
      return lookup(NBA, name);
    case 'baseball':
      return lookup(MLB, name);
    case 'hockey':
    case 'ice hockey':
      return lookup(NHL, name);
    default:
      return undefined;
  }
}
