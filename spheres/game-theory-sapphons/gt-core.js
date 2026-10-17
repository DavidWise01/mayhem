/* gt-core.js · MODEL glue by Grok Bot for spheres/game-theory-sapphons (not part of Dave's engine).
   Two learning agents play a normal-form game by regret matching (Hart & Mas-Colell 2000); the score is 1 − NashConv/range
   of their empirical averages; folded-star meshes {n/k}; exports; proofs. Dave's I-13 VM re-computes NashConv from raw numbers. */
(function(G){
'use strict';
const GT={};
GT.rng=s=>{s=s>>>0||1;return()=>(s=(s*1664525+1013904223)>>>0)/4294967296};
GT.sha=async t=>{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t));return[...new Uint8Array(b)].map(v=>v.toString(16).padStart(2,'0')).join('')};
GT.post=s=>{if(typeof document==='undefined')return;const b=document.getElementById('board');if(!b)return;const li=document.createElement('li');li.textContent=s;b.appendChild(li);if(b.children.length>60)b.removeChild(b.firstChild);b.scrollTop=1e9};
GT.dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
GT.Ay=(A,y)=>A.map(r=>GT.dot(r,y));
GT.xB=(x,B)=>B[0].map((_,j)=>x.reduce((s,xi,i)=>s+xi*B[i][j],0));
GT.nashConv=(g,x,y)=>{const u=GT.Ay(g.A,y),v=GT.xB(x,g.B);return Math.max(...u)-GT.dot(x,u)+Math.max(...v)-GT.dot(v,y)};
GT.range=g=>{const a=[...g.A.flat(),...g.B.flat()];return Math.max(1e-9,Math.max(...a)-Math.min(...a))};
/* I-13 program: the VM recomputes NashConv of (x, y) for bimatrix (A, B), all from literals */
GT.ncProgram=(g,x,y)=>{const L=v=>G.I13.lit(v),m=g.A.length,n=g.A[0].length;let s='';
  x.forEach((v,i)=>s+=`I x${i} <- ${L(v)}\n`);y.forEach((v,j)=>s+=`I y${j} <- ${L(v)}\n`);
  for(let i=0;i<m;i++)s+=`I u${i} <- `+g.A[i].map((a,j)=>`${L(a)} * y${j}`).join(' + ')+'\n';
  for(let j=0;j<n;j++)s+=`I v${j} <- `+g.B.map((r,i)=>`${L(r[j])} * x${i}`).join(' + ')+'\n';
  s+='I mu <- u0\n';for(let i=1;i<m;i++)s+=`if u${i} > mu { mu <- u${i} }\n`;s+='I mv <- v0\n';for(let j=1;j<n;j++)s+=`if v${j} > mv { mv <- v${j} }\n`;
  s+='I val1 <- '+[...Array(m).keys()].map(i=>`x${i} * u${i}`).join(' + ')+'\nI val2 <- '+[...Array(n).keys()].map(j=>`v${j} * y${j}`).join(' + ')+'\nI nc <- mu - val1 + mv - val2\n';return s};
GT.engineNC=async(g,x,y)=>{const r=await G.I13.run(GT.ncProgram(g,x,y));return {nc:r.globals.nc,steps:r.steps,ops:r.ops}};
/* two agents: regret matching with ε-exploration; workspace loop retunes ε / switches to RM+ / forgets old history */
GT.mkLoop=(g,seed)=>{const R=GT.rng(seed),m=g.A.length,n=g.A[0].length,rg=GT.range(g);
  let Rx=Array(m).fill(0),Ry=Array(n).fill(0),cx=Array(m).fill(0),cy=Array(n).fill(0),eps=g.eps0||0.12,plus=false,round=0,since=0,best={score:-1,nc:Infinity,x:null,y:null,round:0},hist=[],traj=[];const h=[],log=[],ws=[];let lastNC=Infinity,first=null;
  const strat=(Rv)=>{const p=Rv.map(v=>Math.max(v,0)),s=p.reduce((a,b)=>a+b,0),k=Rv.length;return p.map(v=>(1-eps)*(s>0?v/s:1/k)+eps/k)};
  const draw=p=>{let u=R(),i=0;for(;i<p.length-1;i++){u-=p[i];if(u<0)break}return i};
  const avg=()=>({x:cx.map(c=>c/Math.max(1,cx.reduce((a,b)=>a+b,0))),y:cy.map(c=>c/Math.max(1,cy.reduce((a,b)=>a+b,0)))});
  const score=nc=>Math.max(0,Math.min(1,1-nc/rg));
  return{g,h,log,ws,traj,score,get best(){return best},get eps(){return eps},get plus(){return plus},get round(){return round},get first(){return first},avg,
   one(){round++;const sx=strat(Rx),sy=strat(Ry),a=draw(sx),b=draw(sy);cx[a]++;cy[b]++;
    for(let i=0;i<m;i++)Rx[i]+=g.A[i][b]-g.A[a][b];for(let j=0;j<n;j++)Ry[j]+=g.B[a][j]-g.B[a][b];if(plus){Rx=Rx.map(v=>Math.max(0,v));Ry=Ry.map(v=>Math.max(0,v))}
    const {x,y}=avg(),nc=GT.nashConv(g,x,y),sc=score(nc);if(first===null)first=sc;let imp=false;if(sc>best.score+1e-12){best={score:sc,nc,x:x.slice(),y:y.slice(),round};imp=true;since=0}else since++;
    h.push(sc);if(h.length>600)h.shift();if(round%4===0){traj.push([x[0],y[0]]);if(traj.length>400)traj.shift()}
    const an=g.agents||['ROW','COL'];log.push({round,[an[0]]:g.rows[a],[an[1]]:g.cols[b],payoff:[g.A[a][b],g.B[a][b]],nashConv:+nc.toFixed(5),score:+sc.toFixed(4)});if(log.length>3000)log.shift();
    let w=null;if(round%40===0){const old=eps;let tr;
     if(since>=40&&!plus){plus=true;tr='plateau '+since+' rounds → switch both agents to regret-matching+ (floor regrets at 0)'}
     else if(since>=40&&eps>0.02){eps=Math.max(0.01,eps*0.5);tr='plateau '+since+' rounds → halve exploration ε'}
     else if(since>=40){for(let i=0;i<m;i++){cx[i]=Math.round(cx[i]/2);Rx[i]/=2}for(let j=0;j<n;j++){cy[j]=Math.round(cy[j]/2);Ry[j]/=2}tr='plateau '+since+' rounds → forget half the old history'}
     else if(nc<lastNC){eps=Math.max(0.005,eps*0.9);tr='NashConv falling ('+nc.toFixed(4)+') → keep course, ε ×0.9'}
     else{eps=Math.min(0.3,eps*1.25);tr='NashConv rising ('+nc.toFixed(4)+') → explore more, ε ×1.25'}
     lastNC=nc;w={entry:ws.length+1,round,measured:{nashConv:+nc.toFixed(5),score:+sc.toFixed(4),plateau:since,rm_plus:plus},tried:tr,eps:[+old.toFixed(4),+eps.toFixed(4)]};ws.push(w)}
    return{imp,w,a,b,nc,sc}}}};
/* folded star {n/k}: n tips (r = 1), n valleys at the star polygon's inner radius, two apexes at ±h; 2n + 2 vertices, 4n triangles */
GT.innerR=(n,k)=>k<=1?0.5:Math.cos(Math.PI*k/n)/Math.cos(Math.PI*(k-1)/n);
GT.starMesh=(n,k,h)=>{const V=[],F=[],ri=GT.innerR(n,k);for(let i=0;i<n;i++){const a=2*Math.PI*i/n+Math.PI/2;V.push([Math.cos(a),Math.sin(a),0])}for(let i=0;i<n;i++){const a=2*Math.PI*(i+.5)/n+Math.PI/2;V.push([ri*Math.cos(a),ri*Math.sin(a),0])}V.push([0,0,h],[0,0,-h]);
  for(let i=0;i<n;i++){const t=i,v=n+i,t2=(i+1)%n,T=2*n,B=2*n+1;F.push([T,t,v],[T,v,t2],[B,v,t],[B,t2,v])}return{V,F}};
GT.toOBJ=(slug,M,note)=>{let o='# '+slug+' · Mayhem game-theory-sapphons · folded star '+(note||'')+' (MODEL geometry)\n';M.V.forEach(p=>o+=`v ${p[0].toFixed(6)} ${p[1].toFixed(6)} ${p[2].toFixed(6)}\n`);M.F.forEach(f=>o+=`f ${f[0]+1} ${f[1]+1} ${f[2]+1}\n`);return o};
GT.toSVG=(n,k,traj,bg,c1,c2,c3)=>{let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="${bg}"/>`;const P=i=>{const a=2*Math.PI*i/n-Math.PI/2;return[200+150*Math.cos(a),200+150*Math.sin(a)]};
  for(let i=0;i<n;i++){const a=P(i),b=P(i+k);s+=`<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${c1}" stroke-width="3"/>`}
  const pts=(traj.length?traj:[[.5,.5]]).map(p=>(50+300*p[0]).toFixed(1)+','+(350-300*p[1]).toFixed(1)).join(' ');s+=`<polyline points="${pts}" fill="none" stroke="${c2}" stroke-width="2"/>`;const e=traj[traj.length-1]||[.5,.5];s+=`<circle cx="${(50+300*e[0]).toFixed(1)}" cy="${(350-300*e[1]).toFixed(1)}" r="6" fill="${c3}"/>`;return s+'</svg>'};
/* standard loop proof: 200 seeded rounds, 5 workspace entries, NashConv must not end worse than it started, OBJ/SVG consistent */
GT.loopCheck=(g,seed,slug,star)=>{const L=GT.mkLoop(g,seed);for(let i=0;i<200;i++)L.one();if(L.ws.length!==5)throw Error('ws '+L.ws.length);
  if(!(L.best.score>L.first||L.first>=1))throw Error('no improvement in 200 rounds');
  const M=GT.starMesh(star[0],star[1],0.6),o=GT.toOBJ(slug,M),nv=(o.match(/^v /gm)||[]).length,nf=(o.match(/^f /gm)||[]).length;if(nv!==2*star[0]+2||nf!==4*star[0])throw Error('obj');
  const sv=GT.toSVG(star[0],star[1],L.traj,'#000','#f00','#0f0','#fff');if((sv.match(/<line/g)||[]).length!==star[0]||(sv.match(/<polyline/g)||[]).length!==1)throw Error('svg');
  const {x,y}=L.avg();if(Math.abs(GT.nashConv(g,x,y)-GT.nashConv(g,x,y))>0)throw Error('nc');
  return {L,text:'200 rounds of '+(g.agents||['ROW','COL']).join(' vs ')+' regret matching: score '+L.first.toFixed(3)+' → best '+L.best.score.toFixed(3)+' (NashConv '+L.best.nc.toFixed(4)+'), workspace loop logged 5 entries, OBJ '+nv+' vertices / '+nf+' faces and SVG {'+star[0]+'/'+star[1]+'} consistent'}};
/* I-13 trig library (MODEL): range reduction + sine Taylor series, cos by shift, Euclid by subtraction (the VM has no trig, no modulo) */
GT.TRIG=`def rd(I x) { if x > 3.141592653589793 { -> rd(x - 6.283185307179586) } if x < (0 - 3.141592653589793) { -> rd(x + 6.283185307179586) } -> x }
def sr(I t, I k, I x2) { if k > 31 { -> 0 } -> t + sr((0 - t) * x2 / ((k + 1) * (k + 2)), k + 2, x2) }
def sn(I x) { I y <- rd(x) -> sr(y, 1, y * y) }
def cs(I x) { -> sn(x + 1.5707963267948966) }
def md(I a, I b) { if a < b { -> a } -> md(a - b, b) }
def gcd(I a, I b) { if b == 0 { -> a } -> gcd(b, md(a, b)) }
`;
G.GT=GT;if(typeof module!=='undefined')module.exports=GT;
})(typeof window!=='undefined'?window:globalThis);
(function(G){const GT=G.GT;
GT.plot=(cv,series,o={})=>{const d=Math.min(devicePixelRatio||1,2),W=cv.clientWidth||600,H=cv.clientHeight||260;cv.width=W*d;cv.height=H*d;const x=cv.getContext('2d');x.scale(d,d);x.fillStyle=o.bg||'rgba(0,0,0,.55)';x.fillRect(0,0,W,H);
  const all=series.flatMap(s=>s.pts);if(!all.length)return;const X0=o.x0??Math.min(...all.map(p=>p[0])),X1=o.x1??Math.max(...all.map(p=>p[0]));const tf=o.logy?(v=>Math.log10(Math.max(v,1e-300))):(v=>v);const Y0=o.y0??Math.min(...all.map(p=>tf(p[1]))),Y1=o.y1??Math.max(...all.map(p=>tf(p[1])));
  const px=v=>46+(v-X0)/((X1-X0)||1)*(W-60),py=v=>H-28-(tf(v)-Y0)/((Y1-Y0)||1)*(H-44);x.strokeStyle=o.axis||'rgba(255,255,255,.5)';x.lineWidth=1;x.beginPath();x.moveTo(46,8);x.lineTo(46,H-28);x.lineTo(W-10,H-28);x.stroke();
  x.fillStyle=o.axis||'rgba(255,255,255,.8)';x.font='11px monospace';x.fillText(o.xlab||'',W/2-40,H-8);x.save();x.translate(12,H/2+40);x.rotate(-Math.PI/2);x.fillText((o.logy?'log₁₀ ':'')+(o.ylab||''),0,0);x.restore();
  x.fillText((o.logy?'1e':'')+(+Y1.toPrecision(3)),2,14);x.fillText((o.logy?'1e':'')+(+Y0.toPrecision(3)),2,H-30);x.fillText(+X0.toPrecision(3),40,H-16);x.fillText(+X1.toPrecision(3),W-50,H-16);
  series.forEach(s=>{x.strokeStyle=s.color;x.fillStyle=s.color;x.lineWidth=s.w||2.5;if(s.dots){s.pts.forEach(p=>{x.beginPath();x.arc(px(p[0]),py(p[1]),3,0,7);x.fill()})}else{x.beginPath();s.pts.forEach((p,i)=>i?x.lineTo(px(p[0]),py(p[1])):x.moveTo(px(p[0]),py(p[1])));x.stroke()}if(s.label){const p=s.pts[s.pts.length-1];x.fillText(s.label,Math.min(px(p[0])-60,W-120),py(p[1])-6)}});
  if(o.vline!=null){x.strokeStyle='#fff';x.setLineDash([4,4]);x.beginPath();x.moveTo(px(o.vline),8);x.lineTo(px(o.vline),H-28);x.stroke();x.setLineDash([])}};
GT.ctx=(cv)=>{const d=Math.min(devicePixelRatio||1,2),W=cv.clientWidth||400,H=cv.clientHeight||300;cv.width=W*d;cv.height=H*d;const x=cv.getContext('2d');x.scale(d,d);return {x,W,H}};
GT.art2d=(seal,cv,h0,kind)=>{const {x,W,H}=GT.ctx(cv);let s=parseInt(seal.slice(0,8),16)>>>0;const R=()=>(s=(s*1664525+1013904223)>>>0)/4294967296;
  const gr=x.createRadialGradient(W*.3,H*.3,10,W/2,H/2,Math.max(W,H));gr.addColorStop(0,`hsl(${h0},70%,26%)`);gr.addColorStop(1,`hsl(${(h0+140)%360},60%,6%)`);x.fillStyle=gr;x.fillRect(0,0,W,H);
  const star=(cx,cy,r,n,k,a0)=>{x.beginPath();for(let i=0;i<=n;i++){const a=a0+2*Math.PI*(i*k%n)/n;i?x.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a)):x.moveTo(cx+r*Math.cos(a),cy+r*Math.sin(a))}x.stroke()};
  if(kind==='stars'){for(let i=0;i<120;i++){const n=5+((R()*8)|0),k=1+((R()*((n-1)/2))|0);x.strokeStyle=`hsla(${(h0+R()*80)%360},95%,${50+R()*30}%,.32)`;x.lineWidth=.6+R()*1.8;star(R()*W,R()*H,8+R()*120,n,Math.max(2,k),R()*7)}}
  else if(kind==='grid'){const g=34;for(let i=0;i<W/g;i++)for(let j=0;j<H/g;j++){if(R()<.35){x.fillStyle=`hsla(${(h0+R()*60)%360},90%,${40+R()*30}%,.22)`;x.fillRect(i*g+2,j*g+2,g-4,g-4)}}}
  else if(kind==='rings'){for(let i=0;i<160;i++){x.strokeStyle=`hsla(${(h0+R()*80)%360},90%,${45+R()*35}%,.25)`;x.lineWidth=.5+R()*2;x.beginPath();x.arc(R()*W,R()*H,10+R()*220,0,7);x.stroke()}}
  else if(kind==='rays'){for(let i=0;i<260;i++){const a=R()*7,r0=R()*60,r1=r0+40+R()*Math.max(W,H)*.7;x.strokeStyle=`hsla(${(h0+R()*70)%360},95%,${55+R()*30}%,.22)`;x.lineWidth=.5+R()*2;x.beginPath();x.moveTo(W/2+r0*Math.cos(a),H/2+r0*Math.sin(a));x.lineTo(W/2+r1*Math.cos(a),H/2+r1*Math.sin(a));x.stroke()}}
  else{for(let n=0;n<420;n++){let px=R()*W,py=R()*H;x.strokeStyle=`hsla(${(h0+R()*90)%360},95%,${45+R()*35}%,.3)`;x.lineWidth=.5+R()*2;x.beginPath();x.moveTo(px,py);for(let j=0;j<30;j++){const a=Math.sin(px/W*7)*Math.cos(py/H*5)*6.283;px+=Math.cos(a)*3;py+=Math.sin(a)*3;x.lineTo(px,py)}x.stroke()}}};
GT.table=(g)=>{const an=g.agents||['ROW','COL'];let s='<table style="border-collapse:collapse;font-family:monospace;font-size:13px;margin:6px 0"><tr><td style="padding:3px 8px">'+an[0]+' ↓ / '+an[1]+' →</td>'+g.cols.map(c=>'<td style="padding:3px 8px;border-bottom:1px solid currentColor"><b>'+c+'</b></td>').join('')+'</tr>';
  g.rows.forEach((r,i)=>{s+='<tr><td style="padding:3px 8px"><b>'+r+'</b></td>'+g.cols.map((_,j)=>'<td style="padding:3px 8px">'+(+g.A[i][j].toFixed(3))+', '+(+g.B[i][j].toFixed(3))+'</td>').join('')+'</tr>'});return s+'</table>'};
})(typeof window!=='undefined'?window:globalThis);
