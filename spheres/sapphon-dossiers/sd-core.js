/* sd-core.js · MODEL by Grok Bot for the Sapphon Dossiers batch (Mayhem). Score maths, I-13 programs, ARTIST+CRITIC agents, exports, data checks.
   Layer labels and numbers are Dave's (t253), kept verbatim. Every formula here is an interpretive MODEL, never fact. */
(function(G){'use strict';const SD={};
SD.LAYERS=[['5','ethics'],['4','logic'],['3','pathos'],['2','mythos'],['1','{i}'],['-1','inner dimension{self,confidence,reality}'],['-2','hearing{pause,choice}'],['-3','sound{act/react}'],['-4','taste{life,death}'],['-5','hearing{balance,ground}'],['-6','touch{balance,cordination}'],['+1','super id { connection}']];
SD.sha=async t=>{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t));return [...new Uint8Array(b)].map(v=>v.toString(16).padStart(2,'0')).join('')};
SD.rng=s=>{s=(s>>>0)||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296}};
/* derive (MODEL): depth 1 = in their moment (base), depth 2 = across their life ((2·base+BLUE)/3), depth 3 = long memory ((base+GREEN)/2) */
SD.derive=(b,R,B,Gr)=>{const d2=b.map(x=>(2*x+B)/3),d3=b.map(x=>(x+Gr)/2),s=b.map((x,k)=>(x+d2[k]+d3[k])/3);
 const U=(s[0]+s[1]+s[2]+s[3]+s[4])/5,Lo=(s[5]+s[6]+s[7]+s[8]+s[9]+s[10])/6,S=s[11];
 const LS=(s[1]+s[7]+s[6])/3,TO=(s[9]+s[10]+s[5])/3,RS=(s[2]+s[3]+s[8])/3,tot=LS+TO+RS;
 const obs=(s[6]+s[9])/2,resp=s[7],sub=(s[5]+s[11])/2,tempo=(0.3*obs+0.2*resp+0.1*sub)/0.6;
 const rI=s[4],rID=Lo,rSID=(s[11]+sub)/2,L=(R+B+Gr)/3,all=s.reduce((a,v)=>a+v,0)/12,idx=(all+L)/2;
 return {d2,d3,s,U,Lo,S,LS,TO,RS,lsp:LS/tot,top:TO/tot,rsp:RS/tot,obs,resp,sub,tempo,rI,rID,rSID,aI:36*rI,aID:36*rID,aSID:36*rSID,L,all,idx}};
SD.KEYS=['U','Lo','S','LS','TO','RS','lsp','top','rsp','obs','resp','sub','tempo','rI','rID','rSID','aI','aID','aSID','L','all','idx'];
SD.vmProgram=(b,R,B,Gr)=>{const L=v=>G.I13.lit(v);let s=`I rr <- ${L(R)}\nI bb <- ${L(B)}\nI gg <- ${L(Gr)}\n`;
 b.forEach((x,k)=>{s+=`I b${k} <- ${L(x)}\nI p${k} <- (2 * b${k} + bb) / 3\nI q${k} <- (b${k} + gg) / 2\nI s${k} <- (b${k} + p${k} + q${k}) / 3\n`});
 s+=`I uu <- (s0 + s1 + s2 + s3 + s4) / 5\nI lo <- (s5 + s6 + s7 + s8 + s9 + s10) / 6\nI ss <- s11\n`;
 s+=`I ls <- (s1 + s7 + s6) / 3\nI to <- (s9 + s10 + s5) / 3\nI rs <- (s2 + s3 + s8) / 3\nI tt <- ls + to + rs\nI lsp <- ls / tt\nI top <- to / tt\nI rsp <- rs / tt\n`;
 s+=`I obs <- (s6 + s9) / 2\nI resp <- s7\nI sub <- (s5 + s11) / 2\nI tempo <- (0.3 * obs + 0.2 * resp + 0.1 * sub) / 0.6\n`;
 s+=`I ri <- s4\nI rid <- lo\nI rsid <- (s11 + sub) / 2\nI ai <- 36 * ri\nI aid <- 36 * rid\nI asid <- 36 * rsid\nI ln <- (rr + bb + gg) / 3\n`;
 s+=`I al <- (s0 + s1 + s2 + s3 + s4 + s5 + s6 + s7 + s8 + s9 + s10 + s11) / 12\nI idx <- (al + ln) / 2\n`;return s};
SD.VMMAP={U:'uu',Lo:'lo',S:'ss',LS:'ls',TO:'to',RS:'rs',lsp:'lsp',top:'top',rsp:'rsp',obs:'obs',resp:'resp',sub:'sub',tempo:'tempo',rI:'ri',rID:'rid',rSID:'rsid',aI:'ai',aID:'aid',aSID:'asid',L:'ln',all:'al',idx:'idx'};
SD.engineDerive=async(b,R,B,Gr)=>{const r=await G.I13.run(SD.vmProgram(b,R,B,Gr));const j=SD.derive(b,R,B,Gr);let n=0;
 for(const k of SD.KEYS){const v=r.globals[SD.VMMAP[k]];if(typeof v!=='number'||Math.abs(v-j[k])>1e-9)throw Error('VM '+k+'='+v+' ≠ JS '+j[k]);n++}
 j.s.forEach((x,k)=>{if(Math.abs(r.globals['s'+k]-x)>1e-9)throw Error('VM layer '+k)});return {n:n+12,steps:r.steps,ops:r.ops,g:r.globals}};
SD.subjectOf=rec=>({b:rec.layers.map(l=>l.base),R:rec.lanes.RED.score,B:rec.lanes.BLUE.score,G:rec.lanes.GREEN.score});
SD.meanSubject=recs=>{const b=Array(12).fill(0);let R=0,B=0,Gr=0;recs.forEach(r=>{r.layers.forEach((l,k)=>b[k]+=l.base/recs.length);R+=r.lanes.RED.score/recs.length;B+=r.lanes.BLUE.score/recs.length;Gr+=r.lanes.GREEN.score/recs.length});return {b,R,B,G:Gr}};
/* ARTIST + CRITIC (MODEL). ARTIST proposes sculpture parameters [twist,gap,gain,hue,thick]; CRITIC scores how faithfully they encode the dossier
   (rubric targets from tempo, lower senses, overall index, era hue, lanes). Workspace loop every 40 rounds: plateau → explore (σ×1.6), gain → refine (σ×0.85). */
SD.target=(subj,hue)=>{const d=SD.derive(subj.b,subj.R,subj.B,subj.G);return [d.tempo/10,0.3+0.4*d.Lo/10,0.4+0.5*d.all/10,hue,0.2+0.6*d.L/10]};
SD.W=[1,1,1.5,0.8,1];
SD.critic=(p,t)=>{let a=0,w=0;p.forEach((v,i)=>{a+=SD.W[i]*(v-t[i])**2;w+=SD.W[i]});return 1-Math.sqrt(a/w)};
SD.mkLoop=(subj,hue,seed)=>{const R=SD.rng(seed),t=SD.target(subj,hue);const cl=v=>Math.max(0,Math.min(1,v));
 let best=[R(),R(),R(),R(),R()],bs=SD.critic(best,t),sig=0.18,round=0,win0=bs;const hist=[bs],log=[],first=bs;
 const g=()=>{let u=0,v=0;while(!u)u=R();while(!v)v=R();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)};
 return {t,step(){round++;const prop=best.map(v=>cl(v+sig*g()));const sc=SD.critic(prop,t);let acc=false;if(sc>bs){best=prop;bs=sc;acc=true}hist.push(bs);
   if(round%40===0){const gain=bs-win0;let m;if(gain<1e-4){sig=Math.min(0.5,sig*1.6);m='plateau → ARTIST explores wider (σ '+sig.toFixed(3)+')'}else{sig=Math.max(0.005,sig*0.85);m='CRITIC saw +'+gain.toFixed(4)+' → ARTIST refines (σ '+sig.toFixed(3)+')'}log.push({round,score:bs,msg:m});win0=bs}return acc},
  get best(){return best},get score(){return bs},get round(){return round},hist,log,first}};
SD.N=48;
SD.rings=(subj,p)=>{const d=SD.derive(subj.b,subj.R,subj.B,subj.G),out=[];const gap=0.25+p[1]*0.6,gain=0.6+p[2]*2.2,th=0.04+p[4]*0.3;
 d.s.forEach((x,k)=>{const y=k===11?(5.4)*gap:(k<5?(5-k)*gap:-(k-4)*gap);out.push({k,r:0.5+gain*x/10,y,th,tw:p[0]*Math.PI*(k/11)})});
 [subj.R,subj.B,subj.G].forEach((x,j)=>out.push({k:12+j,r:1.0+gain*1.05+0.3*j,y:0,th:th*0.7*(0.4+x/10),tw:(j-1)*0.5}));return out};
SD.toOBJ=(subj,p)=>{const N=SD.N,R=SD.rings(subj,p);let v='',f='',base=1;let nv=0,nf=0;v+='# Sapphon dossier sculpture · MODEL · 12 Dave layers + RED/BLUE/GREEN lanes\n';
 R.forEach(q=>{for(let i=0;i<N;i++){const a=2*Math.PI*i/N+q.tw;for(const rr of [q.r-q.th,q.r+q.th]){v+=`v ${(rr*Math.cos(a)).toFixed(4)} ${q.y.toFixed(4)} ${(rr*Math.sin(a)).toFixed(4)}\n`;nv++}}
  for(let i=0;i<N;i++){const a=base+2*i,b=base+2*((i+1)%N);f+=`f ${a} ${a+1} ${b+1} ${b}\n`;nf++}base+=2*N});return {text:v+f,nv,nf}};
SD.esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
SD.toSVG=(subj,title,col)=>{const d=SD.derive(subj.b,subj.R,subj.B,subj.G),c=200,K=12;col=col||{ink:'#222',a:'#7a5cff'};let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" font-family="sans-serif"><title>${SD.esc(title)} · sapphon radial (MODEL)</title><circle cx="200" cy="200" r="190" fill="none" stroke="${col.ink}" stroke-opacity=".25"/>`;
 const P=(r,a)=>[c+r*Math.sin(a*Math.PI/180),c-r*Math.cos(a*Math.PI/180)];
 d.s.forEach((x,k)=>{const a0=k*30,a1=a0+30,r=20+13*x,[x0,y0]=P(r,a0+1),[x1,y1]=P(r,a1-1);s+=`<path class="w" d="M200 200 L${x0.toFixed(2)} ${y0.toFixed(2)} A${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z" fill="hsl(${(k*30+260)%360},70%,60%)" fill-opacity=".55" stroke="${col.ink}" stroke-width=".6"><title>${SD.esc(SD.LAYERS[k][0]+' '+SD.LAYERS[k][1])}: ${x.toFixed(2)}</title></path>`;
  [subj.b[k],d.d2[k],d.d3[k]].forEach((y,j)=>{const rr=20+13*y,[u0,v0]=P(rr,a0+3+j*8),[u1,v1]=P(rr,a0+9+j*8);s+=`<line x1="${u0.toFixed(2)}" y1="${v0.toFixed(2)}" x2="${u1.toFixed(2)}" y2="${v1.toFixed(2)}" stroke="${col.ink}" stroke-width="1.6"/>`});
  const [lx,ly]=P(162,a0+15);s+=`<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" font-size="9" text-anchor="middle" fill="${col.ink}">${SD.esc(SD.LAYERS[k][0])}</text>`});
 [['RED','#ff5d73',subj.R],['BLUE','#5aa9ff',subj.B],['GREEN','#3ee07a',subj.G]].forEach(([n,cc,x],j)=>{const r=172+j*7,a1=Math.max(1,36*x-0.01),[x0,y0]=P(r,0),[x1,y1]=P(r,a1);s+=`<path class="ln" d="M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${a1>180?1:0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}" fill="none" stroke="${cc}" stroke-width="5"><title>${n} ${x}</title></path>`});
 [['{i}',d.aI,150,'#ffcf3e'],['{id}',d.aID,125,'#ff7ad9'],['{sid}',d.aSID,100,'#4fd1ff']].forEach(([n,a,r,cc])=>{const [x,y]=P(r,a);s+=`<line class="nd" x1="200" y1="200" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}" stroke="${cc}" stroke-width="3"><title>${n} ${a.toFixed(1)}°</title></line><circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="4" fill="${cc}"/>`});
 s+=`<circle cx="200" cy="200" r="9" fill="#9b5de5"/><text x="200" y="396" font-size="10" text-anchor="middle" fill="${col.ink}">index ${d.idx.toFixed(2)} · MODEL</text></svg>`;return s};
SD.loopCheck=(subj,hue,seed)=>{const L=SD.mkLoop(subj,hue,seed);for(let i=0;i<240;i++)L.step();if(L.log.length<5)throw Error('workspace loop logged '+L.log.length+' < 5');
 if(!(L.score>L.first||L.first>0.999))throw Error('CRITIC score did not improve');const O=SD.toOBJ(subj,L.best);if(O.nv!==15*2*SD.N||O.nf!==15*SD.N)throw Error('OBJ counts');
 const S=SD.toSVG(subj,'check');const nw=(S.match(/class="w"/g)||[]).length,nd=(S.match(/class="nd"/g)||[]).length,nl=(S.match(/class="ln"/g)||[]).length;if(nw!==12||nd!==3||nl!==3)throw Error('SVG counts '+nw+'/'+nd+'/'+nl);
 return {L,text:`ARTIST+CRITIC loop: CRITIC ${L.first.toFixed(3)} → ${L.score.toFixed(3)} in 240 rounds, ${L.log.length} workspace entries; OBJ ${O.nv} v / ${O.nf} f; SVG 12 layer wedges, 3 lanes, 3 radials`}};
/* data checks (LIT on the data file itself: counts and date sanity; the scores inside are MODEL) */
SD.ERAS=null;
SD.checkData=D=>{const P=D.people,E=D.eras;if(P.length!==144)throw Error('people '+P.length);if(E.length!==12)throw Error('eras');const ids=new Set();let f=0,m=0;const reg={};
 P.forEach(p=>{if(ids.has(p.slug))throw Error('dup '+p.slug);ids.add(p.slug);if(p.gender==='F')f++;else if(p.gender==='M')m++;else throw Error('gender '+p.name);reg[p.region]=(reg[p.region]||0)+1;
  const e=E[p.era-1];if(!(p.fl>=e.from&&p.fl<e.to))throw Error('era range '+p.name);if(!(p.y0<=p.fl))throw Error('birth>floruit '+p.name);
  if(p.y1!==null){if(!(p.y1>=p.y0&&p.fl<=p.y1+1))throw Error('death '+p.name);if(p.living)throw Error('living flag '+p.name)}else{if(!p.living||p.y0<1920||p.y0>2026)throw Error('living sanity '+p.name)}
  if(!/^https:\/\/en\.wikipedia\.org\/wiki\//.test(p.source))throw Error('source '+p.name);if(p.layers.length!==12)throw Error('layers '+p.name);
  p.layers.forEach((l,k)=>{if(l.n!==SD.LAYERS[k][0]||l.name!==SD.LAYERS[k][1])throw Error('label '+p.name);if(!(l.base>=0&&l.base<=10))throw Error('range '+p.name)});
  ['RED','BLUE','GREEN'].forEach(k=>{const x=p.lanes[k];if(!(x.score>=0&&x.score<=10)||!x.why)throw Error('lane '+k+' '+p.name)});
  const d=SD.derive(...Object.values(SD.subjectOf(p)));for(const k of SD.KEYS)if(Math.abs(d[k]-p.derived[k])>1e-9)throw Error('derived '+k+' '+p.name)});
 E.forEach((e,i)=>{const n=P.filter(p=>p.era===i+1).length;if(n!==12)throw Error('era '+(i+1)+' has '+n)});
 if(f!==D.stats.female||m!==D.stats.male)throw Error('gender stats');for(const k in reg)if(reg[k]!==D.stats.regions[k])throw Error('region stats '+k);
 return `data: 144 people, 12 eras × 12, ${f} F / ${m} M, ${Object.keys(reg).length} regions, every date inside its era and life span, ${P.filter(p=>p.living).length} living, Dave's 12 labels verbatim on every card, every derived score recomputed`};
G.SD=SD})(window);
