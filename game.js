import {Adventure, QUESTS, QUESTIONS, HAIRSTYLES, HAIR_COLORS, LESSONS, FINAL_TEST, REVIEW_TEST, ENERGY, clamp} from './core.js?v=moods-6';

const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d',{alpha:false});
const SAVE_KEY='five-villages-sun-v1';
const FONT_HEADING='"NEXON Lv1 Gothic","Malgun Gothic",sans-serif';
const FONT_BODY='"NEXON Lv2 Gothic","Malgun Gothic",sans-serif';
let saved=null;try{saved=JSON.parse(localStorage.getItem(SAVE_KEY));}catch{}
let model=new Adventure(saved),s=model.s;
let W=1280,H=720,ground=568,mode='loading',modal=null,cam=0,time=0,lastTime=0;
let hits=[],keys=new Set(),held=new Set(),pointerActions=new Map(),stick={id:null,x:0,y:0};
let toast=null,floaters=[],effects=[],pickups=[],scene=0,sceneTime=0,transitionTime=0,quizIndex=0,lastQuestion=-1;
let player={x:s.x,y:ground,vx:0,vy:0,dir:1,onGround:true,attack:0,cooldown:0,invincible:0};
let audioContext=null,autoSaveTime=0,interactionHint=null;
const images={},atlases={};
const MOVE_SPEED=190,TYPE_SPEED=22;
const ARENA_WIDTH=2200;
let encounter=null,profileError='',emotion={face:0,t:0};
function react(face,duration=1.2){emotion={face,t:duration};}
function expressionFor(pose='hero'){
 if(mode==='create')return 0;
 if(mode==='ending'||modal?.type==='reward')return 1;
 if(modal?.type==='testReport')return model.testGaps().length?2:1;
 if(['quiz','practice','test','review'].includes(modal?.type))return modal.answered&&(modal.type==='quiz'||modal.correct)?1:2;
 if(emotion.t>0&&emotion.face===2)return 2;
 if(pose==='attack'||player.attack>0)return 3;
 if(emotion.t>0)return emotion.face;
 if(mode==='intro'&&(intro[scene].blackout||intro[scene].ruined))return 2;
 return 0;
}
const nameInput=document.querySelector('#player-name');
const MISSIONS={
 1:{npc:'courier',role:'배달원',title:'먼지 몬스터의 소굴',enemy:'dust',count:4,x:1265},
 2:{npc:'caretaker',role:'쉼터 선생님',title:'가시 몬스터의 숲',enemy:'thorn',count:3,x:2565},
 4:{npc:'chief',role:'촌장님',title:'그늘을 삼킨 큰 나무',enemy:'boss',count:1,x:4425}
};
function activeEnemies(){return encounter?enemies.filter(e=>e.type===MISSIONS[encounter.quest].enemy):[];}
function enemiesLeft(q=s.quest){return enemies.filter(e=>e.type===MISSIONS[q]?.enemy&&e.hp>0).length;}
function portalForQuest(){if(s.quest===1&&!s.practiceDone.includes('delivery-time'))return null;const m=MISSIONS[s.quest];return m&&s.accepted&&!s.finished&&enemiesLeft()?{...m,id:'portal',kind:'portal',art:'portal',name:'전투 포탈',y:ground}:null;}
function introText(){return (intro[scene].text||'').replaceAll('{name}',s.playerName);}
function introDelay(){return intro[scene].ruined?.7:0;}
function advanceScene(){transitionTime=sceneTime;if(++scene>=intro.length)finishIntro();else sceneTime=0;}
let walkDistance=0;
function syncCamera(){cam=clamp(player.x-W*.42,0,Math.max(0,(encounter?ARENA_WIDTH:5300)-W));}
function typedCount(t,elapsed){return Math.min(Array.from(t).length,Math.floor(Math.max(0,elapsed)*TYPE_SPEED));}
function typed(t,elapsed){return Array.from(t).slice(0,typedCount(t,elapsed)).join('');}
function typingDone(t,elapsed){return typedCount(t,elapsed)>=Array.from(t).length;}
const names=['hero','walkA','walkB','attack','chief','courier','caretaker','observer','dust','thorn','boss','platform','crate','water','record','stone'];
const controlNames=['joyBase','joyKnob','attackButton','jumpButton','chargeButton','interactButton'];
const intro=[
 {text:'나는 {name}, 다섯 마을의 견습 수호대원!',at:[.5,.5],zoom:1.1,hero:true},
 {text:'날씨 때문에 힘든 이웃을 돕는 게 내 임무야.',at:[.5,.5],zoom:1.1,hero:true},
 {text:'다섯 마을은 평화로웠어요.',at:[.5,.5],zoom:1},
 {text:'햇살마을에는 웃음이 가득했어요.',at:[.23,.7],zoom:1.8},
 {text:'온샘마을 장터는 늘 북적였어요.',at:[.28,.28],zoom:1.8},
 {text:'푸른들마을에서는 곡식이 자랐어요.',at:[.5,.72],zoom:1.8},
 {text:'물빛마을의 강은 이웃을 이어줬어요.',at:[.72,.6],zoom:1.8},
 {text:'별고개마을은 여행자를 맞아줬어요.',at:[.83,.2],zoom:1.8},
 {text:'어느 밤, 괴물의 저주가 퍼졌어요.',at:[.55,.2],zoom:1.25,dark:true,boss:true},
 {blackout:true,duration:1.2},
 {text:'다음 날, 마을의 모습이 달라졌어요.',at:[.5,.5],zoom:1,ruined:true},
 {text:'텅 빈 광장… 이웃들은 어디로 갔을까요?',at:[.23,.7],zoom:1.8,ruined:true},
 {text:'다섯 수호석에 무슨 일이 생긴 걸까요?',at:[.5,.5],zoom:1,stone:true,ruined:true},
 {text:'“우리 마을을 한번 살펴봐 주겠니?”',at:[.25,.7],zoom:1.5,chief:true,ruined:true},
 {text:'첫 번째 목적지, 햇살마을!',at:[.23,.7],zoom:1.8,ruined:true}
];

function resize(){const r=canvas.getBoundingClientRect();H=720;W=clamp(720*r.width/r.height,320,2000);const d=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);ground=568;clearInput();syncCamera();}
addEventListener('resize',resize);addEventListener('orientationchange',resize);
function save(){s.x=encounter?encounter.returnX:player.x;try{localStorage.setItem(SAVE_KEY,model.serialize());}catch{}}
addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{if(document.hidden){save();clearInput();}});
function announce(t){document.querySelector('#live').textContent=t;}
function tone(freq=600,duration=.08){if(!s.sound)return;try{audioContext??=new AudioContext();audioContext.resume();const o=audioContext.createOscillator(),g=audioContext.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(.035,audioContext.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+duration);o.connect(g);g.connect(audioContext.destination);o.start();o.stop(audioContext.currentTime+duration);}catch{}}
function notify(t,seconds=2.5){toast={text:t,t:Math.max(seconds,Array.from(t).length/TYPE_SPEED+1.5),elapsed:0};announce(t);}
function floating(t,x,y,color='#fff5d0'){floaters.push({text:t,x,y,t:1.2,color});}
function pickup(o){react(1);pickups.push({art:o.art,x:o.x,y:o.y-12,elapsed:0,duration:1.15});floating(`${o.name} +1`,o.x,o.y-100);tone(760,.09);}
function drawGlints(x,y,elapsed,alpha=1){for(let i=0;i<5;i++){const phase=clamp((elapsed-i*.045)/.7,0,1),angle=i*Math.PI*2/5-.7,r=20+phase*48,size=8+Math.sin(phase*Math.PI)*10;ctx.save();ctx.globalAlpha=alpha*Math.sin(phase*Math.PI);ui(300,199,55,58,x+Math.cos(angle)*r-size/2,y+Math.sin(angle)*r-size/2,size,size);ctx.restore();}}
function clearInput(){keys.clear();held.clear();pointerActions.clear();stick={id:null,x:0,y:0};}
function text(t,x,y,size=26,color='#49321e',align='left',weight=500,family=FONT_BODY){ctx.font=`${weight} ${size}px ${family}`;ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(t,x,y);}
function heading(t,x,y,size=26,color='#49321e',align='left'){text(t,x,y,size,color,align,700,FONT_HEADING);}
function outlined(t,x,y,size=24,color='#fff2ce',align='center'){ctx.font=`700 ${size}px ${FONT_HEADING}`;ctx.lineWidth=Math.max(2,size*.11);ctx.strokeStyle='#433524';ctx.textAlign=align;ctx.textBaseline='middle';ctx.strokeText(t,x,y);ctx.fillStyle=color;ctx.fillText(t,x,y);}
function wrap(t,maxWidth,size=28,weight=500){ctx.font=`${weight} ${size}px ${FONT_BODY}`;const lines=[];let line='';for(const c of t){if(c==='\n'){lines.push(line);line='';continue;}if(ctx.measureText(line+c).width>maxWidth&&line){lines.push(line);line=c;}else line+=c;}if(line)lines.push(line);return lines;}
function paragraphs(t,x,y,width,size=28,lineHeight=40,color='#49321e',align='left',weight=500){const lines=wrap(t,width,size,weight);for(let i=0;i<lines.length;i++)text(lines[i],x,y+i*lineHeight,size,color,align,weight);return lines.length*lineHeight;}
// Wrap using the complete message, then reveal characters without shifting its lines.
function typedParagraphs(t,elapsed,x,y,width,size=28,lineHeight=40,color='#49321e',align='left',weight=500){let left=typedCount(t,elapsed);for(const [i,line] of wrap(t,width,size,weight).entries()){const chars=Array.from(line);text(chars.slice(0,Math.max(0,left)).join(''),x,y+i*lineHeight,size,color,align,weight);left-=chars.length;}}
function source(img,sx,sy,sw,sh,x,y,w,h){ctx.drawImage(img,sx,sy,sw,sh,x,y,w,h);}
function ui(sx,sy,sw,sh,x,y,w,h){source(images.ui,sx,sy,sw,sh,x,y,w,h);}
function nine(sx,sy,sw,sh,x,y,w,h,b=22){const d=Math.min(b,w/3,h/3),a=15;for(let r=0;r<3;r++)for(let c=0;c<3;c++){const xs=[sx,sx+a,sx+sw-a],ys=[sy,sy+a,sy+sh-a],ws=[a,sw-2*a,a],hs=[a,sh-2*a,a],dx=[x,x+d,x+w-d],dy=[y,y+d,y+h-d],dw=[d,w-2*d,d],dh=[d,h-2*d,d];ui(xs[c],ys[r],ws[c],hs[r],dx[c],dy[r],dw[c],dh[r]);}}
function artFrame(rect,x,y,w,h,srcBorder=60,dstBorder=22){const [sx,sy,sw,sh]=rect,d=Math.min(dstBorder,w/3,h/3),a=srcBorder;for(let r=0;r<3;r++)for(let c=0;c<3;c++){const xs=[sx,sx+a,sx+sw-a],ys=[sy,sy+a,sy+sh-a],ws=[a,sw-2*a,a],hs=[a,sh-2*a,a],dx=[x,x+d,x+w-d],dy=[y,y+d,y+h-d],dw=[d,w-2*d,d],dh=[d,h-2*d,d];source(images.frames,xs[c],ys[r],ws[c],hs[r],dx[c],dy[r],dw[c],dh[r]);}}
function panel(x,y,w,h){artFrame([47,148,791,585],x,y,w,h,65,22);}
function ribbon(label,x,y,w=270){spriteRect('ribbon',x,y,w,72);let size=25;ctx.font=`700 ${size}px ${FONT_HEADING}`;while(size>16&&ctx.measureText(label).width>w*.74){size--;ctx.font=`700 ${size}px ${FONT_HEADING}`;}heading(label,x+w/2,y+28,size,'#49321e','center');}
function button(label,x,y,w,h,fn,opt={}){if(opt.disabled)ctx.globalAlpha=.5;artFrame([921,330,818,225],x,y,w,h,60,18);let size=opt.size||25;ctx.font=`700 ${size}px ${FONT_HEADING}`;while(size>14&&ctx.measureText(label).width>w-Math.min(32,w*.24)){size--;ctx.font=`700 ${size}px ${FONT_HEADING}`;}heading(label,x+w/2,y+h/2,size,opt.color||'#4b351e','center');ctx.globalAlpha=1;if(!opt.disabled)hits.push({x,y,w,h,fn,label});}
function sprite(key,x,y,h,flip=false,alpha=1){if(['hero','walkA','walkB','attack'].includes(key))return drawCharacter(key,x,y,h,flip,alpha);const a=atlases[key];if(!a)return;const w=h*a.w/a.h;ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);if(flip)ctx.scale(-1,1);source(a.img,a.x,a.y,a.w,a.h,-w/2,-h,w,h);ctx.restore();return w;}
function spriteRect(key,x,y,w,h){const a=atlases[key];if(a)source(a.img,a.x,a.y,a.w,a.h,x,y,w,h);}
function control(key,x,y,size,fn,label,active=false){if(active)ctx.globalAlpha=.78;spriteRect(key,x-size/2,y-size/2,size,size);ctx.globalAlpha=1;if(label)outlined(label,x,y+size/2-4,21);hits.push({x:x-size/2-5,y:y-size/2-5,w:size+10,h:size+12,fn,label:label||key});}
function veil(alpha=.57){ctx.fillStyle=`rgba(30,29,26,${alpha})`;ctx.fillRect(0,0,W,H);}

function buildAtlas(img,cols,rows,list,regions={}){
 const off=document.createElement('canvas');off.width=img.width;off.height=img.height;
 const c=off.getContext('2d',{willReadFrequently:true});c.drawImage(img,0,0);
 const data=c.getImageData(0,0,img.width,img.height).data;
 list.forEach((key,n)=>{
  const cell=regions[key]||[Math.floor(n%cols*img.width/cols),Math.floor(Math.floor(n/cols)*img.height/rows),Math.floor(img.width/cols),Math.floor(img.height/rows)];
  const [l,t,w,h]=cell,r=l+w,b=t+h;let minX=r,maxX=l,minY=b,maxY=t;
  for(let y=t;y<b;y++)for(let x=l;x<r;x++)if(data[(y*img.width+x)*4+3]>100){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
  atlases[key]={img,x:minX,y:minY,w:Math.max(1,maxX-minX+1),h:Math.max(1,maxY-minY+1)};
 });
}

function attachCharacterAnchors(){
 for(let color=0;color<4;color++){
  const img=images[['heads','headsBlack','headsGold','headsBlue'][color]],off=document.createElement('canvas');off.width=img.width;off.height=img.height;const c=off.getContext('2d',{willReadFrequently:true});c.drawImage(img,0,0);const data=c.getImageData(0,0,img.width,img.height).data;
  for(let i=0;i<16;i++){
   const a=atlases[`head-${color}-${i}`],base=atlases[`head-0-${i}`],ratio=img.width/images.heads.width,center=color?base.pegX*ratio:a.x+a.w*.55,rows=[];
   for(let y=Math.floor(a.y+a.h*.8);y<a.y+a.h;y++){let count=0,total=0;for(let x=Math.max(a.x,Math.floor(center-25*ratio));x<Math.min(a.x+a.w,center+25*ratio);x++){const p=(y*img.width+x)*4,[r,g,b,alpha]=data.slice(p,p+4);if(alpha>100&&r>210&&g>140&&g<230&&b>115&&r-g>20&&g-b>15){count++;total+=x;}}if(count>=5)rows.push({y,count,total});}
   const edge=rows.slice(-4);a.pegX=edge.length?edge.reduce((n,r)=>n+r.total,0)/edge.reduce((n,r)=>n+r.count,0):center;a.pegY=rows.length?rows[rows.length-1].y:base.pegY*ratio;
  }
 }
 const collarCenters=[306.6,820.3,1329.4,1840.5];for(const [i,key] of ['body-hero','body-walkA','body-walkB','body-attack'].entries()){const a=atlases[key];a.pegX=collarCenters[i];a.pegY=a.y+12;}
}
function drawHead(hair,color,x,y,height=86,face=0){const a=atlases[`head-${color}-${hair*4+face}`];if(!a)return;const w=height*a.w/a.h;source(a.img,a.x,a.y,a.w,a.h,x-w/2,y-height,w,height);}
function drawCharacter(pose,x,y,height,flip=false,alpha=1,hair=s.hair,color=s.color,face=expressionFor(pose)){
 const body=atlases[`body-${pose}`],head=atlases[`head-${color}-${hair*4+face}`];if(!body||!head)return;
 const scale=height/400,b=200/body.h,f=250/(head.img.height/4),neckY=-200+(body.pegY-body.y)*b;
 ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.scale((flip?-1:1)*scale,scale);
 source(head.img,head.x,head.y,head.w,head.h,(head.x-head.pegX)*f,neckY+(head.y-head.pegY)*f,head.w*f,head.h*f);
 source(body.img,body.x,body.y,body.w,body.h,(body.x-body.pegX)*b,-200,body.w*b,200);
 ctx.restore();return Math.max(body.w*b,head.w*f)*scale;
}

const platforms=[{x:3650,y:ground-90,w:240},{x:3950,y:ground-160,w:230}];
let enemies=[];
function resetEnemies(){enemies=[...[700,960,1220,1480].map((x,i)=>({id:`dust-${i}`,type:'dust',x,home:x,y:ground,hp:20,max:20,dir:i%2?1:-1,t:i,hit:0})),...[800,1120,1440].map((x,i)=>({id:`thorn-${i}`,type:'thorn',x,home:x,y:ground,hp:30,max:30,dir:1,t:i+2,hit:0})),{id:'boss',type:'boss',x:1380,home:1380,y:ground,hp:240,max:240,dir:-1,t:0,hit:0,phase:'wait',phaseT:0}];for(const e of enemies)if(s.killed.includes(e.id)||e.id==='boss'&&s.bossDead)e.hp=0;}
resetEnemies();
function npcs(){if(encounter)return [];return [{id:'chief',role:'촌장님',art:'chief',x:s.quest===4?4270:320},{id:'courier',role:'배달원',art:'courier',x:1110},{id:'caretaker',role:'쉼터 선생님',art:'caretaker',x:2410},{id:'observer',role:'관측소 선생님',art:'observer',x:3440}];}
function objects(){if(encounter)return [{id:'exit',kind:'exit',art:'returnPortal',name:'마을로 돌아가기',x:encounter.cleared?encounter.exitX:180,y:ground}];const out=[];if(s.quest===0&&s.accepted){[{id:'empty',x:570,art:'platform',name:'빈 벤치'},{id:'notice',x:810,art:'record',name:'더위 안내판'},{id:'resident',x:1000,art:'caretaker',name:'주민'}].forEach(o=>{if(!s.clues.includes(o.id))out.push({...o,kind:'clue',y:ground});});}
 if(s.quest===1&&s.accepted)[2070,2280].forEach((x,i)=>{if(!s.crates.includes(`crate-${i}`))out.push({id:`crate-${i}`,x,y:ground,art:'crate',name:i?'집 보급 상자':'일터 보급 상자',kind:'crate'});});
 if(s.quest===2&&s.accepted)[{x:2580,id:'water',art:'water',name:'마실 물'},{x:2850,id:'cups',art:'crate',name:'컵 상자'},{x:3230,id:'cloth',art:'record',name:'쉼터 천'}].forEach(o=>{if(!s.supplies.includes(o.id))out.push({...o,y:ground,kind:'supply'});});
 if(s.quest===3&&s.accepted)[{x:3570,y:ground,id:'record-0'},{x:3780,y:ground-90,id:'record-1'},{x:4070,y:ground-160,id:'record-2'}].forEach(o=>{if(!s.records.includes(o.id))out.push({...o,art:'record',name:'관측 기록',kind:'record'});});
 if(s.quest===4&&s.accepted&&s.bossDead)out.push({id:'stone',x:4425,y:ground,art:'stone',name:'녹음의 수호석',kind:'stone'});const portal=portalForQuest();if(portal)out.push(portal);return out;}
function nearby(){const all=[...npcs().map(n=>({...n,kind:'npc',y:ground})),...objects()];return all.filter(o=>Math.abs(o.x-player.x)<140&&Math.abs((o.y||ground)-player.y)<130).sort((a,b)=>Math.abs(a.x-player.x)-Math.abs(b.x-player.x))[0];}
function progress(){if(encounter)return encounter.cleared?'처치 완료! 마을로 돌아가요':`남은 몬스터 ${enemiesLeft()}마리`;if(s.finished)return '배운 개념은 수첩에서 다시 봐요';if(!s.accepted)return ['촌장님과 이야기하기','배달원과 이야기하기','쉼터 선생님과 이야기하기','관측소 선생님과 이야기하기','큰 나무 앞 촌장님 만나기'][s.quest];if(model.evidenceReady()){if(!model.lessonComplete())return `개념 선택 ${LESSONS[s.quest].practice.filter(q=>s.practiceDone.includes(q.id)).length}/${LESSONS[s.quest].practice.length} · 부탁한 분과 확인`;if(s.quest===4&&!model.hasPassedTest())return s.testAnswers.length<5?`수호대 확인 ${s.testAnswers.length}/5`:`다시 확인할 개념 ${model.testGaps().filter(q=>!s.testReviewed.includes(q)).length}개`;return '부탁한 분에게 돌아가기';}if(s.quest===1&&!s.practiceDone.includes('delivery-time'))return '배달원과 배달 시간 정하기';return [`단서 찾기 ${s.clues.length}/3`,`몬스터 ${4-enemiesLeft()}/4 · 배달 ${s.crates.length}/2`,`쉼터 물품 ${s.supplies.length}/3 · 몬스터 ${3-enemiesLeft()}/3`,`관측 기록 ${s.records.length}/3`,s.bossDead?'수호석 앞 대응 고르기':'촌장님 옆 포탈로 들어가기'][s.quest];}
function nextX(){if(encounter)return encounter.cleared?encounter.exitX:activeEnemies().find(e=>e.hp>0)?.x||180;if(s.finished)return 4425;if(!s.accepted)return [320,1110,2410,3440,4270][s.quest];if(model.evidenceReady())return [320,1110,2410,3440,4425][s.quest];if(s.quest===1&&!s.practiceDone.includes('delivery-time'))return 1110;const portal=portalForQuest();if(portal)return portal.x;const list=objects();if(model.canComplete()&&s.quest===1)return 1110;if(model.canComplete()&&s.quest===2)return 2410;return list[0]?.x||player.x;}
function openPortal(o=portalForQuest()){if(encounter||!o)return;s.hp=6;save();clearInput();player.vx=0;modal={type:'portal',portal:o,elapsed:0};}
function enterPortal(){const o=modal?.type==='portal'?modal.portal:portalForQuest();if(!o||encounter||s.energy<ENERGY.attack)return;encounter={quest:s.quest,returnX:o.x,cleared:false,exitX:180};player.x=330;player.y=ground;player.vx=0;player.vy=0;player.invincible=1.2;player.onGround=true;modal=null;clearInput();syncCamera();save();notify('포탈 안이야. 준비한 힘을 보여주자!',3);}
function leaveArena(){if(!encounter)return;const back=encounter.returnX;encounter=null;modal=null;player.x=back;player.y=ground;player.vx=0;player.vy=0;player.onGround=true;player.invincible=1.2;pickups=[];floaters=[];effects=[];clearInput();syncCamera();save();notify(enemiesLeft()?'후우, 마을에서 다시 준비하자!':'해냈다! 부탁한 분께 돌아가자.',3);}
function checkArenaClear(){if(encounter&&!encounter.cleared&&!enemiesLeft()){encounter.cleared=true;encounter.exitX=clamp(player.x+160,260,ARENA_WIDTH-150);notify('모두 처치했어! 황금 포탈로 돌아가자.',4);tone(880,.18);save();}}
function syncNameInput(){nameInput.hidden=mode!=='create';if(nameInput.hidden)return;const r=canvas.getBoundingClientRect();Object.assign(nameInput.style,{left:`${(W/2-180)/W*100}%`,top:`${542/H*100}%`,width:`${360/W*100}%`,height:`${41/H*100}%`,fontSize:`${29*r.height/H}px`});}
function chooseStyle(kind,value){if(!['hair','color'].includes(kind)||!Number.isInteger(value)||value<0||value>3)return;s[kind]=value;profileError='';tone(540,.05);}
function confirmCharacter(){if(!model.setProfile(s.hair,s.color,nameInput.value)){profileError='이름을 적어줘! (최대 8글자)';return;}nameInput.blur();nameInput.hidden=true;clearInput();mode=s.introSeen?(s.finished?'ending':'play'):'intro';scene=0;sceneTime=0;syncCamera();save();}
function say(role,art,lines,done,doneLabel='대화 마치기'){clearInput();modal={type:'dialog',role,art,lines:Array.isArray(lines)?lines:[lines],index:0,elapsed:0,done,doneLabel};announce(modal.lines[0]);}
function nextDialog(){const m=modal;if(!m||m.type!=='dialog')return;if(!typingDone(m.lines[m.index],m.elapsed)){m.elapsed=(Array.from(m.lines[m.index]).length+1)/TYPE_SPEED;return;}if(++m.index<m.lines.length){m.elapsed=0;announce(m.lines[m.index]);}else{modal=null;m.done?.();save();}}
function startPractice(q,indices=null,done=null,actionLabel='선택 결과 확인하기'){
 if(q>s.learned)return;const remaining=(indices||LESSONS[q].practice.map((_,i)=>i)).filter(i=>!s.practiceDone.includes(LESSONS[q].practice[i].id));
 if(!remaining.length){done?.();return;}clearInput();player.vx=0;
 if(!s.lessonSeen.includes(q)){modal={type:'lesson',q,elapsed:0,done:()=>startPractice(q,remaining,done,actionLabel)};return;}
 const question=LESSONS[q].practice[remaining[0]];modal={type:'practice',q,queue:remaining,index:0,question,order:shuffleAnswers(),answered:false,wrong:[],feedback:null,elapsed:0,feedbackElapsed:0,done,actionLabel};
}
function shuffleAnswers(){const a=[0,1,2];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function continueLesson(){const m=modal;if(m?.type!=='lesson')return;if(!s.lessonSeen.includes(m.q))s.lessonSeen.push(m.q);save();modal=null;m.done?.();}
function openFinal(done=null){
 if(s.quest<4)return;clearInput();player.vx=0;
 if(!model.lessonComplete(4)){startPractice(4,null,()=>openFinal(done),'마지막 5문제 풀기');return;}
 if(s.testAnswers.length===FINAL_TEST.length){showTestReport(done);return;}
 const index=s.testAnswers.length;modal={type:'test',question:FINAL_TEST[index],index,order:shuffleAnswers(),answered:false,wrong:[],feedback:null,elapsed:0,feedbackElapsed:0,done};
}
function showTestReport(done=null){modal={type:'testReport',done,elapsed:0};clearInput();save();}
function openReview(done=null){const queue=model.testGaps().filter(q=>!s.testReviewed.includes(q));if(!queue.length){showTestReport(done);return;}modal={type:'review',queue,index:0,question:REVIEW_TEST[queue[0]],order:shuffleAnswers(),answered:false,wrong:[],feedback:null,elapsed:0,feedbackElapsed:0,done};clearInput();}
function answerLearning(index){
 const m=modal;if(!m||!['practice','test','review'].includes(m.type)||m.answered||index<0||index>2)return;
 const selected=m.order[index],correct=selected===m.question.correct;
 if(m.type==='test'){if(!model.recordTestAnswer(m.index,selected))return;m.answered=true;}
 else{if(m.wrong.includes(selected))return;if(m.type==='practice')model.recordPractice(m.question.id,correct);else model.recordReview(m.question.topic,correct);if(correct)m.answered=true;else m.wrong.push(selected);}
 m.selected=selected;m.correct=correct;m.feedback=m.question.why;m.feedbackElapsed=0;tone(correct?820:260,.09);announce(m.feedback);save();
}
function nextLearning(){
 const m=modal;if(!m||!m.answered)return;
 if(m.type==='test'){if(s.testAnswers.length===FINAL_TEST.length)showTestReport(m.done);else openFinal(m.done);return;}
 if(m.type==='review'){const done=m.done;openReview(done);return;}
 if(m.type!=='practice')return;
 const next=m.index+1;if(next>=m.queue.length){modal=null;save();m.done?.();return;}
 modal={...m,index:next,question:LESSONS[m.q].practice[m.queue[next]],order:shuffleAnswers(),answered:false,wrong:[],feedback:null,elapsed:0,feedbackElapsed:0};
}
function pauseLearning(){save();modal=null;clearInput();}
function completeQuest(){const q=s.quest;if(encounter||!model.evidenceReady())return;if(!model.lessonComplete(q)){startPractice(q,null,completeQuest,['광장 조사 마치기','배달 부탁 마치기','쉼터 준비 마치기','기록 조사 마치기','마지막 5문제 풀기'][q]);return;}if(q===4&&!model.hasPassedTest()){openFinal(completeQuest);return;}if(!model.complete())return;save();tone(790,.15);notify(`부탁 완료! 경험치 +${QUESTS[q].reward}`,3);modal={type:'reward',q,elapsed:0,done:()=>{if(q===4){mode='ending';sceneTime=0;}else if(q===3){say('관측소 선생님','observer','큰 나무 앞에서 촌장님이 기다려요.');}}};clearInput();}
function maybeComplete(){if(encounter||!model.evidenceReady())return;if(s.quest===2)say('쉼터 선생님','caretaker',[`${s.playerName}, 잠깐! 다친 데는 없니?`,'물도 컵도 천도 딱 맞네. 꼼꼼하구나!','이제 더위에 지친 이웃들이 쉴 수 있겠어.'],completeQuest,model.lessonComplete(2)?'쉼터 보상 확인':'쉼터 내용 복습');else if(s.quest===1)say('배달원','courier',['으쌰! 길도 뚫고 상자도 챙겼네!','고마워. 그래도 한낮 배달은 쉬엄쉬엄 해야지.'],completeQuest,model.lessonComplete(1)?'배달 보상 확인':'배달 내용 복습');}
function interact(target=null){if(mode!=='play'||modal)return;const o=target?.kind?target:nearby();if(o&&(Math.abs(o.x-player.x)>=140||Math.abs((o.y||ground)-player.y)>=130))return;if(!o){notify('가까이 다가가서 눌러주세요.',1.5);return;}tone(420);if(o.kind==='npc'){talk(o);return;}if(o.kind==='portal'){openPortal(o);return;}if(o.kind==='exit'){leaveArena();return;}
 if(o.kind==='clue'){const lines={empty:['어? 늘 시끌벅적하던 벤치인데…','너무 더워서 다들 그늘로 갔나 봐.'],notice:['안내판도 뜨끈뜨끈하네.','지나친 더위가 이어지는 폭염이래!'],resident:['후아, 부채질을 해도 덥네!','얇은 옷을 입어도 밖에서 놀기 힘들어.']};if(model.collect('clues',o.id)){say(o.id==='resident'?'주민':'발견!',o.art,lines[o.id],()=>{if(model.evidenceReady())completeQuest();},model.evidenceReady()?'세 단서 비교하기':'이 단서 확인 마치기');}}
 if(o.kind==='crate'){const index=o.id==='crate-0'?1:2;startPractice(1,[index],()=>{if(model.collect('crates',o.id)){pickup(o);notify('시간표에 맞춰 배달원에게 가져가자.');save();}},'배달 상자 챙기기');}
 if(o.kind==='supply'){const index=['water','cups','cloth'].indexOf(o.id);startPractice(2,[index],()=>{if(model.collect('supplies',o.id)){pickup(o);notify(`${o.name} · 쉼터에서 쓰는 까닭 확인!`);save();}},'쉼터로 가져가기');}
 if(o.kind==='record'){if(model.collect('records',o.id)){pickup(o);notify(`기록 ${s.records.length}/3`);save();if(s.records.length===3)completeQuest();}}
 if(o.kind==='stone'){if(s.plans.length===3){completeQuest();return;}pickup(o);modal={type:'plans',picked:[...s.plans],wrong:null,order:[0,1,2,3,4,5].sort(()=>Math.random()-.5)};clearInput();}}
function talk(n){if(encounter)return;const q=s.quest,name=s.playerName||'수호대';if(s.accepted&&n.id===['chief','courier','caretaker','observer','chief'][q]&&model.evidenceReady()){if(q===1||q===2)maybeComplete();else completeQuest();return;}if(s.accepted&&q===1&&n.id==='courier'&&!s.practiceDone.includes('delivery-time')){startPractice(1,[0],()=>notify('새 배달 시간표로 포탈을 준비하자!',3),'시간표 정하고 포탈 열기');return;}if(s.finished){const thanks={chief:`허허, ${name}! 광장에 웃음이 돌아왔구나.`,courier:'으쌰! 이번 배달은 그늘길로 간다!',caretaker:'모험도 좋지만 물 한 모금 잊지 마!',observer:'수호석 되찾은 날, 기록 완료! 네 덕분이야.'};say(n.role,n.art,thanks[n.id]);return;}
 if(!s.accepted&&n.id===['chief','courier','caretaker','observer','chief'][q]){const lines=[
 [`허허, ${name}! 먼 길 오느라 고생했구나.`,'이 더위엔 매미도 노래를 쉬는 모양이야.','광장 세 곳을 살펴봐 주겠니? 영 조용하구나.'],
 ['으쌰… 에구! 오늘은 상자 하나도 천근이네.','너무 더워서 밖에서 일하기가 힘들어.','먼저 안전한 배달 시간을 같이 정하자!','준비되면 4마리를 잡고 상자 2개도 부탁해!'],
 [`${name}, 얼굴이 빨개졌네. 물부터 마셔!`,'물·컵·천! 어떻게 쓸지도 골라 줄래?','내 옆 포탈의 가시 몬스터 3마리도 부탁할게.','급하게 뛰지 말고, 힘들면 꼭 돌아오렴.'],
 ['오, 수호대! 궁금한 게 생겼어.','예전에도 이렇게 더웠을까? 기록이 알려주지!','언덕에 흩어진 기록 세 장을 찾아줄래?'],
 [`허허, ${name}. 이제 마지막 부탁이구나.`,'내 옆 포탈 너머, 큰 나무에 저주가 있단다.','든든히 준비하고 다녀오렴. 난 여기 있으마.']
 ][q];say(n.role,n.art,lines,()=>{model.accept();s.checkpoint=player.x;save();if(q===1){startPractice(1,[0],()=>notify('시간표 준비 완료! 옆 포탈에서 준비하자.',4),'시간표 정하고 포탈 열기');}else if(MISSIONS[q])notify(`${n.role} 옆에 포탈이 열렸어!`,4);if(q===2)notify('새 스킬! X 또는 바람 버튼',3);},['광장 조사 시작','배달 시간표 보기','쉼터 준비 시작','기록 조사 시작','수호석 찾기 시작'][q]);return;}
 if(s.accepted&&((q===1&&n.id==='courier')||(q===2&&n.id==='caretaker'))){if(model.evidenceReady())maybeComplete();else say(n.role,n.art,q===1?['내 옆 포탈이 보여? 준비되면 들어가 봐!','먼지 몬스터 4마리, 보급 상자 2개야.','걱정 마. 돌아오는 동안 내가 수레를 지킬게!']:['물 한 모금, 숨 한 번. 서두르지 않아도 돼.','물품 세 가지와 포탈 속 몬스터를 확인해 줘!']);return;}
 if(n.id==='caretaker'){s.hp=6;if(!encounter)s.checkpoint=player.x;save();say(n.role,n.art,['잠깐! 모험보다 네 몸이 먼저야.','여기 앉아서 쉬렴. 자, 체력이 돌아왔네!']);return;}
 const replies={chief:['허허, 급할수록 그늘을 찾으렴.','오른쪽 수첩이 길잡이가 되어 줄 게다.'],courier:['배송은 정확하게! 휴식은 넉넉하게!','오늘 내 새 구호야. 꽤 멋지지?'],observer:['앗, 찾았다! …아니, 이건 내 메모구나.','하루만 보지 말고 여러 해를 비교하자!']};say(n.role,n.art,replies[n.id]||'함께 마을을 도와보자!');}
function openQuiz(returnTo=null){if(mode!=='play'||modal||s.finished)return;if(s.energy>=100){notify('기력이 가득해요!',1.5);return;}const pool=model.quizPool();let choices=pool.filter(q=>QUESTIONS.indexOf(q)!==lastQuestion);if(!choices.length)choices=pool;const q=choices[quizIndex++%choices.length];lastQuestion=QUESTIONS.indexOf(q);const order=[0,1,2].sort(()=>Math.random()-.5);modal={type:'quiz',question:q,order,feedback:null,answered:false,elapsed:0,feedbackElapsed:0,returnTo};clearInput();s.firstCharge=true;}
function answerQuiz(i){const m=modal;if(!m||m.type!=='quiz'||m.answered)return;const correct=m.order[i]===m.question.correct;if(correct){model.charge(true);m.answered=true;m.feedback=`기력 +${ENERGY.charge}!`;tone(850,.16);save();}else{m.feedback=m.question.hint;tone(240,.1);}m.feedbackElapsed=0;announce(m.feedback);}
function closeQuiz(){modal=modal?.returnTo||null;player.invincible=Math.max(player.invincible,.9);clearInput();}

function choosePlan(i){i=modal.order?.[i]??i;const opts=['shade','water','help','run','noWater','endure'];const id=opts[i];if(i<3){if(!s.plans.includes(id))model.collect('plans',id);modal.picked=[...s.plans];modal.wrong=null;tone(700);save();if(s.plans.length===3){modal=null;completeQuest();}}else{modal.wrong=['','','','더운 한낮에는 쉬어요.','물을 마실 곳이 필요해요.','힘들 때는 도움받아요.'][i];modal.feedbackElapsed=0;}}
function attack(skill=false){if(mode!=='play'||modal||player.cooldown>0)return;if(skill&&(s.quest<2||s.quest===2&&!s.accepted)){notify('쉼터 부탁에서 스킬이 열려요.');return;}if(!model.spend(skill?ENERGY.skill:ENERGY.attack)){notify('기력 충전 버튼을 눌러요!',1.5);return;}player.cooldown=skill?.8:.32;player.attack=skill?.4:.22;tone(skill?480:350,.035);const range=skill?180:125;let hit=false;for(const e of activeEnemies()){if(e.hp<=0||e.type==='boss'&&s.quest<4)continue;if(Math.abs(e.x-player.x)<range&&Math.abs(e.y-player.y)<145&&(e.x-player.x)*player.dir>-35){e.hp=Math.max(0,e.hp-(skill?30:10));e.hit=.22;floating(skill?'30':'10',e.x,e.y-(e.type==='boss'?195:70),'#fff2bc');hit=true;if(e.hp<=0){model.kill(e.id);tone(650,.07);if(e.type==='boss'){s.bossDead=true;notify('수호석을 조사해요!',3);save();}else{floating('경험치 +5',e.x,e.y-100);s.xp+=5;save();}}}}checkArenaClear();if(skill)effects.push({x:player.x+player.dir*65,y:player.y-65,t:.35});if(s.energy<=60&&!s.firstCharge){s.firstCharge=true;notify('기력이 줄었어요. 책 버튼으로 충전!',4);}return hit;}
function jump(){if(mode==='play'&&!modal&&player.onGround){player.vy=-690;player.onGround=false;tone(520,.04);}}
function hurt(){if(player.invincible>0)return;react(2,.9);model.hurt();player.invincible=1.7;player.vx=-player.dir*130;tone(190,.12);floating('아야!',player.x,player.y-130,'#fff1d1');if(s.hp<=0){model.respawn();if(encounter)leaveArena();player.x=s.x;player.y=ground;syncCamera();player.vy=0;resetEnemies();say('쉼터 선생님','caretaker',['어머, 많이 놀랐지? 여기선 괜찮아.','한숨 돌렸으니 다시 준비해 보자!']);save();}}

function start(newGame=false){encounter=null;emotion={face:0,t:0};if(newGame){model=new Adventure();s=model.s;s.sound=true;player={x:230,y:ground,vx:0,vy:0,dir:1,onGround:true,attack:0,cooldown:0,invincible:0};resetEnemies();}tone();clearInput();if(newGame||!s.profileReady||!s.appearanceReady||s.styleVersion!==2){mode='create';profileError='';nameInput.value=s.playerName;nameInput.hidden=false;}else{mode=s.introSeen?(s.finished?'ending':'play'):'intro';scene=0;sceneTime=0;if(mode==='play')notify(`다시 만나서 반가워, ${s.playerName}!`,3);}syncCamera();}
function finishIntro(){if(!s.profileReady){mode='create';return;}mode='play';s.introSeen=true;player.x=230;player.y=ground;s.x=230;syncCamera();save();notify('동그란 조이패드 또는 방향키로 이동',5);}
function nextScene(){if(intro[scene].blackout)return;const elapsed=Math.max(0,sceneTime-introDelay());if(!typingDone(introText(),elapsed)){sceneTime=(Array.from(introText()).length+1)/TYPE_SPEED+introDelay();return;}advanceScene();}
function goalForZone(x){if(x<1200)return '햇살 광장';if(x<2400)return '그늘 오솔길';if(x<3400)return '쉼터 창고길';if(x<4250)return '관측 언덕';return '큰 나무 숲';}

function update(dt){emotion.t=Math.max(0,emotion.t-dt);time+=dt;autoSaveTime+=dt;if(toast){toast.t-=dt;toast.elapsed+=dt;if(toast.t<=0)toast=null;}floaters.forEach(f=>{f.t-=dt;f.y-=dt*35;});floaters=floaters.filter(f=>f.t>0);effects.forEach(e=>e.t-=dt);effects=effects.filter(e=>e.t>0);pickups.forEach(p=>p.elapsed+=dt);pickups=pickups.filter(p=>p.elapsed<p.duration);
 if(modal){modal.elapsed=(modal.elapsed||0)+dt;modal.feedbackElapsed=(modal.feedbackElapsed||0)+dt;}
 if(mode==='intro'){sceneTime+=dt;if(intro[scene].blackout){if(sceneTime>=intro[scene].duration)advanceScene();}else if(sceneTime>Math.max(5.5,Array.from(introText()).length/TYPE_SPEED+introDelay()+2.5))nextScene();return;}
 if(mode!=='play'||modal||document.hidden||innerHeight>innerWidth)return;
 if(autoSaveTime>5){save();autoSaveTime=0;}
 player.attack=Math.max(0,player.attack-dt);player.cooldown=Math.max(0,player.cooldown-dt);player.invincible=Math.max(0,player.invincible-dt);
 const axis=clamp((keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0)+stick.x,-1,1);player.vx=axis*MOVE_SPEED;if(Math.abs(axis)>.1)player.dir=axis>0?1:-1;if((held.has('attack')||keys.has('KeyZ'))&&!nearby())attack();
 const previousX=player.x;player.x+=player.vx*dt;let maxX=5150;if(encounter)maxX=ARENA_WIDTH-120;else if(s.quest===0)maxX=1190;else if(s.quest===1)maxX=2460;else if(s.quest===2)maxX=3390;else if(s.quest===3)maxX=4210;player.x=clamp(player.x,120,maxX);walkDistance+=Math.abs(player.x-previousX);
 const prevY=player.y;player.vy+=1600*dt;player.y+=player.vy*dt;player.onGround=false;if(player.y>=ground){player.y=ground;player.vy=0;player.onGround=true;}for(const p of encounter?[]:platforms){if(player.vy>=0&&prevY<=p.y+3&&player.y>=p.y&&player.x>p.x-15&&player.x<p.x+p.w+15){player.y=p.y;player.vy=0;player.onGround=true;}}
 syncCamera();
 for(const e of activeEnemies()){if(e.hp<=0||Math.abs(e.x-player.x)>900||e.type==='boss'&&(!s.accepted||s.quest<4))continue;e.t+=dt;e.hit=Math.max(0,e.hit-dt);if(e.type==='boss'){e.phaseT+=dt;const period=e.hp<120?2.7:3.6;const cycle=e.phaseT%period;e.phase=cycle<.85?'warn':cycle<1.25?'strike':'rest';if(e.phase==='strike'&&Math.abs(player.x-e.x)<245&&player.y>ground-70)hurt();if(Math.abs(player.x-e.x)<80&&Math.abs(player.y-e.y)<120)hurt();}else{const speed=e.type==='dust'?30:18;e.x=e.home+Math.sin(e.t*.8)*55;e.y=ground-(e.type==='dust'?Math.abs(Math.sin(e.t*2))*12:0);if(Math.abs(e.x-player.x)<45&&Math.abs(e.y-player.y)<80)hurt();}}
 checkArenaClear();
}

function drawBackground(){const img=encounter?images.arena:images.bg;const scale=H/img.height,w=img.width*scale;const offset=cam;const start=Math.floor(offset/w)-1;for(let i=start;i<(offset+W)/w+1;i++){const x=i*w-offset;ctx.save();if(Math.abs(i)%2){ctx.translate(x+w,0);ctx.scale(-1,1);ctx.drawImage(img,0,0,w,H);}else ctx.drawImage(img,x,0,w,H);ctx.restore();}if(!s.finished){ctx.fillStyle='rgba(214,147,69,.075)';ctx.fillRect(0,0,W,H);}}
function drawWorld(){drawBackground();for(const p of encounter?[]:platforms){spriteRect('platform',p.x-cam,p.y-14,p.w,52);}
 for(const n of npcs()){const x=n.x-cam;if(x<-150||x>W+150)continue;sprite(n.art,x,ground,n.id==='chief'?115:108);outlined(n.role,x,ground+23,20);hits.push({x:x-55,y:ground-120,w:110,h:150,fn:()=>{if(Math.abs(player.x-n.x)<140)talk(n);else notify('가까이 다가가서 이야기해요.',1.8);},label:n.role});const index=['chief','courier','caretaker','observer','chief'][s.quest];if(!s.finished&&!s.accepted&&n.id===index){outlined('!',x,ground-143+Math.sin(time*3)*4,38,'#ffe7a0');}}
 if(!encounter&&s.completed.includes(1)){sprite('crate',2290-cam,ground,52);sprite('crate',2333-cam,ground,44);}if(!encounter&&(s.completed.includes(2)||s.quest===2)){if(s.supplies.includes('cloth'))sprite('clothShade',2500-cam,ground,150);if(s.supplies.includes('water'))sprite('water',2455-cam,ground,65);if(s.supplies.includes('cups'))sprite('crate',2530-cam,ground,50);}
 for(const o of objects()){const x=o.x-cam;if(x<-120||x>W+120)continue;const isPortal=['portal','exit'].includes(o.kind);const h=isPortal?155:o.kind==='stone'?112:o.kind==='clue'&&o.id==='resident'?105:o.art==='platform'?34:72;const bob=o.kind==='clue'?0:Math.sin(time*2+o.x)*3;sprite(o.art,x,o.y+bob,h);outlined(isPortal?(o.kind==='exit'?'마을로':'포탈'):o.kind==='clue'?'조사':'발견!',x,o.y-h-19,21,'#ffe3a1');hits.push({x:x-58,y:o.y-h-18,w:116,h:h+38,fn:()=>{if(Math.abs(player.x-o.x)<140&&Math.abs(player.y-o.y)<130)interact(o);else notify('가까이 가서 살펴봐요.',1.8);},label:o.name});}
 for(const e of activeEnemies()){if(e.hp<=0||e.x-cam<-250||e.x-cam>W+250)continue;if(e.type==='boss'&&s.quest<4)continue;const h=e.type==='boss'?220:e.type==='dust'?67:74;const bob=e.type==='boss'&&e.phase==='warn'?Math.sin(time*20)*3:0;sprite(e.type,e.x-cam+bob,e.y,h,e.dir===1,e.hit>0?.6:1);if(e.type==='boss'){outlined('그늘을 삼킨 덩굴',e.x-cam,e.y-h-54,26);ui(300,203,442,48,e.x-cam-155,e.y-h-36,310,29);ctx.save();ctx.beginPath();ctx.rect(e.x-cam-155,e.y-h-36,310*e.hp/e.max,29);ctx.clip();ui(300,130,442,54,e.x-cam-155,e.y-h-36,310,29);ctx.restore();if(e.phase==='warn')outlined('점프!',e.x-cam,e.y-h-90,29,'#ffe1a0');if(e.phase==='rest')outlined('공격 기회!',e.x-cam,e.y-h-90,25,'#e7f2c5');}}
 let art=player.attack>0?'attack':Math.abs(player.vx)>10?(Math.floor(walkDistance/32)%2?'walkA':'walkB'):'hero';sprite(art,player.x-cam,player.y,110,player.dir<0,player.invincible>0&&Math.floor(time*9)%2?.45:1);
 for(const e of effects){ctx.globalAlpha=e.t/.35;ui(338,1075,165,165,e.x-cam-55,e.y-55,110,110);ctx.globalAlpha=1;}
 for(const p of pickups){const a=p.elapsed/p.duration,ease=1-(1-a)**3;ctx.save();ctx.filter=`blur(${Math.max(0,a-.45)*3}px)`;sprite(p.art,p.x-cam,p.y-ease*72,72*(1+.12*Math.sin(a*Math.PI)),false,Math.min(1,(1-a)*2));ctx.restore();drawGlints(p.x-cam,p.y-40-ease*25,p.elapsed,1-a);}
 for(const f of floaters){ctx.save();ctx.globalAlpha=clamp(f.t/.5,0,1);outlined(f.text,f.x-cam,f.y,23,f.color);ctx.restore();}
 const n=nearby();if(n&&!modal){outlined(n.kind==='npc'?'대화하기':['portal','exit'].includes(n.kind)?'들어가기':'살펴보기',n.x-cam,(n.y||ground)-155,25,'#fff5c9');}
}
function drawResourceMeter(x,y,w,h,value,label,kind){artFrame([921,330,818,225],x,y,w,h,60,9);const fill=clamp(value,0,1)*(w-22);if(fill>0){if(kind==='energy')ui(363,147,320,20,x+11,y+10,fill,h-20);else ui(364,217,160,15,x+11,y+9,fill,h-18);}outlined(label,x+w/2,y+h/2,kind==='energy'?19:16);}
function drawHUD(){panel(15,12,156,169);sprite('hero',93,118,88);artFrame([921,330,818,225],23,125,140,32,60,9);let nameSize=17;ctx.font=`700 ${nameSize}px ${FONT_HEADING}`;while(nameSize>11&&ctx.measureText(s.playerName).width>121){nameSize--;ctx.font=`700 ${nameSize}px ${FONT_HEADING}`;}heading(s.playerName,93,141,nameSize,'#49321e','center');
 for(let i=0;i<6;i++){ctx.globalAlpha=i<s.hp?1:.24;ui(305,59,65,64,182+i*34,20,33,33);}ctx.globalAlpha=1;
 drawResourceMeter(180,63,240,36,s.energy/100,`기력 ${s.energy} / 100`,'energy');drawResourceMeter(180,104,240,32,(s.xp%100)/100,`Lv. ${1+Math.floor(s.xp/100)} · 경험치 ${s.xp}`,'xp');
 const qw=clamp(W*.31,300,360),qx=W-qw-18,qy=18,padding=30,contentWidth=qw-padding*2;
 const progressLines=wrap(progress(),contentWidth,22),qh=progressLines.length>1?184:154;
 panel(qx,qy,qw,qh);text(s.finished?'마을 회복 완료':`부탁 ${s.quest+1} / 5`,qx+padding,qy+35,17,'#82643f');
 const title=s.finished?'햇살마을 회복!':QUESTS[s.quest].title;let titleSize=23;ctx.font=`700 ${titleSize}px ${FONT_HEADING}`;while(titleSize>18&&ctx.measureText(title).width>contentWidth){titleSize--;ctx.font=`700 ${titleSize}px ${FONT_HEADING}`;}
 heading(title,qx+padding,qy+70,titleSize);paragraphs(progress(),qx+padding,qy+110,contentWidth,22,30);
 hits.push({x:qx,y:qy,w:qw,h:qh,fn:()=>{modal={type:'journal'};clearInput();},label:'퀘스트 수첩'});
 const mid=(420+qx)/2;if(W>900){ui(870,0,384,325,mid-55,8,110,94);outlined(encounter?'포탈 안':goalForZone(player.x),mid,123,20);}
 if(encounter)button('마을로 돌아가기',20,165,205,45,leaveArena,{size:21});
 const target=nextX(),distance=Math.abs(target-player.x);if(distance>145&&!s.finished){const right=target>player.x;outlined(`${right?'목표 →':'← 목표'} ${Math.round(distance/10)}m`,right?W-150:150,qy+qh+87,25,'#fff3cc');}
 button('메뉴',W-118,qy+qh+9,100,42,()=>{modal={type:'menu'};clearInput();},{size:20});
}
function primaryTarget(){return mode==='play'&&!modal?nearby():null;}
function triggerPrimary(){const target=primaryTarget();if(target)interact(target);else attack();}
function drawControls(){const bx=108,by=H-104,size=156;spriteRect('joyBase',bx-size/2,by-size/2,size,size);spriteRect('joyKnob',bx-38+stick.x*40,by-38+stick.y*40,76,76);outlined('이동',bx,H-19,20);
 const target=primaryTarget(),label=target?(target.kind==='npc'?'대화':target.kind==='portal'?'포탈':target.kind==='exit'?'마을로':['crate','supply','record'].includes(target.kind)?'챙기기':'조사'):'공격';
 if(target)control('interactButton',W-100,H-104,112,()=>interact(target),label);else{control('attackButton',W-100,H-104,112,()=>{},'공격',held.has('attack'));hits[hits.length-1].hold='attack';}
 document.querySelector('#a-attack').textContent=label;
 control('jumpButton',W-235,H-92,96,jump,'점프');control('chargeButton',W-365,H-91,94,openQuiz,'기력 충전');
 if(s.quest>2||s.quest===2&&s.accepted){ui(337,1071,171,172,W-277,H-260,90,90);outlined('스킬',W-232,H-168,19);hits.push({x:W-285,y:H-265,w:104,h:110,fn:()=>attack(true),label:'스킬'});}
 if(!s.accepted&&s.quest===0)outlined('방향키 / 조이패드로 촌장님에게!',W/2,H-28,22);
}
function drawCreate(){
 drawMap(.5,.5,1.05);veil(.22);const w=Math.min(1120,W-40),x=(W-w)/2,leftW=clamp(w*.25,220,280),rightX=x+leftW+48,rightW=w-leftW-76,gap=12,cw=(rightW-gap*3)/4;
 panel(x,30,w,670);ribbon('나만의 수호대원 만들기',W/2-220,5,440);text('머리 4가지 × 머리색 4가지',W/2,99,25,'#596d47','center');
 panel(x+24,143,leftW-12,345);heading('나의 수호대원',x+18+leftW/2,180,23,'#49321e','center');drawCharacter('hero',x+18+leftW/2,411,220+Math.sin(time*1.5)*1.2);text(HAIRSTYLES[s.hair],x+18+leftW/2,430,19,'#61754c','center');text(HAIR_COLORS[s.color],x+18+leftW/2,452,19,'#61754c','center');
 for(const [kind,title,labels,by] of [['hair','헤어스타일',HAIRSTYLES,154],['color','머리색',HAIR_COLORS,344]]){
  heading(title,rightX,by-24,25);for(let i=0;i<4;i++){const bx=rightX+i*(cw+gap),selected=s[kind]===i;panel(bx,by,cw,150);drawHead(kind==='hair'?i:s.hair,kind==='color'?i:s.color,bx+cw/2,by+100,76);heading(labels[i],bx+cw/2,by+116,19,selected?'#4e723d':'#69513a','center');if(selected)ui(300,199,55,58,bx+cw-29,by+5,22,23);hits.push({x:bx,y:by,w:cw,h:150,fn:()=>chooseStyle(kind,i),label:`${title}: ${labels[i]}`});}
 }
 text('나를 뭐라고 부르면 좋을까?',W/2,515,24,'#5b4530','center');panel(W/2-210,533,420,56);text(profileError||'이름 8글자 · 표정은 모험 상황에 따라 바뀌어.',W/2,607,19,profileError?'#a34d31':'#8a7150','center');button(s.introSeen?'이 모습으로 모험 계속':'이 모습으로 이야기 시작',W/2-205,627,410,52,confirmCharacter,{size:28});button('시작 화면',x+23,56,120,40,()=>{nameInput.blur();mode='title';modal=null;},{size:20});
}
function drawPortal(m){const w=Math.min(780,W-60),x=(W-w)/2,y=68;panel(x,y,w,584);ribbon('포탈 입장 준비',W/2-200,y-30,400);sprite('portal',x+135,y+275,188+Math.sin(time*1.6)*2);heading(m.portal.title,x+265,y+92,28);text(`남은 몬스터 ${enemiesLeft()}마리`,x+265,y+143,26);text(`체력 ${s.hp}/6 · 기력 ${s.energy}/100`,x+265,y+193,24);
 text('잠깐 쉬어 체력을 회복했어.',W/2,y+327,26,'#567249','center');text('문제로 기력을 채울 수도 있어.',W/2,y+370,26,'#567249','center');text('기력 충전은 마을 화면의 책 버튼에서!',W/2,y+415,22,'#7d6549','center');
 button('마을에서 더 준비하기',x+45,y+469,(w-110)/2,62,()=>{modal=null;clearInput();},{size:23});button('전투 지역 들어가기',W/2+10,y+469,(w-110)/2,62,enterPortal,{size:25,disabled:s.energy<ENERGY.attack});
}
function drawTitle(){drawMap(.5,.5,1.05);veil(.2);const w=Math.min(680,W-80),x=(W-w)/2;panel(x,108,w,490);ribbon('그림으로 떠나는 기후 모험',W/2-215,82,430);heading('다섯 마을',W/2,223,54,'#42321e','center');heading('수호대',W/2,292,70,'#547049','center');text('첫 번째 모험 · 햇살마을',W/2,363,27,'#665037','center');button(saved?'처음부터 모험':'수호대원 만들기',W/2-190,423,380,64,()=>{if(saved)modal={type:'restart'};else start(true);},{size:30});if(saved)button('이어하기',W/2-190,503,380,60,()=>start(false),{size:29});else text('터치 조이패드 · 방향키 모두 가능',W/2,530,23,'#6b593d','center');text('도입부 + 첫 마을   |   15~20분 목표',W/2,650,22,'#fff5d9','center');}
function drawMap(cx=.5,cy=.5,z=1,img=images.map){const factor=Math.max(W/img.width,H/img.height)*z;const w=img.width*factor,h=img.height*factor;const x=clamp(W/2-w*cx,W-w,0),y=clamp(H/2-h*cy,H-h,0);ctx.drawImage(img,x,y,w,h);}
function drawIntro(){
 const a=intro[scene];if(a.blackout){const before=intro[scene-1];drawMap(before.at[0]+Math.sin(transitionTime*.32)*.003,before.at[1],before.zoom*(1+Math.min(transitionTime,6)*.004));veil(.45);sprite('boss',W/2,H-100,340);const fade=clamp(sceneTime/.65,0,1),ease=fade*fade*(3-2*fade);ctx.fillStyle=`rgba(0,0,0,${ease})`;ctx.fillRect(0,0,W,H);return;}
 const caption=introText(),drift=Math.sin(sceneTime*.32)*.003;drawMap(a.at[0]+drift,a.at[1],a.zoom*(1+Math.min(sceneTime,6)*.004),a.ruined?images.ruined:images.map);
 if(a.hero){veil(.15);sprite('hero',W/2,H-205+Math.sin(time*1.4)*5,230);}if(a.dark){veil(.45);if(a.boss)sprite('boss',W/2,H-100,340);}if(a.stone){veil(.25);sprite('stone',W/2,H-210+Math.sin(time*1.4)*5,240);}if(a.chief){veil(.2);sprite('chief',W/2,H-210+Math.sin(time*1.4)*3,250);}
 const w=Math.min(W-80,970),elapsed=Math.max(0,sceneTime-introDelay());panel((W-w)/2,H-168,w,120);typedParagraphs(caption,elapsed,W/2,H-118,w-80,33,42,'#49321e','center');button('마을로 가기',W-180,22,155,48,finishIntro,{size:23});button(typingDone(caption,elapsed)?'다음 장면':'자막 펼치기',W-180,H-65,155,44,nextScene,{size:19});text(`${scene+1} / ${intro.length}`,W/2,H-27,20,'#fff3d3','center');
 if(a.ruined&&sceneTime<.7){ctx.fillStyle=`rgba(0,0,0,${1-clamp(sceneTime/.7,0,1)})`;ctx.fillRect(0,0,W,H);}
}
function drawToast(){if(!toast)return;const width=Math.min(W-100,Math.max(300,toast.text.length*22));panel((W-width)/2,151,width,72);text(typed(toast.text,toast.elapsed),W/2,187,24,'#49321e','center');}
function drawDialog(m){const w=Math.min(W-36,1440),x=(W-w)/2,y=H-207;panel(x,y,w,185);const portrait=atlases[m.art];const portraitHeight=portrait?Math.min(165,160*portrait.h/portrait.w):165;sprite(m.art,x+95,y+165,portraitHeight);ribbon(m.role,x+180,y-37,240);typedParagraphs(m.lines[m.index],m.elapsed,x+207,y+58,w-280,32,42);hits.push({x:x+190,y:y+18,w:w-215,h:96,fn:nextDialog,label:'대사 바로 보기 / 다음'});const ready=typingDone(m.lines[m.index],m.elapsed);button(!ready?'대사 펼치기':m.index<m.lines.length-1?'다음 대사':m.doneLabel,x+w-220,y+124,197,47,nextDialog,{size:22});}
function drawQuiz(m){const w=Math.min(790,W-70),h=590,x=(W-w)/2,y=62;panel(x,y,w,h);ribbon('문제로 기력 충전',W/2-175,y-32,350);sprite(m.question.art,x+92,y+177,105);typedParagraphs(m.question.q,m.elapsed,x+169,y+76,w-210,32,40,'#49321e','left',700);for(let i=0;i<3;i++){button(m.question.a[m.order[i]],x+55,y+210+i*80,w-110,65,()=>answerQuiz(i),{size:28,disabled:m.answered});}if(m.feedback){text(typed(m.feedback,m.feedbackElapsed),W/2,y+486,m.answered?32:23,m.answered?'#446842':'#9a4c2b','center');}if(m.answered)button(encounter?'전투로 돌아가기':'마을로 돌아가기',W/2-170,y+520,340,52,closeQuiz,{size:26});else{button('충전 창 닫기',x+25,y+530,180,43,closeQuiz,{size:22});}}

function drawPlans(m){const w=Math.min(880,W-50),x=(W-w)/2,y=44;panel(x,y,w,640);ribbon('도움 되는 행동 3개 고르기',W/2-235,y-28,470);const labels=['그늘에서 쉬기','물 마시기','도움받기','한낮에 달리기','물 안 마시기','계속 참기'],arts=['shadeAction','drinkAction','helpAction','runAction','refuseAction','endureAction'],ids=['shade','water','help','run','noWater','endure'];for(let i=0;i<6;i++){const actual=m.order?.[i]??i,col=i%3,row=Math.floor(i/3),cw=(w-90)/3,bx=x+25+col*(cw+20),by=y+108+row*205;panel(bx,by,cw,177);sprite(arts[actual],bx+cw/2,by+127,112);text(labels[actual],bx+cw/2,by+149,23,'#49321e','center');if(m.picked.includes(ids[actual])){outlined('완료',bx+cw/2,by+25,26,'#d8ebbd');}else hits.push({x:bx,y:by,w:cw,h:177,fn:()=>choosePlan(i),label:labels[actual]});}text(m.wrong?typed(m.wrong,m.feedbackElapsed):`${m.picked.length}/3  마을을 도울 방법을 골라요.`,W/2,y+570,26,'#6b4d30','center');}
function drawReward(m){const w=Math.min(720,W-60),x=(W-w)/2,y=105;panel(x,y,w,480);ribbon('부탁 완료!',W/2-160,y-33,320);const arrival=clamp(m.elapsed/.55,0,1),pop=1-(1-arrival)**3;sprite(m.q===4?'stone':'record',W/2,y+185+(1-pop)*24,120*(.7+.3*pop),false,pop);drawGlints(W/2,y+130,m.elapsed);heading(QUESTS[m.q].title,W/2,y+231,30,'#49321e','center');typedParagraphs(QUESTS[m.q].fact,Math.max(0,m.elapsed-.35),W/2,y+287,w-70,30,39,'#4c663e','center');text(`경험치 +${QUESTS[m.q].reward}`,W/2,y+350,24,'#745c36','center');button(m.q===4?'마을 회복 결과 보기':'보상 확인하고 창 닫기',W/2-180,y+395,360,60,()=>{modal=null;m.done?.();save();},{size:28});}
function drawLesson(m){
 const l=LESSONS[m.q],w=Math.min(900,W-60),x=(W-w)/2,y=54;panel(x,y,w,610);ribbon(l.title,W/2-220,y-30,440);text(l.source,W/2,y+75,24,'#84694c','center');
 const gap=20,cw=(w-100-gap*(l.cards.length-1))/l.cards.length;for(const [i,[art,label]] of l.cards.entries()){const bx=x+50+i*(cw+gap);panel(bx,y+112,cw,211);sprite(art,bx+cw/2,y+261,112);paragraphs(label,bx+cw/2,y+287,cw-32,23,28,'#526e43','center');}
 for(let i=0;i<l.summary.length;i++)paragraphs(l.summary[i],W/2,y+(l.summary.length>2?351:368)+i*(l.summary.length>2?43:47),w-90,l.summary.length>2?26:29,34,'#49321e','center');
 button(m.closeOnly?'개념 정리 창 닫기':['단서 비교 시작하기','배달 시간 정하기','물품 쓰임 고르기','관측 기록 비교하기','대비와 실천 구분하기'][m.q],W/2-190,y+507,380,62,continueLesson,{size:28});button('학습 창 닫기',x+w-176,y+23,150,40,pauseLearning,{size:19});
}
function drawRecordChart(values,x,y,w){
 const max=Math.max(...values),base=y+108;for(let i=0;i<2;i++){const cx=x+w*(.28+i*.44),height=70*values[i]/max;ui(300,131,442,55,cx-32,base-height,64,height);heading(`${values[i]}일`,cx,base-height-17,22,'#49321e','center');text(i?'최근 30년 평균':'예전 30년 평균',cx,base+18,18,'#6c563d','center');}
 text('게임용 가상 자료 · 연평균 폭염 일수',x+w/2,y+152,17,'#8a7358','center');
}
function drawLearning(m){
 const q=m.question,w=Math.min(920,W-60),x=(W-w)/2,y=35;panel(x,y,w,650);
 const label=m.type==='practice'?`개념 선택 ${m.queue[m.index]+1} / ${LESSONS[m.q].practice.length}`:m.type==='test'?`수호대 확인 ${m.index+1} / 5`:'다른 상황으로 다시 확인';ribbon(label,W/2-220,y-24,440);
 const topic=m.type==='practice'?m.q:q.topic;const context=m.type==='test'?'새 상황에 적용해 보자':m.type==='review'?LESSONS[topic].title:LESSONS[topic].source;
 text(context,W/2,y+73,22,'#8a7051','center');
 if(q.diagram){typedParagraphs(q.q,m.elapsed,W/2,y+112,w-100,28,35,'#49321e','center',700);drawRecordChart(q.diagram,x+115,y+134,w-230);}
 else{sprite(q.art,x+99,y+220,105);typedParagraphs(q.q,m.elapsed,x+180,y+122,w-230,30,38,'#49321e','left',700);}
 for(let i=0;i<3;i++){
  const actual=m.order[i],right=m.answered&&actual===q.correct,bad=m.wrong.includes(actual)||(m.answered&&!m.correct&&actual===m.selected),disabled=m.answered||m.wrong.includes(actual),color=right?'#466f3c':bad?'#9d6347':'#49321e';
  if(q.choiceArts){const gap=15,cw=(w-100-2*gap)/3,bx=x+50+i*(cw+gap),by=y+248;panel(bx,by,cw,215);sprite(q.choiceArts[actual],bx+cw/2,by+130,100,false,disabled&&!right?.55:1);paragraphs(q.a[actual],bx+cw/2,by+153,cw-32,20,26,color,'center');if(!disabled)hits.push({x:bx,y:by,w:cw,h:215,fn:()=>answerLearning(i),label:q.a[actual]});if(right)ui(300,199,55,58,bx+cw-32,by+8,23,24);}
  else{const by=y+(q.diagram?305:238)+i*(q.diagram?60:73),bh=q.diagram?54:63;button('',x+50,by,w-100,bh,()=>answerLearning(i),{disabled});const lines=wrap(q.a[actual],w-146,24,700);paragraphs(q.a[actual],W/2,by+bh/2-(lines.length-1)*14,w-146,24,28,color,'center',700);if(!disabled)hits[hits.length-1].label=q.a[actual];if(right)ui(300,199,55,58,x+65,by+19,22,23);}
 }
 if(m.feedback){const title=m.correct?'이유를 확인해 보자':(m.type==='test'?'이 개념은 나중에 다시 확인하자':'그림과 이유를 보고 다시 골라봐');heading(title,W/2,y+495,22,m.correct?'#4e7044':'#a1643e','center');typedParagraphs(m.feedback,m.feedbackElapsed,W/2,y+524,w-100,23,28,'#655039','center');}
 if(m.answered){const last=m.type==='practice'&&m.index===m.queue.length-1;button(m.type==='test'?(m.index===4?'첫 도전 결과 보기':`${m.index+2}번 문제 풀기`):last?m.actionLabel:m.type==='review'?(m.queue.length>1?'다음 오답 영역 확인':'재확인 결과 보기'):LESSONS[m.q].practice[m.queue[m.index+1]].task,W/2-185,y+577,370,49,nextLearning,{size:25});}
 button('학습 창 닫기',x+w-175,y+18,150,38,pauseLearning,{size:18});
}
function drawTestReport(m){
 const w=Math.min(900,W-60),x=(W-w)/2,y=42;panel(x,y,w,636);ribbon('수호대 확인 결과',W/2-210,y-27,420);heading(`첫 도전 ${model.testScore()} / 5`,W/2,y+86,36,'#4d6e41','center');text('처음 점수와 다시 확인한 영역을 따로 남겼어.',W/2,y+132,22,'#81694d','center');
 for(let i=0;i<5;i++){const correct=s.testAnswers[i]===FINAL_TEST[i].correct,recovered=s.testReviewed.includes(i),status=correct?'첫 도전에서 확인':recovered?'다시 확인 완료':'다시 확인할 개념';heading(LESSONS[i].title,x+43,y+201+i*52,23);text(status,x+w-43,y+201+i*52,21,correct||recovered?'#517348':'#aa7042','right');}
 const passed=model.hasPassedTest();text(passed?'다섯 개념을 모두 확인했어!':'틀린 영역은 다른 상황으로 한 번 더 확인해 보자.',W/2,y+481,24,passed?'#4d6e41':'#8d623e','center');
 button(passed?(m.done?'수호석 받기':'마을로 돌아가기'):'다른 상황으로 다시 확인',W/2-230,y+531,460,62,()=>{if(!passed){openReview(m.done);return;}modal=null;m.done?.();save();},{size:27});
 button('결과 창 닫기',x+w-174,y+22,150,38,pauseLearning,{size:18});
}
function drawJournal(){const w=Math.min(900,W-60),x=(W-w)/2,y=55;panel(x,y,w,610);ribbon('모험과 배움 수첩',W/2-200,y-28,400);for(let i=0;i<5;i++){const done=s.completed.includes(i),unlocked=i<=s.learned,by=y+108+i*78,count=LESSONS[i].practice.filter(q=>s.practiceDone.includes(q.id)).length;text(`${i+1}. ${QUESTS[i].title}`,x+40,by,25,done?'#527045':'#6a4b30');text(`${LESSONS[i].title} · 개념 ${count}/${LESSONS[i].practice.length}`,x+40,by+31,20,'#806a4c');button('개념 보기',x+w-158,by-5,119,43,()=>{modal={type:'lesson',q:i,elapsed:0,closeOnly:true,done:()=>{modal=null;}};},{size:20,disabled:!unlocked});}button(s.testAnswers.length===5?'수호대 확인 결과':'수호대 확인 도전',W/2-210,y+513,420,58,()=>openFinal(),{size:25,disabled:s.learned<4&&!s.finished});button('닫기',x+w-126,y+26,99,39,()=>modal=null,{size:20});}

function closeMenu(){if(modal?.type!=='menu')return;save();modal=null;clearInput();}
function drawMenu(){const w=Math.min(660,W-80),x=(W-w)/2;panel(x,90,w,535);ribbon('모험 메뉴',W/2-150,65,300);button('×',x+w-78,108,49,44,closeMenu,{size:32});hits[hits.length-1].label='메뉴 닫기';text('이동  ← → / A D',W/2,193,27,'#49321e','center');text('점프 Space · 스킬 X',W/2,235,25,'#49321e','center');text('공격·대화 Z · 조사 E',W/2,277,25,'#49321e','center');text('기력 충전 Q',W/2,315,23,'#49321e','center');button(s.sound?'효과음 끄기':'효과음 켜기',W/2-190,350,380,54,()=>{s.sound=!s.sound;save();},{size:25});button('메뉴 닫고 모험 계속',W/2-210,423,420,54,closeMenu,{size:26});button('게임 시작 화면으로',W/2-190,496,380,54,()=>{save();modal=null;mode='title';saved={...s};},{size:25});text('진행은 이 브라우저에 자동 저장돼요.',W/2,589,21,'#7b664b','center');}

function drawRestart(){const w=Math.min(670,W-60),x=(W-w)/2;panel(x,200,w,310);paragraphs('이 기기의 저장을 지우고\n새로 시작할까요?',W/2,270,w-70,32,45,'#49321e','center');button('새 모험 취소',W/2-250,400,225,62,()=>modal=null,{size:27});button('새로 시작',W/2+25,400,225,62,()=>{modal=null;start(true);},{size:27});}
function drawEnding(){drawBackground();veil(.2);const w=Math.min(800,W-65),x=(W-w)/2;panel(x,62,w,595);ribbon('햇살마을을 되찾았어요!',W/2-235,35,470);sprite('stone',W/2,300,168);heading('첫 번째 수호석 획득',W/2,343,34,'#486344','center');text('그늘에서 쉬기 · 물 마시기 · 도움받기',W/2,397,27,'#57432c','center');text('자원·에너지 아끼는 실천도 계속!',W/2,430,24,'#526b43','center');text('다음 편지: 온샘마을 장터가 얼어붙었대요.',W/2,460,24,'#57432c','center');button('마을 더 둘러보기',W/2-215,515,430,65,()=>{mode='play';player.x=2400;syncCamera();modal=null;save();},{size:28});text('이번 버전은 햇살마을까지 플레이할 수 있어요.',W/2,620,20,'#796449','center');}
function render(){syncNameInput();ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);ctx.clearRect(0,0,W,H);hits=[];if(mode==='loading')return;if(mode==='title')drawTitle();else if(mode==='create')drawCreate();else if(mode==='intro')drawIntro();else if(mode==='ending')drawEnding();else{drawWorld();drawHUD();if(!modal)drawControls();drawToast();}if(modal){hits=[];if(modal.type!=='dialog')veil(.55);if(modal.type==='portal')drawPortal(modal);if(modal.type==='dialog')drawDialog(modal);if(modal.type==='quiz')drawQuiz(modal);if(modal.type==='lesson')drawLesson(modal);if(['practice','test','review'].includes(modal.type))drawLearning(modal);if(modal.type==='testReport')drawTestReport(modal);if(modal.type==='plans')drawPlans(modal);if(modal.type==='reward')drawReward(modal);if(modal.type==='journal')drawJournal();if(modal.type==='menu')drawMenu();if(modal.type==='restart')drawRestart();}}
function frame(now){const dt=Math.min((now-lastTime)/1000||0,.04);lastTime=now;update(dt);render();requestAnimationFrame(frame);}

function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};}
canvas.addEventListener('pointerdown',e=>{e.preventDefault();canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);const p=point(e);if(mode==='play'&&!modal&&Math.hypot(p.x-108,p.y-(H-104))<90&&stick.id===null){stick.id=e.pointerId;stick.x=clamp((p.x-108)/55,-1,1);stick.y=clamp((p.y-(H-104))/55,-1,1);return;}const h=[...hits].reverse().find(h=>p.x>=h.x&&p.x<=h.x+h.w&&p.y>=h.y&&p.y<=h.y+h.h);if(h){if(h.hold){held.add(h.hold);pointerActions.set(e.pointerId,h.hold);attack();}else h.fn();}});
canvas.addEventListener('pointermove',e=>{if(e.pointerId===stick.id){const p=point(e);stick.x=clamp((p.x-108)/55,-1,1);if(Math.abs(stick.x)<.15)stick.x=0;stick.y=clamp((p.y-(H-104))/55,-1,1);}});
function pointerEnd(e){if(e.pointerId===stick.id)stick={id:null,x:0,y:0};const a=pointerActions.get(e.pointerId);if(a)held.delete(a);pointerActions.delete(e.pointerId);}
canvas.addEventListener('pointerup',pointerEnd);canvas.addEventListener('pointercancel',pointerEnd);canvas.addEventListener('lostpointercapture',pointerEnd);canvas.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('keydown',e=>{if(e.target===nameInput){if(e.code==='Enter'){e.preventDefault();confirmCharacter();}return;}if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyZ','KeyX','KeyE','KeyQ','Escape','Enter'].includes(e.code))e.preventDefault();if(e.repeat){if(mode==='play'&&!modal)keys.add(e.code);return;}if(modal){if(modal.type==='lesson'&&['Enter','Space'].includes(e.code)){continueLesson();return;}if(['practice','test','review'].includes(modal.type)){if(/^Digit[123]$/.test(e.code))answerLearning(Number(e.code.slice(-1))-1);else if(e.code==='Enter'&&modal.answered)nextLearning();else if(e.code==='Escape')pauseLearning();return;}if(modal.type==='dialog'&&['Space','Enter','KeyE'].includes(e.code))nextDialog();else if(modal.type==='quiz'&&/^Digit[123]$/.test(e.code))answerQuiz(Number(e.code.slice(-1))-1);else if(modal.type==='quiz'&&modal.answered&&e.code==='Enter')closeQuiz();else if(modal.type==='reward'&&['Space','Enter','KeyE'].includes(e.code)){const m=modal;modal=null;m.done?.();}else if(modal.type==='portal'&&e.code==='Enter')enterPortal();else if(e.code==='Escape'&&['menu','journal','quiz','portal','lesson','testReport'].includes(modal.type)){if(modal.type==='quiz')closeQuiz();else modal=null;}return;}if(mode==='title'&&e.code==='Enter'){start(!saved);return;}if(mode==='create'&&e.code==='Enter'){confirmCharacter();return;}if(mode==='intro'&&['Space','Enter','ArrowRight'].includes(e.code)){nextScene();return;}if(mode!=='play')return;keys.add(e.code);if(['Space','ArrowUp','KeyW'].includes(e.code))jump();if(e.code==='KeyZ')triggerPrimary();if(e.code==='KeyX')attack(true);if(e.code==='KeyE'||e.code==='Enter')interact();if(e.code==='KeyQ')openQuiz();if(e.code==='Escape'){modal={type:'menu'};clearInput();}});
addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',clearInput);
document.querySelector('#a-left').onpointerdown=()=>keys.add('ArrowLeft');document.querySelector('#a-left').onpointerup=()=>keys.delete('ArrowLeft');document.querySelector('#a-right').onpointerdown=()=>keys.add('ArrowRight');document.querySelector('#a-right').onpointerup=()=>keys.delete('ArrowRight');document.querySelector('#a-jump').onclick=jump;document.querySelector('#a-attack').onclick=triggerPrimary;document.querySelector('#a-interact').onclick=interact;document.querySelector('#a-charge').onclick=()=>openQuiz();

async function load(){const fontReady=document.fonts?Promise.all([
 document.fonts.load('700 28px "NEXON Lv1 Gothic"','가나다 ABC 123'),
 document.fonts.load('400 28px "NEXON Lv2 Gothic"','가나다 ABC 123'),
 document.fonts.load('700 28px "NEXON Lv2 Gothic"','가나다 ABC 123')
]).catch(error=>console.warn('Using fallback fonts:',error)):Promise.resolve();const files={ui:'ui.png',bg:'village-bg.png',map:'world-map.png',sprites:'sprites.png',controls:'controls.png',frames:'frames.png',actions:'actions.png',ribbon:'ribbon.png',adventurers:'adventurers-portals.png',arena:'portal-forest.png',heads:'character-heads.png',headsBlack:'character-heads-black.png',headsGold:'character-heads-gold.png',headsBlue:'character-heads-blue.png',bodies:'character-bodies-collar.png',ruined:'ruined-map.png',cloth:'cloth-actions.png'};let n=0;await Promise.all(Object.entries(files).map(([key,file])=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{images[key]=img;document.querySelector('#load-progress').value=++n/Object.keys(files).length*100;resolve();};img.onerror=()=>reject(new Error(file));img.src=`assets/${file}`;})));await fontReady;buildAtlas(images.ribbon,1,1,['ribbon']);buildAtlas(images.sprites,4,4,names);buildAtlas(images.adventurers,2,3,['unused-0','unused-1','unused-2','unused-3','portal','returnPortal'],{portal:[0,790,627,464],returnPortal:[627,790,627,464]});
 for(const [color,key] of ['heads','headsBlack','headsGold','headsBlue'].entries())buildAtlas(images[key],4,4,Array.from({length:16},(_,i)=>`head-${color}-${i}`));buildAtlas(images.bodies,4,1,['body-hero','body-walkA','body-walkB','body-attack'],{'body-walkB':[1086,0,500,724],'body-attack':[1586,0,586,724]});attachCharacterAnchors();atlases.recycleBadge={img:images.ui,x:932,y:565,w:55,h:49};buildAtlas(images.cloth,3,1,['clothShade','clothClosed','clothLayers']);buildAtlas(images.controls,3,2,controlNames);buildAtlas(images.actions,3,2,['shadeAction','drinkAction','helpAction','runAction','refuseAction','endureAction']);resize();document.querySelector('#loading').remove();mode='title';requestAnimationFrame(frame);}
load().catch(e=>{document.querySelector('#loading span').textContent='그림을 불러오지 못했어요. 새로고침해 주세요.';console.error('Asset load failed:',e);});
