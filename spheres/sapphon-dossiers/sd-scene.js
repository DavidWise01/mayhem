/* sd-scene.js · MODEL: Three.js r160 (pinned via importmap) sapphon sculpture for the Sapphon Dossiers pages. DPR capped at 2.
   Amethyst core (PATRICIA's final say) · Dave's 12 layers as stacked rings · RED/BLUE/GREEN lane rings · {i}/{id}/{sid} needles. ARTIST+CRITIC morph it live. */
import * as THREE from 'three';import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
const SD=window.SD;
function mat(st,col,k){const C=new THREE.Color(col);const S=THREE;switch(st){
 case 'clay':return new S.MeshLambertMaterial({color:C.lerp(new S.Color('#c0663a'),.5),flatShading:true});
 case 'papyrus':return new S.MeshStandardMaterial({color:C.lerp(new S.Color('#d4a017'),.6),metalness:.8,roughness:.35});
 case 'bronze':return new S.MeshStandardMaterial({color:C.lerp(new S.Color('#cd7f32'),.7),metalness:1,roughness:.3});
 case 'marble':return new S.MeshPhysicalMaterial({color:C.lerp(new S.Color('#ffffff'),.75),roughness:.25,clearcoat:1,clearcoatRoughness:.1});
 case 'mosaic':return new S.MeshStandardMaterial({color:C,flatShading:true,roughness:.6});
 case 'illum':return new S.MeshStandardMaterial({color:C.lerp(new S.Color('#d4af37'),.5),metalness:.7,roughness:.3,emissive:'#1d3fa8',emissiveIntensity:.25});
 case 'ink':return new S.MeshToonMaterial({color:k%3===0?'#b22222':'#1a1a1a'});
 case 'sfumato':return new S.MeshPhysicalMaterial({color:C.lerp(new S.Color('#c9a46a'),.5),roughness:.85,sheen:1,sheenColor:'#fff2d0'});
 case 'baroque':return new S.MeshStandardMaterial({color:C.lerp(new S.Color('#d4af37'),.65),metalness:.95,roughness:.15});
 case 'engraving':return new S.MeshBasicMaterial({color:k%2?'#1b1b1b':'#24527a',wireframe:true});
 case 'deco':return new S.MeshStandardMaterial({color:k%2?C.lerp(new S.Color('#e5c07b'),.7):new S.Color('#d8dde0'),metalness:1,roughness:.08});
 case 'neon':return new S.MeshBasicMaterial({color:C.lerp(new S.Color('#ffffff'),.15),blending:S.AdditiveBlending,transparent:true,opacity:.9});
 default:return new S.MeshPhysicalMaterial({color:C,roughness:.1,transmission:.5,thickness:.6,emissive:C,emissiveIntensity:.15})}}
export async function start(){const subj=await window.SD_READY;if(!subj)return;const box=document.getElementById('v3');const thumb=document.body.classList.contains('thumb');
 const W=thumb?innerWidth:(box.clientWidth||900),H=thumb?innerHeight:(box.clientHeight||540);let R;try{R=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true})}catch(e){box.dataset.webgl='fail';return}
 R.setPixelRatio(Math.min(devicePixelRatio||1,2));R.setSize(W,H);box.appendChild(R.domElement);box.dataset.webgl='ok';
 const st=STYLE,S=new THREE.Scene();S.background=new THREE.Color(PAL.bg);S.fog=new THREE.FogExp2(PAL.bg,st==='sfumato'?.06:.025);
 const C=new THREE.PerspectiveCamera(48,W/H,.1,300);C.position.set(0,3.2,thumb?9:11.5);const O=new OrbitControls(C,R.domElement);O.enableDamping=true;O.autoRotate=true;O.autoRotateSpeed=.6;
 S.add(new THREE.AmbientLight(0xffffff,.55));const dl=new THREE.DirectionalLight(0xffffff,1.6);dl.position.set(5,8,6);S.add(dl);[[PAL.a1,7,3,5],[PAL.a2,-7,-2,-4]].forEach(([c,x,y,z])=>{const l=new THREE.PointLight(c,60,50);l.position.set(x,y,z);S.add(l)});
 const core=new THREE.Mesh(new THREE.IcosahedronGeometry(.5,0),new THREE.MeshPhysicalMaterial({color:'#9b5de5',roughness:.08,transmission:.4,thickness:.5,emissive:'#5a2a9a',emissiveIntensity:.5,flatShading:true}));S.add(core);
 const G=new THREE.Group();S.add(G);let meshes=[];const LANEC=['#ff5d73','#5aa9ff','#3ee07a'];
 const seed=parseInt(SEAL.slice(0,8),16)^(thumb?0:0x5eed);const L=SD.mkLoop(subj,CFG.hue,seed);
 function build(p){meshes.forEach(m=>{G.remove(m);m.geometry.dispose();m.material.dispose()});meshes=[];const rs=SD.rings(subj,p);const seg=st==='mosaic'?[4,28]:st==='engraving'?[6,56]:[14,120];
  rs.forEach(q=>{const col=q.k>=12?LANEC[q.k-12]:new THREE.Color().setHSL((p[3]+q.k/24)%1,.65,.55);const m=new THREE.Mesh(new THREE.TorusGeometry(q.r,Math.max(.02,q.th),seg[0],seg[1]),mat(st,col,q.k));
   m.rotation.order='YXZ';m.rotation.y=q.tw;m.rotation.x=Math.PI/2+(q.k>=12?.42*(q.k-13)+.12:.22*Math.sin(2*q.tw));m.position.y=q.y;G.add(m);meshes.push(m)});
  const d=SD.derive(subj.b,subj.R,subj.B,subj.G);[[d.aI,'#ffcf3e',.35],[d.aID,'#ff7ad9',0],[d.aSID,'#4fd1ff',-.35]].forEach(([a,c,y])=>{const len=2.6;const n=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,len,8),new THREE.MeshBasicMaterial({color:c}));
   const t=a*Math.PI/180;n.rotation.z=Math.PI/2;const g=new THREE.Group();g.add(n);n.position.x=len/2;g.rotation.y=-t+Math.PI/2;g.position.y=y;G.add(g);meshes.push(n);const tip=new THREE.Mesh(new THREE.SphereGeometry(.09,12,8),new THREE.MeshBasicMaterial({color:c}));tip.position.x=len;g.add(tip);meshes.push(tip)});}
 build(L.best);
 const NP=thumb?300:900,pg=new THREE.BufferGeometry(),pp=new Float32Array(NP*3),ph=[];for(let i=0;i<NP;i++){ph.push([Math.random()*6.283,3+Math.random()*4,(Math.random()-.5)*6,.1+Math.random()*.4]);}pg.setAttribute('position',new THREE.BufferAttribute(pp,3));
 const pts=new THREE.Points(pg,new THREE.PointsMaterial({color:PAL.a2,size:st==='neon'?.08:.05,transparent:true,opacity:.8,blending:st==='neon'?THREE.AdditiveBlending:THREE.NormalBlending}));S.add(pts);
 const $=i=>document.getElementById(i),ch=$('chart'),gal=$('gal'),ag=$('ag'),ws=$('wslog'),bd=$('board');let lastB=L.score,lastShot=0,lastVM=0,lastBoard=0,vmMsg='',nlog=0,dirty=false;
 async function vmCritic(p){const t=L.t,Lt=v=>I13.lit(v);let s=I13.LIB+'I a <- '+p.map((v,i)=>`${Lt(SD.W[i])} * (${Lt(v)} - ${Lt(t[i])}) * (${Lt(v)} - ${Lt(t[i])})`).join(' + ')+`\nI sc <- 1 - sq(a / ${Lt(SD.W.reduce((a,b)=>a+b,0))})\n`;
  const r=await I13.run(s),j=SD.critic(p,t);if(Math.abs(r.globals.sc-j)>1e-7)throw Error('VM CRITIC '+r.globals.sc+' ≠ JS '+j);vmMsg=' · VM CRITIC '+r.globals.sc.toFixed(6)+' = JS ✓'}
 function chart(){if(!ch)return;const x=ch.getContext('2d'),w=ch.width,h=ch.height,hs=L.hist.slice(-600);x.fillStyle='rgba(0,0,0,.55)';x.fillRect(0,0,w,h);x.strokeStyle=PAL.a1;x.lineWidth=2;x.beginPath();
  const lo=Math.min(...hs),hi=Math.max(...hs,lo+1e-3);hs.forEach((v,i)=>{const X=i/(hs.length-1||1)*w,Y=h-6-(v-lo)/(hi-lo)*(h-12);i?x.lineTo(X,Y):x.moveTo(X,Y)});x.stroke();x.fillStyle='#fff';x.font='12px monospace';x.fillText('CRITIC '+L.score.toFixed(4)+' · round '+L.round,8,16)}
 function board(){if(!bd)return;let B={};try{B=JSON.parse(localStorage.getItem('mayhem-sapphon-dossiers-board')||'{}')}catch(e){}B[SLUG]={name:NAME,best:+L.score.toFixed(5),rounds:L.round,t:Date.now()};try{localStorage.setItem('mayhem-sapphon-dossiers-board',JSON.stringify(B))}catch(e){}
  bd.innerHTML=Object.entries(B).sort((a,b)=>b[1].best-a[1].best).slice(0,12).map(([k,v])=>`<li><a href="${k}.html">${SD.esc(v.name)}</a> · CRITIC ${v.best.toFixed(4)} · ${v.rounds} rounds</li>`).join('')}
 const dl2=(name,text,type)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click()};
 if($('ej'))$('ej').onclick=()=>dl2(SLUG+'.json',JSON.stringify({page:SLUG,name:NAME,label:'MODEL',subject:subj,derived:SD.derive(subj.b,subj.R,subj.B,subj.G),artist:{params:L.best,rounds:L.round},critic:{score:L.score,target:L.t},workspace:L.log},null,1),'application/json');
 if($('es'))$('es').onclick=()=>dl2(SLUG+'.svg',SD.toSVG(subj,NAME),'image/svg+xml');if($('eo'))$('eo').onclick=()=>dl2(SLUG+'.obj',SD.toOBJ(subj,L.best).text,'text/plain');
 addEventListener('resize',()=>{const w=thumb?innerWidth:box.clientWidth,h=thumb?innerHeight:box.clientHeight;if(w&&h){R.setSize(w,h);C.aspect=w/h;C.updateProjectionMatrix()}});
 const clk=new THREE.Clock();let fr=0;
 function loop(){requestAnimationFrame(loop);const t=clk.getElapsedTime();fr++;
  for(let k=0;k<2;k++){if(L.step())dirty=true}
  if(dirty&&fr%6===0){build(L.best);dirty=false}
  core.rotation.y=t*.8;core.rotation.x=t*.3;const s=1+.06*Math.sin(t*3);core.scale.setScalar(s);
  for(let i=0;i<NP;i++){const q=ph[i];const a=q[0]+t*q[3]*(st==='ink'?.3:1);pp[i*3]=q[1]*Math.cos(a);pp[i*3+1]=q[2]+(st==='neon'?Math.sin(t+i)*.2:0);pp[i*3+2]=q[1]*Math.sin(a)}pg.attributes.position.needsUpdate=true;
  O.update();R.render(S,C);
  if(thumb)return;const now=performance.now();
  if(L.score>lastB+0.004&&now-lastShot>1200&&gal){lastShot=now;lastB=L.score;const im=new Image();im.src=R.domElement.toDataURL('image/jpeg',.7);im.width=140;im.title='CRITIC '+L.score.toFixed(4)+' at round '+L.round;gal.prepend(im);while(gal.children.length>8)gal.lastChild.remove();
   if(window.SD_VM_OK&&now-lastVM>4000){lastVM=now;vmCritic(L.best).catch(e=>{vmMsg=' · '+e.message;console.error(e)})}}
  if(fr%15===0){chart();if(ag)ag.textContent='ARTIST params [twist,gap,gain,hue,thick] = ['+L.best.map(v=>v.toFixed(3)).join(', ')+'] · CRITIC '+L.score.toFixed(4)+vmMsg;
   if(ws&&L.log.length!==nlog){nlog=L.log.length;ws.innerHTML=L.log.slice(-12).map(e=>`<li>round ${e.round}: ${SD.esc(e.msg)} · CRITIC ${e.score.toFixed(4)}</li>`).join('')}}
  if(now-lastBoard>3000){lastBoard=now;board()}}
 loop()}
