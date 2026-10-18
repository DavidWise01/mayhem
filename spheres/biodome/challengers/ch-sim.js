/* ch-sim.js · MODEL mini-sim for the biodome waiting room. NOT the dome's real duel engine:
   a small seeded sketch that uses the real move table from agentmd.js (AMD.TABLE) so a challenger's
   agent.md parameters can be compared. The dome page decides real bouts. */
(function(G){'use strict';var AMD=G.AMD;
function fnv(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function mk(a){return{ag:a,pf:.35,grad:0,nc:false,hid:0,reflex:0,read:0}}
function bout(A,B,seed){var r=AMD.rng(seed),T=AMD.TABLE,N=AMD.EXCHANGES,EX=AMD.EX_S,S=[mk(A),mk(B)],dmg=[0,0];
 for(var e=0;e<N;e++){var ai=e%2,di=1-ai,a=S[ai],d=S[di],ag=a.ag,dg=d.ag,mv;
  if(e<2&&ag.rules.open!=='any')mv=ag.rules.open==='feint'?'FEINT':'PUNCH';else mv=r()<ag.attack.feint?'FEINT':'PUNCH';
  var shown=r()>=ag.attack.conceal,tell=mv;if(shown&&r()<ag.attack.bluff)tell=(mv==='PUNCH'?'FEINT':'PUNCH');
  var t=dg.reaction.observe+dg.reaction.respond,h=EX*.5,fit=t<=h?1:Math.max(0,1-(t-h)/h);
  var read=shown&&r()<(.3+.6*dg.style.observes)*fit,ans;
  if(d.grad>=dg.gradient.threshold){ans=dg.hide==='dodge'?'DODGE':'BLOCK';d.grad*=.5;d.hid++}
  else if(read){ans=tell==='PUNCH'?'DODGE':'COUNTER';d.read++}
  else if(d.nc){ans='COUNTER';d.nc=false}
  else if(r()<dg.style.probes*.3)ans=AMD.MOVES.def[Math.floor(r()*3)];
  else if(dg.hide==='block')ans='BLOCK';else if(dg.hide==='dodge')ans='DODGE';
  else{var p=d.pf,eD=4*p,eB=3*(1-p),eC=10*(1-p)-8*p-dg.rules.counter_bias*3;ans=(eD<=eB&&eD<=eC)?'DODGE':(eB<=eC?'BLOCK':'COUNTER')}
  if(!read&&mv==='PUNCH'&&ans!=='DODGE'&&r()<(.5-dg.reaction.sub_id)*.4){ans='DODGE';d.reflex++}
  var res=T[mv][ans];dmg[di]+=res[0];dmg[ai]+=res[1];
  d.pf+=(.15+.7*dg.style.learns)*((mv==='FEINT'?1:0)-d.pf);
  d.grad=d.grad*Math.exp(-EX/dg.gradient.decay_s)+res[0]/4*(1+(read&&tell!==mv?dg.gradient.bad_outcome:0));
  if(res[0]>0){if(dg.rules.after_hit==='hide')d.grad=Math.max(d.grad,dg.gradient.threshold);else if(dg.rules.after_hit==='counter')d.nc=true}}
 return{dmg:dmg,win:dmg[0]<dmg[1]?1:dmg[0]>dmg[1]?0:.5}}
// series: n bouts, first attacker alternates; returns A's win rate (draw = half)
function series(A,B,n,salt){n=n||101;var seed0=fnv((salt||'')+A.name+'|'+B.name),w=0,da=0,db=0;
 for(var i=0;i<n;i++){var s=(seed0+i*2654435761)>>>0,x;if(i%2){x=bout(B,A,s);w+=1-x.win;da+=x.dmg[1];db+=x.dmg[0]}else{x=bout(A,B,s);w+=x.win;da+=x.dmg[0];db+=x.dmg[1]}}
 return{n:n,win:+(w/n).toFixed(4),dmg_taken:+(da/n).toFixed(2),dmg_dealt:+(db/n).toFixed(2)}}
G.CHSIM={bout:bout,series:series,fnv:fnv,N:101};
})(typeof window!=='undefined'?window:globalThis);
