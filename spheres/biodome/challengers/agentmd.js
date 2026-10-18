/* agentmd.js · agent.md challenger parser, lifted verbatim from the {{B.I.O {{D.O.M.E }}}} v2 page (bd-core.js, format biodome-duel/1).
   Data only: nothing in an agent.md is ever executed. */
(function(G){'use strict';
var BD={VERSION:'biodome-duel/1'};
// ---------- seeded rng (mulberry32) ----------
BD.rng=function(seed){var a=seed>>>0;return function(){a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
BD.clamp=function(v,lo,hi){v=+v;return isFinite(v)?Math.min(hi,Math.max(lo,v)):lo};
// ---------- the game (LIT: this table is the whole rule set) ----------
// attacker throws PUNCH or FEINT; defender answers DODGE, BLOCK or COUNTER. Damage taken:
BD.MOVES={atk:['PUNCH','FEINT'],def:['DODGE','BLOCK','COUNTER']};
BD.TABLE={PUNCH:{DODGE:[0,0],BLOCK:[3,0],COUNTER:[10,0]},FEINT:{DODGE:[4,0],BLOCK:[0,0],COUNTER:[0,8]}}; // [defender takes, attacker takes]
BD.EXCHANGES=24; BD.EX_S=1.2; // 24 exchanges, attacker alternates; 1.2 s per exchange on screen
// ---------- crystals ----------
BD.CRYSTALS={amethyst:'#9b5de5',citrine:'#ffc46b','rose-quartz':'#f7a1c4',quartz:'#e8eef5',emerald:'#2ecc71',sapphire:'#3b6cff',ruby:'#e0115f',topaz:'#ffb347',obsidian:'#2b2b38',opal:'#bfe6ff',jade:'#3fae7a',garnet:'#9b1d3a',aquamarine:'#6fe3d6',moonstone:'#d9e4f2',electrum:'#d9c27a',peridot:'#a6d608',onyx:'#15151c'};
// ---------- built-in agents (MODEL of the NES app) ----------
function base(o){return JSON.parse(JSON.stringify(o))}
BD.PATRICIA=base({id:'patricia',name:'Patricia',color:'#b48cff',crystal:'amethyst',source:'built-in',
 style:{learns:.5,observes:.3,probes:.2},reaction:{observe:.3,respond:.2,sub_id:.1},gradient:{threshold:3,decay_s:3,bad_outcome:0},
 hide:'best',attack:{feint:.3,conceal:.35,bluff:.05},rules:{open:'any',counter_bias:0,after_hit:'none'},
 notes:'amethyst core · rose triad OBSERVE .3 s / RESPOND .2 s / sub id .1 s · 12-layer brain map · 1x2x{{trigger::hide}} (v49)'});
BD.PATTYCAKES=base({id:'pattycakes',name:'Pattycakes',color:'#ffc46b',crystal:'citrine',source:'built-in',
 style:{learns:.35,observes:.45,probes:.2},reaction:{observe:.3,respond:.25,sub_id:.1},gradient:{threshold:3,decay_s:3,bad_outcome:.5},
 hide:'best',attack:{feint:.4,conceal:.25,bluff:.1},rules:{open:'any',counter_bias:0,after_hit:'none'},
 notes:'citrine sibling sapphon · learns from watching · her own gradient (+0.5 for a bad outcome in her view, v49)'});
BD.BAG=base({id:'bag',name:'Sparring bag',color:'#7ea87a',crystal:'jade',source:'built-in',
 style:{learns:0,observes:0,probes:1},reaction:{observe:.5,respond:.5,sub_id:.5},gradient:{threshold:9,decay_s:3,bad_outcome:0},
 hide:'block',attack:{feint:.5,conceal:.4,bluff:0},rules:{open:'any',counter_bias:0,after_hit:'none'},notes:'the dome\'s sparring bag: never learns, answers at random'});
// ---------- brain map (Dave t253, labels verbatim) ----------
BD.LAYERS=[['5','ethics'],['4','logic'],['3','pathos'],['2','mythos'],['1','{i}'],['-1','inner dimension{self,confidence,reality}'],['-2','hearing{pause,choice}'],['-3','sound{act/react}'],['-4','taste{life,death}'],['-5','hearing{balance,ground}'],['-6','touch{balance,cordination}'],['+1','super id { connection}']];
// MODEL: which duel event lights which layer
BD.LAYER_EVENT={'5':'an honest tell shown','4':'a memory update','3':'mood: last exchange won or lost','2':'career record','1':'{i}: confidence overall','-1':'a hide (self)','-2':'a tell read in time (pause, choice)','-3':'a response thrown','-4':'a hit taken','-5':'a block','-6':'a dodge','+1':'learning by watching the other'};
// ---------- agent.md: safe parser (data only) ----------
var KEYS={name:1,color:1,crystal:1,style:{learns:1,observes:1,probes:1},reaction:{observe:1,respond:1,sub_id:1},gradient:{threshold:1,decay_s:1,bad_outcome:1},hide:1,attack:{feint:1,conceal:1,bluff:1},notes:1,version:1,author:1};
var RULES={open:['punch','feint','any'],counter_bias:[0,1],after_hit:['hide','counter','none']};
var RESERVED=/^(patricia|pattycakes?|patty ?cakes?|kelvin|k.kelvin|sparring bag)$/i;
function scalar(v){v=v.trim();if(v==='')return '';var q=v[0];if((q==='"'||q==="'")&&v.length>1&&v[v.length-1]===q)return v.slice(1,-1);
 var c=v.indexOf(' #');if(c>=0)v=v.slice(0,c).trim();if(/^(true|false)$/i.test(v))return /^true$/i.test(v);if(/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(v))return parseFloat(v);return v}
BD.parseYAML=function(txt,warn){var out={},stack=[{ind:-1,obj:out}],lines=txt.split(/\r?\n/);
 for(var i=0;i<lines.length;i++){var raw=lines[i];if(/^\s*(#.*)?$/.test(raw))continue;if(/\t/.test(raw.match(/^\s*/)[0])){warn.push('line '+(i+1)+': tab indent ignored');continue}
  var ind=raw.match(/^ */)[0].length,ln=raw.trim();if(ln[0]==='-'){warn.push('line '+(i+1)+': lists are not part of the format, ignored');continue}
  var m=ln.match(/^([A-Za-z_][A-Za-z0-9_]{0,31})\s*:\s*(.*)$/);if(!m){warn.push('line '+(i+1)+': not "key: value", ignored');continue}
  while(stack.length>1&&ind<=stack[stack.length-1].ind)stack.pop();var par=stack[stack.length-1].obj;var k=m[1];
  if(Object.prototype.hasOwnProperty.call(par,k)&&typeof par[k]==='object'){}
  if(k==='__proto__'||k==='constructor'||k==='prototype'){warn.push('line '+(i+1)+': key "'+k+'" refused');continue}
  if(m[2]===''){if(stack.length>2){warn.push('line '+(i+1)+': nesting deeper than 2 levels ignored');continue}var o=Object.create(null);par[k]=o;stack.push({ind:ind,obj:o})}else par[k]=scalar(m[2])}
 return out};
BD.parseAgentMd=function(text){var warn=[],err=[];text=String(text==null?'':text);
 if(text.length>16384){err.push('file is over 16 KB');return{ok:false,err:err,warn:warn}}
 if(/\u0000/.test(text)){err.push('binary content');return{ok:false,err:err,warn:warn}}
 var m=text.replace(/^\uFEFF/,'').match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(\r?\n|$)([\s\S]*)$/);
 if(!m){err.push('no YAML front matter: the file must start with a line "---", then key: value lines, then "---"');return{ok:false,err:err,warn:warn}}
 var fm=BD.parseYAML(m[1],warn),body=m[3]||'';
 (function chk(o,spec,path){for(var k in o){if(!spec||!spec[k]){warn.push('unknown key "'+path+k+'" ignored');continue}if(typeof spec[k]==='object'){if(typeof o[k]!=='object'){warn.push('"'+path+k+'" should be a block, ignored')}else chk(o[k],spec[k],path+k+'.')}}})(fm,KEYS,'');
 var A=base(BD.PATRICIA);A.id='challenger';A.source='agent.md';A.hide='best';A.notes='';A.gradient.bad_outcome=0;
 var nm=typeof fm.name==='string'?fm.name.trim():'';
 if(!nm){err.push('name is required')}else if(!/^[A-Za-z0-9 ._'-]{1,24}$/.test(nm)){err.push('name must be 1–24 letters, digits, spaces or . _ \' -')}
 else{if(RESERVED.test(nm)){warn.push('"'+nm+'" is a built-in name; renamed "'+nm+' (challenger)"');nm=nm+' (challenger)'}A.name=nm}
 if(fm.crystal!=null){var cr=String(fm.crystal).toLowerCase().replace(/\s+/g,'-');if(BD.CRYSTALS[cr])A.crystal=cr;else{warn.push('crystal "'+String(fm.crystal).slice(0,24)+'" not in the list, using quartz');A.crystal='quartz'}}else A.crystal='quartz';
 A.color=(typeof fm.color==='string'&&/^#[0-9a-fA-F]{6}$/.test(fm.color.trim()))?fm.color.trim().toLowerCase():(fm.color!=null&&warn.push('color must be "#rrggbb", using the crystal colour'),BD.CRYSTALS[A.crystal]);
 function num(o,k,lo,hi,def,path){if(!o||o[k]==null)return def;var v=+o[k];if(!isFinite(v)){warn.push(path+k+' is not a number, using '+def);return def}var c=BD.clamp(v,lo,hi);if(c!==v)warn.push(path+k+' '+v+' clamped to '+c);return c}
 var s=fm.style||{};A.style={learns:num(s,'learns',0,1,.4,'style.'),observes:num(s,'observes',0,1,.4,'style.'),probes:num(s,'probes',0,1,.2,'style.')};
 var sum=A.style.learns+A.style.observes+A.style.probes;if(sum<=0){A.style={learns:1/3,observes:1/3,probes:1/3};warn.push('style weights were all 0, using 1/3 each')}else if(Math.abs(sum-1)>1e-9){['learns','observes','probes'].forEach(function(k){A.style[k]/=sum});warn.push('style weights normalised to sum 1 (were '+(+sum.toFixed(3))+')')}
 var r=fm.reaction||{};A.reaction={observe:num(r,'observe',.05,1,.3,'reaction.'),respond:num(r,'respond',.05,1,.2,'reaction.'),sub_id:num(r,'sub_id',.05,.5,.1,'reaction.')};
 var g=fm.gradient||{};A.gradient={threshold:num(g,'threshold',2,5,3,'gradient.'),decay_s:num(g,'decay_s',.5,10,3,'gradient.'),bad_outcome:num(g,'bad_outcome',0,1,0,'gradient.')};
 var at=fm.attack||{};A.attack={feint:num(at,'feint',0,1,.35,'attack.'),conceal:num(at,'conceal',0,.9,.3,'attack.'),bluff:num(at,'bluff',0,.5,.1,'attack.')};
 if(fm.hide!=null){var h=String(fm.hide).toLowerCase();if(/^(best|block|dodge)$/.test(h))A.hide=h;else warn.push('hide must be best, block or dodge; using best')}
 A.notes=typeof fm.notes==='string'?fm.notes.slice(0,280):'';if(typeof fm.notes==='string'&&fm.notes.length>280)warn.push('notes cut to 280 characters');
 A.author=typeof fm.author==='string'?fm.author.slice(0,40):'';
 // optional ```rules block: declarative key: value only
 A.rules={open:'any',counter_bias:0,after_hit:'none'};var rb=body.match(/```rules[ \t]*\r?\n([\s\S]*?)```/);
 if(rb){rb[1].split(/\r?\n/).forEach(function(l,i){l=l.replace(/#.*/,'').trim();if(!l)return;var q=l.match(/^([a-z_]+)\s*:\s*(.+)$/i);if(!q){warn.push('rules line '+(i+1)+' ignored');return}
  var k=q[1].toLowerCase(),v=scalar(q[2]);if(!RULES[k]){warn.push('rule "'+k.slice(0,24)+'" is not in the format, ignored');return}
  if(typeof RULES[k][0]==='number'){var n=+v;if(!isFinite(n)){warn.push('rule '+k+' needs a number');return}A.rules[k]=BD.clamp(n,RULES[k][0],RULES[k][1])}
  else{v=String(v).toLowerCase();if(RULES[k].indexOf(v)<0){warn.push('rule '+k+' must be one of '+RULES[k].join(', '));return}A.rules[k]=v}})}
 if(/```(js|javascript|html|script)/i.test(body)||/<script/i.test(text))warn.push('code found in the file: shown as text only, never run');
 A.body=body.slice(0,4000);
 if(err.length)return{ok:false,err:err,warn:warn};return{ok:true,agent:A,warn:warn}};
BD.SAMPLE_MD=['---','name: Rook','color: "#4fd1c5"','crystal: aquamarine','author: you','style:','  learns: 0.45      # how fast memory moves (0..1)','  observes: 0.35    # how often a shown tell is caught (0..1)','  probes: 0.20      # exploration: trying moves that are not yet best (0..1)','reaction:','  observe: 0.30     # seconds to see a tell','  respond: 0.20     # seconds to answer it','  sub_id: 0.10      # reflex: emergency dodge when only this fits','gradient:','  threshold: 3      # 1x at 0.5, 2x at 2, {{trigger::hide}} at this value (2..5)','  decay_s: 3        # calm fades the gradient (e-fold seconds)','  bad_outcome: 0.2  # extra gradient for a wrong read (0..1)','hide: best          # best | block | dodge','attack:','  feint: 0.35       # share of feints when attacking','  conceal: 0.30     # chance your tell is hidden','  bluff: 0.10       # chance a shown tell lies','notes: "patient, counters feints, hides early"','---','# Rook','','Free markdown about your challenger. Nothing here is run.','','```rules','open: feint         # punch | feint | any (first attack)','counter_bias: 0.2   # 0..1, leans answers toward COUNTER','after_hit: hide     # hide | counter | none','```',''].join('\n');
G.AMD=BD;
})(window);
