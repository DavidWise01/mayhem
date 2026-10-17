/* gt-scene.js · MODEL: Three.js r160 (pinned via the page importmap) scene for the game-theory-sapphons pages. DPR capped at 2.
   Centerpiece: a folded star {n/k} whose fold height rises with the agents' score (equilibria drawn as stars, MODEL). */
import * as THREE from 'three';import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
const GT=window.GT;
function mats(st,c1,c2){const S=THREE;if(st==='glass')return new S.MeshPhysicalMaterial({color:c1,roughness:.05,metalness:0,transmission:.8,thickness:.8,emissive:c2,emissiveIntensity:.18,flatShading:true,side:S.DoubleSide});
  if(st==='wire')return new S.MeshBasicMaterial({color:c1,wireframe:true});if(st==='paper')return new S.MeshLambertMaterial({color:c1,side:S.DoubleSide,flatShading:true});
  if(st==='neon')return new S.MeshBasicMaterial({color:c1,side:S.DoubleSide});return new S.MeshStandardMaterial({color:c1,emissive:c2,emissiveIntensity:st==='crystal'?.45:.25,roughness:st==='metal'?.18:.35,metalness:st==='metal'?.9:.2,flatShading:true,side:S.DoubleSide})}
export function start(o){const box=document.getElementById('v3'),W=box.clientWidth||900,H=box.clientHeight||540;
  const R=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});R.setPixelRatio(Math.min(devicePixelRatio||1,2));R.setSize(W,H);box.appendChild(R.domElement);
  const S=new THREE.Scene();S.background=new THREE.Color(o.pal.bg);S.fog=new THREE.FogExp2(o.pal.bg,o.fog||.022);const C=new THREE.PerspectiveCamera(50,W/H,.1,400);C.position.set(0,4,13);
  const O=new OrbitControls(C,R.domElement);O.enableDamping=true;O.autoRotate=true;O.autoRotateSpeed=.35;
  S.add(new THREE.AmbientLight(0xffffff,.45));[[o.pal.A,8,6,6],[o.pal.B,-8,4,-5],[0xffffff,0,-7,7]].forEach(([c,x,y,z])=>{const l=new THREE.PointLight(c,90,60);l.position.set(x,y,z);S.add(l)});
  const [N,K]=o.star;const geo=new THREE.BufferGeometry();const M0=GT.starMesh(N,K,.3);const pos=new Float32Array(M0.F.length*9);geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const star=new THREE.Mesh(geo,mats(o.style,o.pal.A,o.pal.B));const edges=new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color:o.pal.L}));const SG=new THREE.Group();SG.add(star,edges);SG.scale.setScalar(o.starScale||2.2);SG.position.set(...(o.starPos||[0,0,0]));S.add(SG);
  let fold=.3,foldT=.3;function setFold(h){const M=GT.starMesh(N,K,h);M.F.forEach((f,i)=>f.forEach((v,j)=>{pos.set(M.V[v],i*9+j*3)}));geo.attributes.position.needsUpdate=true;geo.computeVertexNormals();edges.geometry.dispose();edges.geometry=new THREE.EdgesGeometry(geo)}setFold(fold);
  const upd=o.art?o.art(THREE,S,o.pal):null;
  const NP=800,pg=new THREE.BufferGeometry(),pp=new Float32Array(NP*3);for(let i=0;i<NP*3;i++)pp[i]=(Math.random()-.5)*44;pg.setAttribute('position',new THREE.BufferAttribute(pp,3));S.add(new THREE.Points(pg,new THREE.PointsMaterial({color:o.pal.fx||0xffffff,size:.07,transparent:true,opacity:.6})));
  const g=o.game;let seed=Date.now()>>>0,LP=GT.mkLoop(g,seed),fr=0,play=true,lastAudit=0,lastG=-1;const audits=[];const an=g.agents||['ROW','COL'];
  GT.post(an[0]+' and '+an[1]+' start playing '+(g.name||'the game')+' by regret matching. Score = 1 − NashConv/'+(+GT.range(g).toFixed(3))+' of their empirical averages; the star folds up as the score rises.');
  const ch=document.getElementById('chart'),cx=ch.getContext('2d');ch.width=(ch.clientWidth||900)*2;ch.height=240;
  document.getElementById('pp').onclick=e=>{play=!play;e.target.textContent=play?'⏸ Pause':'▶ Play'};
  document.getElementById('rs').onclick=()=>{seed=(Math.random()*4e9)>>>0;LP=GT.mkLoop(g,seed);lastG=-1;GT.post('Reseed '+seed+': both agents forget everything.')};
  const dl=(n,s,ty)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([s],{type:ty}));a.download=n;a.click()};
  document.getElementById('ej').onclick=()=>dl(o.slug+'-training.json',JSON.stringify({sphere:o.slug,agents:an,game:{name:g.name,rows:g.rows,cols:g.cols,A:g.A,B:g.B},seed,rounds:LP.log,workspace_log:LP.ws,best:LP.best,averages:LP.avg(),engine_audits:audits,engine_stats:window.I13&&I13.STATS},null,1),'application/json');
  document.getElementById('es').onclick=()=>dl(o.slug+'.svg',GT.toSVG(N,K,LP.traj,o.pal.css.bg,o.pal.css.A,o.pal.css.B,o.pal.css.L),'image/svg+xml');
  document.getElementById('eo').onclick=()=>dl(o.slug+'.obj',GT.toOBJ(o.slug,GT.starMesh(N,K,fold),'{'+N+'/'+K+'} h='+fold.toFixed(3)),'text/plain');
  const gal=document.getElementById('gal');
  function coop(v){try{const Kk='mayhem-game-theory-sapphons-board',b=JSON.parse(localStorage.getItem(Kk)||'{}');if(!(b[o.slug]>=v)){b[o.slug]=+v.toFixed(4);localStorage.setItem(Kk,JSON.stringify(b))}}catch(e){}}
  const state={score:0,x:[],y:[],round:0,loop:null};
  function tick(){requestAnimationFrame(tick);const t=performance.now()/1000;
    if(play&&fr++%2===0){for(let k=0;k<(o.speed||4);k++){const r=LP.one();
      if(r.imp&&r.sc>lastG+.01){lastG=r.sc;const av=LP.avg();GT.post(an[0]+' plays '+av.x.map((v,i)=>g.rows[i]+' '+(v*100).toFixed(0)+'%').join(', ')+' · '+an[1]+' plays '+av.y.map((v,j)=>g.cols[j]+' '+(v*100).toFixed(0)+'%').join(', ')+' → score '+r.sc.toFixed(3)+'.');coop(r.sc);
        R.render(S,C);const im=new Image();im.src=R.domElement.toDataURL('image/png');im.width=120;im.title='score '+r.sc.toFixed(3);gal.prepend(im);while(gal.children.length>6)gal.lastChild.remove();
        if(window.I13&&t-lastAudit>.5){lastAudit=t;const nj=GT.nashConv(g,av.x,av.y);GT.engineNC(g,av.x,av.y).then(e=>{const ok=Math.abs(e.nc-nj)<1e-9;audits.push({round:LP.round,nashConv_js:nj,nashConv_engine:e.nc,vm_steps:e.steps,match:ok});if(audits.length>200)audits.shift();GT.post('I-13 VM audit: NashConv = '+e.nc.toFixed(6)+' in '+e.steps+' VM steps '+(ok?'✓ matches JS':'✗ MISMATCH'))}).catch(err=>GT.post('engine audit failed '+err.message))}}
      if(r.w){GT.post('WORKSPACE #'+r.w.entry+': '+r.w.tried+'; logged.');const li=document.createElement('li');li.textContent='#'+r.w.entry+' round '+r.w.round+': '+r.w.tried+' (ε '+r.w.eps[0]+'→'+r.w.eps[1]+')';document.getElementById('wslog').prepend(li)}
      state.score=r.sc}}
    foldT=.15+1.25*state.score;if(Math.abs(foldT-fold)>.004){fold+=(foldT-fold)*.08;setFold(fold)}
    const av=LP.avg();state.x=av.x;state.y=av.y;state.round=LP.round;state.loop=LP;
    const pa=pg.attributes.position.array;for(let i=0;i<NP*3;i+=3){pa[i+1]+=o.fxv||-.012;if(pa[i+1]<-22)pa[i+1]=22;if(pa[i+1]>22)pa[i+1]=-22}pg.attributes.position.needsUpdate=true;
    if(upd)upd(t,state);SG.rotation.y=t*.2;SG.rotation.x=Math.sin(t*.13)*.3;O.update();R.render(S,C);
    cx.fillStyle=o.pal.css.chart||'#0b0b12';cx.fillRect(0,0,ch.width,ch.height);cx.strokeStyle=o.pal.css.A;cx.lineWidth=3;cx.beginPath();LP.h.forEach((v,i)=>{const X=i/Math.max(1,LP.h.length-1)*ch.width,Y=ch.height-10-v*(ch.height-20);i?cx.lineTo(X,Y):cx.moveTo(X,Y)});cx.stroke();cx.fillStyle='#fff';cx.font='22px monospace';cx.fillText('score '+(LP.h[LP.h.length-1]||0).toFixed(3)+'  best '+Math.max(0,LP.best.score).toFixed(3)+'  round '+LP.round+'  ε '+LP.eps.toFixed(3)+(LP.plus?'  RM+':''),10,28)}
  tick();document.body.dataset.webgl=R.getContext()?'ok':'none';
  return {THREE,S,C,R,state,get loop(){return LP}}}
