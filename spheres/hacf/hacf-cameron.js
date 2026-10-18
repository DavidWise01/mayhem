/* hacf-cameron.js · Mayhem t270 · follow-cam through time, 1983 → ~1995, on axes of gray / white / black.
   MODEL: white = x = time, gray = y = what she builds, black = z = what it costs her (my reading of Dave's phrase).
   Three.js r160 local, DPR ≤ 2; scene materials are all neutral greys, and a grayscale CRT pass makes every output pixel r = g = b. */
(async()=>{'use strict';const T=window.THREE,$=i=>document.getElementById(i),thumb=/[?&]thumb=1/.test(location.search);if(thumb)document.body.classList.add('thumb');
T.ColorManagement.enabled=false;const Tg=(c,s)=>'<span class="t '+c+'">'+c+'</span> '+s,esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const C=window.CAM,S=C.stops,Y0=1983,Y1=1995.2,XS=3,YS=6,ZS=6;const proof=$('proof');window.HACF_READY=null;
const AX={white:'#ffffff',gray:'#808080',black:'#000000'};
const X=y=>(y-Y0)*XS;
// ---- path through (time, build, cost) ----
const pts=[new T.Vector3(X(Y0),S[0].build*YS*.8,S[0].cost*ZS*.8)].concat(S.map(s=>new T.Vector3(X(s.y),s.build*YS,s.cost*ZS))).concat([new T.Vector3(X(Y1),S[S.length-1].build*YS,S[S.length-1].cost*ZS)]);
const curve=new T.CatmullRomCurve3(pts,false,'centripetal');const LUT=[];for(let i=0;i<=2000;i++){const p=curve.getPoint(i/2000);LUT.push([p.x,i/2000])}
function uAtYear(y){const x=X(Math.max(Y0,Math.min(Y1,y)));let lo=0,hi=LUT.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(LUT[m][0]<x)lo=m;else hi=m}const a=LUT[lo],b=LUT[hi];return a[1]+(b[1]-a[1])*((x-a[0])/((b[0]-a[0])||1))}
const posAt=y=>curve.getPoint(uAtYear(y));
// ---- renderer + grayscale CRT pass ----
const el=$('v3'),DPR=Math.min(window.devicePixelRatio||1,thumb?1:2);const R=new T.WebGLRenderer({antialias:false,powerPreference:'low-power'});R.setPixelRatio(DPR);R.outputColorSpace=T.LinearSRGBColorSpace;el.appendChild(R.domElement);R.domElement.style.display='block';
const scene=new T.Scene();scene.background=new T.Color('#4a4a4a');scene.fog=new T.Fog(new T.Color('#4a4a4a'),14,46);
scene.add(new T.HemisphereLight(0xffffff,0x404040,1.25));const sun=new T.DirectionalLight(0xffffff,1.25);sun.position.set(-4,9,8);scene.add(sun);
const cam=new T.PerspectiveCamera(46,1,.05,120);
const MC={};const G=v=>{const h=Math.round(v*255).toString(16).padStart(2,'0');return'#'+h+h+h};
function mat(g){if(!MC[g])MC[g]=new T.MeshLambertMaterial({color:new T.Color(g),flatShading:true});return MC[g]}
const BG=new T.BoxGeometry(1,1,1);function box(p,w,h,d,g,x,y,z){const m=new T.Mesh(BG,mat(g));m.scale.set(w,h,d);m.position.set(x,y,z);p.add(m);return m}
function label(p,text,x,y,z,w,fg,bg,size){const c=document.createElement('canvas');c.width=512;c.height=80;const g=c.getContext('2d');if(bg){g.fillStyle=bg;g.fillRect(0,0,512,80)}g.fillStyle=fg;g.font='bold '+(size||34)+'px monospace';g.textAlign='center';g.textBaseline='middle';g.fillText(text,256,42);
 const t=new T.CanvasTexture(c);t.magFilter=T.NearestFilter;const s=new T.Sprite(new T.SpriteMaterial({map:t,transparent:!bg,depthWrite:false}));s.scale.set(w,w*80/512,1);s.position.set(x,y,z);p.add(s);return s}
// floor grid
const fl=new T.Mesh(new T.PlaneGeometry(60,30),mat('#5a5a5a'));fl.rotation.x=-Math.PI/2;fl.position.set(X(1989),-.01,2);scene.add(fl);
const gl=[];for(let y=1983;y<=1995;y++)gl.push(new T.Vector3(X(y),0,-6),new T.Vector3(X(y),0,8));scene.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(gl),new T.LineBasicMaterial({color:0x6e6e6e})));
// ---- the axes: white x (time), gray y (build), black z (cost) ----
const axes=new T.Group();axes.name='axes';scene.add(axes);const AXM={};
function axis(name,col,dir,len){const m=new T.MeshBasicMaterial({color:new T.Color(col)});AXM[name]=m;const g=new T.Group();g.name='axis-'+name;const r=.07;const sh=new T.Mesh(new T.CylinderGeometry(r,r,len,8),m);sh.position.y=len/2;g.add(sh);const hd=new T.Mesh(new T.ConeGeometry(r*3,r*8,10),m);hd.position.y=len+r*4;g.add(hd);
 if(dir==='x')g.rotation.z=-Math.PI/2;if(dir==='z')g.rotation.x=Math.PI/2;g.position.set(X(Y0)-.6,0,0);axes.add(g);return g}
axis('white',AX.white,'x',X(Y1)-X(Y0)+1.6);axis('gray',AX.gray,'y',YS+1.2);axis('black',AX.black,'z',ZS+1.2);
label(scene,'WHITE · x · TIME →',X(Y1)+1.6,.7,0,4.4,'#ffffff');label(scene,'GRAY · y · WHAT SHE BUILDS',X(Y0)-.6,YS+2.2,0,5.2,'#9a9a9a','#2a2a2a');label(scene,'BLACK · z · WHAT IT COSTS HER',X(Y0)-.6,.6,ZS+2.0,5.2,'#000000','#bdbdbd');
for(let y=1983;y<=1995;y++){box(scene,.05,.3,.05,'#ffffff',X(y),.15,0);label(scene,String(y),X(y),-.0+.55,-.55,1.3,'#ffffff')}
// path tube + era drops
const tube=new T.Mesh(new T.TubeGeometry(curve,400,.06,6),new T.MeshBasicMaterial({color:0xd0d0d0}));tube.name='path';scene.add(tube);
S.forEach(s=>{const p=posAt(s.y);const g=new T.BufferGeometry().setFromPoints([new T.Vector3(p.x,0,p.z),p,new T.Vector3(p.x,0,p.z),new T.Vector3(p.x,0,0),new T.Vector3(X(Y0)-.6,p.y,0),new T.Vector3(p.x,p.y,0)]);
 scene.add(new T.LineSegments(g,new T.LineDashedMaterial({color:0x9a9a9a,dashSize:.15,gapSize:.12})).computeLineDistances());const k=new T.Mesh(new T.SphereGeometry(.16,10,8),new T.MeshBasicMaterial({color:0xffffff}));k.position.copy(p);scene.add(k)});
// ---- dioramas, one per era, behind the timeline (z < 0) ----
const anim=[];const DZ=-3.4;
function desk(p,x,z){box(p,1.4,.06,.7,'#bdbdbd',x,.72,z);for(const a of[-1,1])for(const b of[-1,1])box(p,.06,.72,.06,'#262626',x+a*.62,.36,z+b*.28)}
function crt(p,x,y,z,s){s=s||1;box(p,.4*s,.34*s,.36*s,'#d8d8d8',x,y+.17*s,z);box(p,.3*s,.24*s,.02*s,'#111111',x,y+.18*s,z+.19*s);const sc=box(p,.26*s,.2*s,.01*s,'#9a9a9a',x,y+.18*s,z+.2*s);anim.push(t=>sc.material=mat(Math.sin(t*3+x)>0?'#cfcfcf':'#8a8a8a'))}
function figure(p,x,z,shade,hair){const g=new T.Group();g.position.set(x,0,z);p.add(g);const V=.06,m=['..h.h.h...','.hhhhhhh..','..hssssh..','..s1ss1s..','..ssssss..','...ssss...','..jjjjjj..','.jjwjjwjj.','.sjjjjjjs.','.sjjjjjjs.','..jjjjjj..','..pppppp..','..pp..pp..','..pp..pp..','..pp..pp..','.bbb..bbb.'];
 const col={h:hair||'#f0f0f0',s:'#c8c8c8',1:'#101010',j:shade||'#1c1c1c',w:'#e8e8e8',p:'#5a5a5a',b:'#0a0a0a'};let n=0;m.forEach(r=>{for(const c of r)if(c!=='.')n++});const im=new T.InstancedMesh(BG,new T.MeshLambertMaterial({flatShading:true}),n*2);const M=new T.Matrix4(),cc=new T.Color();let i=0;
 m.forEach((r,ri)=>{for(let ci=0;ci<r.length;ci++){const ch=r[ci];if(ch==='.')continue;for(const zz of[0,1]){M.compose(new T.Vector3((ci-4.5)*V,(15-ri)*V+V/2,(zz-.5)*V),new T.Quaternion(),new T.Vector3(V,V,V));im.setMatrixAt(i,M);cc.set(col[ch]);im.setColorAt(i,cc);i++}}});g.add(im);return g}
const D={cardiff:(g)=>{desk(g,0,0);crt(g,-.2,.75,-.05);box(g,.7,.42,.5,'#a8a8a8',1.6,.21,.1);box(g,.22,.16,.01,'#1a1a1a',1.45,.27,.36);box(g,.66,.05,.3,'#8a8a8a',1.6,.02,.55);label(g,'THE GIANT (MODEL)',1.6,.8,.4,1.6,'#e0e0e0')},
 mutiny:(g)=>{box(g,3.2,1.6,2,'#9a9a9a',0,.8,-.6);const rf=new T.Mesh(new T.ConeGeometry(2.3,1,4),mat('#5e5e5e'));rf.rotation.y=Math.PI/4;rf.scale.set(1,1,.62);rf.position.set(0,2.1,-.6);g.add(rf);desk(g,-.8,.9);crt(g,-.8,.75,.85);desk(g,.9,.9);crt(g,.9,.75,.85);box(g,.08,2.4,.08,'#3a3a3a',2.1,1.2,.6);
  const w=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(2.1,2.3,.6),new T.Vector3(1.4,1.6,.8),new T.Vector3(.9,.8,.9)]),20,.015,4),mat('#e0e0e0'));g.add(w)},
 valley:(g)=>{for(let i=0;i<6;i++)box(g,.5,.4,.5,i%2?'#b0b0b0':'#8e8e8e',-1.2+(i%3)*.55,.2+((i/3)|0)*.4,.4);box(g,1.8,1.0,1.0,'#d0d0d0',1.2,.75,0);box(g,.7,.7,1,'#7a7a7a',2.45,.6,0);for(const xx of[.6,1.8,2.5]){const w=new T.Mesh(new T.CylinderGeometry(.2,.2,.12,10),mat('#1a1a1a'));w.rotation.x=Math.PI/2;w.position.set(xx,.2,.52);g.add(w)}
  for(let i=0;i<3;i++){const h=new T.Mesh(new T.SphereGeometry(1.6+i*.4,10,6,0,Math.PI*2,0,Math.PI/2),mat(['#6a6a6a','#5f5f5f','#727272'][i]));h.position.set(-2+i*2.2,0,-2.2);g.add(h)}},
 atari:(g)=>{box(g,.7,1.8,.7,'#202020',-1,.9,0);box(g,.56,.42,.02,'#b5b5b5',-1,1.3,.36);label(g,'ARCADE',-1,1.95,.37,.8,'#ffffff','#101010');const ring=new T.Mesh(new T.TorusGeometry(1,.05,6,40),mat('#e0e0e0'));ring.rotation.x=Math.PI/2;ring.position.set(1,.05,0);g.add(ring);
  const bk=new T.Group();g.add(bk);box(bk,.5,.12,.08,'#f0f0f0',0,.25,0);for(const xx of[-.22,.22]){const w=new T.Mesh(new T.TorusGeometry(.12,.035,6,14),mat('#111111'));w.position.set(xx,.14,0);bk.add(w)}box(bk,.06,.22,.06,'#888888',.14,.38,0);anim.push(t=>{bk.position.set(1+Math.cos(t*1.3),0,Math.sin(t*1.3));bk.rotation.y=-t*1.3-Math.PI/2})},
 pilgrim:(g)=>{for(let i=0;i<5;i++)for(let j=0;j<5;j++)if((i*7+j*3)%4)box(g,.4,.5+((i+j)%3)*.25,.4,'#8a8a8a',-1.6+i*.42,.3,-.8+j*.42);const tw=new T.Mesh(new T.CylinderGeometry(.35,.42,2.2,8),mat('#b8b8b8'));tw.position.set(1.4,1.1,-.4);g.add(tw);box(g,.9,.3,.9,'#9a9a9a',1.4,2.3,-.4);
  const c=document.createElement('canvas');c.width=128;c.height=96;const x=c.getContext('2d');x.fillStyle='#c8c8c8';x.fillRect(0,0,128,96);x.fillStyle='#303030';x.fillRect(0,0,128,12);x.fillStyle='#f4f4f4';x.fillRect(4,16,120,76);for(let k=0;k<6;k++){x.fillStyle=G(.2+k*.1);x.fillRect(8,22+k*11,30+k*14,6)}
  const t=new T.CanvasTexture(c);t.magFilter=T.NearestFilter;const pl=new T.Mesh(new T.PlaneGeometry(1.4,1.05),new T.MeshBasicMaterial({map:t,side:T.DoubleSide}));pl.position.set(-.2,2.4,.2);g.add(pl);anim.push(tt=>pl.position.y=2.4+Math.sin(tt*.9)*.12)},
 rover:(g)=>{const dog=new T.Group();dog.position.set(-1,0,.2);g.add(dog);box(dog,.6,.28,.26,'#d6d6d6',0,.4,0);box(dog,.26,.24,.22,'#d6d6d6',.38,.6,0);box(dog,.1,.08,.1,'#111111',.55,.58,0);for(const a of[-.2,.2])for(const b of[-.09,.09])box(dog,.07,.28,.07,'#bdbdbd',a,.14,b);box(dog,.22,.05,.05,'#bdbdbd',-.38,.55,0);
  anim.push(t=>{dog.position.y=Math.abs(Math.sin(t*4))*.05});const cm=new T.Mesh(new T.SphereGeometry(.3,12,10),new T.MeshBasicMaterial({color:0xffffff}));g.add(cm);const tail=[];for(let i=0;i<7;i++){const s=box(g,.18-i*.02,.18-i*.02,.18-i*.02,G(.9-i*.1),0,0,0);tail.push(s)}
  anim.push(t=>{const cx=1.2+Math.cos(t*.5)*.6,cy=2.2+Math.sin(t*.7)*.3;cm.position.set(cx,cy,0);tail.forEach((s,i)=>s.position.set(cx-.25*(i+1),cy+.08*(i+1),0))});label(g,'ROVER',-1,1.05,.2,.9,'#ffffff');label(g,'COMET',1.2,2.9,0,.9,'#ffffff')},
 next:(g)=>{box(g,1.6,.08,.5,'#9a9a9a',0,.45,0);for(const a of[-.7,.7])box(g,.08,.45,.45,'#444444',a,.22,0);figure(g,.45,.5,'#2a2a2a','#202020');const sunm=new T.Mesh(new T.CircleGeometry(1.1,24),new T.MeshBasicMaterial({color:0xffffff}));sunm.position.set(0,1.6,-1.6);g.add(sunm)}};
S.forEach(s=>{const g=new T.Group();g.position.set(X(s.y),0,DZ);g.name='era-'+s.key;scene.add(g);box(g,4.2,.12,3,'#6e6e6e',0,.06,0);D[s.key](g);label(g,String(Math.floor(s.y))+' · '+s.title.toUpperCase(),0,3.3,0,4.2,'#ffffff','#1c1c1c',26)});
// ---- her: original voxel coder on a hover board (MODEL, inspired by Cameron Howe, not a likeness) ----
const her=new T.Group();her.name='her';scene.add(her);const body=figure(her,0,0,'#141414','#f2f2f2');const board=box(her,.7,.06,.3,'#e6e6e6',0,-.05,0);const glow=box(her,.5,.02,.2,'#ffffff',0,-.1,0);
// ---- follow camera: FOLLOWER's params ----
const P={dist:4.2,height:1.6,side:-.55,lead:1.2,fov:46,lag:.08,px:2,levels:10,scan:.35,curve:.06};
const B={dist:[2.4,8],height:.4,side:[-1.3,1.3],lead:[0,3],fov:[34,70],px:[1,4,1],levels:[4,16,1],scan:[0,.8],curve:[0,.16]};B.height=[.3,4];
function desired(y,p){p=p||P;const h=posAt(y),a=p.side;const pos=new T.Vector3(h.x-Math.sin(-a)*p.dist,h.y+p.height,h.z+Math.cos(a)*p.dist);const look=new T.Vector3(h.x+p.lead,h.y+.6,h.z);return{pos,look,h}}
function placeHer(y,t){const h=posAt(y),h2=posAt(y+.05);her.position.copy(h);her.position.y+=.12+Math.sin(t*3)*.04;her.rotation.y=Math.atan2(-(h2.z-h.z),h2.x-h.x)}
// grayscale post
const post=new T.ShaderMaterial({uniforms:{tD:{value:null},rs:{value:new T.Vector2(1,1)},levels:{value:10},scan:{value:.35},curve:{value:.06},dpr:{value:1},time:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
 fragmentShader:'uniform sampler2D tD;uniform vec2 rs;uniform float levels,scan,curve,dpr,time;varying vec2 vUv;void main(){vec2 c=vUv*2.-1.;c*=1.+curve*dot(c.yx,c.yx);vec2 uv=c*.5+.5;if(uv.x<0.||uv.x>1.||uv.y<0.||uv.y>1.){gl_FragColor=vec4(0.,0.,0.,1.);return;}vec3 s=texture2D(tD,uv).rgb;float l=dot(s,vec3(.299,.587,.114));l=floor(l*(levels-1.)+.5)/(levels-1.);float r=step(mod(gl_FragCoord.y,3.*dpr),dpr*.999);l*=1.-scan*.4*r;l*=1.-.3*curve*dot(c,c)*2.;l=clamp(l,0.,1.);gl_FragColor=vec4(l,l,l,1.);}',depthTest:false,depthWrite:false});
const ps=new T.Scene(),pc=new T.OrthographicCamera(-1,1,1,-1,0,1);ps.add(new T.Mesh(new T.PlaneGeometry(2,2),post));
const mk=(w,h)=>new T.WebGLRenderTarget(Math.max(8,w|0),Math.max(8,h|0),{minFilter:T.NearestFilter,magFilter:T.NearestFilter});
let W=0,H=0,rt=null;function size(){const w=el.clientWidth||800,h=el.clientHeight||500;if(w===W&&h===H&&rt)return;W=w;H=h;R.setSize(w,h,false);R.domElement.style.width='100%';R.domElement.style.height='100%';if(rt)rt.dispose();rt=mk(w/P.px,h/P.px)}
function draw(y,t,target,p){p=p||P;anim.forEach(f=>f(t));placeHer(y,t);const d=desired(y,p);if(!target){cam.position.lerp(d.pos,p.lag);camLook.lerp(d.look,p.lag)}else{cam.position.copy(d.pos);camLook.copy(d.look)}cam.fov=p.fov;cam.aspect=target?target[1].width/target[1].height:W/H;cam.updateProjectionMatrix();cam.lookAt(camLook);
 const u=post.uniforms;u.levels.value=p.levels;u.scan.value=p.scan;u.curve.value=p.curve;u.time.value=t;u.dpr.value=target?1:DPR;const src=target?target[0]:rt;R.setRenderTarget(src);R.render(scene,cam);u.tD.value=src.texture;u.rs.value.set(src.width,src.height);R.setRenderTarget(target?target[1]:null);R.render(ps,pc);R.setRenderTarget(null)}
const camLook=new T.Vector3();function resync(){const d=desired(year);cam.position.copy(d.pos);camLook.copy(d.look)}
// ---- timeline UI ----
let year=Y0,playing=true,speed=.8,last=performance.now(),t0=performance.now();
function eraAt(y){let e=S[0];S.forEach(s=>{if(y>=s.y-.6)e=s});return e}
function ui(){if(thumb)return;$('scrub').value=year.toFixed(2);$('yr').textContent=year.toFixed(1);const e=eraAt(year);if($('era').dataset.k!==e.key){$('era').dataset.k=e.key;
 $('era').innerHTML='<h3>'+Math.floor(e.y)+' · '+esc(e.title)+' <small>('+esc(e.place)+')</small></h3><p>'+Tg('MODEL','show reference: '+esc(e.show))+'</p><ul>'+e.lit.map(f=>'<li>'+Tg('LIT','<b>'+f[0]+'</b> · '+esc(f[1])+' <small>('+esc(f[2])+')</small>')+'</li>').join('')+'</ul><p>'+Tg('MODEL','gray (builds) '+e.build.toFixed(2)+' · black (costs) '+e.cost.toFixed(2)+': my reading, not a measurement')+'</p>';
 document.querySelectorAll('#stops button').forEach(b=>b.classList.toggle('on',b.dataset.k===e.key))}}
function loop(){requestAnimationFrame(loop);const now=performance.now(),dt=Math.min(.1,(now-last)/1000);last=now;if(playing){year+=dt*speed;if(year>Y1)year=Y0}if(thumb&&(Math.floor(now/16)&1))return;size();draw(year,(now-t0)/1000);ui()}
if(thumb){size();cam.position.copy(desired(Y0).pos);camLook.copy(desired(Y0).look);loop();window.HACF_READY={ok:true,thumb:true};return}
$('stops').innerHTML=S.map(s=>'<button data-k="'+s.key+'" data-y="'+s.y+'">'+Math.floor(s.y)+' · '+esc(s.title)+'</button>').join('');
document.querySelectorAll('#stops button').forEach(b=>b.onclick=()=>{year=+b.dataset.y;playing=false;$('play').textContent='▶ autoplay'});
$('scrub').oninput=e=>{year=+e.target.value;playing=false;$('play').textContent='▶ autoplay'};$('play').onclick=()=>{playing=!playing;$('play').textContent=playing?'❚❚ pause':'▶ autoplay'};$('spd').oninput=e=>speed=+e.target.value;
window.CAM_SET=y=>{year=y;playing=false;const d=desired(y);cam.position.copy(d.pos);camLook.copy(d.look)};
// ---- checks ----
const facts=[];try{
 const sb=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(NAME+'|'+SLUG+'|'+BLURB)),sh=[...new Uint8Array(sb)].map(v=>v.toString(16).padStart(2,'0')).join('');if(sh!==SEAL)throw Error('seal mismatch');
 if(T.REVISION!=='160')throw Error('three r'+T.REVISION);if(DPR>2)throw Error('DPR '+DPR);
 if(AXM.white.color.getHexString()!=='ffffff'||AXM.gray.color.getHexString()!=='808080'||AXM.black.color.getHexString()!=='000000')throw Error('axis colours');
 facts.push(['LIT','axes are exactly white #ffffff (x), gray #808080 (y) and black #000000 (z)']);
 let nonGray=0;Object.values(MC).forEach(m=>{const c=m.color;if(Math.abs(c.r-c.g)>1e-6||Math.abs(c.g-c.b)>1e-6)nonGray++});scene.traverse(o=>{if(o.isInstancedMesh&&o.instanceColor){const a=o.instanceColor.array;for(let i=0;i<a.length;i+=3)if(Math.abs(a[i]-a[i+1])>1e-6||Math.abs(a[i+1]-a[i+2])>1e-6)nonGray++}});if(nonGray)throw Error(nonGray+' non-grey materials');
 facts.push(['LIT','every scene material and voxel is a neutral grey ('+Object.keys(MC).length+' material tones checked, r = g = b)']);
 for(let i=1;i<S.length;i++)if(!(S[i].y>S[i-1].y))throw Error('stops out of order');if(S[0].y<1983||S[0].y>1984)throw Error('does not start ~1983');S.forEach(s=>{if(!(s.build>=0&&s.build<=1&&s.cost>=0&&s.cost<=1))throw Error('axis value');s.lit.forEach(f=>{if(!f[2]||f[0]<1975||f[0]>1995)throw Error('LIT fact')})});
 let px=-1e9;for(let i=0;i<=600;i++){const x=posAt(Y0+i/600*(Y1-Y0)).x;if(x<px-1e-6)throw Error('time runs backwards on x');px=x}S.forEach(s=>{const p=posAt(s.y);if(Math.abs(p.x-X(s.y))>.02||Math.abs(p.y-s.build*YS)>.05||Math.abs(p.z-s.cost*ZS)>.05)throw Error('path misses '+s.key)});
 facts.push(['LIT','her path moves forward along white (time) everywhere (601 samples), and passes through all '+S.length+' era points at gray = builds × '+YS+', black = costs × '+ZS]);
}catch(e){proof.innerHTML=Tg('WALL','FAIL '+esc(e.message));window.HACF_READY={ok:false,err:e.message};throw e}
size();cam.position.copy(desired(Y0).pos);camLook.copy(desired(Y0).look);loop();
// ---- FOLLOWER + CRITIC loop ----
const rtA=mk(80,60),rtB=mk(160,120),buf=new Uint8Array(160*120*4);const ray=new T.Raycaster();const occl=[];scene.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&o!==tube&&!her.children.includes(o)&&o!==fl)occl.push(o)});
function critic(p){let sF=0,sS=0,sC=0,sO=0,gray=0;const yrs=S.map(s=>s.y);const keep={px:P.px};yrs.forEach(y=>{const tA=mk(160/p.px,120/p.px);draw(y,2,[tA,rtB],p);tA.dispose();R.readRenderTargetPixels(rtB,0,0,160,120,buf);let s=0,s2=0;for(let i=0;i<buf.length;i+=4){if(buf[i]!==buf[i+1]||buf[i+1]!==buf[i+2])gray++;const l=buf[i]/255;s+=l;s2+=l*l}const n=buf.length/4,m=s/n,sd=Math.sqrt(Math.max(0,s2/n-m*m));sC+=Math.min(1,sd/.2)*(1-Math.abs(m-.42));
  const h=her.position.clone().add(new T.Vector3(0,.5,0)),pr=h.clone().project(cam);sF+=Math.max(0,1-Math.hypot(pr.x-0,pr.y+.1)/1.0);const top=her.position.clone().add(new T.Vector3(0,1.0,0)).project(cam),bot=her.position.clone().project(cam);const fr=Math.abs(top.y-bot.y)/2;sS+=Math.max(0,1-Math.abs(fr-.22)/.22);
  ray.set(cam.position,h.clone().sub(cam.position).normalize());const hits=ray.intersectObjects(occl,false).filter(x=>x.distance<cam.position.distanceTo(h)-.3);sO+=hits.length?0:1});
 const n=yrs.length,c=[sF/n,sS/n,sC/n,sO/n];return{c,s:100*(c[0]*.3+c[1]*.25+c[2]*.2+c[3]*.25),gray}}
const NAMES=['framing (her near the centre)','her size on screen','grey contrast','clear line of sight'];
const RR=(()=>{let a=parseInt(SEAL.slice(0,8),16)>>>0;return()=>{a=a+0x6D2B79F5>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}})();
const clampP=p=>{const o=Object.assign({},p);for(const k in B){const[a,b,st]=B[k];o[k]=Math.max(a,Math.min(b,o[k]));if(st)o[k]=Math.round(o[k]);o[k]=+o[k].toFixed(4)}return o};
let best=clampP(P),bR=critic(best),hist=[bR.s],tried=[bR.s],gal=[];const gal0=()=>{};
function snap(y){const a=mk(320/best.px,240/best.px),b=mk(320,240);draw(y,2,[a,b],best);const px=new Uint8Array(320*240*4);R.readRenderTargetPixels(b,0,0,320,240,px);a.dispose();b.dispose();const c=document.createElement('canvas');c.width=320;c.height=240;const x=c.getContext('2d'),im=x.createImageData(320,240);for(let r=0;r<240;r++)im.data.set(px.subarray((239-r)*1280,(240-r)*1280),r*1280);x.putImageData(im,0,0);return c.toDataURL()}
function step(){const ks=Object.keys(B),k=ks[(RR()*ks.length)|0],c=Object.assign({},best),[a,b]=B[k];c[k]=best[k]+(RR()-.5)*(b-a)*.45;const cc=clampP(c),r=critic(cc);tried.push(r.s);const kept=r.s>bR.s;
 $('board').insertAdjacentHTML('beforeend','<li>FOLLOWER tries '+k+' → '+cc[k]+' · CRITIC '+r.s.toFixed(2)+(kept?' <b>kept</b>':' rejected')+'</li>');$('board').scrollTop=1e9;if(kept){best=cc;bR=r}hist.push(bR.s)}
function chart(){const c=$('chart'),x=c.getContext('2d'),w=c.width=c.clientWidth*Math.min(devicePixelRatio||1,2),h=c.height=120*Math.min(devicePixelRatio||1,2);x.fillStyle='#111';x.fillRect(0,0,w,h);const mn=Math.min(...tried)-2,mx=Math.max(...tried)+2,Xc=i=>8+i/Math.max(1,hist.length-1)*(w-16),Yc=v=>h-8-(v-mn)/(mx-mn)*(h-16);
 tried.forEach((v,i)=>{x.fillStyle='#777';x.fillRect(Xc(i)-2,Yc(v)-2,4,4)});x.strokeStyle='#fff';x.lineWidth=3;x.beginPath();hist.forEach((v,i)=>i?x.lineTo(Xc(i),Yc(v)):x.moveTo(Xc(i),Yc(v)));x.stroke();$('comp').innerHTML=bR.c.map((v,i)=>'<div>'+NAMES[i]+' <span class="bar" style="width:'+(v*160|0)+'px"></span> '+(v*100).toFixed(0)+'</div>').join('');$('params').textContent=JSON.stringify(best)}
function rounds(n){for(let i=0;i<n;i++)step();Object.assign(P,best);if(rt){rt.dispose();rt=mk(W/P.px,H/P.px)}chart();resync()}
try{rounds(12);for(let i=1;i<hist.length;i++)if(hist[i]<hist[i-1]-1e-9)throw Error('loop went backwards');const re=critic(best);if(Math.abs(re.s-bR.s)>.75)throw Error('CRITIC not reproducible');if(re.gray)throw Error(re.gray+' non-grey output pixels');
 facts.push(['LIT','every rendered test pixel is grey: '+(7*160*120)+' pixels over the 7 era stops, r = g = b in all of them']);
 gal=S.filter((s,i)=>i%2===0||i===S.length-1).map(s=>[s,snap(s.y)]);$('gal').innerHTML=gal.map(g=>'<figure><img src="'+g[1]+'" width="200" height="150"><figcaption>'+Math.floor(g[0].y)+' · '+esc(g[0].title)+'</figcaption></figure>').join('');
 resync();$('computed').innerHTML=facts.map(f=>'<li>'+Tg(f[0],esc(f[1]))+'</li>').join('');
 proof.innerHTML=Tg('LIT','self-check passed: seal recomputed · Three.js r'+T.REVISION+' at DPR '+DPR+' · '+facts.length+' checks (axis colours, grey-only scene and output, path follows time) · '+(hist.length-1)+' FOLLOWER rounds, CRITIC '+hist[0].toFixed(2)+' → '+bR.s.toFixed(2)+' (never down, re-render '+re.s.toFixed(2)+')');
 window.HACF_READY={ok:true,score:bR.s,rounds:hist.length-1,checks:facts.length,dpr:DPR,params:best}}
catch(e){proof.innerHTML=Tg('WALL','FAIL '+esc(e.message));window.HACF_READY={ok:false,err:e.message};throw e}
$('again').onclick=()=>rounds(4);
function dl(n,d,t){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([d],{type:t}));a.download=n;a.click()}
$('xjson').onclick=()=>dl('hacf-cameron.json',JSON.stringify({mayhem:'t270',said:C.dave,axes:{white:'x = time (years from 1983)',gray:'y = what she builds (MODEL reading, 0..1 × '+YS+')',black:'z = what it costs her (MODEL reading, 0..1 × '+ZS+')'},stops:S,follower:best,critic:{score:bR.s,components:Object.fromEntries(bR.c.map((v,i)=>[NAMES[i],+v.toFixed(4)]))},history:hist,seal:SEAL,three:'r'+T.REVISION,dpr:DPR},null,2),'application/json');
$('xsvg').onclick=()=>{const w=760,h=420,sx=y=>40+(y-Y0)/(Y1-Y0)*(w-80),pl=(f)=>{let s='';for(let i=0;i<=300;i++){const y=Y0+i/300*(Y1-Y0),p=posAt(y);s+=sx(y).toFixed(1)+','+f(p).toFixed(1)+' '}return s};
 dl('hacf-cameron.svg','<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'"><rect width="100%" height="100%" fill="#7a7a7a"/><text x="40" y="24" font-family="monospace" font-size="14" fill="#fff">following her, 1983 → 1995 · white = time · gray = builds · black = costs (MODEL)</text><line x1="40" y1="200" x2="'+(w-30)+'" y2="200" stroke="#fff" stroke-width="3"/><line x1="40" y1="200" x2="40" y2="40" stroke="#808080" stroke-width="3"/><line x1="40" y1="400" x2="'+(w-30)+'" y2="400" stroke="#fff" stroke-width="3"/><line x1="40" y1="400" x2="40" y2="240" stroke="#000" stroke-width="3"/><polyline fill="none" stroke="#c0c0c0" stroke-width="3" points="'+pl(p=>200-p.y/YS*150)+'"/><polyline fill="none" stroke="#000" stroke-width="3" points="'+pl(p=>400-p.z/ZS*150)+'"/>'+S.map(s=>'<text x="'+sx(s.y)+'" y="218" font-family="monospace" font-size="10" fill="#fff" text-anchor="middle">'+Math.floor(s.y)+'</text>').join('')+'</svg>','image/svg+xml')};
$('xobj').onclick=()=>{const o=['# Mayhem t270 · her path through (time, builds, costs) + the gray/white/black axes · MODEL','o path'];const N=400;for(let i=0;i<=N;i++){const p=curve.getPoint(i/N);o.push('v '+p.x.toFixed(4)+' '+p.y.toFixed(4)+' '+p.z.toFixed(4))}o.push('l '+Array.from({length:N+1},(_,i)=>i+1).join(' '));const x0=X(Y0)-.6;let b=N+2;
 [['axis_white_x_time',[X(Y1)+1,0,0]],['axis_gray_y_builds',[x0,YS+1.2,0]],['axis_black_z_costs',[x0,0,ZS+1.2]]].forEach(([n,e])=>{o.push('o '+n,'v '+x0+' 0 0','v '+e.join(' '),'l '+b+' '+(b+1));b+=2});dl('hacf-cameron.obj',o.join('\n')+'\n','text/plain')};
$('snap').onclick=()=>{const u=snap(year);resync();$('gal').insertAdjacentHTML('beforeend','<figure><img src="'+u+'" width="200" height="150"><figcaption>'+year.toFixed(1)+'</figcaption></figure>')};
})();
