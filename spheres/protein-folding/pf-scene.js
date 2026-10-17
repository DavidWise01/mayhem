/* pf-scene.js · MODEL: Three.js r160 (pinned via the page importmap) renderer for the protein-folding pages. DPR capped at 2. */
import * as THREE from 'three';import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
const PF=window.PF;
export function chainGroup(seq,C,st,pal){const g=new THREE.Group();const cx=[0,0,0];C.forEach(p=>{cx[0]+=p[0]/C.length;cx[1]+=p[1]/C.length;cx[2]+=p[2]/C.length});
  const V=C.map(p=>new THREE.Vector3(p[0]-cx[0],p[1]-cx[1],p[2]-cx[2]));
  const mat=(c,em)=>st==='glass'?new THREE.MeshPhysicalMaterial({color:c,roughness:.05,metalness:0,transmission:.85,thickness:.6,emissive:c,emissiveIntensity:.15}):st==='wire'?new THREE.MeshBasicMaterial({color:c,wireframe:true}):new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:em,roughness:.35,metalness:st==='metal'?.9:.3,flatShading:st==='cubes'||st==='gem'});
  const geo=st==='cubes'?new THREE.BoxGeometry(.62,.62,.62):st==='gem'?new THREE.OctahedronGeometry(.42):st==='wire'?new THREE.IcosahedronGeometry(.4,1):st==='torus'?new THREE.TorusGeometry(.26,.11,12,32):new THREE.SphereGeometry(.34,28,18);
  V.forEach((v,i)=>{const m=new THREE.Mesh(geo,mat(seq[i]==='H'?pal.H:pal.P,seq[i]==='H'?.55:.2));m.position.copy(v);if(st==='torus')m.lookAt(0,0,0);g.add(m)});
  if(st==='tube'||st==='glass'||st==='metal'){const cur=new THREE.CatmullRomCurve3(V,false,'catmullrom',.1);g.add(new THREE.Mesh(new THREE.TubeGeometry(cur,C.length*8,.09,10,false),new THREE.MeshStandardMaterial({color:pal.L,emissive:pal.L,emissiveIntensity:.4,roughness:.3})))}
  else for(let i=1;i<V.length;i++){const A=V[i-1],B=V[i];const cy=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,1,8),new THREE.MeshStandardMaterial({color:pal.L,emissive:pal.L,emissiveIntensity:.5}));cy.position.copy(A).add(B).multiplyScalar(.5);cy.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),B.clone().sub(A).normalize());g.add(cy)}
  return g}
export function start(o){const box=document.getElementById('v3'),W=box.clientWidth||900,H=box.clientHeight||540;
  const R=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});R.setPixelRatio(Math.min(devicePixelRatio||1,2));R.setSize(W,H);box.appendChild(R.domElement);
  const S=new THREE.Scene();S.background=new THREE.Color(o.pal.bg);S.fog=new THREE.FogExp2(o.pal.bg,o.fog||.025);const C=new THREE.PerspectiveCamera(50,W/H,.1,400);C.position.set(9,8,12);
  const O=new OrbitControls(C,R.domElement);O.enableDamping=true;O.autoRotate=true;O.autoRotateSpeed=.35;
  S.add(new THREE.AmbientLight(0xffffff,.4));[[o.pal.H,8,6,6],[o.pal.P,-8,4,-5],[0xffffff,0,-7,7]].forEach(([c,x,y,z])=>{const l=new THREE.PointLight(c,90,60);l.position.set(x,y,z);S.add(l)});
  const upd=o.art?o.art(THREE,S,o.pal):null;
  const NP=900,pg=new THREE.BufferGeometry(),pp=new Float32Array(NP*3);for(let i=0;i<NP*3;i++)pp[i]=(Math.random()-.5)*40;pg.setAttribute('position',new THREE.BufferAttribute(pp,3));S.add(new THREE.Points(pg,new THREE.PointsMaterial({color:o.pal.fx||0xffffff,size:.07,transparent:true,opacity:.65})));
  const spec=o.spec;let seed=Date.now()>>>0,LP=PF.mkLoop(spec,seed),grp=null,override=null,fr=0,play=true,lastAudit=0;const audits=[];
  function show(){if(grp)S.remove(grp);const q=override||{seq:spec.seq,C:PF.coords(LP.dirs)};grp=chainGroup(q.seq,q.C,o.style,o.pal);S.add(grp)}
  show();PF.post('CRITIC: target E_ref = '+spec.Eref+' for '+spec.seq.length+'-mer '+spec.seq+' on the '+(spec.dim===2?'square':'cubic')+' lattice; score = −E / '+(-spec.Eref)+'.');
  const ch=document.getElementById('chart'),cx=ch.getContext('2d');ch.width=(ch.clientWidth||900)*2;ch.height=240;
  document.getElementById('pp').onclick=e=>{play=!play;e.target.textContent=play?'⏸ Pause':'▶ Play'};
  document.getElementById('rs').onclick=()=>{seed=(Math.random()*4e9)>>>0;LP=PF.mkLoop(spec,seed);show();PF.post('ARTIST: unfolded chain, fresh seed '+seed+'.')};
  const dl=(n,s,ty)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([s],{type:ty}));a.download=n;a.click()};
  document.getElementById('ej').onclick=()=>dl(o.slug+'-training.json',JSON.stringify({sphere:o.slug,agents:['ARTIST','CRITIC'],seed,sequence:spec.seq,lattice:spec.dim===2?'square 2D':'cubic 3D',E_ref:spec.Eref,attempts:LP.log,workspace_log:LP.ws,best:{dirs:LP.dirs.join(''),E:LP.best.E,coords:PF.coords(LP.dirs)},engine_audits:audits,engine_stats:window.I13&&I13.STATS},null,1),'application/json');
  document.getElementById('es').onclick=()=>dl(o.slug+'.svg',PF.toSVG(spec.seq,PF.coords(LP.dirs),o.pal.css.bg,o.pal.css.H,o.pal.css.P,o.pal.css.L),'image/svg+xml');
  document.getElementById('eo').onclick=()=>dl(o.slug+'.obj',PF.toOBJ(o.slug,spec.seq,PF.coords(LP.dirs)),'text/plain');
  const gal=document.getElementById('gal');let lastG=-1;
  function coop(v){try{const K='mayhem-protein-folding-board',b=JSON.parse(localStorage.getItem(K)||'{}');if(!(b[o.slug]>=v)){b[o.slug]=+v.toFixed(4);localStorage.setItem(K,JSON.stringify(b))}}catch(e){}}
  function tick(){requestAnimationFrame(tick);const t=performance.now()/1000;
    if(play&&fr++%2===0){for(let k=0;k<(o.speed||3);k++){const r=LP.one();
      if(r.imp){const sc=LP.score(LP.best.E);if(!override)show();if(sc>lastG+.001){lastG=sc;PF.post('ARTIST: '+r.kind+' → E = '+LP.best.E+'.');PF.post('CRITIC: score '+sc.toFixed(3)+' (E '+LP.best.E+' / E_ref '+spec.Eref+') kept.');coop(sc);
        R.render(S,C);const im=new Image();im.src=R.domElement.toDataURL('image/png');im.width=120;im.title='E = '+LP.best.E;gal.prepend(im);while(gal.children.length>6)gal.lastChild.remove();
        if(window.I13&&t-lastAudit>.4){lastAudit=t;const Cc=PF.coords(LP.best.dirs),Ej=LP.best.E;PF.engineEnergy(spec.seq,Cc).then(e=>{const ok=e.E===Ej&&e.clash===0&&e.bonds===Cc.length-1;audits.push({E_js:Ej,E_engine:e.E,clash:e.clash,bonds:e.bonds,vm_steps:e.steps,ops:e.ops,match:ok});if(audits.length>200)audits.shift();PF.post('CRITIC (I-13 VM): recount E = '+e.E+', clashes '+e.clash+', bonds '+e.bonds+'/'+(Cc.length-1)+' in '+e.steps+' VM steps '+(ok?'✓':'✗ MISMATCH'))}).catch(err=>PF.post('CRITIC: engine audit failed '+err.message))}}}
      if(r.w){PF.post('WORKSPACE #'+r.w.entry+': '+r.w.tried+'; logged.');const li=document.createElement('li');li.textContent='#'+r.w.entry+' round '+r.w.round+': '+r.w.tried+' (T '+r.w.T[0]+'→'+r.w.T[1]+')';document.getElementById('wslog').prepend(li)}}}
    const pa=pg.attributes.position.array;for(let i=0;i<NP*3;i+=3){pa[i+1]+=o.fxv||-.015;if(pa[i+1]<-20)pa[i+1]=20;if(pa[i+1]>20)pa[i+1]=-20}pg.attributes.position.needsUpdate=true;
    if(upd)upd(t);if(grp)grp.rotation.y=t*.12;O.update();R.render(S,C);
    cx.fillStyle=o.pal.css.chart||'#0b0b12';cx.fillRect(0,0,ch.width,ch.height);cx.strokeStyle=o.pal.css.H;cx.lineWidth=3;cx.beginPath();LP.h.forEach((v,i)=>{const X=i/Math.max(1,LP.h.length-1)*ch.width,Y=ch.height-10-v*(ch.height-20);i?cx.lineTo(X,Y):cx.moveTo(X,Y)});cx.stroke();cx.fillStyle='#fff';cx.font='22px monospace';cx.fillText('CRITIC score '+LP.score(LP.best.E).toFixed(3)+'  best E '+LP.best.E+' / '+spec.Eref+'  T '+LP.T.toFixed(2),10,28)}
  tick();document.body.dataset.webgl=R.getContext()?'ok':'none';
  return {THREE,S,C,R,setOverride(q){override=q;show()},get loop(){return LP}}}
