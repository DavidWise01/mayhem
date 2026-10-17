/* sd-art.js · MODEL: 13 era art styles painted on the page background canvas (seeded by the page seal). */
(function(G){'use strict';const A={};
A.paint=(style,cv,seal,pal)=>{const dpr=Math.min(devicePixelRatio||1,2),W=innerWidth,H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;const x=cv.getContext('2d');x.scale(dpr,dpr);
 const R=G.SD.rng(parseInt(seal.slice(8,16),16));x.fillStyle=pal.bg;x.fillRect(0,0,W,H);const a1=pal.a1,a2=pal.a2;x.lineCap='round';
 const P={
 clay(){for(let i=0;i<900;i++){const px=R()*W,py=R()*H,s=4+R()*9,an=R()*6.3;x.save();x.translate(px,py);x.rotate(an);x.fillStyle=R()<.5?a1+'55':a2+'33';x.beginPath();x.moveTo(0,0);x.lineTo(s,-s/3);x.lineTo(s,s/3);x.closePath();x.fill();x.fillRect(s,-1,s*1.2,2);x.restore()}},
 papyrus(){for(let i=0;i<260;i++){x.strokeStyle=`rgba(120,90,40,${.05+R()*.12})`;x.lineWidth=1+R()*3;const y=R()*H;x.beginPath();x.moveTo(0,y);x.bezierCurveTo(W/3,y+R()*8-4,2*W/3,y+R()*8-4,W,y+R()*6-3);x.stroke()}
  for(let i=0;i<120;i++){x.strokeStyle=a2+'55';x.lineWidth=2;const px=R()*W,py=R()*H;x.beginPath();if(R()<.5){x.arc(px,py,6,0,6.3)}else{x.moveTo(px,py);x.lineTo(px,py+16);x.moveTo(px-6,py+5);x.lineTo(px+6,py+5)}x.stroke()}},
 bronze(){const g=x.createRadialGradient(W/2,H/2,50,W/2,H/2,Math.max(W,H));g.addColorStop(0,'#3a2a14');g.addColorStop(1,pal.bg);x.fillStyle=g;x.fillRect(0,0,W,H);x.strokeStyle=a1+'66';x.lineWidth=3;
  for(let r=0;r<H;r+=46){x.beginPath();for(let c=0;c<W;c+=40){x.moveTo(c,r);x.lineTo(c+30,r);x.lineTo(c+30,r+20);x.lineTo(c+10,r+20);x.lineTo(c+10,r+10);x.lineTo(c+20,r+10)}x.stroke()}
  for(let i=0;i<200;i++){x.fillStyle=`rgba(90,170,140,${R()*.25})`;x.beginPath();x.arc(R()*W,R()*H,2+R()*14,0,6.3);x.fill()}},
 marble(){for(let i=0;i<70;i++){x.strokeStyle=`rgba(120,120,130,${.05+R()*.2})`;x.lineWidth=.5+R()*2.5;let px=R()*W,py=0;x.beginPath();x.moveTo(px,py);while(py<H){px+=R()*40-20;py+=10+R()*30;x.lineTo(px,py)}x.stroke()}
  x.strokeStyle=a1+'44';x.lineWidth=2;for(let c=30;c<W;c+=90){x.beginPath();x.moveTo(c,0);x.lineTo(c,H);x.stroke()}},
 mosaic(){const s=18;for(let r=0;r<H;r+=s)for(let c=0;c<W;c+=s){const v=Math.sin(c/120+R()*.4)+Math.cos(r/90);x.fillStyle=v>.9?a1:v>0?a2+'cc':v>-.8?'#20384a':'#0b1822';x.fillRect(c+1+R()*2,r+1+R()*2,s-3,s-3)}},
 illum(){x.fillStyle='#0d1446';x.fillRect(0,0,W,H);for(let i=0;i<30;i++){const cx=R()*W,cy=R()*H,r=30+R()*80;x.strokeStyle=a1+'aa';x.lineWidth=3;for(let k=0;k<3;k++){x.beginPath();x.ellipse(cx,cy,r,r*.4,k*1.05,0,6.3);x.stroke()}x.fillStyle='#c0392b88';x.beginPath();x.arc(cx,cy,6,0,6.3);x.fill()}
  for(let i=0;i<400;i++){x.fillStyle='#ffd70088';x.fillRect(R()*W,R()*H,2,2)}},
 ink(){for(let i=0;i<40;i++){let px=R()*W,py=R()*H,w=14+R()*26;x.strokeStyle=`rgba(17,17,17,${.06+R()*.2})`;for(let k=0;k<26;k++){x.lineWidth=Math.max(.5,w*(1-k/26));const nx=px+R()*30-8,ny=py+R()*16-8;x.beginPath();x.moveTo(px,py);x.lineTo(nx,ny);x.stroke();px=nx;py=ny}}
  x.fillStyle=a1+'cc';for(let i=0;i<4;i++){const s=26+R()*14;x.fillRect(R()*(W-40),R()*(H-40),s,s)}},
 sfumato(){for(let i=0;i<60;i++){const g=x.createRadialGradient(R()*W,R()*H,0,R()*W,R()*H,120+R()*260);g.addColorStop(0,`rgba(201,164,106,${R()*.25})`);g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,W,H)}
  x.strokeStyle=a2+'33';for(let i=0;i<20;i++){x.beginPath();x.moveTo(0,H*.6+R()*H*.4);for(let c=0;c<=W;c+=60)x.lineTo(c,H*.55+R()*60+i*8);x.stroke()}},
 baroque(){for(let i=0;i<26;i++){const cx=R()*W,cy=R()*H;x.strokeStyle=R()<.6?a1+'99':a2+'77';x.lineWidth=2+R()*3;x.beginPath();for(let t=0;t<14;t+=.1){const r=4+t*7;x.lineTo(cx+r*Math.cos(t),cy+r*Math.sin(t))}x.stroke()}
  x.fillStyle='rgba(0,0,0,.35)';x.fillRect(0,0,W,H)},
 engraving(){x.strokeStyle='rgba(27,27,27,.18)';x.lineWidth=.7;for(let r=0;r<H;r+=5){x.beginPath();for(let c=0;c<=W;c+=12)x.lineTo(c,r+3*Math.sin(c/70+r/40));x.stroke()}
  x.strokeStyle=a2+'55';x.lineWidth=1;for(let i=0;i<14;i++){const cx=R()*W,cy=R()*H;for(let k=0;k<12;k++){x.beginPath();x.arc(cx,cy,8+k*6,0,6.3);x.stroke()}}},
 deco(){x.strokeStyle=a1+'88';x.lineWidth=1.5;for(let c=0;c<W+200;c+=160){for(let k=1;k<9;k++){x.beginPath();x.arc(c,H,k*18,Math.PI,2*Math.PI);x.stroke()}for(let k=0;k<12;k++){x.beginPath();x.moveTo(c,H);x.lineTo(c+150*Math.cos(Math.PI+k*Math.PI/11),H+150*Math.sin(Math.PI+k*Math.PI/11));x.stroke()}}
  x.strokeStyle=a2+'66';for(let r=40;r<H-200;r+=60){x.beginPath();x.moveTo(0,r);x.lineTo(W,r);x.stroke()}},
 neon(){x.strokeStyle=a2+'44';x.lineWidth=1;const hz=H*.45;for(let c=-W;c<2*W;c+=60){x.beginPath();x.moveTo(W/2,hz);x.lineTo(c,H);x.stroke()}for(let k=0;k<20;k++){const y=hz+(H-hz)*Math.pow(k/20,2);x.beginPath();x.moveTo(0,y);x.lineTo(W,y);x.stroke()}
  for(let i=0;i<160;i++){x.fillStyle=R()<.5?a1:a2;x.globalAlpha=R();x.fillRect(R()*W,R()*hz,2,2)}x.globalAlpha=1},
 amethyst(){for(let i=0;i<50;i++){const cx=R()*W,cy=R()*H,r=20+R()*70,n=6;x.strokeStyle=R()<.5?a1+'66':a2+'44';x.lineWidth=1.5;x.beginPath();for(let k=0;k<=n;k++){const a=k/n*6.283+R()*.05;x.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a))}x.stroke();x.beginPath();x.moveTo(cx,cy-r);x.lineTo(cx,cy+r);x.stroke()}}};
 (P[style]||P.amethyst)();return style};
G.SDART=A})(window);
