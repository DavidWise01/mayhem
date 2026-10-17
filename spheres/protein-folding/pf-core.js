/* pf-core.js · MODEL glue by Grok Bot for spheres/protein-folding (not part of Dave's engine).
   HP lattice chains, the I-13 energy program generator, the ARTIST + CRITIC loop, exports. */
(function(G){
'use strict';
const PF={};
PF.DIRS={2:[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0]],3:[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]};
PF.rng=s=>{s=s>>>0||1;return()=>(s=(s*1664525+1013904223)>>>0)/4294967296};
PF.coords=dirs=>{const D=PF.DIRS[3];const c=[[0,0,0]];for(const d of dirs){const p=c[c.length-1],v=D[d];c.push([p[0]+v[0],p[1]+v[1],p[2]+v[2]])}return c};
PF.key=p=>p[0]+','+p[1]+','+p[2];
PF.energy=(seq,C)=>{const m=new Map();let clash=0;C.forEach((p,i)=>{const k=PF.key(p);if(m.has(k))clash++;else m.set(k,i)});let E=0;const contacts=[];
  for(let i=0;i<C.length;i++){if(seq[i]!=='H')continue;for(let j=i+3;j<C.length;j++){if(seq[j]!=='H')continue;const a=C[i],b=C[j];if(Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])+Math.abs(a[2]-b[2])===1){E--;contacts.push([i,j])}}}
  return {E,clash,contacts}};
/* I-13 source: the VM itself counts bonds, clashes and H–H topological contacts from raw coordinates */
PF.lit=v=>G.I13.lit(v);PF.num=PF.lit;
/* I-13 energy program: the VM checks every bond is a unit step, then (lattice is bipartite, so only even separations can collide) clashes, then H–H contacts at odd separation ≥ 3, from raw coordinates */
PF.DD='def dd(I a, I b, I c, I d, I e, I f) { -> (a - d) * (a - d) + (b - e) * (b - e) + (c - f) * (c - f) }\n';
PF.hpGroups=(seq,C)=>{const g=[],L=PF.lit,q=(i,j)=>`dd(${L(C[i][0])}, ${L(C[i][1])}, ${L(C[i][2])}, ${L(C[j][0])}, ${L(C[j][1])}, ${L(C[j][2])})`;
  for(let i=0;i<C.length;i++)for(let j=i+1;j<C.length;j++){const s=j-i;if(s===1)g.push(`if ${q(i,j)} == 1 { bonds.p <- 1 }`);else if(s%2===0)g.push(`if ${q(i,j)} == 0 { clash.p <- 1 }`);else if(s>=3&&seq[i]==='H'&&seq[j]==='H')g.push(`if ${q(i,j)} == 1 { E.p <- 0 - 1 }`)}return g};
PF.engineEnergy=async(seq,C)=>{const r=await G.I13.runChain(PF.DD,PF.hpGroups(seq,C),{E:0,clash:0,bonds:0});return {E:r.globals.E,clash:r.globals.clash,bonds:r.globals.bonds,steps:r.steps,ops:r.ops,runs:r.runs}};
/* lattice rotations (proper, det +1) for pivot moves */
PF.rots=dim=>{const out=[];const perms=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];const par=[1,-1,-1,1,1,-1];
  perms.forEach((p,pi)=>{for(let s=0;s<8;s++){const sg=[s&1?-1:1,s&2?-1:1,s&4?-1:1];if(dim===3&&par[pi]*sg[0]*sg[1]*sg[2]!==1)continue;if(dim===2&&(p[2]!==2||sg[2]!==1))continue;out.push({p,sg})}});
  return out.filter(r=>!(r.p[0]===0&&r.p[1]===1&&r.p[2]===2&&r.sg.every(v=>v===1)))};
PF.dirOf=v=>PF.DIRS[3].findIndex(d=>d[0]===v[0]&&d[1]===v[1]&&d[2]===v[2]);
PF.rotDir=(d,r)=>{const v=PF.DIRS[3][d];return PF.dirOf([v[r.p[0]]*r.sg[0],v[r.p[1]]*r.sg[1],v[r.p[2]]*r.sg[2]])};
/* ARTIST proposes lattice moves; CRITIC scores −E/−Eref (Metropolis at temperature T); workspace loop retunes T */
PF.mkLoop=(spec,seed)=>{const R=PF.rng(seed),n=spec.seq.length,dim=spec.dim,ND=dim*2,RT=PF.rots(dim);
  let dirs=Array(n-1).fill(0),cur=PF.energy(spec.seq,PF.coords(dirs)),best={dirs:dirs.slice(),E:cur.E},T=spec.T0||1.2,acc=0,tries=0,since=0,round=0;const h=[0],log=[],ws=[];
  const score=E=>Math.min(1,(-E)/(-spec.Eref));
  return{get dirs(){return best.dirs},get cur(){return dirs},get best(){return best},get T(){return T},h,log,ws,score,
  one(){round++;tries++;const m=dirs.slice();const k=(R()*(n-1))|0,u=R();let kind;
    if(u<.55){const r=RT[(R()*RT.length)|0];for(let i=k;i<n-1;i++)m[i]=PF.rotDir(m[i],r);kind='pivot@'+k}
    else if(u<.85&&k<n-2){const a=m[k];m[k]=m[k+1];m[k+1]=a;kind='corner@'+k}
    else{m[k]=(R()*ND)|0;kind='kink@'+k}
    const C=PF.coords(m),e=PF.energy(spec.seq,C);let ok=false;
    if(!e.clash){const dE=e.E-cur.E;ok=dE<=0||R()<Math.exp(-dE/T)}
    log.push({agent:'ARTIST',round,move:kind,E:e.clash?null:e.E,critic:e.clash?'clash → reject':(ok?'accept':'reject'),score:e.clash?0:+score(e.E).toFixed(4)});if(log.length>3000)log.shift();
    let imp=false;if(ok){acc++;dirs=m;cur=e;if(e.E<best.E){best={dirs:m.slice(),E:e.E};imp=true}}
    since=imp?0:since+1;h.push(score(best.E));if(h.length>600)h.shift();
    let w=null;if(round%40===0){const rate=acc/tries,old=T;let tr;
      if(since>=40){T=Math.min(3,T*1.5);tr='plateau '+since+' rounds → reheat T'}
      else if(rate<.15){T=Math.min(3,T*1.25);tr='acceptance '+(rate*100).toFixed(0)+'% low → warm T'}
      else if(rate>.45){T=Math.max(.15,T*.7);tr='acceptance '+(rate*100).toFixed(0)+'% high → cool T'}
      else{T=Math.max(.15,T*.9);tr='acceptance '+(rate*100).toFixed(0)+'% healthy → anneal T ×0.9'}
      w={entry:ws.length+1,round,measured:{acceptance:+rate.toFixed(3),score:+score(best.E).toFixed(4),bestE:best.E,plateau:since},tried:tr,T:[+old.toFixed(3),+T.toFixed(3)]};ws.push(w);acc=0;tries=0}
    return{imp,w,kind,E:e.E,clash:e.clash,ok}}}};
PF.toOBJ=(slug,seq,C)=>{let o='# '+slug+' · Mayhem protein-folding · HP lattice chain (MODEL geometry)\n';C.forEach((p,i)=>o+=`v ${p[0]} ${p[1]} ${p[2]}\n`);seq.split('').forEach((s,i)=>{});for(let i=1;i<C.length;i++)o+=`l ${i} ${i+1}\n`;return o};
PF.toSVG=(seq,C,bg,cH,cP,cL)=>{const xs=C.map(p=>p[0]+p[2]*.35),ys=C.map(p=>p[1]+p[2]*.35);const mx=Math.min(...xs),Mx=Math.max(...xs),my=Math.min(...ys),My=Math.max(...ys);const sc=340/Math.max(1,Mx-mx,My-my);const P=i=>[30+(xs[i]-mx)*sc,370-(ys[i]-my)*sc];
  let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="${bg}"/>`;for(let i=1;i<C.length;i++){const a=P(i-1),b=P(i);s+=`<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${cL}" stroke-width="3"/>`}
  C.forEach((p,i)=>{const a=P(i);s+=`<circle cx="${a[0].toFixed(1)}" cy="${a[1].toFixed(1)}" r="${Math.max(3,sc*.22).toFixed(1)}" fill="${seq[i]==='H'?cH:cP}"/>`});return s+'</svg>'};
PF.contactMap=(cv,seq,C,cH,bg)=>{const n=C.length,x=cv.getContext('2d'),W=cv.width,c=W/n;x.fillStyle=bg;x.fillRect(0,0,W,W);for(let i=0;i<n;i++)for(let j=0;j<n;j++){const a=C[i],b=C[j],d=Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])+Math.abs(a[2]-b[2]);if(d===1&&Math.abs(i-j)>=1){x.fillStyle=(seq[i]==='H'&&seq[j]==='H'&&Math.abs(i-j)>=3)?cH:'rgba(255,255,255,.35)';x.fillRect(i*c,j*c,c,c)}}};
PF.post=s=>{if(typeof document==='undefined')return;const b=document.getElementById('board');if(!b)return;const li=document.createElement('li');li.textContent=s;b.appendChild(li);if(b.children.length>60)b.removeChild(b.firstChild);b.scrollTop=1e9};
PF.sha=async t=>{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t));return[...new Uint8Array(b)].map(v=>v.toString(16).padStart(2,'0')).join('')};
/* standard loop proof: 200 seeded rounds must improve, 5 workspace entries, OBJ/SVG consistent, JS energy of the reference fold equals Eref */
PF.loopCheck=(spec,seed,slug)=>{const L=PF.mkLoop(spec,seed);for(let i=0;i<200;i++)L.one();if(!(L.best.E<0))throw Error('no improvement in 200 rounds');if(L.ws.length!==5)throw Error('ws '+L.ws.length);
  if(spec.refDirs){const e=PF.energy(spec.seq,PF.coords(spec.refDirs));if(e.clash||e.E!==spec.Eref)throw Error('reference fold E '+e.E+' ≠ '+spec.Eref)}
  const C=PF.coords(L.dirs),o=PF.toOBJ(slug,spec.seq,C),nv=(o.match(/^v /gm)||[]).length,nl=(o.match(/^l /gm)||[]).length;if(nv!==C.length||nl!==C.length-1)throw Error('obj');const sv=PF.toSVG(spec.seq,C,'#000','#f00','#00f','#fff');if((sv.match(/<circle/g)||[]).length!==nv||(sv.match(/<line/g)||[]).length!==nl)throw Error('svg');
  return '200 ARTIST rounds: best E 0 → '+L.best.E+' (score '+L.score(L.best.E).toFixed(3)+'), workspace loop logged 5 entries, OBJ+SVG '+nv+' residues, '+nl+' bonds'+(spec.refDirs?', reference fold E = '+spec.Eref+' recomputed':'')};
G.PF=PF;if(typeof module!=='undefined')module.exports=PF;
})(typeof window!=='undefined'?window:globalThis);
(function(G){const PF=G.PF;
PF.plot=(cv,series,o={})=>{const d=Math.min(devicePixelRatio||1,2),W=cv.clientWidth||600,H=cv.clientHeight||260;cv.width=W*d;cv.height=H*d;const x=cv.getContext('2d');x.scale(d,d);x.fillStyle=o.bg||'rgba(0,0,0,.55)';x.fillRect(0,0,W,H);
  const all=series.flatMap(s=>s.pts);if(!all.length)return;const X0=o.x0??Math.min(...all.map(p=>p[0])),X1=o.x1??Math.max(...all.map(p=>p[0]));const tf=o.logy?(v=>Math.log10(Math.max(v,1e-300))):(v=>v);const Y0=o.y0??Math.min(...all.map(p=>tf(p[1]))),Y1=o.y1??Math.max(...all.map(p=>tf(p[1])));
  const px=v=>46+(v-X0)/((X1-X0)||1)*(W-60),py=v=>H-28-(tf(v)-Y0)/((Y1-Y0)||1)*(H-44);x.strokeStyle=o.axis||'rgba(255,255,255,.5)';x.lineWidth=1;x.beginPath();x.moveTo(46,8);x.lineTo(46,H-28);x.lineTo(W-10,H-28);x.stroke();
  x.fillStyle=o.axis||'rgba(255,255,255,.8)';x.font='11px monospace';x.fillText(o.xlab||'',W/2-40,H-8);x.save();x.translate(12,H/2+40);x.rotate(-Math.PI/2);x.fillText((o.logy?'log₁₀ ':'')+(o.ylab||''),0,0);x.restore();
  x.fillText((o.logy?'1e':'')+(+Y1.toPrecision(3)),2,14);x.fillText((o.logy?'1e':'')+(+Y0.toPrecision(3)),2,H-30);x.fillText(+X0.toPrecision(3),40,H-16);x.fillText(+X1.toPrecision(3),W-50,H-16);
  series.forEach(s=>{x.strokeStyle=s.color;x.fillStyle=s.color;x.lineWidth=s.w||2.5;if(s.dots){s.pts.forEach(p=>{x.beginPath();x.arc(px(p[0]),py(p[1]),3,0,7);x.fill()})}else{x.beginPath();s.pts.forEach((p,i)=>i?x.lineTo(px(p[0]),py(p[1])):x.moveTo(px(p[0]),py(p[1])));x.stroke()}if(s.label){const p=s.pts[s.pts.length-1];x.fillText(s.label,Math.min(px(p[0])-60,W-120),py(p[1])-6)}});
  if(o.vline!=null){x.strokeStyle='#fff';x.setLineDash([4,4]);x.beginPath();x.moveTo(px(o.vline),8);x.lineTo(px(o.vline),H-28);x.stroke();x.setLineDash([])}};
PF.art2d=(seal,cv,h0,kind)=>{const d=Math.min(devicePixelRatio||1,2),W=cv.clientWidth,H=cv.clientHeight;cv.width=W*d;cv.height=H*d;const x=cv.getContext('2d');x.scale(d,d);let s=parseInt(seal.slice(0,8),16)>>>0;const R=()=>(s=(s*1664525+1013904223)>>>0)/4294967296;
  const gr=x.createRadialGradient(W*.3,H*.3,10,W/2,H/2,Math.max(W,H));gr.addColorStop(0,`hsl(${h0},70%,28%)`);gr.addColorStop(1,`hsl(${(h0+140)%360},60%,6%)`);x.fillStyle=gr;x.fillRect(0,0,W,H);
  if(kind==='lattice'){const g=26;for(let i=0;i<500;i++){let px=Math.round(R()*W/g)*g,py=Math.round(R()*H/g)*g;x.strokeStyle=`hsla(${(h0+R()*60)%360},90%,${50+R()*30}%,.35)`;x.lineWidth=2;x.beginPath();x.moveTo(px,py);for(let j=0;j<12;j++){const k=(R()*4)|0;px+=[g,-g,0,0][k];py+=[0,0,g,-g][k];x.lineTo(px,py)}x.stroke();x.fillStyle=x.strokeStyle;x.beginPath();x.arc(px,py,3,0,7);x.fill()}}
  else if(kind==='rings'){for(let i=0;i<160;i++){x.strokeStyle=`hsla(${(h0+R()*80)%360},90%,${45+R()*35}%,.25)`;x.lineWidth=.5+R()*2;x.beginPath();x.arc(R()*W,R()*H,10+R()*220,0,7);x.stroke()}}
  else if(kind==='helix'){for(let k=0;k<40;k++){const y0=R()*H,a=20+R()*60,f=.01+R()*.03,ph=R()*7;x.strokeStyle=`hsla(${(h0+R()*70)%360},90%,${50+R()*30}%,.3)`;x.lineWidth=1+R()*2;x.beginPath();for(let X=0;X<W;X+=4){const Y=y0+Math.sin(X*f+ph)*a;X?x.lineTo(X,Y):x.moveTo(X,Y)}x.stroke()}}
  else{for(let n=0;n<420;n++){let px=R()*W,py=R()*H;x.strokeStyle=`hsla(${(h0+R()*90)%360},95%,${45+R()*35}%,.33)`;x.lineWidth=.5+R()*2;x.beginPath();x.moveTo(px,py);for(let j=0;j<30;j++){const a=Math.sin(px/W*7)*Math.cos(py/H*5)*6.283;px+=Math.cos(a)*3;py+=Math.sin(a)*3;x.lineTo(px,py)}x.stroke()}}};
})(typeof window!=='undefined'?window:globalThis);
