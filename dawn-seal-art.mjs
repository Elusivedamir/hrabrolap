/** Dawn Seal artwork: four hand-composed Chapter-1 SVG concept glyphs.
 * Remaining 36 are explicitly UNAPPROVED placeholder sigils, never final art.
 * No AI-generated character images, approved sprite changes or external fonts.
 */
import {dawnSealForWave} from './dawn-seals.mjs';

const COLORS=[
 ['#75bf74','#d4ef8d','#233e31'],  // moss
 ['#f0dfbd','#c7a47c','#564357'], // bone
 ['#b975ca','#e7a6d9','#372941'], // chitin
 ['#83d5f3','#e2faff','#224b65']  // ice
];
const MOTIFS=[
 // Moss: rooted tree axis with four branching green leaves.
 '<path d="M48 76V21M48 42L29 31M48 49L68 30" fill="none" stroke="#d4ef8d" stroke-width="7" stroke-linecap="round"/><path d="M45 26Q24 6 23 23Q25 37 45 35M51 25Q73 5 75 21Q75 38 52 35M30 33Q13 34 20 49Q32 58 38 40M66 33Q86 33 78 49Q66 57 59 40" fill="#75bf74" stroke="#173c2b" stroke-width="3"/><path d="M36 73Q48 62 61 73M33 78Q48 66 64 78" fill="none" stroke="#d4ef8d" stroke-width="4"/>',
 // Bone: geometric rib arches and ivory crown, avoids the snowman skull.
 '<path d="M29 30L37 21 42 29 48 16 55 29 61 21 69 30 63 41H34Z" fill="#f0dfbd" stroke="#5d4b4a" stroke-width="4"/><path d="M48 36V75M34 46Q48 59 62 46M29 56Q48 72 67 56M39 72L27 81M57 72L69 81" fill="none" stroke="#f0dfbd" stroke-width="7" stroke-linecap="round"/><path d="M39 41L45 48M57 41L51 48" stroke="#564357" stroke-width="3" stroke-linecap="round"/>',
 // Chitin: spider-egg hourglass motif, jointed asymmetric-feeling segmented legs.
 '<path d="M48 19C26 20 27 37 40 48C18 60 32 79 48 80C64 79 77 60 56 48C69 37 70 20 48 19Z" fill="#b975ca" stroke="#412a49" stroke-width="4"/><path d="M38 30L20 24 13 33M35 42L16 43 12 57M36 59L22 70 19 83M58 30L76 24 83 33M61 42L80 43 84 57M60 59L74 70 77 83" fill="none" stroke="#e7a6d9" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/><path d="M35 30H61M38 43H58M38 58H58M42 69H54" fill="none" stroke="#412a49" stroke-width="3"/><circle cx="48" cy="52" r="4" fill="#f7cedd"/>',
 // Ice: jagged serpent coil, icicle facets and sharp head, not a snowflake glyph.
 '<path d="M46 14L65 35 54 47 70 59 48 84 29 61 40 47 27 36Z" fill="#83d5f3" stroke="#244862" stroke-width="4" stroke-linejoin="round"/><path d="M46 14L47 45 39 64 48 84M47 45L65 35M39 64L70 59" fill="none" stroke="#e2faff" stroke-width="4"/><path d="M29 61L16 53 22 76M70 59L83 50 79 74" fill="none" stroke="#83d5f3" stroke-width="5" stroke-linejoin="round"/>'
];
const SKETCHES=[
 '<path d="M48 19L32 39 45 49 31 76M48 19L64 39 51 49 65 76M35 64H61" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>',
 '<path d="M29 24L67 26 54 42 70 70 43 79 30 59 48 43Z" fill="none" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/>',
 '<path d="M47 15L28 32 47 46 70 33 47 60 28 75 67 80" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>',
 '<path d="M27 31L48 17 69 31 67 62 48 81 29 62ZM29 61L70 31M28 30L67 62" fill="none" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/>'
];
const cache=new Map();
export function dawnSealSvg(wave){
 const seal=dawnSealForWave(wave);
 if(!seal)return '';
 if(cache.has(wave))return cache.get(wave);
 const first=seal.number<=4,chapter=seal.chapter;
 const [base,shine,shade]=first?COLORS[seal.number-1]:['#b8a38b','#ead3b0','#59495a'];
 const motif=first?MOTIFS[seal.number-1]:SKETCHES[(seal.number-1)%SKETCHES.length];
 const hex=first?'':'<text x="48" y="90" fill="#e8ceaf" font-family="sans-serif" font-size="9" font-weight="bold" text-anchor="middle">ЭСКИЗ '+seal.number+'</text>';
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 100" role="img" aria-label="'+seal.name+'">'+
 '<defs><radialGradient id="halo"><stop stop-color="'+shine+'" stop-opacity=".34"/><stop offset="1" stop-color="'+shade+'" stop-opacity=".08"/></radialGradient></defs>'+
 '<circle cx="48" cy="48" r="46" fill="url(#halo)"/>'+
 '<path d="M48 5Q68 6 83 23L91 48 82 76 59 91 35 90 13 74 5 48 13 23 35 7Z" fill="'+shade+'" stroke="'+base+'" stroke-width="4"/>'+
 '<path d="M48 11Q68 11 79 27L84 48 76 72 58 84 36 83 19 70 13 48 19 28 37 12Z" fill="#233039" stroke="'+shine+'" stroke-width="1.7" stroke-dasharray="5 5"/>'+
 '<g color="'+base+'" stroke-linecap="round" stroke-linejoin="round">'+motif+'</g>'+
 hex+'</svg>';
 cache.set(wave,svg);return svg;
}
export const dawnSealUrl=wave=>'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(dawnSealSvg(wave));
