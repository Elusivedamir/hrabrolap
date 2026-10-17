// Slice the ImageGen atlases into the same fixed 279×370 frames as Golden Knight.
// Usage: node tools/import_crafted_costumes.mjs SLIME_ATLAS BONE_ATLAS
// No background removal, repainting, per-frame trimming or pose transformations.
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const entries=[['slime_guardian','Слизневая броня','slime',process.argv[2]],['bone_guardian','Костяная броня','bone',process.argv[3]]];
for(const [id,name,material,source] of entries){
 if(!source)throw new Error('Pass both generated atlas paths');
 const meta=await sharp(source).metadata();
 if(!meta.hasAlpha)throw new Error('Atlas must have genuine transparency');
 const original=path.join(root,'assets/costumes',id),clean=path.join(root,'assets/clean',id);
 await fs.mkdir(original,{recursive:true});await fs.mkdir(clean,{recursive:true});
 await fs.copyFile(source,path.join(original,'source-atlas.png'));
 const manifest={armor_id:id,name,price:0,materials:{[material]:15},content:'complete-character',source:'ImageGen edit of the Golden Knight 6×2 reference atlas',source_size:[meta.width,meta.height],sword:'separate-svg',frames:[]};
 for(const [row,kind] of ['attack','hurt'].entries())for(let col=0;col<6;col++){
  const left=Math.round(col*meta.width/6),right=Math.round((col+1)*meta.width/6);
  const top=Math.round(row*meta.height/2),bottom=Math.round((row+1)*meta.height/2);
  const buffer=await sharp(source).extract({left,top,width:right-left,height:bottom-top}).resize(279,370,{fit:'fill'}).ensureAlpha().png().toBuffer();
  const file=`${kind}_${String(col+1).padStart(2,'0')}.png`;
  await fs.writeFile(path.join(original,file),buffer);await fs.writeFile(path.join(clean,file),buffer);
  manifest.frames.push({file,width:279,height:370,sha256:createHash('sha256').update(buffer).digest('hex')});
 }
 await fs.writeFile(path.join(original,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log(`${name}: ${manifest.frames.length} transparent complete-character frames`);
}
