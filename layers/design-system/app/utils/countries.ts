import type { UiIcon } from '../shared/ui-icons'

// ISO 3166-1 alpha-3 to alpha-2 and country names
export const countryData: Record<string, { alpha2: string, name: string }> = {
  deu: { alpha2: 'de', name: 'Germany' },
  fra: { alpha2: 'fr', name: 'France' },
  ind: { alpha2: 'in', name: 'India' },
  usa: { alpha2: 'us', name: 'United States' },
  gbr: { alpha2: 'gb', name: 'United Kingdom' },
  nld: { alpha2: 'nl', name: 'Netherlands' },
  pol: { alpha2: 'pl', name: 'Poland' },
  rus: { alpha2: 'ru', name: 'Russia' },
  esp: { alpha2: 'es', name: 'Spain' },
  ita: { alpha2: 'it', name: 'Italy' },
  bra: { alpha2: 'br', name: 'Brazil' },
  can: { alpha2: 'ca', name: 'Canada' },
  aus: { alpha2: 'au', name: 'Australia' },
  jpn: { alpha2: 'jp', name: 'Japan' },
  chn: { alpha2: 'cn', name: 'China' },
  kor: { alpha2: 'kr', name: 'South Korea' },
  mex: { alpha2: 'mx', name: 'Mexico' },
  arg: { alpha2: 'ar', name: 'Argentina' },
  tur: { alpha2: 'tr', name: 'Turkey' },
  sau: { alpha2: 'sa', name: 'Saudi Arabia' },
  zaf: { alpha2: 'za', name: 'South Africa' },
  egy: { alpha2: 'eg', name: 'Egypt' },
  nga: { alpha2: 'ng', name: 'Nigeria' },
  ken: { alpha2: 'ke', name: 'Kenya' },
  idn: { alpha2: 'id', name: 'Indonesia' },
  tha: { alpha2: 'th', name: 'Thailand' },
  vnm: { alpha2: 'vn', name: 'Vietnam' },
  phl: { alpha2: 'ph', name: 'Philippines' },
  mys: { alpha2: 'my', name: 'Malaysia' },
  sgp: { alpha2: 'sg', name: 'Singapore' },
  pak: { alpha2: 'pk', name: 'Pakistan' },
  bgd: { alpha2: 'bd', name: 'Bangladesh' },
  ukr: { alpha2: 'ua', name: 'Ukraine' },
  rou: { alpha2: 'ro', name: 'Romania' },
  cze: { alpha2: 'cz', name: 'Czechia' },
  hun: { alpha2: 'hu', name: 'Hungary' },
  aut: { alpha2: 'at', name: 'Austria' },
  che: { alpha2: 'ch', name: 'Switzerland' },
  bel: { alpha2: 'be', name: 'Belgium' },
  swe: { alpha2: 'se', name: 'Sweden' },
  nor: { alpha2: 'no', name: 'Norway' },
  dnk: { alpha2: 'dk', name: 'Denmark' },
  fin: { alpha2: 'fi', name: 'Finland' },
  prt: { alpha2: 'pt', name: 'Portugal' },
  grc: { alpha2: 'gr', name: 'Greece' },
  irl: { alpha2: 'ie', name: 'Ireland' },
  nzl: { alpha2: 'nz', name: 'New Zealand' },
  isr: { alpha2: 'il', name: 'Israel' },
  are: { alpha2: 'ae', name: 'UAE' },
  col: { alpha2: 'co', name: 'Colombia' },
  chl: { alpha2: 'cl', name: 'Chile' },
  per: { alpha2: 'pe', name: 'Peru' },
  ven: { alpha2: 've', name: 'Venezuela' },
  irn: { alpha2: 'ir', name: 'Iran' },
  irq: { alpha2: 'iq', name: 'Iraq' },
  twn: { alpha2: 'tw', name: 'Taiwan' },
  hkg: { alpha2: 'hk', name: 'Hong Kong' },
  mac: { alpha2: 'mo', name: 'Macau' },
  svk: { alpha2: 'sk', name: 'Slovakia' },
  bgr: { alpha2: 'bg', name: 'Bulgaria' },
  hrv: { alpha2: 'hr', name: 'Croatia' },
  srb: { alpha2: 'rs', name: 'Serbia' },
  svn: { alpha2: 'si', name: 'Slovenia' },
  ltu: { alpha2: 'lt', name: 'Lithuania' },
  lva: { alpha2: 'lv', name: 'Latvia' },
  est: { alpha2: 'ee', name: 'Estonia' },
  blr: { alpha2: 'by', name: 'Belarus' },
  kaz: { alpha2: 'kz', name: 'Kazakhstan' },
  uzb: { alpha2: 'uz', name: 'Uzbekistan' },
  aze: { alpha2: 'az', name: 'Azerbaijan' },
  geo: { alpha2: 'ge', name: 'Georgia' },
  arm: { alpha2: 'am', name: 'Armenia' },
  // Remaining ISO 3166-1 countries + common GSC-reported territories. GSC emits
  // alpha-3 (lowercase) for every country, so an incomplete map left the long
  // tail rendering as raw codes (`lbn`, `isl`) with a globe instead of a flag.
  afg: { alpha2: 'af', name: 'Afghanistan' },
  alb: { alpha2: 'al', name: 'Albania' },
  dza: { alpha2: 'dz', name: 'Algeria' },
  and: { alpha2: 'ad', name: 'Andorra' },
  ago: { alpha2: 'ao', name: 'Angola' },
  atg: { alpha2: 'ag', name: 'Antigua and Barbuda' },
  bhs: { alpha2: 'bs', name: 'Bahamas' },
  bhr: { alpha2: 'bh', name: 'Bahrain' },
  brb: { alpha2: 'bb', name: 'Barbados' },
  ben: { alpha2: 'bj', name: 'Benin' },
  btn: { alpha2: 'bt', name: 'Bhutan' },
  bol: { alpha2: 'bo', name: 'Bolivia' },
  bih: { alpha2: 'ba', name: 'Bosnia and Herzegovina' },
  bwa: { alpha2: 'bw', name: 'Botswana' },
  brn: { alpha2: 'bn', name: 'Brunei' },
  bfa: { alpha2: 'bf', name: 'Burkina Faso' },
  bdi: { alpha2: 'bi', name: 'Burundi' },
  khm: { alpha2: 'kh', name: 'Cambodia' },
  cmr: { alpha2: 'cm', name: 'Cameroon' },
  cpv: { alpha2: 'cv', name: 'Cape Verde' },
  caf: { alpha2: 'cf', name: 'Central African Republic' },
  tcd: { alpha2: 'td', name: 'Chad' },
  com: { alpha2: 'km', name: 'Comoros' },
  cog: { alpha2: 'cg', name: 'Congo' },
  cod: { alpha2: 'cd', name: 'DR Congo' },
  cri: { alpha2: 'cr', name: 'Costa Rica' },
  civ: { alpha2: 'ci', name: 'Côte d\'Ivoire' },
  cub: { alpha2: 'cu', name: 'Cuba' },
  cyp: { alpha2: 'cy', name: 'Cyprus' },
  dji: { alpha2: 'dj', name: 'Djibouti' },
  dma: { alpha2: 'dm', name: 'Dominica' },
  dom: { alpha2: 'do', name: 'Dominican Republic' },
  ecu: { alpha2: 'ec', name: 'Ecuador' },
  slv: { alpha2: 'sv', name: 'El Salvador' },
  gnq: { alpha2: 'gq', name: 'Equatorial Guinea' },
  eri: { alpha2: 'er', name: 'Eritrea' },
  swz: { alpha2: 'sz', name: 'Eswatini' },
  eth: { alpha2: 'et', name: 'Ethiopia' },
  fji: { alpha2: 'fj', name: 'Fiji' },
  gab: { alpha2: 'ga', name: 'Gabon' },
  gmb: { alpha2: 'gm', name: 'Gambia' },
  gha: { alpha2: 'gh', name: 'Ghana' },
  gib: { alpha2: 'gi', name: 'Gibraltar' },
  grd: { alpha2: 'gd', name: 'Grenada' },
  gtm: { alpha2: 'gt', name: 'Guatemala' },
  gin: { alpha2: 'gn', name: 'Guinea' },
  gnb: { alpha2: 'gw', name: 'Guinea-Bissau' },
  guy: { alpha2: 'gy', name: 'Guyana' },
  hti: { alpha2: 'ht', name: 'Haiti' },
  hnd: { alpha2: 'hn', name: 'Honduras' },
  isl: { alpha2: 'is', name: 'Iceland' },
  jam: { alpha2: 'jm', name: 'Jamaica' },
  jor: { alpha2: 'jo', name: 'Jordan' },
  kwt: { alpha2: 'kw', name: 'Kuwait' },
  kgz: { alpha2: 'kg', name: 'Kyrgyzstan' },
  lao: { alpha2: 'la', name: 'Laos' },
  lbn: { alpha2: 'lb', name: 'Lebanon' },
  lso: { alpha2: 'ls', name: 'Lesotho' },
  lbr: { alpha2: 'lr', name: 'Liberia' },
  lby: { alpha2: 'ly', name: 'Libya' },
  lie: { alpha2: 'li', name: 'Liechtenstein' },
  lux: { alpha2: 'lu', name: 'Luxembourg' },
  mkd: { alpha2: 'mk', name: 'North Macedonia' },
  mdg: { alpha2: 'mg', name: 'Madagascar' },
  mwi: { alpha2: 'mw', name: 'Malawi' },
  mdv: { alpha2: 'mv', name: 'Maldives' },
  mli: { alpha2: 'ml', name: 'Mali' },
  mlt: { alpha2: 'mt', name: 'Malta' },
  mrt: { alpha2: 'mr', name: 'Mauritania' },
  mus: { alpha2: 'mu', name: 'Mauritius' },
  mda: { alpha2: 'md', name: 'Moldova' },
  mco: { alpha2: 'mc', name: 'Monaco' },
  mng: { alpha2: 'mn', name: 'Mongolia' },
  mne: { alpha2: 'me', name: 'Montenegro' },
  mar: { alpha2: 'ma', name: 'Morocco' },
  moz: { alpha2: 'mz', name: 'Mozambique' },
  mmr: { alpha2: 'mm', name: 'Myanmar' },
  nam: { alpha2: 'na', name: 'Namibia' },
  npl: { alpha2: 'np', name: 'Nepal' },
  nic: { alpha2: 'ni', name: 'Nicaragua' },
  ner: { alpha2: 'ne', name: 'Niger' },
  omn: { alpha2: 'om', name: 'Oman' },
  pan: { alpha2: 'pa', name: 'Panama' },
  png: { alpha2: 'pg', name: 'Papua New Guinea' },
  pry: { alpha2: 'py', name: 'Paraguay' },
  pse: { alpha2: 'ps', name: 'Palestine' },
  pri: { alpha2: 'pr', name: 'Puerto Rico' },
  qat: { alpha2: 'qa', name: 'Qatar' },
  rwa: { alpha2: 'rw', name: 'Rwanda' },
  kna: { alpha2: 'kn', name: 'Saint Kitts and Nevis' },
  lca: { alpha2: 'lc', name: 'Saint Lucia' },
  vct: { alpha2: 'vc', name: 'Saint Vincent and the Grenadines' },
  wsm: { alpha2: 'ws', name: 'Samoa' },
  smr: { alpha2: 'sm', name: 'San Marino' },
  stp: { alpha2: 'st', name: 'São Tomé and Príncipe' },
  sen: { alpha2: 'sn', name: 'Senegal' },
  syc: { alpha2: 'sc', name: 'Seychelles' },
  sle: { alpha2: 'sl', name: 'Sierra Leone' },
  slb: { alpha2: 'sb', name: 'Solomon Islands' },
  som: { alpha2: 'so', name: 'Somalia' },
  ssd: { alpha2: 'ss', name: 'South Sudan' },
  lka: { alpha2: 'lk', name: 'Sri Lanka' },
  sdn: { alpha2: 'sd', name: 'Sudan' },
  sur: { alpha2: 'sr', name: 'Suriname' },
  syr: { alpha2: 'sy', name: 'Syria' },
  tjk: { alpha2: 'tj', name: 'Tajikistan' },
  tza: { alpha2: 'tz', name: 'Tanzania' },
  tls: { alpha2: 'tl', name: 'Timor-Leste' },
  tgo: { alpha2: 'tg', name: 'Togo' },
  ton: { alpha2: 'to', name: 'Tonga' },
  tto: { alpha2: 'tt', name: 'Trinidad and Tobago' },
  tun: { alpha2: 'tn', name: 'Tunisia' },
  tkm: { alpha2: 'tm', name: 'Turkmenistan' },
  uga: { alpha2: 'ug', name: 'Uganda' },
  ury: { alpha2: 'uy', name: 'Uruguay' },
  vut: { alpha2: 'vu', name: 'Vanuatu' },
  yem: { alpha2: 'ye', name: 'Yemen' },
  zmb: { alpha2: 'zm', name: 'Zambia' },
  zwe: { alpha2: 'zw', name: 'Zimbabwe' },
  // Dependencies, overseas territories and the remaining sovereign states the
  // list above skipped. GSC reports on the full ISO 3166-1 set, so anything
  // absent here rendered as a raw id (`reu`, `blz`) beside a globe. `name` is
  // the offline fallback only — `getCountryName` prefers `Intl.DisplayNames`,
  // and these English strings were generated FROM that same CLDR data so the
  // two agree. Every alpha-2 below has a `i-circle-flags-*` glyph (checked
  // against @iconify-json/circle-flags).
  abw: { alpha2: 'aw', name: 'Aruba' },
  aia: { alpha2: 'ai', name: 'Anguilla' },
  ala: { alpha2: 'ax', name: 'Åland Islands' },
  asm: { alpha2: 'as', name: 'American Samoa' },
  ata: { alpha2: 'aq', name: 'Antarctica' },
  atf: { alpha2: 'tf', name: 'French Southern Territories' },
  bes: { alpha2: 'bq', name: 'Caribbean Netherlands' },
  blm: { alpha2: 'bl', name: 'St. Barthélemy' },
  blz: { alpha2: 'bz', name: 'Belize' },
  bmu: { alpha2: 'bm', name: 'Bermuda' },
  bvt: { alpha2: 'bv', name: 'Bouvet Island' },
  cck: { alpha2: 'cc', name: 'Cocos (Keeling) Islands' },
  cok: { alpha2: 'ck', name: 'Cook Islands' },
  cuw: { alpha2: 'cw', name: 'Curaçao' },
  cxr: { alpha2: 'cx', name: 'Christmas Island' },
  cym: { alpha2: 'ky', name: 'Cayman Islands' },
  esh: { alpha2: 'eh', name: 'Western Sahara' },
  flk: { alpha2: 'fk', name: 'Falkland Islands' },
  fro: { alpha2: 'fo', name: 'Faroe Islands' },
  fsm: { alpha2: 'fm', name: 'Micronesia' },
  ggy: { alpha2: 'gg', name: 'Guernsey' },
  glp: { alpha2: 'gp', name: 'Guadeloupe' },
  grl: { alpha2: 'gl', name: 'Greenland' },
  guf: { alpha2: 'gf', name: 'French Guiana' },
  gum: { alpha2: 'gu', name: 'Guam' },
  hmd: { alpha2: 'hm', name: 'Heard & McDonald Islands' },
  imn: { alpha2: 'im', name: 'Isle of Man' },
  iot: { alpha2: 'io', name: 'British Indian Ocean Territory' },
  jey: { alpha2: 'je', name: 'Jersey' },
  kir: { alpha2: 'ki', name: 'Kiribati' },
  maf: { alpha2: 'mf', name: 'St. Martin' },
  mhl: { alpha2: 'mh', name: 'Marshall Islands' },
  mnp: { alpha2: 'mp', name: 'Northern Mariana Islands' },
  msr: { alpha2: 'ms', name: 'Montserrat' },
  mtq: { alpha2: 'mq', name: 'Martinique' },
  myt: { alpha2: 'yt', name: 'Mayotte' },
  ncl: { alpha2: 'nc', name: 'New Caledonia' },
  nfk: { alpha2: 'nf', name: 'Norfolk Island' },
  niu: { alpha2: 'nu', name: 'Niue' },
  nru: { alpha2: 'nr', name: 'Nauru' },
  pcn: { alpha2: 'pn', name: 'Pitcairn Islands' },
  plw: { alpha2: 'pw', name: 'Palau' },
  prk: { alpha2: 'kp', name: 'North Korea' },
  pyf: { alpha2: 'pf', name: 'French Polynesia' },
  reu: { alpha2: 're', name: 'Réunion' },
  sgs: { alpha2: 'gs', name: 'South Georgia & South Sandwich Islands' },
  shn: { alpha2: 'sh', name: 'St. Helena' },
  sjm: { alpha2: 'sj', name: 'Svalbard & Jan Mayen' },
  spm: { alpha2: 'pm', name: 'St. Pierre & Miquelon' },
  sxm: { alpha2: 'sx', name: 'Sint Maarten' },
  tca: { alpha2: 'tc', name: 'Turks & Caicos Islands' },
  tkl: { alpha2: 'tk', name: 'Tokelau' },
  tuv: { alpha2: 'tv', name: 'Tuvalu' },
  umi: { alpha2: 'um', name: 'U.S. Outlying Islands' },
  vat: { alpha2: 'va', name: 'Vatican City' },
  vgb: { alpha2: 'vg', name: 'British Virgin Islands' },
  vir: { alpha2: 'vi', name: 'U.S. Virgin Islands' },
  wlf: { alpha2: 'wf', name: 'Wallis & Futuna' },
  // Kosovo has no ISO 3166-1 assignment; GSC emits the user-assigned `xkk`,
  // which resolves to the `xk` region CLDR and Iconify both carry. Kept to the
  // one spelling GSC actually sends — a second alias would render as a
  // duplicate "Kosovo" row in every dropdown built from `Object.values`.
  xkk: { alpha2: 'xk', name: 'Kosovo' },
  // GSC's sentinel for traffic it cannot attribute to a region. It appears in
  // essentially every property and is a real category, not an error — so it
  // gets a name, and `UNKNOWN_REGION_CODES` keeps it off the flag path.
  zzz: { alpha2: 'zz', name: 'Unknown region' },
}

/** Codes that name "we don't know", in every spelling a caller might pass. */
const UNKNOWN_REGION_CODES = new Set(['zz', 'zzz'])

// Convert country code to circle-flags icon name
export function countryCodeToFlagIcon(code: string): UiIcon {
  if (!code)
    return 'globe'
  const lowerCode = code.toLowerCase()
  // There is no `zz` flag (nor should there be) — the globe IS the answer.
  if (UNKNOWN_REGION_CODES.has(lowerCode))
    return 'globe'
  const data = countryData[lowerCode]
  const alpha2 = data?.alpha2 || (lowerCode.length === 2 ? lowerCode : null)
  if (!alpha2)
    return 'globe'
  return `i-circle-flags-${alpha2}`
}

// Localized region-name lookup. The bundled `name` field is English-only, so
// prefer `Intl.DisplayNames` (honours the runtime locale, cf. formatting.ts)
// and fall back to the map → raw code when the runtime lacks region data.
let regionDisplay: Intl.DisplayNames | null | undefined
function getRegionDisplay(): Intl.DisplayNames | null {
  if (regionDisplay !== undefined)
    return regionDisplay
  try {
    regionDisplay = new Intl.DisplayNames(undefined, { type: 'region' })
  }
  catch {
    regionDisplay = null // runtime without region display data
  }
  return regionDisplay
}

// Get country display name from code
export function getCountryName(code: string, fallback?: string): string {
  if (!code)
    return fallback || 'Unknown'
  const lowerCode = code.toLowerCase()
  // Ahead of the Intl lookup on purpose: CLDR titles this "Unknown Region",
  // which reads as a proper noun in a list of real ones.
  if (UNKNOWN_REGION_CODES.has(lowerCode))
    return 'Unknown region'
  const data = countryData[lowerCode]
  // MUST be uppercased before `.of()`. V8 does not canonicalise the region
  // subtag: `.of('us')` returns the string `'us'` while `.of('US')` returns
  // "United States". `countryData` stores alpha-2 lowercase (it feeds the
  // `i-circle-flags-*` name), so passing it straight through made every
  // mapped country render as its own lowercase code.
  const alpha2 = (data?.alpha2 || (code.length === 2 ? code : '')).toUpperCase() || null
  if (alpha2) {
    // `.of()` echoes the input back when it can't resolve the region.
    const localized = getRegionDisplay()?.of(alpha2)
    if (localized && localized.toUpperCase() !== alpha2)
      return localized
  }
  return data?.name || fallback || code.toUpperCase()
}

// Shorter aliases used at call sites.
export { countryCodeToFlagIcon as countryFlag, getCountryName as countryName }
