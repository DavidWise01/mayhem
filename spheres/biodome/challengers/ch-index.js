/* ch-index.js · the biodome waiting room: 24 fictional sapphon challengers (MODEL). One shared WebGL renderer draws only visible cards (lazy). */
(function(){'use strict';var R=window.CH_ROSTER,AMD=window.AMD,X=window.CHX,$=function(i){return document.getElementById(i)};
var THUMB=/thumb=1/.test(location.search);if(THUMB)document.body.classList.add('thumb');
function sha(s){return crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)).then(function(b){return[].slice.call(new Uint8Array(b)).map(function(v){return v.toString(16).padStart(2,'0')}).join('')})}
var F={g:'*',f:'*',t:'*'};function apply(){var n=0;[].forEach.call(document.querySelectorAll('li.ch'),function(li){var ok=(F.g==='*'||li.dataset.g===F.g)&&(F.f==='*'||li.dataset.f===F.f)&&(F.t==='*'||li.dataset.t===F.t);li.style.display=ok?'':'none';if(ok)n++});$('shown').textContent=n+' shown';
 [].forEach.call(document.querySelectorAll('button.chip'),function(b){b.classList.toggle('on',F[b.dataset.k]===b.dataset.v)});[].forEach.call(document.querySelectorAll('#key tr[data-t]'),function(tr){tr.classList.toggle('on',F.t===tr.dataset.t)})}
[].forEach.call(document.querySelectorAll('button.chip'),function(b){b.onclick=function(){F[b.dataset.k]=b.dataset.v;if(b.dataset.k!=='t')F.t='*';apply()}});
[].forEach.call(document.querySelectorAll('#key tr[data-t]'),function(tr){tr.onclick=function(){F.t=F.t===tr.dataset.t?'*':tr.dataset.t;apply()}});apply();
// shared renderer
var size=180,d=Math.min(2,devicePixelRatio||1),r=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});r.setPixelRatio(d);r.setSize(size,size);r.toneMapping=THREE.ACESFilmicToneMapping;r.outputColorSpace=THREE.SRGBColorSpace;
var sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(36,1,.1,40);cam.position.set(0,1.1,5.6);cam.lookAt(0,0,0);var env=X.studioEnv(r,'#8899ff');sc.environment=env;
sc.add(new THREE.HemisphereLight(0xffffff,0x221133,.6));var k1=new THREE.DirectionalLight(0xffffff,2.2);k1.position.set(4,6,5);sc.add(k1);var k2=new THREE.PointLight(0xffffff,24,12);k2.position.set(-3,-1,3);sc.add(k2);
var built={},vis=new Set(),cards={};
R.agents.forEach(function(a){cards[a.slug]={a:a,cv:document.querySelector('canvas[data-s="'+a.slug+'"]')}});
var io=new IntersectionObserver(function(es){es.forEach(function(e){var s=e.target.dataset.s;if(e.isIntersecting)vis.add(s);else vis.delete(s)})},{rootMargin:'120px'});
Object.keys(cards).forEach(function(s){var c=cards[s].cv;c.width=size*d;c.height=size*d;io.observe(c)});
var drawn=0;function draw(s,t){var c=cards[s],a=c.a;if(!built[s]){built[s]=X.crystal({hex:a.hex,cut:a.cut,look:a.look},env);built[s].scale.setScalar(1.05)}var g=built[s];sc.add(g);g.rotation.y=t*.6+a.slug.length;g.rotation.x=Math.sin(t*.5)*.1;k2.color.set(a.hex);
 r.render(sc,cam);sc.remove(g);var x=c.cv.getContext('2d');x.clearRect(0,0,c.cv.width,c.cv.height);x.drawImage(r.domElement,0,0);drawn++}
var t0=performance.now(),q=[];(function loop(){var t=(performance.now()-t0)/1000;if(!q.length)q=Array.from(vis);for(var i=0;i<3&&q.length;i++){var s=q.shift();if(vis.has(s)&&cards[s].cv.offsetParent)draw(s,t)}requestAnimationFrame(loop)})();
window.__wr={built:built,vis:vis,drawn:function(){return drawn}};
function check(){var e=[],a=R.agents;if(a.length!==24)e.push('need 24 agents');var f=a.filter(function(x){return x.gender==='female'}).length;if(f!==12||a.length-f!==12)e.push('need 12 female + 12 male');
 var hx=new Set(a.map(function(x){return x.hex}));if(hx.size!==24)e.push('colours not distinct');if(a.some(function(x){return x.gem_key==='amethyst'||x.gem_key==='citrine'}))e.push('amethyst/citrine are taken');
 var tm=new Set(a.map(function(x){return x.temperament}));if(tm.size!==24)e.push('temperaments not distinct');
 a.forEach(function(x){var p=AMD.parseAgentMd(x.md);if(!p.ok||p.warn.length)e.push(x.name+' agent.md: '+(p.err||[]).concat(p.warn).join('; '));if(x.layers.length!==12)e.push(x.name+' layers')});
 if(document.querySelectorAll('li.ch').length!==24)e.push('cards '+document.querySelectorAll('li.ch').length);if(document.querySelectorAll('#key tr[data-t]').length!==24)e.push('key rows');
 if($('notation').textContent!==R.notation)e.push('notation not verbatim');if(e.length)throw Error(e.join(' | '));return '24 challengers (12 female, 12 male), 24 distinct colours and temperaments, amethyst + citrine left to Patricia and Pattycakes, all 24 agent.md files parse with agentmd.js (0 warnings)'}
(async function(){var p=$('proof');try{var h=await sha(window.NAME+'|'+window.SLUG+'|'+window.BLURB);if(h!==window.SEAL)throw Error('seal mismatch');p.innerHTML='<span class="t LIT">LIT</span> self-check passed: seal recomputed; '+check()}catch(e){p.innerHTML='<span class="t WALL">FAIL</span> '+e.message;throw e}})();
})();
