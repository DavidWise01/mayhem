/* ch-crystal.js · faceted crystal builder for the biodome waiting room (Three.js r160, global THREE).
   MODEL: each gem gets a cut/habit (brilliant, step, prism, octa, cube, dodeca, cab = faceted oval). */
(function(G){'use strict';
// a ringed solid: top apex/flat, rings [r,y,rot], bottom apex/flat. sx scales x (oval / step cuts).
function ringed(top,rings,bot,n,sx){var P=[];function ring(R){var a=[];for(var i=0;i<n;i++){var t=(i+R[2])/n*Math.PI*2;a.push([Math.cos(t)*R[0]*sx,R[1],Math.sin(t)*R[0]])}return a}
 var Rs=rings.map(ring);function tri(a,b,c){P.push(a[0],a[1],a[2],b[0],b[1],b[2],c[0],c[1],c[2])}
 var t0=Rs[0];if(top.apex!=null){for(var i=0;i<n;i++)tri([0,top.apex,0],t0[(i+1)%n],t0[i])}else{var c=[0,rings[0][1],0];for(i=0;i<n;i++)tri(c,t0[(i+1)%n],t0[i])}
 for(var k=0;k+1<Rs.length;k++){var A=Rs[k],B=Rs[k+1];for(i=0;i<n;i++){var j=(i+1)%n;tri(A[i],A[j],B[i]);tri(A[j],B[j],B[i])}}
 var bl=Rs[Rs.length-1];if(bot.apex!=null){for(i=0;i<n;i++)tri([0,bot.apex,0],bl[i],bl[(i+1)%n])}else{c=[0,rings[rings.length-1][1],0];for(i=0;i<n;i++)tri(c,bl[i],bl[(i+1)%n])}
 var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.computeVertexNormals();return g}
var CUTS={
 brilliant:function(){return ringed({},[[.55,.42,0],[.82,.26,.5],[1,.08,0],[1,-.04,.25],[.55,-.5,.5]],{apex:-1.02},16,1)},
 step:function(){return ringed({},[[.62,.38,.5],[.86,.24,.5],[1,.06,.5],[1,-.06,.5],[.72,-.38,.5],[.4,-.66,.5]],{},8,1.38)},
 prism:function(){return ringed({apex:1.65},[[.62,1.0,0],[.62,-1.0,0]],{apex:-1.5},6,1)},
 octa:function(){return ringed({apex:1.25},[[.62,.62,.5],[1.05,0,0],[.62,-.62,.5]],{apex:-1.25},4,1)},
 cube:function(){return ringed({},[[.82,.86,.5],[1.08,.7,.5],[1.08,-.7,.5],[.82,-.86,.5]],{},4,1)},
 dodeca:function(){return ringed({apex:1.1},[[.78,.55,0],[1.0,0,.5],[.78,-.55,0]],{apex:-1.1},6,1)},
 cab:function(){return ringed({},[[.36,.6,0],[.66,.5,.5],[.88,.32,0],[1,.1,.5],[1,-.06,0],[.86,-.26,.5]],{},12,1.3)}};
function facetGeo(cut){var g=(CUTS[cut]||CUTS.brilliant)();return g}
// gem material (MODEL look): transparent gems use transmission; opaque/metallic ones use metalness/roughness
function gemMat(c,look,env){var col=new THREE.Color(c),o={color:col,flatShading:true,roughness:look.rough!=null?look.rough:.06,metalness:look.metal||0,clearcoat:1,clearcoatRoughness:.05,
 emissive:col.clone().multiplyScalar(look.glow!=null?look.glow:.12),envMapIntensity:1.4,ior:look.ior||1.6,side:THREE.DoubleSide};
 if(env)o.envMap=env;if(look.clear){o.transmission=look.clear;o.thickness=1.2;o.transparent=true;o.opacity=1;o.attenuationColor=col;o.attenuationDistance=1.6}
 return new THREE.MeshPhysicalMaterial(o)}
// a simple studio environment for reflections (no addon needed)
function studioEnv(renderer,tint){var sc=new THREE.Scene(),geo=new THREE.SphereGeometry(10,32,16),cols=[],p=geo.attributes.position,c=new THREE.Color(),t=new THREE.Color(tint||'#ffffff');
 for(var i=0;i<p.count;i++){var y=p.getY(i)/10;c.setRGB(.05,.05,.08).lerp(t,.15+.25*Math.max(0,y));if(y>.6)c.setRGB(1,1,1);cols.push(c.r,c.g,c.b)}
 geo.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));sc.add(new THREE.Mesh(geo,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide})));
 [[6,2,0],[-6,1,3],[0,5,-6],[2,-4,5]].forEach(function(q,k){var m=new THREE.Mesh(new THREE.PlaneGeometry(4,2),new THREE.MeshBasicMaterial({color:k==3?t:0xffffff,side:THREE.DoubleSide}));m.position.set(q[0],q[1],q[2]);m.lookAt(0,0,0);sc.add(m)});
 var pm=new THREE.PMREMGenerator(renderer),rt=pm.fromScene(sc,.02);pm.dispose();return rt.texture}
// the whole crystal object: gem mesh + edge lines + inner core
function crystal(gem,env){var grp=new THREE.Group(),geo=facetGeo(gem.cut),m=new THREE.Mesh(geo,gemMat(gem.hex,gem.look||{},env));grp.add(m);
 var e=new THREE.LineSegments(new THREE.EdgesGeometry(geo,1),new THREE.LineBasicMaterial({color:new THREE.Color(gem.hex).lerp(new THREE.Color('#ffffff'),.55),transparent:true,opacity:.55}));grp.add(e);
 var core=new THREE.Mesh(new THREE.IcosahedronGeometry(.22,0),new THREE.MeshBasicMaterial({color:new THREE.Color(gem.hex).lerp(new THREE.Color('#ffffff'),.4)}));grp.add(core);
 grp.userData={mesh:m,edges:e,core:core,geo:geo};return grp}
// OBJ text of the crystal mesh (LIT: the exact triangles drawn)
function toOBJ(geo,name){var p=geo.attributes.position,s=['# '+name+' · biodome waiting room crystal (MODEL cut) · Three.js r160 geometry','o '+name.replace(/\s+/g,'_')];
 for(var i=0;i<p.count;i++)s.push('v '+p.getX(i).toFixed(5)+' '+p.getY(i).toFixed(5)+' '+p.getZ(i).toFixed(5));
 for(i=0;i<p.count;i+=3)s.push('f '+(i+1)+' '+(i+2)+' '+(i+3));return s.join('\n')+'\n'}
G.CHX={facetGeo:facetGeo,gemMat:gemMat,studioEnv:studioEnv,crystal:crystal,toOBJ:toOBJ,CUTS:Object.keys(CUTS)};
})(window);
