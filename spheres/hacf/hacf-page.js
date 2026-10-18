/* hacf-page.js · Mayhem t269 · page runner: seal → data checks → Three.js r160 scene (DPR ≤ 2) → interactive widget + its LIT test
   → ARTIST/CRITIC (or BUILDER/WEAVER/CRITIC) improvement loop scored from real pixels → chart, gallery, exports. Throws on any failed check. */
(async()=>{'use strict';const $=i=>document.getElementById(i),PG=window.PAGE,ARC=window.ARC,thumb=/[?&]thumb=1/.test(location.search);if(thumb)document.body.classList.add('thumb');
const T=(c,s)=>'<span class="t '+c+'">'+c+'</span> '+s,esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
async function sha(t){if(crypto&&crypto.subtle){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t));return[...new Uint8Array(b)].map(v=>v.toString(16).padStart(2,'0')).join('')}throw Error('no crypto.subtle')}
const done=r=>{window.HACF_READY=r};const proof=$('proof');
let api;try{api=HS.create($('v3'),{scene:PG.scene,palette:ARC.pal,phos:ARC.pc,cast:PG.cast,title:PG.title,year:PG.year,seed:HS.sha8(PG.slug),thumb,bg:ARC.bg,floorA:ARC.fa,floorB:ARC.fb,wall:ARC.wall})}catch(e){if(proof)proof.innerHTML=T('WALL','FAIL 3D: '+esc(e.message));done({ok:false,err:e.message});throw e}
if(thumb){api.onScreen=(x,w,h,t,p)=>HWX.term(x,w,h,[PG.year+'',PG.title.toUpperCase(),'','MAYHEM · HACF '+String(PG.n).padStart(2,'0'),(Math.floor(t*2)%2?'█':' ')],p,'ARC '+ARC.n);api.start();done({ok:true,thumb:true});return}
const facts=[];let widget=null;
try{
 const h=await sha(NAME+'|'+SLUG+'|'+BLURB);if(h!==SEAL)throw Error('seal mismatch');
 if(THREE.REVISION!=='160')throw Error('three r'+THREE.REVISION);if(api.dpr>2)throw Error('DPR '+api.dpr);
 if(!(PG.year>=ARC.span[0]&&PG.year<=ARC.span[1]))throw Error('year outside arc');if(PG.facts.length<2)throw Error('too few facts');
 PG.facts.forEach(f=>{if(!['LIT','AMBER','MODEL','WALL'].includes(f[0]))throw Error('bad tag');if(f[0]==='LIT'&&!f[3])throw Error('LIT fact without source');if(!(f[1]>=1900&&f[1]<=2017))throw Error('fact year')});
 const ag=PG.agents.split('+');if(!(ag.length===2||ag.length===3)||ag[ag.length-1]!=='CRITIC')throw Error('agents');
 widget=HW[PG.widget]($('wd'),PG);api.onScreen=(x,w,h,t,p)=>{try{widget.screen(x,w,h,t,p)}catch(e){}};
 widget.test().forEach(f=>facts.push(f));
}catch(e){proof.innerHTML=T('WALL','FAIL '+esc(e.message));done({ok:false,err:e.message});throw e}
$('computed').innerHTML=facts.map(f=>'<li>'+T(f[0],esc(f[1]))+'</li>').join('');api.start();
// ---- improvement loop ----
const seal=SEAL,wts=[0,1,2,3,4].map(i=>.6+parseInt(seal.slice(i*2,i*2+2),16)/255*.8),ws=wts.reduce((a,b)=>a+b,0);const NAMES=['palette fidelity','contrast','scanlines','exposure','pixel blocks'];
function critic(px){const d=px.data,w=px.w,h=px.h,pal=api.palette.map(c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)]);let near=0,sum=0,sum2=0,n=w*h,eq=0,sd=0;const Ly=new Float32Array(n);
 for(let i=0;i<n;i++){const r=d[i*4],g=d[i*4+1],b=d[i*4+2],l=(.299*r+.587*g+.114*b)/255;Ly[i]=l;sum+=l;sum2+=l*l;let bd=1e9;for(const p of pal){const e=(r-p[0])**2+(g-p[1])**2+(b-p[2])**2;if(e<bd)bd=e}if(bd<30*30)near++;if(i%w&&Math.abs(r-d[i*4-4])+Math.abs(g-d[i*4-3])+Math.abs(b-d[i*4-2])<6)eq++}
 for(let y=0;y+1<h;y+=2){let a=0,b=0;for(let x=0;x<w;x++){a+=Ly[y*w+x];b+=Ly[(y+1)*w+x]}sd+=Math.abs(a-b)/w}sd/=h/2;const m=sum/n,sdv=Math.sqrt(Math.max(0,sum2/n-m*m));
 const c=[near/n,Math.min(1,sdv/.22),Math.max(0,1-Math.abs(sd-.06)/.06),Math.max(0,1-Math.abs(m-.36)/.36),Math.max(0,1-Math.abs(eq/(n-h)-.62)/.62)];return{c,s:100*c.reduce((a,v,i)=>a+v*wts[i],0)/ws}}
const B={px:[2,6,1],scan:[0,1],quant:[0,1],curve:[0,.2],expo:[.7,1.5],glow:[0,1]};const R=HWX.rng(parseInt(seal.slice(8,16),16));const hist=[],tried=[],gal=[];let best=Object.assign({},api.params),bestS=-1,bestC=null,round=0;
function clampP(p){const o={};for(const k in B){const[a,b,st]=B[k];let v=p[k];v=Math.max(a,Math.min(b,v));if(st)v=Math.round(v);o[k]=+v.toFixed(4)}return o}
function evalP(p){const keep=Object.assign({},api.params);api.setParams(p);const px=api.test(128,96,3.3);const r=critic(px);api.setParams(keep);return{r,px}}
function step(){round++;const keys=Object.keys(B),k=keys[(R()*keys.length)|0],cand=Object.assign({},best),[a,b]=B[k];cand[k]=best[k]+(R()-.5)*(b-a)*.5;if(R()<.3){const k2=keys[(R()*keys.length)|0];cand[k2]=best[k2]+(R()-.5)*(B[k2][1]-B[k2][0])*.4}
 const c=clampP(cand),e=evalP(c);tried.push(e.r.s);const kept=e.r.s>bestS;const lead=PG.agents.startsWith('BUILDER')?(round%2?'BUILDER':'WEAVER'):'ARTIST';
 $('board').insertAdjacentHTML('beforeend','<li>'+lead+' tries '+esc(k)+' → '+esc(String(c[k]))+' · CRITIC '+e.r.s.toFixed(2)+(kept?' <b>kept</b>':' rejected')+'</li>');$('board').scrollTop=1e9;
 if(kept){best=c;bestS=e.r.s;bestC=e.r.c;gal.push(api.toURL(e.px));if(gal.length>8)gal.shift();$('gal').innerHTML=gal.map(u=>'<img src="'+u+'" width="128" height="96">').join('')}hist.push(bestS)}
function chart(){const c=$('chart'),x=c.getContext('2d'),W=c.width=c.clientWidth*Math.min(devicePixelRatio||1,2),Hh=c.height=120*Math.min(devicePixelRatio||1,2);x.fillStyle='#0b0d1a';x.fillRect(0,0,W,Hh);const mn=Math.min(...tried,...hist)-2,mx=Math.max(...tried,...hist)+2,X=i=>10+i/(Math.max(1,hist.length-1))*(W-20),Y=v=>Hh-8-(v-mn)/(mx-mn)*(Hh-16);
 tried.forEach((v,i)=>{x.fillStyle='#ff55ff88';x.fillRect(X(i)-2,Y(v)-2,4,4)});x.strokeStyle=ARC.pc;x.lineWidth=3;x.beginPath();hist.forEach((v,i)=>i?x.lineTo(X(i),Y(v)):x.moveTo(X(i),Y(v)));x.stroke();
 $('comp').innerHTML=bestC.map((v,i)=>'<div>'+NAMES[i]+' <span class="bar" style="width:'+(v*160).toFixed(0)+'px"></span> '+(v*100).toFixed(0)+' <small>(weight '+wts[i].toFixed(2)+')</small></div>').join('')}
function rounds(n){for(let i=0;i<n;i++)step();api.setParams(best);chart();$('params').textContent=JSON.stringify(best)}
try{const e0=evalP(clampP(api.params));bestS=e0.r.s;bestC=e0.r.c;hist.push(bestS);tried.push(bestS);gal.push(api.toURL(e0.px));rounds(12);
 for(let i=1;i<hist.length;i++)if(hist[i]<hist[i-1]-1e-9)throw Error('loop went backwards');const re=evalP(best).r.s;if(Math.abs(re-bestS)>.75)throw Error('CRITIC not reproducible '+re.toFixed(2)+' vs '+bestS.toFixed(2));
 for(const k in B){if(best[k]<B[k][0]||best[k]>B[k][1])throw Error('param out of range '+k)}
 proof.innerHTML=T('LIT','self-check passed: seal recomputed · '+PG.facts.length+' history facts tagged and sourced · '+facts.length+' computed checks · Three.js r'+THREE.REVISION+' at DPR '+api.dpr+' · '+(hist.length-1)+' loop rounds, score '+hist[0].toFixed(2)+' → '+bestS.toFixed(2)+' (never down, re-render '+re.toFixed(2)+')');
 done({ok:true,score:bestS,rounds:hist.length-1,facts:PG.facts.length,computed:facts.length,dpr:api.dpr,counts:api.counts()})}
catch(e){proof.innerHTML=T('WALL','FAIL '+esc(e.message));done({ok:false,err:e.message});throw e}
$('again').onclick=()=>rounds(4);
function dl(name,data,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
$('xjson').onclick=()=>dl(PG.slug+'.json',JSON.stringify({mayhem:'t269',page:PG,arc:ARC,seal:SEAL,computed:facts,params:best,score:bestS,components:bestC&&Object.fromEntries(bestC.map((v,i)=>[NAMES[i],+v.toFixed(4)])),history:hist,three:'r'+THREE.REVISION,dpr:api.dpr,palette:{name:ARC.pal,colours:api.palette,note:api.paletteNote}},null,2),'application/json');
$('xsvg').onclick=()=>{const sp=api.spriteSVG(PG.cast),W=Math.max(sp.w,520),pts=hist.map((v,i)=>(10+i/(Math.max(1,hist.length-1))*(W-20)).toFixed(1)+','+(sp.h+110-(v-hist[0]+2)/(Math.max(...hist)-hist[0]+4)*90).toFixed(1)).join(' ');
 dl(PG.slug+'.svg','<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+(sp.h+130)+'" viewBox="0 0 '+W+' '+(sp.h+130)+'"><rect width="100%" height="100%" fill="#0b0d1a"/>'+sp.svg+'<text x="10" y="'+(sp.h+16)+'" fill="'+ARC.pc+'" font-family="monospace" font-size="13">'+esc(PG.title)+' · CRITIC '+bestS.toFixed(2)+' (MODEL art)</text><polyline fill="none" stroke="'+ARC.pc+'" stroke-width="3" points="'+pts+'"/></svg>','image/svg+xml')};
$('xobj').onclick=()=>dl(PG.slug+'.obj',api.obj(),'text/plain');
$('snap').onclick=()=>{const px=api.test(512,384,performance.now()/1000);gal.push(api.toURL(px));if(gal.length>8)gal.shift();$('gal').innerHTML=gal.map(u=>'<img src="'+u+'" width="128" height="96">').join('')};
})();
