import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const m=JSON.parse(fs.readFileSync(path.join(root,'qa/forest-guardian/manifest.json'),'utf8'));
assert.equal(m.frames.length,12,'Expected exactly 12 frames');
const names=new Set();
for (const frame of m.frames) {
  const original=fs.readFileSync(path.join(root,frame.source));
  const copy=fs.readFileSync(path.join(root,frame.copy));
  assert.ok(original.equals(copy),'Changed copy: '+frame.source);
  assert.equal(crypto.createHash('sha256').update(original).digest('hex'),frame.sha256,'SHA-256 mismatch: '+frame.source);
  assert.equal(original.toString('hex',0,8),'89504e470d0a1a0a','Not PNG: '+frame.source);
  assert.equal(original.readUInt32BE(16),frame.native_width,'Width mismatch: '+frame.source);
  assert.equal(original.readUInt32BE(20),frame.native_height,'Height mismatch: '+frame.source);
  assert.equal(original.readUInt8(25),6,'PNG must be native truecolor+alpha: '+frame.source);
  assert.equal(frame.armor_anchor_source_xy_rotation_scale.length,4);
  assert.equal(frame.weapon_anchor_source_xy_rotation_scale.length,4);
  assert.ok(!names.has(frame.source),'Repeated frame path');names.add(frame.source);
  console.log('PASS',frame.kind,frame.index,frame.native_width+'x'+frame.native_height,frame.sha256);
}
console.log('PASS all 12 original/copied PNGs byte-identical and SHA-256 verified');
