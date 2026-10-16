from pathlib import Path
r=Path(__file__).resolve().parents[1]
for name in ['index.html','sprint-01-studio.html']:
 p=r/name
 s=p.read_text()
 s=s.replace('id="hero-body" href="art/hero/bare-kitten.svg"','id="hero-body" href="animations/hero/slash/01.svg"') if name=='index.html' else s.replace('href="art/hero/bare-kitten.svg"', 'id="hero-body" href="animations/hero/slash/01.svg"')
 needle='</g></g></svg>'
 if needle not in s:
  raise RuntimeError('hero rig slot not found in '+name)
 # Put forepaw over the shared sword hilt. It uses SAME transform as the weapon.
 extra='</g><g id="hero-hand" transform="translate(170 229) rotate(-18)"><ellipse cx="0" cy="-11" rx="12" ry="11" fill="#38252b"/><ellipse cx="0" cy="-11" rx="9" ry="8" fill="#f4a452"/><path d="M-5 -13Q-1 -18 5 -15" fill="none" stroke="#ffe0a2" stroke-width="2.4" stroke-linecap="round"/></g></g></svg>'
 s=s.replace(needle,extra,1)
 p.write_text(s)

p=r/'game.mjs';s=p.read_text()
s=s.replace("import {WEAPONS,ARMORS", "import {ATTACKS} from './hero-poses.mjs';\nimport {WEAPONS,ARMORS",1)
begin=s.index('const ATTACKS=[');end=s.index('\nlet poseSerial=',begin)
s=s[:begin]+'''// slash / overhead / thrust — the same timeline drives 18 swordless SVG sprites.\n// Weapon sprites remain independent and interchangeable during every pose.'''+s[end:]
a=s.index('function heroFrame(index=0){');b=s.index('\nfunction cancelPose()',a)
s=s[:a]+'''function heroFrame(index=0){
 const frame=Math.max(0,Math.min(5,index));
 const attack=ATTACKS[activeAttack];
 const [x,y,angle,dx,dy,lean]=attack.frames[frame];
 const weaponPose=`translate(${x} ${y}) rotate(${angle})`;
 slot.setAttribute('transform',weaponPose);
 // One stable hand-to-hilt transform, including the contact frame of thrust.
 $('hero-hand').setAttribute('transform',weaponPose);
 $('hero-body').setAttribute('href',`animations/hero/${attack.id}/${String(frame+1).padStart(2,'0')}.svg`);
 heroMotion.setAttribute('transform',`translate(${dx} ${dy}) rotate(${lean} 238 252)`);
 currentPose=frame;
}'''+s[b:]
p.write_text(s)

# Studio: switch to the production pose definitions; retains all test controls.
p=r/'sprint-01-studio.html';s=p.read_text()
start=s.index('const attacks=');stop=s.index(';const slimeNames=',start)
s=s[:start]+'const attacks=window.HERO_ATTACKS'+s[stop:]
needle="$('hero-motion').setAttribute('transform',`translate(${dx} ${dy}) rotate(${lean} 238 252)`);"
s=s.replace(needle,"$('hero-motion').setAttribute('transform',`translate(${dx} ${dy}) rotate(${lean} 238 252)`);$('hero-hand').setAttribute('transform',`translate(${x} ${y}) rotate(${angle})`);$('hero-body').setAttribute('href',`animations/hero/${a.id}/${String(i+1).padStart(2,'0')}.svg`);")
s=s.replace('<script>\nconst attacks=', '<script>\nconst attacks=')
# Shared data exposes frames rather than the older studio-only poses key.
s=s.replace('a.poses[i]', 'a.frames[i]')
# insert small inline module import as module script, rest UI init depends on it.
s=s.replace('const attacks=window.HERO_ATTACKS;', 'import {ATTACKS as attacks} from "./hero-poses.mjs";')
s=s.replace('<script>\nimport {ATTACKS', '<script type="module">\nimport {ATTACKS')
s=s.replace('Технический просмотр существующих поз, НЕ финальная перерисовка под v0.7.', 'Новые 18 кадров рига: единая мордочка, синхронная лапа и сменное SVG-оружие; художественная приёмка ещё впереди.')
p.write_text(s)
# Standalone explicit art-version marker.
p=r/'index.html';s=p.read_text().replace('v0.9 · сменное оружие','v0.9.1 · 18 кадров героя');p.write_text(s)
print('Updated game and sprint01 studio with shared sprite source and foreground grip.')
