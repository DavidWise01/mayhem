/* ch-page.js · one challenger page in the biodome waiting room. ARTIST + CRITIC agents (MODEL). Data only from agent.md: nothing is executed. */
(function(){'use strict';
var R=window.CH_ROSTER,AMD=window.AMD,SIM=window.CHSIM,X=window.CHX,$=function(i){return document.getElementById(i)};
var A=R.agents.filter(function(a){return a.slug===window.CH_SLUG})[0];if(!A)throw Error('no roster entry for '+window.CH_SLUG);
var THUMB=/thumb=1/.test(location.search);if(THUMB)document.body.classList.add('thumb');
var PUB=/github\.io$/.test(location.hostname)||/pub=1/.test(location.search),LOCAL=!PUB;
var board=[];function log(who,msg){board.push(who+': '+msg);var b=$('board');if(b){var li=document.createElement('li');li.textContent=who+': '+msg;b.appendChild(li);b.scrollTop=1e9}}
function sha(s){return crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)).then(function(b){return[].slice.call(new Uint8Array(b)).map(function(v){return v.toString(16).padStart(2,'0')}).join('')})}
function b64u(str){return btoa(unescape(encodeURIComponent(str))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function dl(name,text,type){var u=URL.createObjectURL(new Blob([text],{type:type||'text/plain'})),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},4000)}
var parsed=AMD.parseAgentMd(A.md);var me=parsed.agent;
function oppAgent(s){if(s==='patricia')return AMD.PATRICIA;if(s==='pattycakes')return AMD.PATTYCAKES;var o=R.agents.filter(function(a){return a.slug===s})[0];return AMD.parseAgentMd(o.md).agent}
function oppInfo(s){if(s==='patricia')return{name:'Patricia',hex:'#9b5de5',gem:'Amethyst',page:null};if(s==='pattycakes')return{name:'Pattycakes',hex:'#ffc46b',gem:'Citrine',page:null};var o=R.agents.filter(function(a){return a.slug===s})[0];return{name:o.name,hex:o.hex,gem:o.gem,page:o.page}}
// ---------- links: local dome vs public mirror ----------
(function links(){var duel=LOCAL?'../index.v2.html':'../index.html',hash='#agent='+b64u(A.md);
 var d=$('duel');if(d){d.href=duel+hash;d.textContent=(LOCAL?'open the dome duel (index.v2.html)':'open the dome duel (public biodome page)')+' with '+A.name+' loaded'}
 var ar=$('arcade');if(ar){if(LOCAL){ar.href='../arcade.html';ar.textContent='open the arcade (arcade.html, local)'}else{ar.removeAttribute('href');ar.textContent='arcade.html is on Dave\'s machine only (not public)';ar.className='off'}}
 var mo=$('monitor');if(mo){if(LOCAL){mo.href='../index.html';mo.textContent='biodome home monitor (local)'}else{mo.href='../index.html';mo.textContent='biodome home (public)'}}
 $('mode').innerHTML=LOCAL?'<span class="t LIT">LIT</span> local copy: links go to the dome on this machine':'<span class="t AMBER">AMBER</span> public mirror: the arcade and home monitor live on Dave\'s machine only'})();
// ---------- the bout panel ----------
(function bout(){var s=A.suggested,o=oppInfo(s),m=A.matchups[s];
 var alt=Object.keys(A.matchups).filter(function(k){return k!=='patricia'&&k!=='pattycakes'}).sort(function(u,v){return Math.abs(A.matchups[u].win-.5)-Math.abs(A.matchups[v].win-.5)||(u<v?-1:1)})[0],ao=oppInfo(alt);
 $('opp').innerHTML='<b style="color:'+o.hex+'">'+o.name+'</b> ('+o.gem+') · MODEL mini-sim: '+A.name+' wins '+(m.win*100).toFixed(1)+'% of '+m.n+' seeded bouts, takes '+m.dmg_taken+' / deals '+m.dmg_dealt+' damage on average. Picked as the most even house matchup (MODEL rule).';
 $('opp2').innerHTML='Challenger-vs-challenger option: <a href="'+ao.page+'" style="color:'+ao.hex+'">'+ao.name+'</a> ('+ao.gem+'), '+(A.matchups[alt].win*100).toFixed(1)+'% (most even of the 23 others).';
 var ck=$('checks'),key='biodome-ch-'+A.slug,st={};try{st=JSON.parse(localStorage.getItem(key)||'{}')}catch(e){}
 [].forEach.call(ck.querySelectorAll('input'),function(i){i.checked=!!st[i.dataset.k];i.onchange=function(){st[i.dataset.k]=i.checked;try{localStorage.setItem(key,JSON.stringify(st))}catch(e){}prog()}});
 function prog(){var n=ck.querySelectorAll('input').length,c=ck.querySelectorAll('input:checked').length;$('prog').textContent=c+' / '+n+' done'+(c===n?' · ready for the dome':'')}prog();
 $('mdget').onclick=function(){dl(A.md_file,A.md,'text/markdown');log('ARTIST','agent.md downloaded ('+A.md.length+' bytes)')};
 $('mdcopy').onclick=function(){navigator.clipboard&&navigator.clipboard.writeText(A.md).then(function(){log('ARTIST','agent.md copied')},function(){log('CRITIC','clipboard refused; use download')})}})();
// ---------- charts ----------
function cv(id,h){var c=$(id);if(!c)return null;var d=Math.min(2,devicePixelRatio||1),w=c.clientWidth||600;c.width=w*d;c.height=h*d;var x=c.getContext('2d');x.scale(d,d);x.W=w;x.H=h;return x}
function layerChart(){var x=cv('lchart',200);if(!x)return;var L=A.layers,w=x.W/L.length;x.font='11px system-ui';
 L.forEach(function(l,i){l.depths.forEach(function(v,k){x.fillStyle=k===0?A.hex:k===1?'rgba(255,255,255,.75)':'rgba(255,255,255,.35)';var bh=v*150;x.fillRect(i*w+6+k*(w-12)/3,170-bh,(w-12)/3-2,bh)});x.fillStyle='#ccd';x.fillText(l.n,i*w+w/2-8,188)});
 x.fillStyle='#ccd';x.fillText('depth 1 surface · 2 habit · 3 core (MODEL)',6,12)}
function radials(){var x=cv('radials',170);if(!x)return;var neg=A.layers.filter(function(l){return l.n[0]==='-'}),
 vi=A.layers.filter(function(l){return l.n==='1'})[0].depths[1],vid=neg.reduce(function(s,l){return s+l.depths[1]},0)/neg.length,vs=A.layers[0].depths[1];
 var R3=[['{i}',vi,'layer 1 = {i}'],['{id}',vid,'mean of -1..-6'],['{sid}',vs,'+1 super id']],w=x.W/3;window.__radials=R3;
 R3.forEach(function(r,i){var cx=w*i+w/2,cy=82,rad=58;x.lineWidth=12;x.strokeStyle='rgba(255,255,255,.15)';x.beginPath();x.arc(cx,cy,rad,.75*Math.PI,2.25*Math.PI);x.stroke();
  x.strokeStyle=A.hex;x.beginPath();x.arc(cx,cy,rad,.75*Math.PI,(.75+1.5*r[1])*Math.PI);x.stroke();x.fillStyle='#fff';x.font='bold 20px system-ui';x.textAlign='center';x.fillText(r[0],cx,cy+2);
  x.font='13px system-ui';x.fillText(r[1].toFixed(2),cx,cy+22);x.fillStyle='#aab';x.font='11px system-ui';x.fillText(r[2],cx,cy+78)})}
function matchChart(){var x=cv('mchart',170);if(!x)return;var ks=Object.keys(A.matchups),w=x.W/ks.length;x.strokeStyle='rgba(255,255,255,.4)';x.beginPath();x.moveTo(0,80);x.lineTo(x.W,80);x.stroke();
 ks.forEach(function(k,i){var o=oppInfo(k),v=A.matchups[k].win;x.fillStyle=o.hex;x.globalAlpha=k===A.suggested?1:.6;x.fillRect(i*w+2,150-v*140,w-4,v*140);x.globalAlpha=1;if(k===A.suggested){x.fillStyle='#fff';x.fillRect(i*w+2,152,w-4,4)}});
 x.fillStyle='#ccd';x.font='11px system-ui';x.fillText('win rate vs each opponent (MODEL mini-sim, 101 bouts) · line = 50% · white tick = suggested',6,12);x.fillText('Patricia, Pattycakes, then the 23 challengers',6,166)}
// ---------- 3D: crystal + 12-layer brain ----------
var S={};function scene(){var host=$('v3');var r=new THREE.WebGLRenderer({antialias:true,alpha:false});r.setPixelRatio(Math.min(2,devicePixelRatio||1));r.setSize(host.clientWidth,host.clientHeight);
 r.toneMapping=THREE.ACESFilmicToneMapping;r.outputColorSpace=THREE.SRGBColorSpace;host.appendChild(r.domElement);
 var sc=new THREE.Scene();sc.background=new THREE.Color('#07060d');sc.fog=new THREE.Fog('#07060d',9,22);var cam=new THREE.PerspectiveCamera(42,host.clientWidth/host.clientHeight,.1,60);cam.position.set(0,1.2,7.4);cam.lookAt(0,0,0);
 var env=X.studioEnv(r,A.hex);sc.environment=env;
 sc.add(new THREE.HemisphereLight(0xffffff,0x221133,.5));var k1=new THREE.DirectionalLight(0xffffff,2.2);k1.position.set(4,6,5);sc.add(k1);var k2=new THREE.PointLight(new THREE.Color(A.hex),30,12);k2.position.set(-3,-1,3);sc.add(k2);
 var gem={hex:A.hex,cut:A.cut,look:A.look},cr=X.crystal(gem,env);cr.scale.setScalar(1.15);sc.add(cr);
 // brain: 12 rings, 3 depth orbs each. +1 halo above, 5..1 upper, -1..-6 lower (MODEL layout)
 var brain=new THREE.Group();sc.add(brain);var orbs=[];
 A.layers.forEach(function(l,i){var y=l.n==='+1'?2.55:(i<6?2.0-(i-1)*.36:-0.25-(i-6)*.36),rad=l.n==='+1'?1.15:2.15+(i%2)*.12;
  var ring=new THREE.Mesh(new THREE.TorusGeometry(rad,.012,6,96),new THREE.MeshBasicMaterial({color:A.hex,transparent:true,opacity:.18+.5*l.depths[1]}));ring.rotation.x=Math.PI/2;ring.position.y=y;brain.add(ring);
  l.depths.forEach(function(v,k){var o=new THREE.Mesh(new THREE.SphereGeometry(.05+.07*v,14,10),new THREE.MeshStandardMaterial({color:k===0?A.hex:'#ffffff',emissive:new THREE.Color(A.hex),emissiveIntensity:.3+1.6*v,roughness:.3}));
   o.userData={y:y,rad:rad*(1-.14*k),ph:i*.52+k*2.09,v:v};brain.add(o);orbs.push(o)})});
 // floor: electrum ring of the dome
 var fl=new THREE.Mesh(new THREE.TorusGeometry(3.1,.05,10,160),new THREE.MeshStandardMaterial({color:'#d9c27a',metalness:.9,roughness:.25}));fl.rotation.x=Math.PI/2;fl.position.y=-2.6;sc.add(fl);
 var st=new THREE.BufferGeometry(),sp=[];for(var i=0;i<500;i++){var t=Math.random()*6.283,u=Math.random()*2-1,rr=11+Math.random()*6;sp.push(rr*Math.sqrt(1-u*u)*Math.cos(t),rr*u,rr*Math.sqrt(1-u*u)*Math.sin(t))}
 st.setAttribute('position',new THREE.Float32BufferAttribute(sp,3));sc.add(new THREE.Points(st,new THREE.PointsMaterial({color:'#ffffff',size:.04})));
 var drag=null,yaw=0,pitch=.08;r.domElement.addEventListener('pointerdown',function(e){drag=[e.clientX,e.clientY]});addEventListener('pointerup',function(){drag=null});
 r.domElement.addEventListener('pointermove',function(e){if(!drag)return;yaw+=(e.clientX-drag[0])*.008;pitch=Math.max(-.6,Math.min(.6,pitch+(e.clientY-drag[1])*.005));drag=[e.clientX,e.clientY]});
 S={r:r,sc:sc,cam:cam,cr:cr,brain:brain,orbs:orbs,env:env,k1:k1,k2:k2,host:host,spin:.004,yawf:function(){return yaw},pitchf:function(){return pitch}};
 addEventListener('resize',function(){r.setSize(host.clientWidth,host.clientHeight);cam.aspect=host.clientWidth/host.clientHeight;cam.updateProjectionMatrix()});
 var t0=performance.now();(function loop(){var t=(performance.now()-t0)/1000;cr.rotation.y+=S.spin;cr.rotation.x=Math.sin(t*.4)*.08;
  orbs.forEach(function(o){var u=o.userData,a=u.ph+t*(.25+.5*u.v);o.position.set(Math.cos(a)*u.rad,u.y+Math.sin(t*1.3+u.ph)*.03,Math.sin(a)*u.rad)});
  var cy=yaw+t*.05;cam.position.set(Math.sin(cy)*7.4*Math.cos(pitch),1.2+7.4*Math.sin(pitch),Math.cos(cy)*7.4*Math.cos(pitch));cam.lookAt(0,.1,0);
  r.render(sc,cam);requestAnimationFrame(loop)})();}
function snap(yawAng,w,h){var r=S.r,c=S.cam,old=c.position.clone(),s=new THREE.Vector2();r.getSize(s);c.position.set(Math.sin(yawAng)*7.4,1.4,Math.cos(yawAng)*7.4);c.lookAt(0,.1,0);r.render(S.sc,c);var u=r.domElement.toDataURL('image/png');c.position.copy(old);return u}
function gallery(){var g=$('gal');if(!g)return;g.innerHTML='';[0,1.57,3.14,4.71].forEach(function(a,i){var im=new Image();im.src=snap(a);im.width=210;im.alt=A.name+' crystal, view '+(i+1);g.appendChild(im)});log('ARTIST','gallery: 4 views of the '+A.gem+' '+A.cut+' crystal')}
// ---------- improvement loop: ARTIST adjusts the look, CRITIC measures a 96x96 render ----------
function measure(){var r=S.r,rt=new THREE.WebGLRenderTarget(96,96),cam=S.cam.clone();cam.aspect=1;cam.position.set(0,1.2,5.2);cam.lookAt(0,0,0);cam.updateProjectionMatrix();
 var vis=S.brain.visible;S.brain.visible=false;var bg=S.sc.background;S.sc.background=new THREE.Color('#000000');r.setRenderTarget(rt);r.render(S.sc,cam);var px=new Uint8Array(96*96*4);r.readRenderTargetPixels(rt,0,0,96,96,px);r.setRenderTarget(null);S.sc.background=bg;S.brain.visible=vis;rt.dispose();
 var tc=new THREE.Color(A.hex),T=[tc.r,tc.g,tc.b].map(function(v){return Math.pow(v,1/2.2)*255}),n=0,lum=[],cd=0;for(var i=0;i<px.length;i+=4){var L=.2126*px[i]+.7152*px[i+1]+.0722*px[i+2];if(L<6)continue;n++;lum.push(L);
  var m=Math.max(px[i],px[i+1],px[i+2],1),Tm=Math.max(T[0],T[1],T[2],1);cd+=Math.abs(px[i]/m-T[0]/Tm)+Math.abs(px[i+1]/m-T[1]/Tm)+Math.abs(px[i+2]/m-T[2]/Tm)}
 var mean=lum.reduce(function(s,v){return s+v},0)/Math.max(1,n),sd=Math.sqrt(lum.reduce(function(s,v){return s+(v-mean)*(v-mean)},0)/Math.max(1,n));
 var cover=n/(96*96),hue=1-Math.min(1,cd/Math.max(1,n)/1.2),contrast=Math.min(1,sd/60),expo=1-Math.min(1,Math.abs(mean-120)/120);
 return{cover:+cover.toFixed(3),hue:+hue.toFixed(3),contrast:+contrast.toFixed(3),expo:+expo.toFixed(3),score:+(.4*hue+.3*contrast+.2*expo+.1*Math.min(1,cover/.25)).toFixed(4)}}
function setLook(p){S.r.toneMappingExposure=p.exposure;S.k1.intensity=p.key;S.k2.intensity=p.rim;S.cr.userData.mesh.material.emissive=new THREE.Color(A.hex).multiplyScalar(p.glow);S.cr.userData.edges.material.opacity=p.edge}
var hist=[];function improve(rounds){var rng=AMD.rng(SIM.fnv('look|'+A.slug)),best={exposure:1,key:2.2,rim:30,glow:(A.look&&A.look.glow!=null)?A.look.glow:.12,edge:.55};setLook(best);var bm=measure();hist=[bm.score];
 log('CRITIC','round 0: score '+bm.score+' (colour '+bm.hue+', facet contrast '+bm.contrast+', exposure '+bm.expo+', cover '+bm.cover+')');
 for(var k=1;k<=rounds;k++){var c={exposure:Math.max(.5,Math.min(1.8,best.exposure+(rng()-.5)*.4)),key:Math.max(.5,Math.min(4,best.key+(rng()-.5)*1.2)),rim:Math.max(5,Math.min(60,best.rim+(rng()-.5)*16)),glow:Math.max(0,Math.min(.4,best.glow+(rng()-.5)*.1)),edge:Math.max(.2,Math.min(.9,best.edge+(rng()-.5)*.2))};
  setLook(c);var m=measure();if(m.score>bm.score){best=c;bm=m;log('ARTIST','round '+k+': kept exposure '+c.exposure.toFixed(2)+', key '+c.key.toFixed(2)+', rim '+c.rim.toFixed(0)+', glow '+c.glow.toFixed(2));log('CRITIC','round '+k+': better, '+m.score)}
  else log('CRITIC','round '+k+': '+m.score+' not better, reverted');hist.push(bm.score)}
 setLook(best);S.best=best;S.bm=bm;var x=cv('ichart',110);if(x){x.strokeStyle=A.hex;x.lineWidth=2;var lo=Math.min.apply(null,hist)-.01,hi=Math.max.apply(null,hist)+.01;x.beginPath();hist.forEach(function(v,i){var px=8+i*(x.W-16)/Math.max(1,hist.length-1),py=104-(v-lo)/(hi-lo)*84;i?x.lineTo(px,py):x.moveTo(px,py)});x.stroke();x.fillStyle='#ccd';x.font='11px system-ui';x.fillText('CRITIC score per round (measured from a 96×96 render): '+hist[0]+' → '+bm.score,6,12)}
 $('iscore').textContent=bm.score;return bm}
// ---------- exports ----------
function svg(){var w=720,h=260,s=['<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'"><rect width="100%" height="100%" fill="#07060d"/>','<text x="12" y="22" fill="#fff" font-family="system-ui" font-size="15">'+A.name+' · '+A.gem+' · '+A.temperament+' · 12-layer {i} (MODEL values)</text>'];
 A.layers.forEach(function(l,i){l.depths.forEach(function(v,k){var bw=14,x=20+i*58+k*16,bh=v*170;s.push('<rect x="'+x+'" y="'+(220-bh)+'" width="'+bw+'" height="'+bh+'" fill="'+(k===0?A.hex:'#ffffff')+'" fill-opacity="'+(k===0?1:k===1?.75:.35)+'"/>')});s.push('<text x="'+(26+i*58)+'" y="240" fill="#ccd" font-family="system-ui" font-size="12">'+l.n.replace('+','&#43;')+'</text>')});
 s.push('</svg>');return s.join('')}
function profile(){return{format:'biodome-waiting-room/1',model:'fictional challenger (MODEL), not a real person',name:A.name,gender:A.gender,gem:A.gem,crystal_key:A.crystal,color:A.hex,family:A.family,temperament:A.temperament,meaning:A.meaning,vector:A.vector,cut:A.cut,
 notation_verbatim:R.notation,layers:A.layers,radials:window.__radials,agent_md:A.md,parsed:me,suggested_opponent:A.suggested,matchups:A.matchups,improvement:{history:hist,best:S.best,critic:S.bm},seal:window.SEAL}}
$('xjson').onclick=function(){dl(A.slug+'.json',JSON.stringify(profile(),null,1),'application/json')};$('xsvg').onclick=function(){dl(A.slug+'-layers.svg',svg(),'image/svg+xml')};
$('xobj').onclick=function(){dl(A.slug+'-crystal.obj',X.toOBJ(S.cr.userData.geo,A.name+' '+A.gem),'text/plain')};$('xmd').onclick=function(){dl(A.md_file,A.md,'text/markdown')};
$('again').onclick=function(){improve(4)};
// ---------- LIT check (throws) ----------
function check(){var e=[];if(!parsed.ok)e.push('agent.md does not parse: '+parsed.err.join('; '));if(parsed.warn.length)e.push('agent.md warnings: '+parsed.warn.join('; '));
 if(me){if(me.name!==A.name||me.color!==A.hex||me.crystal!==A.crystal||me.hide!==A.params.hide)e.push('parsed identity differs');['style','reaction','gradient','attack'].forEach(function(g){for(var k in A.params[g])if(Math.abs(me[g][k]-A.params[g][k])>1e-9)e.push(g+'.'+k+' differs')});
  ['open','counter_bias','after_hit'].forEach(function(k){if(me.rules[k]!==A.params.rules[k])e.push('rules.'+k+' differs')})}
 if(A.layers.length!==12)e.push('need 12 layers');var want=[['+1','super id { connection}']].concat(AMD.LAYERS.filter(function(l){return l[0]!=='+1'}));
 want.forEach(function(w){var l=A.layers.filter(function(x){return x.n===w[0]})[0];if(!l||l.label!==w[1])e.push('layer '+w[0]+' label not verbatim');if(l&&(l.depths.length!==3||l.depths.some(function(v){return!(v>=0&&v<=1)})))e.push('layer '+w[0]+' needs 3 depths in 0..1')});
 var others=A.layers.filter(function(l){return l.n!=='1'}),mean=others.reduce(function(s,l){return s+l.depths[1]},0)/11,i1=A.layers.filter(function(l){return l.n==='1'})[0].depths[1];if(Math.abs(mean-i1)>.006)e.push('{i} is not the mean of the other 11');
 if(document.getElementById('notation').textContent!==R.notation)e.push('notation on the page is not Dave\'s verbatim string');
 var rows=document.querySelectorAll('#ltable tbody tr');if(rows.length!==12)e.push('layer table rows '+rows.length);
 var s=A.suggested,re=SIM.series(me,oppAgent(s),SIM.N);if(re.win!==A.matchups[s].win)e.push('mini-sim re-run differs: '+re.win+' vs '+A.matchups[s].win);
 if($('nowc').textContent.indexOf('+1 now')!==0)e.push('+1 now clause missing');
 if(e.length)throw Error(e.join(' | '));return 'agent.md parses with agentmd.js (0 warnings, values equal), 12 layers verbatim × 3 depths, {i} = mean of 11, mini-sim re-run '+re.win+' matches'}
window.check=check;
(function nowClause(){var o=oppInfo(A.suggested),sid=A.layers[0].depths[1];$('nowc').textContent='+1 now: super id { connection} '+sid.toFixed(2)+' · reaching toward '+o.name+' ('+o.gem+') for the first bout';})();
// ---------- boot ----------
layerChart();radials();matchChart();
(async function(){var p=$('proof');try{var h=await sha(window.NAME+'|'+window.SLUG+'|'+window.BLURB);if(h!==window.SEAL)throw Error('seal mismatch');var r=check();
  var mdHttp='';if(/^https?:/.test(location.protocol)){var t=await fetch(A.md_file,{cache:'no-store'}).then(function(x){return x.ok?x.text():''}).catch(function(){return ''});if(t!==A.md)throw Error('served '+A.md_file+' differs from the page copy');mdHttp='; served '+A.md_file+' is byte-equal'}
  p.innerHTML='<span class="t LIT">LIT</span> self-check passed: seal recomputed; '+r+mdHttp+(mdHttp?'':' <span class="t AMBER">AMBER</span> file:// cannot fetch the .agent.md to compare')}
 catch(e){p.innerHTML='<span class="t WALL">FAIL</span> '+e.message;throw e}
 scene();if(!THUMB){requestAnimationFrame(function(){requestAnimationFrame(function(){improve(6);gallery()})})}})();
})();
