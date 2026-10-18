/* hacf-scene.js · Mayhem t269 · MODEL: Code-Monkeys-style pixel look for a Halt-and-Catch-Fire-era world.
   Three.js r160 (local UMD copy), DPR capped at 2. The scene renders into a low-res target (pixel blocks), then one post pass adds
   CRT curvature, palette quantisation, scanlines and phosphor glow. Every prop is original voxel/box art. */
(function(){'use strict';const T=window.THREE;if(!T)throw Error('THREE missing');T.ColorManagement.enabled=false;
const PAL={
 cga:['#000000','#0000aa','#00aa00','#00aaaa','#aa0000','#aa00aa','#aa5500','#aaaaaa','#555555','#5555ff','#55ff55','#55ffff','#ff5555','#ff55ff','#ffff55','#ffffff'],
 c64:['#000000','#ffffff','#68372b','#70a4b2','#6f3d86','#588d43','#352879','#b8c76f','#6f4f25','#433900','#9a6759','#444444','#6c6c6c','#9ad284','#6c5eb5','#959595'],
 valley:['#140c1c','#442434','#30346d','#4e4a4e','#854c30','#346524','#d04648','#757161','#597dce','#d27d2c','#8595a1','#6daa2c','#d2aa99','#6dc2ca','#dad45e','#deeed6'],
 websafe:['#000000','#003366','#006699','#0099cc','#33ccff','#ffffff','#cccccc','#666666','#990000','#ff3300','#ff9900','#ffcc00','#009933','#66cc33','#663399','#cc66cc']};
const PALNOTE={cga:'IBM CGA 16-colour palette (LIT values)',c64:'Commodore 64 palette, "Pepto" measurement (AMBER: approximate)',valley:'"Valley" 16-colour palette (MODEL, an original-style picking)',websafe:'16 colours picked from the 216-colour web-safe cube (LIT: every channel a multiple of 0x33)'};
const CAST={roxy:{skin:'#f1c27d',hair:'#ff2f6d',shirt:'#26262e',pants:'#3b4cca',shoe:'#111111',acc:'#c0c0c0',style:'spike'},
 dex:{skin:'#e0ac69',hair:'#3a2a1a',shirt:'#2c3e70',pants:'#2c3e70',shoe:'#1a1a1a',acc:'#d0312d',style:'slick'},
 wrench:{skin:'#ffdbac',hair:'#6b4f2a',shirt:'#8fae5a',pants:'#5a4632',shoe:'#3a2a1a',acc:'#1a1a1a',style:'bald'},
 madge:{skin:'#c68642',hair:'#1a1a1a',shirt:'#b06ab3',pants:'#40304a',shoe:'#222222',acc:'#ffffff',style:'bob'},
 boss:{skin:'#f5cba7',hair:'#8a8a8a',shirt:'#f4f4f4',pants:'#4a4a4a',shoe:'#222222',acc:'#1f6feb',style:'part'},
 kid:{skin:'#8d5524',hair:'#111111',shirt:'#ff9f1c',pants:'#2f5d8a',shoe:'#eeeeee',acc:'#1fa34a',style:'cap'}};
const BASE=['...2222...','..222222..','..211112..','..171171..','..111111..','...1111...','..333333..','.33333333.','.13333331.','.13333331.','..333333..','..444444..','..44..44..','..44..44..','..44..44..','.555..555.'];
const HAIR={spike:['.2.2.2.2..','.22222222.','..211112..'],slick:['...2222...','..222222..','..211112..'],bald:['..........','...1111...','..111111..'],
 bob:['..222222..','.22222222.','.22111122.'],part:['...2222...','..2222.2..','..211112..'],cap:['..666666..','.66666666.','..211112..']};
function spriteMap(style){const m=BASE.slice();const h=HAIR[style]||HAIR.slick;m[0]=h[0];m[1]=h[1];m[2]=h[2];
 if(style==='bald'){m[3]='..676676..';m[5]='...2222...'}if(style==='bob'){m[3]='.21711712.';m[4]='.21111112.'}
 if(style==='slick'||style==='part'){m[7]='.33336333.';m[8]='.13336331.';m[9]='.13336331.'}if(style==='part')m[5]='...2222...';
 if(style==='spike'){m[6]='..363363..';m[7]='.36333363.'}return m}
function sha8(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return h}
function rng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
const VS='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
const FS=`uniform sampler2D tD;uniform vec2 rs;uniform vec3 pal[16];uniform float quant,scan,curve,expo,glow,time,dpr;uniform vec3 phos;varying vec2 vUv;
vec2 warp(vec2 u){vec2 c=u*2.-1.;c*=1.+curve*dot(c.yx,c.yx);return c*.5+.5;}
void main(){vec2 uv=warp(vUv);if(uv.x<0.||uv.x>1.||uv.y<0.||uv.y>1.){gl_FragColor=vec4(.02,.02,.03,1.);return;}
vec2 px=1./rs;vec3 c=texture2D(tD,uv).rgb*expo;vec3 b=(texture2D(tD,uv+vec2(px.x,0.)).rgb+texture2D(tD,uv-vec2(px.x,0.)).rgb+texture2D(tD,uv+vec2(0.,px.y)).rgb+texture2D(tD,uv-vec2(0.,px.y)).rgb)*.25*expo;
c=c+glow*max(b-c,0.)*.8+glow*.10*phos*dot(c,vec3(.299,.587,.114));
float bd=9.;vec3 q=c;for(int i=0;i<16;i++){vec3 d=c-pal[i];float e=dot(d,d);if(e<bd){bd=e;q=pal[i];}}c=mix(c,q,quant);
float r=step(mod(gl_FragCoord.y,3.*dpr),dpr*.999);c*=1.-scan*.42*r;vec2 v=uv*2.-1.;c*=1.-.35*curve*dot(v,v)*2.;
c*=.97+.03*sin(time*3.+uv.y*40.);gl_FragColor=vec4(clamp(c,0.,1.),1.);}`;
function hex3(h){const c=new T.Color(h);return new T.Vector3(c.r,c.g,c.b)}
function create(el,cfg){
 const thumb=!!cfg.thumb,DPR=Math.min(window.devicePixelRatio||1,thumb?1:2);
 const renderer=new T.WebGLRenderer({antialias:false,alpha:false,preserveDrawingBuffer:false,powerPreference:'low-power'});
 renderer.setPixelRatio(DPR);renderer.outputColorSpace=T.LinearSRGBColorSpace;el.appendChild(renderer.domElement);renderer.domElement.style.display='block';
 const R=rng(cfg.seed||sha8(cfg.title||'hacf')),pal=PAL[cfg.palette]||PAL.cga,phos=cfg.phos||'#33ff66';
 const P={px:3,scan:.5,quant:.4,curve:.07,expo:1.15,glow:.4,spin:.25};
 const scene=new T.Scene(),bg=new T.Color(cfg.bg||'#1b1f3a');scene.background=bg;scene.fog=new T.Fog(bg,9,22);
 const cam=new T.PerspectiveCamera(42,1,.05,60);
 scene.add(new T.HemisphereLight(0xfff4e0,0x505070,1.45));const sun=new T.DirectionalLight(0xffffff,1.3);sun.position.set(3,6,4);scene.add(sun);
 const pl=new T.PointLight(new T.Color(phos),1.2,6);pl.position.set(0,1.4,1.2);scene.add(pl);
 const MC={};function mat(c,o){const k=c+(o?JSON.stringify(o):'');if(!MC[k])MC[k]=new T.MeshLambertMaterial(Object.assign({color:new T.Color(c),flatShading:true},o||{}));return MC[k]}
 const BG=new T.BoxGeometry(1,1,1);const world=new T.Group();scene.add(world);const anim=[];
 function box(p,w,h,d,c,x,y,z,o){const m=new T.Mesh(BG,mat(c,o));m.scale.set(w,h,d);m.position.set(x,y,z);p.add(m);return m}
 // screen texture
 const sc=document.createElement('canvas');sc.width=256;sc.height=192;const sx=sc.getContext('2d');const stex=new T.CanvasTexture(sc);stex.magFilter=T.NearestFilter;stex.minFilter=T.NearestFilter;
 const smat=new T.MeshBasicMaterial({map:stex});const api={onScreen:null};
 function crt(p,x,y,z,s,ry){const g=new T.Group();g.position.set(x,y,z);g.rotation.y=ry||0;g.scale.setScalar(s||1);p.add(g);
  box(g,.40,.34,.36,'#d9cfae',0,.17,0);box(g,.30,.26,.16,'#c9bf9e',0,.17,-.24);box(g,.36,.30,.02,'#b7ad8e',0,.17,.185);
  const scr=new T.Mesh(new T.PlaneGeometry(.30,.225),smat);scr.position.set(0,.175,.197);g.add(scr);box(g,.03,.03,.01,'#ff3b30',.15,.035,.19);box(g,.2,.03,.2,'#c9bf9e',0,-.0,0);return g}
 function pc(p,x,y,z,ry){const g=new T.Group();g.position.set(x,y,z);g.rotation.y=ry||0;p.add(g);
  box(g,.56,.15,.44,'#e3d9b8',0,.075,0);box(g,.56,.13,.01,'#cfc5a4',0,.075,.222);
  for(const dx of[-.13,.13]){box(g,.2,.05,.012,'#3a3a3a',dx,.085,.228);box(g,.05,.012,.014,'#777',dx,.085,.235)}box(g,.02,.02,.01,'#ff3b30',.25,.04,.226);
  crt(g,0,.15,0,1);const kb=new T.Group();kb.position.set(0,0,.42);g.add(kb);box(kb,.5,.03,.17,'#d6ccab',0,.015,0);
  const kc=new T.InstancedMesh(BG,mat('#efe7cf'),60);const M=new T.Matrix4();let i=0;for(let r=0;r<4;r++)for(let c=0;c<15;c++){M.compose(new T.Vector3(-.21+c*.03,.036,-.055+r*.035),new T.Quaternion(),new T.Vector3(.024,.012,.026));kc.setMatrixAt(i++,M)}kb.add(kc);return g}
 function desk(p,x,z,ry,w){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=ry||0;p.add(g);w=w||1.3;box(g,w,.05,.75,cfg.desk||'#c8c8c8',0,.72,0);box(g,w,.02,.75,'#555555',0,.69,0);
  for(const a of[-1,1])for(const b of[-1,1])box(g,.05,.72,.05,'#333333',a*(w/2-.05),.36,b*.32);return g}
 function sprite(p,id,x,z,ry,act){const c=CAST[id]||CAST.roxy,m=spriteMap(c.style),cols={1:c.skin,2:c.hair,3:c.shirt,4:c.pants,5:c.shoe,6:c.acc,7:'#111111'};
  const g=new T.Group();g.position.set(x,0,z);g.rotation.y=ry||0;p.add(g);const V=.06;let n=0;m.forEach(r=>{for(const ch of r)if(ch!=='.')n++});
  const im=new T.InstancedMesh(BG,new T.MeshLambertMaterial({flatShading:true}),n*2);const M=new T.Matrix4(),col=new T.Color();let i=0;
  m.forEach((r,ri)=>{for(let ci=0;ci<r.length;ci++){const ch=r[ci];if(ch==='.')continue;for(const zz of[0,1]){M.compose(new T.Vector3((ci-4.5)*V,(15-ri)*V+V/2,(zz-.5)*V),new T.Quaternion(),new T.Vector3(V,V,V));im.setMatrixAt(i,M);col.set(cols[ch]);im.setColorAt(i,col);i++}}});
  im.name='sprite-'+id;g.add(im);const ph=R()*6.28;anim.push(t=>{g.position.y=Math.abs(Math.sin(t*(act==='walk'?6:2.2)+ph))*(act==='walk'?.05:.018);if(act==='walk'){const a=ph+t*.36;g.position.x=x+Math.cos(a)*1.2;g.position.z=z+Math.sin(a)*1.2;g.rotation.y=-a}});return g}
 function label(p,text,x,y,z,w,h,fg,bgc){const c=document.createElement('canvas');c.width=512;c.height=96;const x2=c.getContext('2d');x2.fillStyle=bgc||'#111';x2.fillRect(0,0,512,96);x2.fillStyle=fg||phos;x2.font='bold 44px monospace';x2.textAlign='center';x2.textBaseline='middle';x2.fillText(text.slice(0,22),256,50);
  const t=new T.CanvasTexture(c);t.magFilter=T.NearestFilter;const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:t}));m.position.set(x,y,z);p.add(m);return m}
 // floor: office carpet tiles
 const fc=document.createElement('canvas');fc.width=fc.height=64;const fx=fc.getContext('2d');for(let i=0;i<8;i++)for(let j=0;j<8;j++){fx.fillStyle=(i+j)%2?(cfg.floorA||'#3d4a6b'):(cfg.floorB||'#34405e');fx.fillRect(i*8,j*8,8,8)}
 const ft=new T.CanvasTexture(fc);ft.magFilter=T.NearestFilter;ft.wrapS=ft.wrapT=T.RepeatWrapping;ft.repeat.set(6,6);const floor=new T.Mesh(new T.PlaneGeometry(14,14),new T.MeshLambertMaterial({map:ft}));floor.rotation.x=-Math.PI/2;floor.name='floor';world.add(floor);
 box(world,14,3.2,.1,cfg.wall||'#5b6b8c',0,1.6,-3.2);box(world,14,.12,.12,'#e8e0c8',0,.06,-3.12);
 if(cfg.year)label(world,String(cfg.year),-2.3,2.15,-3.13,1.1,.42,phos,'#111111');
 {const wc=document.createElement('canvas');wc.width=128;wc.height=64;const w2=wc.getContext('2d');w2.fillStyle='#f4f4f4';w2.fillRect(0,0,128,64);for(let i=0;i<7;i++){w2.strokeStyle=pal[(i*3+1)%16];w2.lineWidth=2;w2.beginPath();w2.moveTo(8+R()*20,8+i*8);w2.lineTo(40+R()*80,8+i*8+R()*4);w2.stroke()}
  const wt=new T.CanvasTexture(wc);wt.magFilter=T.NearestFilter;const wb=new T.Mesh(new T.PlaneGeometry(1.5,.75),new T.MeshBasicMaterial({map:wt}));wb.position.set(1.9,1.75,-3.13);world.add(wb);box(world,1.6,.85,.04,'#888888',1.9,1.75,-3.16)}
 {const pt=new T.Group();pt.position.set(-2.6,0,-2.6);world.add(pt);box(pt,.3,.3,.3,'#aa5500',0,.15,0);for(let i=0;i<9;i++)box(pt,.12,.12,.12,i%2?'#00aa00':'#55ff55',(R()-.5)*.35,.4+R()*.45,(R()-.5)*.35)}
 const cast=(cfg.cast||['roxy']).slice();const S=cfg.scene||'desk';
 // seeded office props for variety (MODEL)
 const PROPS={cabinet:(x,z)=>{box(world,.45,1.1,.5,'#8a8f98',x,.55,z);for(let i=0;i<3;i++){box(world,.4,.02,.01,'#444',x,.25+i*.33,z+.255);box(world,.1,.03,.02,'#ddd',x,.33+i*.33,z+.26)}},
  cooler:(x,z)=>{box(world,.32,.8,.32,'#f2f2f2',x,.4,z);const b=new T.Mesh(new T.CylinderGeometry(.13,.13,.4,10),mat('#55ffff'));b.position.set(x,1.0,z);world.add(b);box(world,.06,.04,.04,'#1f4fd1',x,.6,z+.17)},
  shelf:(x,z)=>{box(world,1.0,1.4,.3,'#6b4a2b',x,.7,z);for(let r=0;r<3;r++){box(world,.96,.03,.28,'#4a321c',x,.25+r*.45,z);for(let k=0;k<8;k++)box(world,.08,.32,.22,pal[(k*3+r*5+2)%16],x-.4+k*.11,.42+r*.45,z+.02)}},
  arcade:(x,z)=>{const g=new T.Group();g.position.set(x,0,z);world.add(g);box(g,.6,1.7,.6,'#26262e',0,.85,0);box(g,.62,.22,.62,'#111',0,1.62,0);box(g,.55,.05,.3,'#333',0,.95,.3);
   for(let i=0;i<3;i++)box(g,.05,.05,.05,['#ff5555','#ffff55','#55ff55'][i],-.12+i*.12,.99,.34);const c=document.createElement('canvas');c.width=32;c.height=24;const c2=c.getContext('2d');for(let i=0;i<60;i++){c2.fillStyle=pal[(R()*16)|0];c2.fillRect((R()*32)|0,(R()*24)|0,3,3)}
   const t=new T.CanvasTexture(c);t.magFilter=T.NearestFilter;const sc2=new T.Mesh(new T.PlaneGeometry(.46,.34),new T.MeshBasicMaterial({map:t}));sc2.position.set(0,1.28,.305);g.add(sc2);label(g,'MAYHEM',0,1.62,.315,.58,.18,phos,'#111')},
  rack:(x,z)=>{box(world,.55,1.6,.55,'#1d1f26',x,.8,z);const L=[];for(let i=0;i<8;i++){box(world,.5,.12,.01,'#30333c',x,.25+i*.17,z+.28);L.push(box(world,.03,.03,.01,'#300',x+.18,.25+i*.17,z+.29))}anim.push(t=>L.forEach((l,i)=>l.material=mat(Math.sin(t*7+i*2.1)>0?'#55ff55':'#063')))},
  poster:(x,z)=>{const ids=Object.keys(CAST),id=ids[(R()*ids.length)|0],c=CAST[id],m=spriteMap(c.style),cols={1:c.skin,2:c.hair,3:c.shirt,4:c.pants,5:c.shoe,6:c.acc,7:'#111111'};const cv=document.createElement('canvas');cv.width=12;cv.height=18;const c2=cv.getContext('2d');c2.fillStyle=pal[(R()*16)|0];c2.fillRect(0,0,12,18);
   m.forEach((r,ri)=>{for(let ci=0;ci<r.length;ci++)if(r[ci]!=='.'){c2.fillStyle=cols[r[ci]];c2.fillRect(ci+1,ri+1,1,1)}});const t=new T.CanvasTexture(cv);t.magFilter=T.NearestFilter;const pm=new T.Mesh(new T.PlaneGeometry(.6,.9),new T.MeshBasicMaterial({map:t}));pm.position.set(x,1.75,-3.13);world.add(pm)}};
 {const keys=Object.keys(PROPS),slots=[[-3.3,-2.75],[-1.0,-2.75],[0.6,-2.75],[3.3,-2.4]],n=S==='booth'?2:3;for(let i=0;i<n;i++){const k=keys[(R()*keys.length)|0],sl=slots[i+(S==='lab'?1:0)]||slots[i];if(k==='poster')PROPS.poster(-.9+i*.9,0);else PROPS[k](sl[0],sl[1])}}
 if(S==='desk'||S==='bbs'){const d=desk(world,0,0,0,1.5);pc(d,-.15,.745,-.05);box(d,.12,.02,.16,'#222',.55,.755,.05);box(d,.12,.02,.16,'#2b5fd9',.55,.775,.05);box(d,.07,.09,.07,'#f2f2f2',-.6,.79,.15);
  if(S==='bbs'){box(d,.22,.05,.16,'#2b2b2b',.42,.77,-.2);const leds=[];for(let i=0;i<6;i++)leds.push(box(d,.018,.012,.01,'#333',.34+i*.032,.775,-.118));anim.push(t=>leds.forEach((l,i)=>l.material=mat(Math.sin(t*9+i*1.7)>.2?'#ff4040':'#331111')));
   box(d,.18,.06,.1,'#c23b22',-.55,.78,-.22);const far=new T.Group();far.position.set(3.4,0,-1.8);world.add(far);desk(far,0,0,-.6,1.0);crt(far,0,.745,0,1.2,-.6);
   const pts=[new T.Vector3(.42,.8,-.2),new T.Vector3(1.6,.15,-.8),new T.Vector3(3.2,.8,-1.7)];const tube=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),40,.012,5),mat('#e8e8e8'));world.add(tube);
   const pk=box(world,.06,.06,.06,phos);const cv=new T.CatmullRomCurve3(pts);anim.push(t=>{pk.position.copy(cv.getPoint((t*.35)%1))})}
  sprite(world,cast[0],-1.05,.25,.5,'sit');if(cast[1])sprite(world,cast[1],1.1,.35,-.5,'idle');if(cast[2])sprite(world,cast[2],-1.6,-.6,.9,'idle')}
 else if(S==='lab'){for(const s of[-1,1]){const d=desk(world,s*1.1,0,0,1.2);pc(d,0,.745,-.05);box(world,.02,1.6,1.6,s<0?'#8b1e1e':'#1e8b4a',s*2.0,.8,.2)}
  const glass=new T.Mesh(new T.BoxGeometry(.04,1.8,2.4),new T.MeshLambertMaterial({color:0x9fd8ff,transparent:true,opacity:.25}));glass.position.set(0,.9,0);glass.name='glass';world.add(glass);
  label(world,'DIRTY ROOM',-1.1,1.7,-3.14,1.4,.26,'#ff5555');label(world,'CLEAN ROOM',1.1,1.7,-3.14,1.4,.26,'#55ff55');
  const card=box(world,.18,.005,.12,'#ffffff',0,.95,0);anim.push(t=>{const k=(t*.25)%1;card.position.x=-1+2*k;card.position.y=.95+Math.sin(k*Math.PI)*.25});
  sprite(world,cast[0]||'wrench',-1.1,.75,Math.PI,'sit');sprite(world,cast[1]||'roxy',1.1,.75,Math.PI,'sit');if(cast[2])sprite(world,cast[2],0,1.2,Math.PI,'idle')}
 else if(S==='luggable'){const d=desk(world,0,0,0,1.5);const g=new T.Group();g.position.set(0,.745,0);d.add(g);box(g,.62,.34,.5,'#d6cdb0',0,.17,-.05);box(g,.6,.04,.28,'#bdb393',0,.02,.36);
  const scr=new T.Mesh(new T.PlaneGeometry(.2,.15),smat);scr.position.set(-.12,.2,.201);g.add(scr);for(const dy of[.24,.14])box(g,.18,.035,.01,'#333',.17,dy,.202);box(g,.3,.03,.05,'#555',0,.35,-.05);
  const o=new T.Group();o.position.set(1.2,.745,-.2);d.add(o);box(o,.36,.3,.34,'#c8c0a0',0,.15,0);box(o,.12,.09,.01,'#163',-.08,.18,.171);
  sprite(world,cast[0]||'wrench',-.9,.7,2.4,'idle');if(cast[1])sprite(world,cast[1],.9,.7,-2.4,'idle')}
 else if(S==='booth'){box(world,4,1.6,.1,'#202a44',0,.8,-2);label(world,(cfg.title||'').toUpperCase(),0,1.45,-1.94,3.4,.5,phos,'#0b0b18');const tb=desk(world,0,-1.2,0,3);
  for(let i=-1;i<=1;i++)crt(tb,i*.9,.745,-.1,1.2);for(let i=0;i<10;i++){const id=['roxy','dex','wrench','madge','boss','kid'][i%6];sprite(world,i<cast.length?cast[i]:id,(R()-.5)*5,.6+R()*2,R()*6,'walk')}}
 else if(S==='house'){for(let i=0;i<4;i++){const d=desk(world,(i%2?1:-1)*1.2,(i<2?-.6:1.2),0,1.2);pc(d,0,.745,-.05)}for(let k=0;k<5;k++)box(world,1.2,.2,.3,'#6b4a2b',3,.1+k*.2,-2.6+k*.3);
  for(let i=0;i<6;i++)box(world,.02,.02,2.4,['#ff3b30','#ffd60a','#30d158','#0a84ff'][i%4],-2+i*.8,.01,0);cast.forEach((id,i)=>sprite(world,id,(i%2?1:-1)*1.2,(i<2?.15:1.95),Math.PI,'sit'))}
 else if(S==='net'||S==='web'){const N=S==='net'?8:6,nodes=[];for(let i=0;i<N;i++){const a=i/N*6.283,r=2.2,x=Math.cos(a)*r,z=Math.sin(a)*r-.4;
   if(S==='net'){const rk=new T.Group();rk.position.set(x,0,z);world.add(rk);box(rk,.4,1.1,.4,'#2a2f3a',0,.55,0);for(let k=0;k<5;k++)box(rk,.36,.04,.01,k%2?phos:'#555',0,.2+k*.18,.205);nodes.push(new T.Vector3(x,1.15,z))}
   else{const c=document.createElement('canvas');c.width=128;c.height=96;const g2=c.getContext('2d');g2.fillStyle='#c0c0c0';g2.fillRect(0,0,128,96);g2.fillStyle='#000080';g2.fillRect(0,0,128,12);g2.fillStyle='#fff';g2.fillRect(4,16,120,76);
    for(let k=0;k<7;k++){g2.fillStyle=pal[(k*5+i)%16];g2.fillRect(8,20+k*10,40+R()*70,6)}const t=new T.CanvasTexture(c);t.magFilter=T.NearestFilter;const pg=new T.Mesh(new T.PlaneGeometry(.8,.6),new T.MeshBasicMaterial({map:t,side:T.DoubleSide}));pg.position.set(x,1.3+Math.sin(i)*.3,z);pg.lookAt(0,1.3,3);world.add(pg);nodes.push(pg.position.clone());const ph=i;anim.push(tt=>{pg.position.y=1.3+Math.sin(tt*.8+ph)*.12})}}
  const links=[];for(let i=0;i<N;i++)for(const j of[(i+1)%N,(i+3)%N]){const g=new T.BufferGeometry().setFromPoints([nodes[i],nodes[j]]);world.add(new T.Line(g,new T.LineBasicMaterial({color:new T.Color(phos)})));links.push([nodes[i],nodes[j]])}
  const pk=[];for(let k=0;k<10;k++){const b=box(world,.07,.07,.07,pal[(k*3+9)%16],0,0,0);pk.push([b,links[k%links.length],R()])}anim.push(t=>pk.forEach(p=>{const u=(t*.4+p[2])%1;p[0].position.lerpVectors(p[1][0],p[1][1],u)}));
  const d=desk(world,0,.6,0,1.4);pc(d,0,.745,-.05);sprite(world,cast[0]||'kid',0,1.35,Math.PI,'sit');if(cast[1])sprite(world,cast[1],-1.1,1.0,2.6,'idle');if(cast[2])sprite(world,cast[2],1.1,1.0,-2.6,'idle');
  if(S==='web'){const sp=new T.Group();world.add(sp);box(sp,.18,.1,.18,'#111',0,0,0);for(let k=0;k<8;k++){const lg=box(sp,.16,.02,.02,'#111',0,0,0);lg.position.set(Math.cos(k/8*6.28)*.14,0,Math.sin(k/8*6.28)*.14);lg.rotation.y=-k/8*6.28}
   box(sp,.03,.03,.03,'#ff2020',.06,.05,.08);box(sp,.03,.03,.03,'#ff2020',-.06,.05,.08);anim.push(t=>{const i=Math.floor(t*.5)%N,j=(i+1)%N,u=(t*.5)%1;sp.position.lerpVectors(nodes[i],nodes[j],u);sp.position.y+=.35})}}
 // helpers for size / render
 let W=1,H=1,rt=null,rtT=null,rtO=null;const post=new T.ShaderMaterial({vertexShader:VS,fragmentShader:FS,depthTest:false,depthWrite:false,uniforms:{tD:{value:null},rs:{value:new T.Vector2(1,1)},pal:{value:pal.map(hex3)},quant:{value:P.quant},scan:{value:P.scan},curve:{value:P.curve},expo:{value:P.expo},glow:{value:P.glow},time:{value:0},dpr:{value:1},phos:{value:hex3(phos)}}});
 const pscene=new T.Scene(),pcam=new T.OrthographicCamera(-1,1,1,-1,0,1);pscene.add(new T.Mesh(new T.PlaneGeometry(2,2),post));
 function mkRT(w,h){return new T.WebGLRenderTarget(Math.max(8,w|0),Math.max(8,h|0),{minFilter:T.NearestFilter,magFilter:T.NearestFilter,depthBuffer:true})}
 function size(){const w=el.clientWidth||640,h=el.clientHeight||400;if(w===W&&h===H&&rt)return;W=w;H=h;renderer.setSize(w,h,false);renderer.domElement.style.width='100%';renderer.domElement.style.height='100%';cam.aspect=w/h;cam.updateProjectionMatrix();if(rt)rt.dispose();rt=mkRT(w/P.px,h/P.px)}
 let yaw=((cfg.seed||0)%1000)/1000*1.4-.7,pitch=0,drag=null;const dom=renderer.domElement;dom.addEventListener('pointerdown',e=>{drag=[e.clientX,e.clientY,yaw,pitch];dom.setPointerCapture(e.pointerId)});dom.addEventListener('pointermove',e=>{if(!drag)return;yaw=drag[2]+(e.clientX-drag[0])*.006;pitch=Math.max(-.35,Math.min(.5,drag[3]+(e.clientY-drag[1])*.004))});dom.addEventListener('pointerup',()=>drag=null);
 function placeCam(t){const a=yaw+Math.sin(t*.12)*P.spin*.8,r=S==='net'||S==='web'?5.2:3.2,h=(S==='net'||S==='web'?2.6:2.05)+pitch*2;cam.position.set(Math.sin(a)*r,h,Math.cos(a)*r);cam.lookAt(0,S==='net'||S==='web'?1.0:.8,0)}
 let lastScr=-1;function testCard(){sx.fillStyle='#000';sx.fillRect(0,0,256,192);sx.fillStyle=phos;sx.font='bold 16px monospace';sx.fillText((cfg.title||'').slice(0,22),8,40);for(let i=0;i<8;i++){sx.fillStyle=pal[(i*2+1)%16];sx.fillRect(8+i*30,80,26,60)}stex.needsUpdate=true}
 function frame(t,target,tw,th){anim.forEach(f=>f(t));placeCam(t);if(target){testCard();lastScr=-1}else if(api.onScreen&&Math.floor(t*6)!==lastScr){lastScr=Math.floor(t*6);sx.fillStyle='#000';sx.fillRect(0,0,256,192);api.onScreen(sx,256,192,t,phos);stex.needsUpdate=true}
  const u=post.uniforms;u.quant.value=P.quant;u.scan.value=P.scan;u.curve.value=P.curve;u.expo.value=P.expo;u.glow.value=P.glow;u.time.value=t;
  u.dpr.value=target?1:DPR;const src=target?target[0]:rt;renderer.setRenderTarget(src);renderer.render(scene,cam);u.tD.value=src.texture;u.rs.value.set(src.width,src.height);renderer.setRenderTarget(target?target[1]:null);renderer.render(pscene,pcam);renderer.setRenderTarget(null)}
 let run=true,t0=performance.now(),k=0;function loop(){if(!run)return;requestAnimationFrame(loop);if(thumb&&(k++&1))return;size();frame((performance.now()-t0)/1000)}
 api.start=()=>{size();loop()};api.stop=()=>{run=false};api.params=P;api.palette=pal;api.paletteNote=PALNOTE[cfg.palette]||'';api.dpr=DPR;api.renderer=renderer;api.scene=scene;api.THREE=T;
 api.setParams=p=>{const oldpx=P.px;Object.assign(P,p);if(P.px!==oldpx&&rt){rt.dispose();rt=mkRT(W/P.px,H/P.px)}};
 api.test=(w,h,t)=>{w=w||128;h=h||96;if(rtT)rtT.dispose();rtT=mkRT(w/P.px,h/P.px);if(!rtO||rtO.width!==w||rtO.height!==h){if(rtO)rtO.dispose();rtO=mkRT(w,h)}frame(t==null?3.3:t,[rtT,rtO]);const b=new Uint8Array(w*h*4);renderer.readRenderTargetPixels(rtO,0,0,w,h,b);return{w,h,data:b}};
 api.toURL=(px)=>{const c=document.createElement('canvas');c.width=px.w;c.height=px.h;const x=c.getContext('2d'),im=x.createImageData(px.w,px.h);for(let y=0;y<px.h;y++)im.data.set(px.data.subarray((px.h-1-y)*px.w*4,(px.h-y)*px.w*4),y*px.w*4);x.putImageData(im,0,0);return c.toDataURL('image/png')};
 api.obj=()=>{scene.updateMatrixWorld(true);const out=['# Mayhem t269 · '+(cfg.title||'')+' · voxel/box scene export (MODEL art), Three.js r160'];let vo=1;const v=new T.Vector3(),M=new T.Matrix4(),IM=new T.Matrix4();
  scene.traverse(o=>{if(!o.isMesh||!o.visible||o.material===post)return;const g=o.geometry,pos=g.attributes.position;if(!pos)return;const idx=g.index?g.index.array:null;const cnt=o.isInstancedMesh?o.count:1;
   for(let ii=0;ii<cnt;ii++){if(o.isInstancedMesh){o.getMatrixAt(ii,IM);M.multiplyMatrices(o.matrixWorld,IM)}else M.copy(o.matrixWorld);out.push('o '+(o.name||o.type)+'_'+ii);
    for(let i=0;i<pos.count;i++){v.fromBufferAttribute(pos,i).applyMatrix4(M);out.push('v '+v.x.toFixed(4)+' '+v.y.toFixed(4)+' '+v.z.toFixed(4))}
    if(idx)for(let i=0;i<idx.length;i+=3)out.push('f '+(idx[i]+vo)+' '+(idx[i+1]+vo)+' '+(idx[i+2]+vo));else for(let i=0;i<pos.count;i+=3)out.push('f '+(i+vo)+' '+(i+1+vo)+' '+(i+2+vo));vo+=pos.count}});return out.join('\n')+'\n'};
 api.spriteSVG=(ids)=>{ids=ids||cast;const V=8;let s='',x0=0;ids.forEach(id=>{const c=CAST[id],m=spriteMap(c.style),cols={1:c.skin,2:c.hair,3:c.shirt,4:c.pants,5:c.shoe,6:c.acc,7:'#111111'};m.forEach((r,ri)=>{for(let ci=0;ci<r.length;ci++)if(r[ci]!=='.')s+=`<rect x="${x0+ci*V}" y="${ri*V}" width="${V}" height="${V}" fill="${cols[r[ci]]}"/>`});x0+=12*V});return{svg:s,w:x0,h:16*V}};
 api.counts=()=>{let meshes=0,inst=0;scene.traverse(o=>{if(o.isMesh){meshes++;if(o.isInstancedMesh)inst+=o.count}});return{meshes,inst,sprites:cast.length}};
 return api}
window.HS={create,PAL,PALNOTE,CAST,spriteMap,rng,sha8};})();
