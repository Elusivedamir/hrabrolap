"""Reproducible vector model update; preserve existing per-species timelines."""
from pathlib import Path
from lxml import etree
import base64, math
ROOT=Path(__file__).resolve().parents[1]
NS='http://www.w3.org/2000/svg'
def uri(text): return 'data:image/svg+xml;base64,'+base64.b64encode(text.encode()).decode()
def eyes(x,y,spacing=33):
 return ''.join(f'<ellipse cx="{xx}" cy="{y}" rx="13" ry="19" fill="#fff7d8"/><ellipse cx="{xx-4}" cy="{y+2}" rx="6" ry="11" fill="#242b40"/><circle cx="{xx-6}" cy="{y-4}" r="3" fill="white"/>' for xx in [x,x+spacing])
models={
'slime':('lime', '<path d="M25 146Q17 102 54 83Q63 21 112 21Q157 15 177 79Q220 94 215 145Q208 177 124 174Q42 179 25 146Z" fill="url(#skin)"/><path d="M43 133Q45 93 72 91Q79 42 110 37" fill="none" stroke="#d7ffb0" stroke-width="12"/>'+eyes(95,111)+'<path d="M102 146Q123 158 141 141" fill="#263f41"/><ellipse cx="69" cy="139" rx="12" ry="6" fill="#c5e37d"/><circle cx="172" cy="129" r="8" fill="#a9eb78"/>'),
'mouse':('stone','<path d="M193 138Q237 97 230 154Q229 174 190 168" fill="none" stroke="#db979b" stroke-width="10"/><ellipse cx="149" cy="128" rx="63" ry="41" fill="url(#skin)"/><circle cx="93" cy="51" r="31" fill="#919baf"/><circle cx="94" cy="52" r="20" fill="#e4a6a6"/><circle cx="155" cy="46" r="29" fill="#919baf"/><circle cx="155" cy="46" r="18" fill="#e4a6a6"/><path d="M65 84Q99 53 154 76Q175 103 158 137L67 146 37 121Z" fill="url(#skin)"/>'+eyes(85,101,38)+'<ellipse cx="43" cy="119" rx="13" ry="10" fill="#463b50"/><path d="M47 127L16 130M56 136L25 149" stroke="#eedcca" stroke-width="3"/><path d="M94 151L77 169H115M158 153L149 172H182" fill="#c2c6c9"/>'),
'mushroom':('sand','<path d="M85 91L73 164Q118 182 163 164L152 90" fill="url(#skin)"/><path d="M21 91Q28 13 117 13Q205 12 222 90Q204 116 118 115Q39 115 21 91Z" fill="#c54c59"/><path d="M30 87Q116 120 215 88" fill="none" stroke="#702c45" stroke-width="9"/><ellipse cx="72" cy="57" rx="22" ry="15" fill="#ffe7bb"/><ellipse cx="155" cy="41" rx="18" ry="12" fill="#ffe7bb"/><ellipse cx="185" cy="81" rx="14" ry="10" fill="#ffe7bb"/>'+eyes(102,132,33)+'<path d="M112 161Q123 150 136 160" fill="none"/><circle cx="36" cy="142" r="8" fill="#dfd66f"/><circle cx="203" cy="131" r="6" fill="#dfd66f"/>'),
'bat':('violet','<path d="M94 93Q60 53 12 58L28 127 54 110 70 147 101 137M146 93Q180 53 228 58L212 127 185 111 170 146 138 137" fill="#694f91"/><path d="M26 69L82 115M214 69L157 115" fill="none" stroke="#c191bd" stroke-width="5"/><path d="M84 62L85 21 110 46Q123 38 136 46L159 21 157 73Q177 156 120 170Q67 152 84 62Z" fill="url(#skin)"/>'+eyes(103,99,34)+'<path d="M102 133Q121 145 141 131L136 152 126 141 115 155Z" fill="#ffeccc"/>'),
'spider':('violet','<path d="M83 91L44 65 22 84M80 113L31 106 13 131M83 136L43 148 31 174M156 91L195 65 219 84M159 113L209 106 227 131M156 136L197 149 209 174" fill="none" stroke="#59446d" stroke-width="13"/><ellipse cx="124" cy="104" rx="63" ry="54" fill="url(#skin)"/><path d="M95 65L124 86 153 65" fill="none" stroke="#c395cf" stroke-width="10"/><ellipse cx="112" cy="132" rx="50" ry="37" fill="#826391"/>'+eyes(94,128,35)+'<path d="M91 153L97 173 109 157M124 157L136 172 142 151" fill="#fff0d5"/>'),
'larva':('sand','<ellipse cx="190" cy="136" rx="32" ry="31" fill="#9eac70"/><ellipse cx="158" cy="135" rx="35" ry="35" fill="#b6c37e"/><ellipse cx="123" cy="130" rx="37" ry="40" fill="#cfdb91"/><path d="M57 83L48 57M91 79L103 51" fill="none" stroke="#bd8854" stroke-width="8"/><circle cx="47" cy="55" r="8" fill="#edd288"/><circle cx="103" cy="50" r="8" fill="#edd288"/><ellipse cx="75" cy="122" rx="51" ry="49" fill="url(#skin)"/>'+eyes(56,112,34)+'<path d="M53 149Q71 158 88 146" fill="none"/><path d="M118 163L114 177M153 162L151 177M186 161L185 172" stroke="#86683f" stroke-width="8"/>'),
'beetle':('teal','<path d="M78 94L43 80 29 99M76 123L32 122 22 143M85 148L51 162 49 178M162 94L197 80 211 99M164 123L208 122 218 143M155 148L188 162 191 178" stroke="#3b505b" stroke-width="11" fill="none"/><ellipse cx="122" cy="116" rx="65" ry="60" fill="url(#skin)"/><path d="M122 61V172" stroke="#284b52" stroke-width="7"/><path d="M77 109Q77 80 105 75M166 110Q164 82 139 75" fill="none" stroke="#b6e9cc" stroke-width="8"/><ellipse cx="119" cy="69" rx="43" ry="29" fill="#3e7979"/><path d="M96 51Q77 20 66 31M139 50Q158 20 171 31" fill="none" stroke="#344754" stroke-width="7"/>'+eyes(103,70,32)),
'ghost':('ice','<path d="M58 103Q49 29 115 22Q182 18 181 97L211 135 173 129 191 169 147 155 125 179 98 155 54 172 66 133 26 143Z" fill="url(#skin)"/><path d="M77 84Q74 47 111 42" fill="none" stroke="#f4ffff" stroke-width="9"/>'+eyes(95,99,40)+'<ellipse cx="119" cy="139" rx="13" ry="16" fill="#435d83"/><path d="M74 154L68 163M169 151L177 162" stroke="#83bfcf" stroke-width="4"/>')}
colors={'lime':('#baf785','#4ca66b'),'stone':('#c0c7d1','#78859c'),'sand':('#fff0b0','#c7af68'),'violet':('#b9a0d7','#66508c'),'teal':('#83c9b4','#327f80'),'ice':('#e2ffff','#86b5d6')}
out=ROOT/'art/monsters-v2';out.mkdir(exist_ok=True)
for kind,(palette,body) in models.items():
 a,b=colors[palette]
 svg=f'<svg xmlns="{NS}" viewBox="0 0 240 184" data-model="{kind}-v2"><defs><linearGradient id="skin" x2=".3" y2="1"><stop stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient></defs><ellipse cx="120" cy="174" rx="88" ry="8" fill="#18273d" opacity=".23"/><g stroke="#343449" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">{body}</g></svg>'
 (out/f'{kind}.svg').write_text(svg)
 for f in (ROOT/'animations'/kind).glob('*/*/*.svg'):
  tree=etree.parse(str(f));root=tree.getroot();root.set('data-model',kind+'-v2')
  model=root.find('.//{*}image');model.set('href',uri(svg))
  f.write_bytes(etree.tostring(root))

# The background already contains the knight, rod and line. Animate the catch
# along that line, then let the unhooked fish arc into the ONE clickable bucket.
positions=[None,(392,365),(392,330),(392,280),(350,225),(270,210),(180,240),(95,300),(56,353),None]
for i,pos in enumerate(positions):
 ripple=f'<ellipse cx="392" cy="392" rx="{20+i*3}" ry="{5+i}" fill="none" stroke="#eafffa" stroke-width="3" opacity="{max(0,.9-i*.1):.2f}"/>' if i<5 else ''
 fish=''
 if pos:
  x,y=pos;angle=-70 if i<4 else (i-4)*25
  fish=f'<g data-catch="fish" transform="translate({x} {y}) rotate({angle})"><path d="M-23 0L-39 -14V14Z" fill="#e4ab61" stroke="#354f52" stroke-width="3"/><ellipse rx="25" ry="12" fill="#cce4b7" stroke="#354f52" stroke-width="3"/><path d="M-10 -10L0 -21 11 -10" fill="#8dbba0"/><circle cx="15" cy="-3" r="3" fill="#213943"/></g>'
 svg=f'<svg xmlns="{NS}" viewBox="0 0 941 425" data-scene="port" data-rod-tip="392,171" data-bucket-mouth="56,353"><title>Рыцарь: улов, кадр {i+1}</title>{ripple}{fish}<!-- Единственная леска уже находится на исходном фоне: от кончика удочки к поплавку. Ведро находится в DOM. --></svg>'
 (ROOT/'animations/fishing'/f'{i+1:02}.svg').write_text(svg)
print('Updated eight vector models, 192 existing animation frames, ten aligned catch frames.')
