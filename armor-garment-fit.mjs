// Native, pose-specific garment outlines. These trace shoulders, sleeves and flanks,
// rather than positioning an inventory icon over the white patch on the belly.
// The source cat is never moved or repainted. All coordinates use its 279×370 canvas.
const fit=(outline,neck,hem,width,cuffs)=>({outline,neck,hem,width,cuffs});
const ready=()=>fit('M112 222Q167 241 224 228Q241 222 251 238L255 249Q256 261 246 266L225 263Q216 276 218 292L225 306Q167 328 96 313Q100 284 109 258L103 249Q101 233 112 218Z',[166,220],[157,311],124,'M109 244L118 251M240 232Q245 244 244 263');
export const STEEL_GARMENT_FITS={
 attack:[
  ready(),
  fit('M81 195L110 188Q118 210 135 225L177 242Q196 237 211 250Q222 263 214 276L188 281Q185 292 193 305Q139 327 66 319L61 310Q81 285 94 258L104 242Q88 221 81 195Z',[137,228],[128,312],119,'M85 205L115 197M195 244Q192 258 194 276'),
  fit('M60 184L91 180Q99 210 114 233L163 248Q178 245 185 259Q191 271 181 282L160 285Q159 298 165 307Q111 328 54 319L50 307Q68 278 84 257Q68 221 60 184Z',[119,237],[108,312],112,'M65 197L97 190M171 251Q166 265 168 279'),
  fit('M62 227Q88 223 119 239Q145 237 160 249Q170 260 165 275L141 279L121 280Q120 293 132 306Q82 329 26 320L23 308Q39 278 54 255Q53 237 62 227Z',[89,231],[80,313],108,'M85 228Q79 246 87 264M151 244L148 271'),
  fit('M106 225Q129 221 153 229L177 236Q186 248 174 261L151 263Q154 282 151 297L166 313Q123 335 76 322L77 308Q94 278 96 252Q95 235 106 225Z',[129,228],[119,317],100,'M148 229Q145 244 149 258M99 246L113 253'),
  ready()
 ],
 hurt:[
  fit('M112 221Q171 239 226 224Q247 226 258 247Q261 263 249 270L227 263Q218 278 225 300L231 308Q172 326 99 312Q108 284 110 259L102 246Q103 228 112 216Z',[169,219],[162,311],124,'M109 246L119 252M241 232Q247 247 245 263'),
  fit('M88 222Q101 218 119 225L162 240Q189 239 210 252Q219 263 212 280L187 284Q182 298 191 310Q135 332 75 317Q89 287 103 260L96 253L86 247Z',[137,233],[129,314],113,'M96 232L108 250M197 245Q193 261 194 278'),
  fit('M125 235Q154 242 178 249Q200 244 217 261Q225 276 216 286L196 290L204 314Q161 332 105 317L103 306Q112 287 119 270L113 258Z',[159,242],[153,318],108,'M123 246L134 260M202 251Q198 267 202 283'),
  fit('M55 204L86 191Q96 219 124 230L170 244Q191 243 210 238L230 246L225 274L199 282L182 280Q182 294 195 305L180 318Q151 319 118 302L111 284Q120 268 123 252Q79 240 65 227Z',[136,233],[153,307],104,'M61 214L92 203M211 241L206 278'),
  fit('M69 278Q90 276 111 290L143 307Q163 299 184 290Q204 286 217 304L223 318L203 328Q181 323 171 319L155 328Q119 337 91 325L86 315L74 313L61 302Z',[129,298],[136,329],113,'M74 286Q83 292 91 305M202 294L192 317'),
  fit('M89 220Q146 238 201 225Q223 226 236 246Q239 261 227 268L204 262Q196 279 203 299L210 310Q151 328 77 314Q87 284 88 259L80 245Q80 227 89 215Z',[147,218],[140,313],124,'M87 245L98 251M219 231Q225 246 223 262')
 ]
};
export function steelGarment(kind,index){
 const f=STEEL_GARMENT_FITS[kind][index];
 const [nx,ny]=f.neck,[hx,hy]=f.hem;
 // Shear follows the chest-to-waist axis; the full outline and sleeves are native
 // paths and are never stretched from the belly anchor.
 const matrix=`matrix(${f.width/100} 0 ${(hx-nx)/100} ${(hy-ny)/100} ${nx} ${ny})`;
 return `<g data-part="chestplate" data-fit="shoulders-to-waist"><defs><clipPath id="garment-cut"><path d="${f.outline}"/></clipPath><linearGradient id="undercloth"><stop stop-color="#435d70"/><stop offset=".48" stop-color="#8ca8ba"/><stop offset="1" stop-color="#344a5e"/></linearGradient><linearGradient id="curved-plate"><stop stop-color="#637c90"/><stop offset=".45" stop-color="#e1eff4"/><stop offset=".7" stop-color="#a4bdcc"/><stop offset="1" stop-color="#566e83"/></linearGradient></defs><path data-part="garment-outline" d="${f.outline}" fill="url(#undercloth)" stroke="#293b4a" stroke-width="3.6" stroke-linejoin="round"/><g clip-path="url(#garment-cut)"><g transform="${matrix}"><path d="M-52 -4L-32 8Q-39 40 -35 74L-32 103L-58 105ZM36 0L60 -2L62 104L31 104Q39 63 36 0Z" fill="#3f5668"/><path d="M-48 28L-34 33M-50 41L-36 46M-52 55L-36 60M-53 69L-35 75M40 28L54 24M40 43L55 40M40 58L56 55M39 73L56 70" fill="none" stroke="#a1b7c5" stroke-width="2"/><path data-part="fitted-cuirass" d="M-30 8Q0 23 31 9L38 37Q32 58 34 76Q12 91 -3 91Q-23 90 -38 78Q-36 49 -37 35Z" fill="url(#curved-plate)" stroke="#293b4a" stroke-width="2.7"/><path d="M-30 18Q-24 42 -29 72Q-16 83 -3 83M7 23Q18 38 23 55" fill="none" stroke="#eff7f9" stroke-width="2.5" stroke-linecap="round"/><path d="M-3 25L2 80M-34 53Q0 68 35 52" fill="none" stroke="#59758a" stroke-width="2"/><path d="M-52 88Q0 101 52 87L52 98Q0 114 -54 98Z" fill="#455a6a" stroke="#293b4a" stroke-width="2.5"/><path d="M-6 94L7 94L7 103L-6 103Z" fill="#a8c1cd" stroke="#293b4a" stroke-width="2"/><path d="M-53 101Q0 115 54 100L54 110L-55 112Z" fill="#7b97a9" stroke="#293b4a" stroke-width="2"/></g></g><path data-part="sleeve-cuffs" d="${f.cuffs}" fill="none" stroke="#d4e5ed" stroke-width="4" stroke-linecap="round"/></g>`;
}
