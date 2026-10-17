// Species illustrations share the game's existing hand-drawn SVG icon style.
export const FISH_ART=Object.freeze({
 'Плотва':'art/fish/roach.svg',
 'Карась':'art/fish/crucian.svg',
 'Окунь':'art/fish/perch.svg',
 'Щука':'art/fish/pike.svg',
 'Золотой карп':'art/fish/golden-carp.svg'
});
export const fishArt=species=>FISH_ART[species]||'art/fish.svg';
