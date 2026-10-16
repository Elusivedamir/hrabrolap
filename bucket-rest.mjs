// Логика визуальных состояний. Реальная вместимость 12/24 слотов, цены,
// механика рыбалки и сохранения здесь не изменяются.
export const BUCKET_ART = Object.freeze({
  empty: 'art/scenery/bucket-empty.svg',
  low: 'art/scenery/bucket-low.svg',
  mid: 'art/scenery/bucket-mid.svg',
  full: 'art/scenery/bucket-full.svg'
});
export const SLEEP_FRAMES = Object.freeze(
  Array.from({length:6}, (_,i) => `assets/rest/sleep_${String(i+1).padStart(2,'0')}.png`)
);
// Особый случай: ровно 7 рыб. После улучшения — третья картинка,
// до улучшения — вторая. Без улучшения 8–12 рыб тоже используют вторую.
export function bucketStage(fishCount, isUpgraded){
  const n=Math.max(0, Math.floor(Number.isFinite(fishCount) ? fishCount : 0));
  if(!n) return 'empty';
  if(n<=4) return 'low';
  if(isUpgraded && n>=7) return 'full';
  return 'mid';
}
export function bucketArt(fishCount, isUpgraded){
  return BUCKET_ART[bucketStage(fishCount,isUpgraded)];
}
// Сначала проигрываются все шесть исходных поз, затем котик тихо дышит,
// чередуя два последних кадра до завершения реального таймера отдыха.
export function sleepFrameIndex(elapsedMs){
  const ms=Math.max(0,Number.isFinite(elapsedMs)?elapsedMs:0);
  const first=Math.floor(ms/430);
  if(first<6)return first;
  return 4+(Math.floor((ms-6*430)/760)%2);
}