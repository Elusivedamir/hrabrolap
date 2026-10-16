// Keep the archived knight poses unchanged. Only the loose catch in pose 9 moves
// to the rim of the physical left-hand bucket; knight/rod layers are identical.
export const FISHING_FRAMES=Object.freeze(Array.from({length:10},(_,i)=>
 i===8?'animations/fishing-deposit/09.svg':`animations/fishing/${String(i+1).padStart(2,'0')}.svg`));
