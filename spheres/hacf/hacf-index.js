/* hacf-index.js · Mayhem t269 (+t270 spotlight) · batch index: hero 3D scene, filter chips (arc / year), lazy 3D thumbnails (load on screen, unload off screen), LIT check that throws. */
(async()=>{'use strict';const $=i=>document.getElementById(i),T=(c,s)=>'<span class="t '+c+'">'+c+'</span> '+s;
const p=$('proof');window.HACF_READY=null;
try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(NAME+'|'+SLUG+'|'+BLURB)),h=[...new Uint8Array(b)].map(v=>v.toString(16).padStart(2,'0')).join('');if(h!==SEAL)throw Error('seal mismatch');
 const cards=[...document.querySelectorAll('li.card')];if(cards.length!==33)throw Error('cards '+cards.length);const sp=cards.pop();if(+sp.dataset.n!==SPOT.n||sp.dataset.arc!=='spotlight'||sp.querySelector('a').getAttribute('href')!==SPOT.slug+'.html')throw Error('spotlight card');
 cards.forEach((c,i)=>{if(+c.dataset.n!==IDX.n[i]||c.dataset.arc!==IDX.arc[i]||+c.dataset.year!==IDX.year[i])throw Error('card '+i+' does not match the data');const a=c.querySelector('a');if(a.getAttribute('href')!==IDX.slug[i]+'.html')throw Error('link '+i)});
 if(new Set(IDX.slug).size!==32)throw Error('duplicate slug');if(THREE.REVISION!=='160')throw Error('three');
 const api=HS.create($('v3'),{scene:'booth',palette:'cga',phos:'#ffb000',cast:['roxy','dex','wrench','madge','boss','kid'],title:'HACF IN PIXELS',seed:269,bg:'#2a1f3d',floorA:'#6b4a2b',floorB:'#5e4126',wall:'#8a7a5a'});
 if(api.dpr>2)throw Error('DPR');let k=0;api.onScreen=(x,w,h,t,ph)=>HWX.term(x,w,h,['32 PAGES · 4 ARCS','1981 → 1995','','> '+IDX.slug[(Math.floor(t/2))%32].replace(/^hacf-\d+-/,'')],ph,'MAYHEM');api.start();
 const arcs={};IDX.arc.forEach(a=>arcs[a]=(arcs[a]||0)+1);
 p.innerHTML=T('LIT','self-check passed: seal recomputed · 32 batch cards + 1 spotlight (Cameron, t270) match the batch data (number, arc, year, link) · arcs '+Object.entries(arcs).map(([a,n])=>a+' '+n).join(', ')+' · Three.js r160 at DPR '+api.dpr);window.HACF_READY={ok:true,cards:33}}
catch(e){p.innerHTML=T('WALL','FAIL '+e.message);window.HACF_READY={ok:false,err:e.message};throw e}
let sel={g:'all',v:null};document.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{sel={g:b.dataset.g,v:b.dataset.v};document.querySelectorAll('.chip').forEach(x=>x.classList.toggle('on',x===b));
 document.querySelectorAll('li.card').forEach(c=>{c.style.display=sel.g==='all'||c.dataset[sel.g]===sel.v?'':'none'})});
const io=new IntersectionObserver(es=>es.forEach(e=>{const f=e.target;if(e.isIntersecting){if(!f.getAttribute('src')||f.getAttribute('src')==='about:blank')f.src=f.dataset.src}else if(f.getAttribute('src')&&f.getAttribute('src')!=='about:blank')f.src='about:blank'}),{rootMargin:'60px'});
document.querySelectorAll('iframe[data-src]').forEach(f=>io.observe(f));})();
