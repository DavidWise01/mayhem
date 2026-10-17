/* sd-page.js · MODEL: proof runner. Seal → data file checks (throws) → page facts → ARTIST+CRITIC loop proof → art → I-13 boot (SHA-256, lab 8/8) → VM score audit → page lab. */
(async()=>{const $=i=>document.getElementById(i),T=(c,s)=>'<span class="t '+c+'">'+c+'</span> '+s,thumb=document.body.classList.contains('thumb');
 let rs;window.SD_READY=new Promise(r=>rs=r);let D,subj,base='',LC,rec=null,recs=null;
 try{D=await (await fetch('sapphon-dossiers.json',{cache:'no-cache'})).json();window.DATA=D;
  if(CFG.kind==='dossier'){rec=D.people.find(p=>p.slug===CFG.slug);if(!rec)throw Error('record missing');subj=SD.subjectOf(rec)}
  else if(CFG.kind==='era'){recs=D.people.filter(p=>p.era===CFG.era);subj=SD.meanSubject(recs)}else{recs=D.people;subj=SD.meanSubject(recs)}
  window.SUBJ=subj;rs(subj)}catch(e){rs(null);if(!thumb){$('proof').innerHTML=T('WALL','FAIL '+e.message)}throw e}
 if(thumb)return;
 const p=$('proof'),en=$('engine');
 try{const h=await SD.sha(NAME+'|'+SLUG+'|'+BLURB);if(h!==SEAL)throw Error('seal mismatch');const dt=SD.checkData(D);let f='';
  if(rec){if(document.querySelector('h1').textContent!==rec.name)throw Error('title ≠ record');if(rec.era!==CFG.era)throw Error('era');const e=D.eras[rec.era-1];if(!(rec.fl>=e.from&&rec.fl<e.to))throw Error('era span');
   f=rec.name+': '+rec.dates+' inside era '+e.n+' ('+e.span+'), bio '+rec.bio.length+' chars with source '+rec.source.replace('https://','');$('rad').innerHTML=SD.toSVG(subj,rec.name,{ink:'#222'})}
  else if(CFG.kind==='era'){const nf=recs.filter(r=>r.gender==='F').length;if(recs.length!==12)throw Error('era size');f='era '+CFG.era+': 12 people, '+nf+' women / '+(12-nf)+' men'}
  else f='roster '+D.people.length+' · '+D.stats.female+' F / '+D.stats.male+' M';
  LC=SD.loopCheck(subj,CFG.hue,parseInt(SEAL.slice(0,8),16));base='seal recomputed; '+dt+'; '+f+'; '+LC.text;p.innerHTML=T('LIT','self-check passed: '+base+'; engine check running…');
  try{SDART.paint(STYLE,$('art'),SEAL,PAL)}catch(e){}
  if(CFG.kind==='index')indexUI(D);if(CFG.kind==='era'||CFG.kind==='index')lazy();
 }catch(e){p.innerHTML=T('WALL','FAIL '+e.message);throw e}
 try{const B=await I13.boot();en.innerHTML=T(B.lineage.sha256_match?'LIT':'WALL','I-13 engine v0.3 booted from <code>../protein-folding/engine/i13-suite-v0.3-direct-wasm.html</code> (Dave’s file, unchanged; page-file sha256 '+(B.htmlShaMatch?'matches':'DIFFERS')+'): emitted '+B.bytes+' WASM bytes, <code>WebAssembly.validate</code> '+B.lineage.wasm_validate+', SHA-256 <code>'+B.lineage.actual_sha256+'</code> '+(B.lineage.sha256_match?'= expected ✓':'≠ expected ✗')+', '+B.nExports+' native exports, '+B.nImports+' imports, Dave\'s regression lab '+B.labPass+'/'+B.labTotal+', booted in '+B.ms.toFixed(0)+' ms.');
  if(!B.lineage.sha256_match)throw Error('WASM sha');if(B.labPass!==B.labTotal)throw Error('regression lab '+B.labPass+'/'+B.labTotal);
  const r=await SD.engineDerive(subj.b,subj.R,subj.B,subj.G);let extra='';
  if(rec){for(const k of SD.KEYS)if(Math.abs(r.g[SD.VMMAP[k]]-rec.derived[k])>1e-9)throw Error('VM ≠ JSON '+k);extra='; VM = JSON file for all '+SD.KEYS.length+' derived values (index '+r.g.idx.toFixed(4)+')'}
  else if(CFG.kind==='era'){const L=v=>I13.lit(v);let s='';recs.forEach((q,i)=>{s+=`I x${i} <- ${L(q.derived.idx)}\nI r${i} <- ${L(q.lanes.RED.score)}\nI b${i} <- ${L(q.lanes.BLUE.score)}\nI g${i} <- ${L(q.lanes.GREEN.score)}\n`});
   const sm=c=>'('+recs.map((q,i)=>c+i).join(' + ')+') / 12';s+=`I mx <- ${sm('x')}\nI mr <- ${sm('r')}\nI mb <- ${sm('b')}\nI mg <- ${sm('g')}\n`;const v=await I13.run(s);
   const j=k=>recs.reduce((a,q)=>a+k(q),0)/12;const J={mx:j(q=>q.derived.idx),mr:j(q=>q.lanes.RED.score),mb:j(q=>q.lanes.BLUE.score),mg:j(q=>q.lanes.GREEN.score)};for(const k in J)if(Math.abs(v.globals[k]-J[k])>1e-9)throw Error('era VM '+k);
   $('eravm').innerHTML=T('MODEL','Era means on the I-13 VM: index '+J.mx.toFixed(3)+' · RED '+J.mr.toFixed(2)+' · BLUE '+J.mb.toFixed(2)+' · GREEN '+J.mg.toFixed(2));extra='; VM era means (48 literals) = JS: index '+J.mx.toFixed(3)}
  else if(CFG.kind==='index'){const L=v=>I13.lit(v);const g=D.people.map(q=>`I ti <- ti + ${L(q.derived.idx)}\nI tf <- tf + ${q.gender==='F'?1:0}`);const v=await I13.runChain('',g,{ti:0,tf:0});
   const ti=D.people.reduce((a,q)=>a+q.derived.idx,0);if(Math.abs(v.globals.ti-ti)>1e-7||v.globals.tf!==D.stats.female)throw Error('index VM');extra='; VM summed 144 indexes in '+v.runs+' chained programs (mean '+(ti/144).toFixed(4)+') and counted '+v.globals.tf+' women'}
  else if(CFG.kind==='method'){const N=D.people[0],s=SD.subjectOf(N),w=await SD.engineDerive(s.b,s.R,s.B,s.G);const d=N.derived;
   $('work').innerHTML=T('LIT','VM program for '+N.name+' ('+SD.vmProgram(s.b,s.R,s.B,s.G).split('\n').length+' lines, '+w.ops+' lowered instructions, '+w.steps+' steps): layer ethics '+w.g.s0.toFixed(3)+' · streams LS/Toph/RS '+(100*w.g.lsp).toFixed(1)+'/'+(100*w.g.top).toFixed(1)+'/'+(100*w.g.rsp).toFixed(1)+'% · tempo '+w.g.tempo.toFixed(3)+' · {i} '+w.g.ai.toFixed(1)+'° {id} '+w.g.aid.toFixed(1)+'° {sid} '+w.g.asid.toFixed(1)+'° · index '+w.g.idx.toFixed(4)+' = JSON '+d.idx.toFixed(4))+'<pre style="font-size:11px;max-height:200px;overflow:auto">'+SD.esc(SD.vmProgram(s.b,s.R,s.B,s.G))+'</pre>';extra='; worked example ('+N.name+') rebuilt on the VM = JSON'}
  window.SD_VM_OK=true;p.innerHTML=T('LIT','self-check passed: '+base+'; I-13 engine: VM rebuilt this page\'s sapphon ('+r.n+' values, '+r.ops+' lowered instructions) = JS'+extra+' (throws on any mismatch)');
  const st=$('stats');const su=()=>{if(st)st.textContent='I-13 VM so far on this page: '+I13.STATS.runs+' programs, '+I13.STATS.steps.toLocaleString()+' VM steps, '+I13.STATS.ops.toLocaleString()+' lowered 24-byte instructions.'};su();setInterval(su,2000);
 }catch(e){en.innerHTML=(en.innerHTML||'')+' '+T('WALL','engine FAIL '+e.message);p.innerHTML+=' '+T('WALL','engine check FAIL '+e.message);console.error(e);throw e}
 function lazy(){const io=new IntersectionObserver(es=>es.forEach(e=>{const f=e.target;if(e.isIntersecting){if(!f.src||f.src==='about:blank')f.src=f.dataset.src}else if(f.src&&f.src!=='about:blank')f.src='about:blank'}),{rootMargin:'150px'});
  const scan=()=>document.querySelectorAll('iframe[data-src]').forEach(f=>{if(!f._o){f._o=1;io.observe(f)}});scan();window.SD_SCAN=scan}
 function indexUI(D){const S={era:null,region:null,gender:null,cat:null,q:''};const mk=(id,key,vals,lab)=>{const el=$(id);el.innerHTML='<b>'+lab+':</b> '+['all',...vals].map(v=>`<button class="chip${v==='all'?' on':''}" data-v="${SD.esc(v)}">${SD.esc(key==='era'&&v!=='all'?v+'. '+D.eras[v-1].name:key==='gender'&&v!=='all'?(v==='F'?'women':'men'):v)}</button>`).join('');
   el.onclick=e=>{const b=e.target.closest('button');if(!b)return;el.querySelectorAll('button').forEach(x=>x.classList.remove('on'));b.classList.add('on');S[key]=b.dataset.v==='all'?null:b.dataset.v;draw()}};
  mk('fe','era',D.eras.map(e=>String(e.n)),'era');mk('fr','region',[...new Set(D.people.map(p=>p.region))].sort(),'region');mk('fg','gender',['F','M'],'gender');mk('ff','cat',[...new Set(D.people.map(p=>p.cat))].sort(),'field');
  $('q').oninput=e=>{S.q=e.target.value.toLowerCase();draw()};
  const card=p=>`<li data-slug="${p.slug}"><a href="${p.slug}.html"><div class="th"><iframe data-src="${p.slug}.html?thumb=1" loading="lazy" tabindex="-1" title="${SD.esc(p.name)} 3D"></iframe></div><b>${SD.esc(p.name)}</b></a><br>${SD.esc(p.dates)} · ${SD.esc(p.region)} · ${SD.esc(p.field)}<br><span class="t MODEL">MODEL</span> index ${p.derived.idx.toFixed(2)}</li>`;
  $('cards').innerHTML=D.people.map(card).join('');
  function draw(){let n=0;D.people.forEach(p=>{const ok=(!S.era||p.era==S.era)&&(!S.region||p.region===S.region)&&(!S.gender||p.gender===S.gender)&&(!S.cat||p.cat===S.cat)&&(!S.q||(p.name+' '+p.field+' '+p.bio+' '+p.region+' '+p.dates).toLowerCase().includes(S.q));
   const li=document.querySelector(`li[data-slug="${p.slug}"]`);li.style.display=ok?'':'none';if(ok)n++});$('cnt').textContent=n+' of 144 shown'}
  draw();window.SD_FILTER=(k,v)=>{S[k]=v;draw();return [...document.querySelectorAll('#cards li')].filter(l=>l.style.display!=='none').length};
  const opts=D.people.map((p,i)=>`<option value="${i}">${SD.esc(p.name)} (${SD.esc(p.dates)})</option>`).join('');$('ca').innerHTML=opts;$('cb').innerHTML=opts;$('cb').value=String(D.people.findIndex(p=>p.name==='Hatshepsut'));$('ca').value=String(D.people.findIndex(p=>p.name==='Elizabeth I'));
  const cmp=()=>{const a=D.people[+$('ca').value],b=D.people[+$('cb').value],sa=SD.subjectOf(a),sb=SD.subjectOf(b);$('cmp').innerHTML=`<div><b>${SD.esc(a.name)}</b>${SD.toSVG(sa,a.name)}</div><div><b>${SD.esc(b.name)}</b>${SD.toSVG(sb,b.name)}</div>`;
   const row=(l,x,y)=>`<tr><td>${l}</td><td>${x.toFixed(2)}</td><td>${y.toFixed(2)}</td><td>${(x-y>=0?'+':'')+(x-y).toFixed(2)}</td></tr>`;
   $('cmpt').innerHTML='<table class="sc"><tr><th>MODEL</th><th>'+SD.esc(a.name)+'</th><th>'+SD.esc(b.name)+'</th><th>Δ</th></tr>'+a.layers.map((l,k)=>row('<code>'+SD.esc(l.n+' '+l.name)+'</code>',l.score,b.layers[k].score)).join('')+['RED','BLUE','GREEN'].map(k=>row(k,a.lanes[k].score,b.lanes[k].score)).join('')+row('tempo',a.derived.tempo,b.derived.tempo)+row('index',a.derived.idx,b.derived.idx)+'</table>'};
  $('ca').onchange=cmp;$('cb').onchange=cmp;cmp()}
})();
