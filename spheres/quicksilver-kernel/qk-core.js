/* qk-core.js · MODEL glue by Grok Bot for the Quicksilver & Kernel batch. Ports Dave's arc step() rules (no drawing), checks his kernel seed for
   internal consistency as its own system, builds I-13 programs, runs the agents and the exports. Dave's numbers and phrases are his; mappings are MODEL. */
(function(G){'use strict';const QK={};
QK.sha=async b=>{const d=await crypto.subtle.digest('SHA-256',typeof b==='string'?new TextEncoder().encode(b):b);return [...new Uint8Array(d)].map(v=>v.toString(16).padStart(2,'0')).join('')};
/* Dave's rng32 (verbatim logic from all three arc pages) */
QK.rng32=function(seed){let a=seed>>>0;return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}};
QK.N=52;QK.SEED=7;QK.TOW_LAG=4;
QK.line=()=>{const rng=QK.rng32(QK.SEED),L=[];for(let i=0;i<QK.N;i++){const up=i%2===0;L.push({i,net:up?98:-98,cross:rng()<0.01})}return L};
/* ports of Dave's newRun()/step(): kind 1 = '1 bit in, 1px out', 2 = '11 across, 2px out', 3 = 'dog on a leash, cubits in tow' */
QK.newRun=(kind,cfg)=>{const N=QK.N;if(kind===1){const m=cfg.moniker,rng=QK.rng32(QK.SEED+m);const cross=Array.from({length:N},()=>rng()<0.01);const dropAt=cfg.drop?10+Math.floor(rng()*(N-20)):-1;
  return {kind,moniker:m,pos:-1,bit:m,delivered:true,ledger:[],cross,dropAt,lostAt:-1,phase:'travel',flash:new Array(N).fill(0),frames:0}}
 const pr=cfg.pair,rng=QK.rng32(QK.SEED+pr[0]*2+pr[1]);
 if(kind===2){const cross=Array.from({length:N},()=>rng()<0.01);const dropAt=cfg.drop==='off'?-1:10+Math.floor(rng()*(N-20));return {kind,pair:[pr[0],pr[1]],bits:[pr[0],pr[1]],pos:-1,delivered:true,ledger:[],cross,dropAt,dropMode:cfg.drop,lost:[-1,-1],phase:'travel',flash:new Array(N).fill(0),frames:0}}
 const dropAt=cfg.drop==='off'?-1:10+Math.floor(rng()*(N-20));const g=QK.G3,c0=g.x0-QK.TOW_LAG*g.dx;
 return {kind,pair:[pr[0],pr[1]],bits:[pr[0],pr[1]],pos:-1,cpos:[c0,c0],hist:new Array(24).fill(c0),delivered:true,ledger:[],dropAt,dropMode:cfg.drop,lost:[-1,-1],phase:'travel',flash:new Array(N).fill(0),frames:0}};
QK.G3=(()=>{const W=1000,x0=70,x1=W-230,dx=(x1-x0)/(QK.N-1);return {W,x0,x1,dx}})();
QK.step=S=>{const N=QK.N;if(S.phase==='done')return;S.frames++;
 if(S.kind===3){if(S.pos<N-1)S.pos=Math.min(S.pos+0.35,N-1);const k=Math.floor(S.pos);if(k>=0&&!S.ledger.includes(k)){S.ledger.push(k);S.flash[k]=1;if(k===S.dropAt){const d=S.dropMode==='both'?[0,1]:[S.dropMode==='A'?0:1];d.forEach(i=>{S.bits[i]=-1;S.lost[i]=k});S.delivered=false}}
  for(let i=0;i<N;i++)S.flash[i]*=0.94;const g=QK.G3,dogX=g.x0+Math.max(0,Math.min(S.pos,N-1))*g.dx;S.hist.push(dogX);if(S.hist.length>64)S.hist.shift();const target=S.hist[Math.max(0,S.hist.length-1-12)];
  S.cpos[0]+=(target-S.cpos[0])*0.16;S.cpos[1]+=(target-S.cpos[1])*0.16;if(S.pos>=N-1&&S.cpos[0]>=g.x1-4&&S.cpos[1]>=g.x1-4)S.phase='done';return}
 S.pos+=0.35;const k=Math.floor(S.pos);if(k>=0&&k<N&&!S.ledger.includes(k)){S.ledger.push(k);S.flash[k]=1;
  if(k===S.dropAt){if(S.kind===1){S.bit=-1;S.delivered=false;S.lostAt=k}else{const d=S.dropMode==='both'?[0,1]:[S.dropMode==='A'?0:1];d.forEach(i=>{S.bits[i]=-1;S.lost[i]=k});S.delivered=false}}}
 for(let i=0;i<N;i++)S.flash[i]*=0.94;if(S.pos>=N-1+6)S.phase='done'};
QK.pixels=S=>S.kind===1?[S.phase==='done'&&S.delivered?S.moniker:0]:S.bits.map(b=>b<0?0:b);
QK.runAll=(kind,cfg)=>{const S=QK.newRun(kind,cfg);let n=0;while(S.phase!=='done'&&n<5000){QK.step(S);n++}return S};
QK.CONFIGS={1:[{moniker:1,drop:false},{moniker:0,drop:false},{moniker:1,drop:true},{moniker:0,drop:true}],2:null,3:null};
QK.CONFIGS[2]=QK.CONFIGS[3]=[].concat(...[[1,1],[1,0],[0,1],[0,0]].map(p=>['off','A','B','both'].map(d=>({pair:p,drop:d}))));
/* LIT: what Dave's code does, run for every configuration his buttons offer */
QK.arcFacts=kind=>{const L=QK.line(),out=[];if(L.some(b=>b.net!==(b.i%2===0?98:-98)))throw Error('alternation');const netSum=L.reduce((a,b)=>a+b.net,0);if(netSum!==0)throw Error('net sum');
 let frames=new Set(),lost=0,del0=0,del1=0;QK.CONFIGS[kind].forEach(c=>{const S=QK.runAll(kind,c);if(S.phase!=='done')throw Error('run never finished');if(S.ledger.length!==QK.N)throw Error('ledger '+S.ledger.length+' (ledger kept walking expected 52)');
  for(let i=0;i<QK.N;i++)if(S.ledger[i]!==i)throw Error('ledger order');frames.add(S.frames);const px=QK.pixels(S);
  if(S.delivered){const want=kind===1?[c.moniker]:c.pair;if(px.join('')!==want.join(''))throw Error('delivered pixels '+px.join('')+' ≠ '+want.join(''));want.forEach(v=>v?del1++:del0++)}else{if(S.dropAt<10||S.dropAt>=QK.N-10)throw Error('dropAt range');lost++}});
 const cross=L.filter(b=>b.cross).length;return {netSum,frames:[...frames],lost,del0,del1,cross,runs:QK.CONFIGS[kind].length}};
/* kernel seed consistency (his own system; LIT where a relation holds exactly, AMBER where it is near but not exact or not derivable) */
QK.kernelFacts=K=>{const TU=1.61e-35,R=[];const ok=(c,m)=>{if(!c)throw Error(m)};
 let s=0;for(let i=0;i<K.tick;i++)s+=TU;ok(s===K.t_s,'t_s ≠ tick additions of 1.61e-35');R.push(['LIT',`t_s = ${K.t_s} is bit-for-bit ${K.tick} accumulated ticks of 1.61e-35 s (his tick unit); the exact product tick × 1.61e-35 = ${(K.tick*TU)} differs only by float accumulation (${((K.t_s-K.tick*TU)/(K.tick*TU)).toExponential(2)} relative)`]);
 K.verdicts.forEach(v=>{let q=0;for(let i=0;i<v.tick;i++)q+=TU;ok(q===v.t_s,'verdict t_s '+v.tick);ok(v.tick%K.config.thinkEvery===0,'verdict spacing')});
 const vt=K.verdicts.map(v=>v.tick);ok(vt.every((t,i)=>!i||t-vt[i-1]===16),'verdicts 16 apart');ok(vt[vt.length-1]<=K.tick,'verdict after tick');
 R.push(['LIT',`${K.verdicts.length} verdicts, every one on a thinkEvery = ${K.config.thinkEvery} boundary, 16 ticks apart (${vt[0]}…${vt[vt.length-1]}), each t_s again = its tick × 1.61e-35 by accumulation`]);
 ['H','O','N'].forEach(L=>{ok(K.foam[L].length===K.config.nCells,'nCells '+L);ok(K.foam[L].every((c,i)=>i%2===1?c.mag>K.foam[L][i-1].mag:true),'parity '+L)});
 R.push(['LIT',`foam: 3 layers × nCells ${K.config.nCells} = 18 cells; in every layer each odd cell is larger than the even cell before it; N's odd cells sit near 1 (${K.foam.N.filter((c,i)=>i%2).map(c=>c.mag.toFixed(4)).join(', ')})`]);
 const p=K.foam.pops;ok(p.H===2*p.O,'H=2O');R.push(['LIT',`pops: H ${p.H} = 2 × O ${p.O} exactly`]);R.push(['AMBER',`pops: O/N = ${(p.O/p.N).toFixed(6)}; exact halving would give N = ${p.O/2}, the seed has ${p.N} (${p.O/2-p.N} fewer)`]);
 const sum=p.H+p.O+p.N,emb=Math.min(42,sum%97);R.push(['LIT',`embers = min(42, (H+O+N) mod 97) = min(42, ${sum%97}) = ${emb}`]);
 const w=K.wave,d=w.describe;ok(w.lastCrest%d.periodTicks===0,'lastCrest');ok(Math.abs((K.tick-w.lastCrest)/d.periodTicks-w.phase)<5e-4,'wave phase');ok(d.peak+d.valence===d.total,'peak+valence');ok(Math.pow(2,4)===16,'gray');
 R.push(['LIT',`wave: lastCrest ${w.lastCrest} = ${w.lastCrest/d.periodTicks} × periodTicks ${d.periodTicks}; phase ${w.phase} = (${K.tick} − ${w.lastCrest}) / 52 = ${((K.tick-w.lastCrest)/52).toFixed(5)}; peak ${d.peak} + valence ${d.valence} = total ${d.total}; 4-bit Gray code → 2⁴ = 16 vertices (a tesseract has 16)`]);
 R.push(['AMBER',`wave: breaks ${w.breaks}, epicenter ${d.epicenter}, carrier "${d.carrier}" and surround "${d.surround}" are stated, not derivable from the other fields`]);
 R.push(['LIT',`crestEcho at dream 0: (tick mod 52) = ${K.tick%52} < 6 is ${K.tick%52<6}; the dream advances 52 ticks per cycle, so tick mod 52 stays ${K.tick%52} and the shimmer band stays off while the seed is used`]);
 const sk=Object.keys(K.sapphons).map(Number);ok(sk[1]-sk[0]===sk[2]-sk[1],'sapphon spacing');const s0=K.sapphons[sk[0]];ok(sk.every(k=>K.sapphons[k].lives===s0.lives&&K.sapphons[k].emissions===s0.emissions),'sapphons equal');
 R.push(['LIT',`sapphons ${sk.join(', ')}: evenly spaced by ${sk[1]-sk[0]}, identical (tick ${s0.tick}, lives ${s0.lives}, emissions ${s0.emissions})`]);R.push(['AMBER',`sapphons: emissions / lives = ${(s0.emissions/s0.lives).toFixed(5)} (4 × lives = ${4*s0.lives}, ${4*s0.lives-s0.emissions} more)`]);
 const sp=K.stillpoint;ok(sp.pattern.length===18,'stillpoint 18');ok(sp.journal.some(j=>j.op==='capture'&&j.tick===sp.writtenAt),'capture journal');
 const cells=[].concat(K.foam.H,K.foam.O,K.foam.N),dm=Math.max(...cells.map((c,i)=>Math.abs(c.mag-sp.pattern[i].mag)));
 R.push(['LIT',`stillpoint: 18-cell pattern written at tick ${sp.writtenAt}, matching the journal's capture at ${sp.writtenAt}; it stays within ${dm.toFixed(4)} of today's foam magnitudes (captured ${K.tick-sp.writtenAt} ticks earlier)`]);
 const ks=K.verdicts.map(v=>(1/v.confidence-1)/v.distance);R.push(['AMBER',`verdicts: confidence vs distance follows 1/c − 1 ≈ k·d with k between ${Math.min(...ks).toFixed(3)} and ${Math.max(...ks).toFixed(3)}: close, not one fixed formula from these fields`]);
 return {R,emb,sum,ks}};
QK.kernelFrom=html=>{const m=html.match(/var KERNEL_SEED = (\{.*\});/);if(!m)throw Error('KERNEL_SEED not found');return JSON.parse(m[1])};
/* I-13 programs (MODEL glue): closed forms the VM recomputes, compared to JS which throws on mismatch */
QK.vmArc=kind=>{const L=v=>G.I13.lit(v);let s=G.I13.LIB+`def pairs(I k) { if k < 1 { -> 0 } -> 98 + (0 - 98) + pairs(k - 1) }\nI net <- 99 - 1\nI ls <- pairs(26)\nI bpn <- 1 / 1000000000 / ${L(1.61e-35)}\nI thr <- ${L(1.61e-35)} / ${L(1.1502e-36)}\nI fr <- (52 - 1 + 6 + 1) / 0.35\n`;
 if(kind===3)s+=`I lagf <- 12 + (1 - 0.16) / 0.16\nI lag <- lagf * 0.35\n`;if(kind===2)s+=`def px(I b, I d) { if d > 0 { -> 0 } -> b }\nI s11 <- px(1, 0) + px(1, 0)\nI s10a <- px(1, 1) + px(0, 0)\nI sboth <- px(1, 1) + px(1, 1)\n`;return s};
QK.vmKernel=(K,q)=>{const L=v=>G.I13.lit(v),p=K.foam.pops,w=K.wave,d=w.describe;let s=`I tk <- ${L(K.tick)}\nI ts <- tk * ${L(1.61e-35)}\nI ph <- (tk - ${L(w.lastCrest)}) / ${L(d.periodTicks)}\nI lc <- ${L(w.lastCrest)} / ${L(d.periodTicks)}\nI tot <- ${L(d.peak)} + ${L(d.valence)}\nI gray <- 2 * 2 * 2 * 2\nI ho <- ${L(p.H)} / ${L(p.O)}\nI on <- ${L(p.O)} / ${L(p.N)}\nI sm <- ${L(p.H)} + ${L(p.O)} + ${L(p.N)}\nI rem <- sm - 97 * ${L(q)}\nI emb <- rem\nif rem > 42 { emb <- 42 }\n`;
 K.verdicts.forEach((v,i)=>{s+=`I k${i} <- (1 / ${L(v.confidence)} - 1) / ${L(v.distance)}\n`});s+=`I km <- (${K.verdicts.map((v,i)=>'k'+i).join(' + ')}) / ${K.verdicts.length}\n`;return s};
/* agents (MODEL): ARTIST+CRITIC, or cooperative BUILDER+WEAVER+CRITIC (BUILDER owns params 0–2, WEAVER owns 3–4, turns alternate). */
QK.W=[1,1,1,1,1];QK.critic=(p,t)=>{let a=0;p.forEach((v,i)=>a+=QK.W[i]*(v-t[i])**2);return 1-Math.sqrt(a/QK.W.length)};
QK.mkLoop=(t,seed,coop)=>{const R=QK.rng32(seed),cl=v=>Math.max(0,Math.min(1,v));let best=[R(),R(),R(),R(),R()],bs=QK.critic(best,t),sig=0.2,round=0,win0=bs;const hist=[bs],log=[],first=bs;
 const g=()=>{let u=0,v=0;while(!u)u=R();while(!v)v=R();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)};
 return {t,coop,step(){round++;const who=coop?(round%2?'BUILDER':'WEAVER'):'ARTIST',own=coop?(who==='BUILDER'?[0,1,2]:[3,4]):[0,1,2,3,4];const prop=best.map((v,i)=>own.includes(i)?cl(v+sig*g()):v);const sc=QK.critic(prop,t);let acc=false;if(sc>bs){best=prop;bs=sc;acc=who}hist.push(bs);
   if(round%40===0){const gain=bs-win0;let m;if(gain<1e-4){sig=Math.min(0.5,sig*1.6);m='CRITIC: plateau → '+(coop?'BUILDER+WEAVER':'ARTIST')+' explore wider (σ '+sig.toFixed(3)+')'}else{sig=Math.max(0.004,sig*0.85);m='CRITIC: +'+gain.toFixed(4)+' → '+(coop?'BUILDER+WEAVER':'ARTIST')+' refine (σ '+sig.toFixed(3)+')'}log.push({round,score:bs,msg:m});win0=bs}return acc},
  get best(){return best},get score(){return bs},get round(){return round},hist,log,first}};
/* exports */
QK.RS=24;QK.SS=48;
QK.sphereMesh=(p,amp)=>{const V=[],F=[];for(let r=0;r<=QK.RS;r++){const th=Math.PI*r/QK.RS;for(let s=0;s<QK.SS;s++){const ph=2*Math.PI*s/QK.SS;const d=1+amp*p[0]*0.12*Math.sin(5*th+3*ph)*Math.sin(th);V.push([d*Math.sin(th)*Math.cos(ph),d*Math.cos(th),d*Math.sin(th)*Math.sin(ph)])}}
 for(let r=0;r<QK.RS;r++)for(let s=0;s<QK.SS;s++){const a=r*QK.SS+s,b=r*QK.SS+(s+1)%QK.SS;F.push([a,b,b+QK.SS,a+QK.SS])}return {V,F}};
QK.toOBJ=(p,amp,title)=>{const M=QK.sphereMesh(p,amp);return {text:'# '+title+' · quicksilver/kernel sphere · MODEL\n'+M.V.map(v=>'v '+v.map(x=>x.toFixed(5)).join(' ')).join('\n')+'\n'+M.F.map(f=>'f '+f.map(i=>i+1).join(' ')).join('\n')+'\n',nv:M.V.length,nf:M.F.length}};
QK.esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
QK.toSVG=(title,S,npx)=>{const L=QK.line();let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" font-family="sans-serif"><title>${QK.esc(title)} · MODEL map of the sphere</title><rect width="400" height="400" fill="#05070f"/>`;
 L.forEach((b,i)=>{const a=2*Math.PI*i/QK.N-Math.PI/2,x=200+150*Math.cos(a),y=200+150*Math.sin(a),led=S&&S.ledger.includes(i);s+=`<circle class="b" cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="6" fill="${b.net>0?'#d4af37':'#8b5cf6'}" stroke="${led?'#2dd4bf':'none'}" stroke-width="2"/>`});
 const px=S?QK.pixels(S):new Array(npx).fill(0);for(let d=0;d<npx;d++)s+=`<rect class="px" x="${180+d*26-(npx-1)*13}" y="185" width="22" height="22" fill="${S&&S.phase==='done'&&px[d]?'#eafffb':'#0b1220'}" stroke="#1f3a4d"/>`;
 s+=`<text x="200" y="390" fill="#8fa3bd" font-size="11" text-anchor="middle">${QK.esc(title)} · ledger ${S?S.ledger.length:0}/${QK.N}</text></svg>`;return s};
QK.loopCheck=(t,seed,coop,npx,amp)=>{const L=QK.mkLoop(t,seed,coop);for(let i=0;i<240;i++)L.step();if(L.log.length<5)throw Error('workspace log '+L.log.length);if(!(L.score>L.first||L.first>0.999))throw Error('CRITIC did not improve');
 const O=QK.toOBJ(L.best,amp,'check');if(O.nv!==(QK.RS+1)*QK.SS||O.nf!==QK.RS*QK.SS)throw Error('OBJ counts');const S=QK.toSVG('check',null,npx);if((S.match(/class="b"/g)||[]).length!==52||(S.match(/class="px"/g)||[]).length!==npx)throw Error('SVG counts');
 return {L,text:`${coop?'BUILDER+WEAVER+CRITIC':'ARTIST+CRITIC'} loop: CRITIC ${L.first.toFixed(3)} → ${L.score.toFixed(3)} in 240 rounds, ${L.log.length} workspace entries; OBJ ${O.nv} v / ${O.nf} f; SVG 52 bubbles + ${npx}px`}};
G.QK=QK})(window);
(function(G){G.QK.mulberry32=function(a){return function(){a|=0;a=(a+0x6D2B79F5)|0;var t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}}})(window);
