import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createCanvas,Image,GlobalFonts} from '@napi-rs/canvas';
import * as CORE from '../core.js';

const root=fileURLToPath(new URL('..',import.meta.url));
GlobalFonts.registerFromPath(root+'/assets/fonts/nexon-lv1-bold.woff','NEXON Lv1 Gothic');
GlobalFonts.registerFromPath(root+'/assets/fonts/nexon-lv2-regular.woff','NEXON Lv2 Gothic');
GlobalFonts.registerFromPath(root+'/assets/fonts/nexon-lv2-bold.woff','NEXON Lv2 Gothic');

async function engine(){
 const realCanvas=createCanvas(1280,720),events={},canvasEvents={},storage=new Map(),nodes={};
 const canvas={getContext:()=>realCanvas.getContext('2d'),getBoundingClientRect:()=>({left:0,top:0,width:box.width,height:box.height}),addEventListener:(n,f)=>canvasEvents[n]=f,focus(){},setPointerCapture(){},get width(){return realCanvas.width},set width(v){realCanvas.width=v},get height(){return realCanvas.height},set height(v){realCanvas.height=v}};
 const box={width:1280,height:720};nodes['#game']=canvas;
 const document={hidden:false,querySelector:n=>nodes[n]??=( {textContent:'',value:0,remove(){},addEventListener(){}}),addEventListener:(n,f)=>events[n]=f,createElement:()=>createCanvas(1,1)};
 class LocalImage extends Image{set src(value){super.src=readFileSync(root+'/'+value);}get src(){return super.src;}}
 const context={CORE,console,document,innerWidth:1280,innerHeight:720,devicePixelRatio:1,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},Image:LocalImage,requestAnimationFrame:f=>context.nextFrame=f,addEventListener:(n,f)=>events[n]=f,setTimeout,clearTimeout};context.window=context;vm.createContext(context);
 let src=readFileSync(root+'/game.js','utf8').replace(/^import .*?;\n/,'const {Adventure, QUESTS, QUESTIONS, clamp}=CORE;\n');
 src+='\nglobalThis.qa={get s(){return s},get player(){return player},get mode(){return mode},get modal(){return modal},get enemies(){return enemies},get hits(){return hits},get stick(){return stick},get cam(){return cam},get pickups(){return pickups},get toast(){return toast},typed,typingDone,syncCamera,get W(){return W},get H(){return H},start,finishIntro,nextDialog,interact,attack,jump,openQuiz,answerQuiz,closeQuiz,chooseGraph,choosePlan,render,resize,update,save};';
 vm.runInContext(src,context,{filename:'game.js'});
 for(let i=0;i<100&&context.qa.mode==='loading';i++)await new Promise(r=>setTimeout(r,10));
 assert.equal(context.qa.mode,'title','all generated image assets load and atlas slices compile');
 const q=context.qa;
 function tick(seconds=.04){let remain=seconds;while(remain>0){q.update(Math.min(.04,remain));remain-=.04;}q.render();}
 function key(code,hold=.04){events.keydown({code,repeat:false,preventDefault(){}});tick(hold);events.keyup({code});}
 function pointer(n,id,x,y){canvasEvents[n]({pointerId:id,clientX:x,clientY:y,preventDefault(){}});}
 function snapshot(name,w=1280,h=720){box.width=w;box.height=h;context.innerWidth=w;context.innerHeight=h;q.resize();q.render();mkdirSync(root+'/qa',{recursive:true});writeFileSync(root+'/qa/'+name+'.png',realCanvas.toBuffer('image/png'));}
 function closeDialog(){while(q.modal?.type==='dialog')q.nextDialog();}
 function closeReward(){assert.equal(q.modal?.type,'reward');const done=q.modal.done;vm.runInContext('modal=null',context);done?.();q.render();}
 return {q,tick,key,pointer,snapshot,closeDialog,closeReward,context,box,realCanvas,events,storage};
}

test('생성 이미지 렌더링·키보드·조이패드·퀘스트 5개와 엔딩까지 실행한다',async()=>{
 const e=await engine(),{q,tick,key,pointer,snapshot,closeDialog,closeReward}=e;
 snapshot('01-title-tablet',1024,768);snapshot('01-title-phone',932,430);snapshot('01-title',1280,720);q.start(true);assert.equal(q.mode,'intro');q.render();snapshot('02-intro');q.finishIntro();q.render();snapshot('03-village-desktop');snapshot('04-village-tablet',1024,768);snapshot('05-village-phone',932,430);snapshot('06-village-desktop',1280,720);
 const old=q.player.x;key('ArrowRight',.25);assert.ok(q.player.x>old+45);key('ArrowLeft',.25);assert.ok(Math.abs(q.player.x-old)<5);
 pointer('pointerdown',1,155,616);tick(.25);assert.ok(q.player.x>old+40);pointer('pointerup',1,155,616);assert.equal(q.stick.x,0);
 const beforeTouch=q.player.x,beforeEnergy=q.s.energy;pointer('pointerdown',2,155,616);pointer('pointerdown',3,1180,616);tick(.5);assert.ok(q.player.x>beforeTouch+80,'two touch contacts support moving and attacking together');assert.ok(q.s.energy<beforeEnergy,'touch attack consumes energy');pointer('pointerup',2,155,616);pointer('pointerup',3,1180,616);
 q.player.x=320;q.interact();closeDialog();assert.ok(q.s.accepted);
 for(const x of [570,810,1000]){q.player.x=x;q.interact();closeDialog();}
 assert.equal(q.s.quest,1);closeReward();q.player.x=1110;q.interact();closeDialog();
 for(const enemy of q.enemies.filter(e=>e.type==='dust')){q.player.x=enemy.x-75;q.player.y=568;q.player.dir=1;while(enemy.hp>0){q.attack();tick(.34);}}
 assert.equal(q.s.killed.filter(id=>id.startsWith('dust')).length,4);
 q.openQuiz();assert.equal(q.modal.type,'quiz');const px=q.player.x,en=q.enemies.find(e=>e.type==='thorn'),ex=en.x;tick(2);assert.equal(q.player.x,px);assert.equal(en.x,ex,'enemy motion pauses while reading');
 const m=q.modal;const wrong=m.order.findIndex(i=>i!==m.question.correct),right=m.order.findIndex(i=>i===m.question.correct),oldEnergy=q.s.energy;q.answerQuiz(wrong);assert.equal(q.s.energy,oldEnergy);q.answerQuiz(right);assert.equal(q.s.energy,Math.min(oldEnergy+40,100));snapshot('07-energy-question');q.closeQuiz();
 for(const x of [2070,2280]){q.player.x=x;q.interact();}q.player.x=2410;q.interact();closeDialog();assert.equal(q.s.quest,2);closeReward();
 q.interact();closeDialog();assert.ok(q.s.accepted);
 for(const enemy of q.enemies.filter(e=>e.type==='thorn')){q.player.x=enemy.x-90;q.player.y=568;q.player.dir=1;while(enemy.hp>0){if(q.s.energy<5){q.openQuiz();const m=q.modal;q.answerQuiz(m.order.findIndex(i=>i===m.question.correct));q.closeQuiz();}q.attack();tick(.34);}}
 for(const x of [2580,2850,3230]){q.player.x=x;q.interact();closeDialog();}
 assert.equal(q.s.quest,3);closeReward();q.player.x=3440;q.interact();closeDialog();
 q.player.x=3780;q.player.y=568;q.player.onGround=true;q.jump();tick(.8);assert.equal(q.player.y,478,'jump can land on the first record platform');
 for(const [x,y] of [[3570,568],[3780,478],[4070,408]]){q.player.x=x;q.player.y=y;q.interact();}
 assert.equal(q.modal.type,'graph');snapshot('08-observation-record');q.chooseGraph(0);assert.ok(q.modal.feedback);q.chooseGraph(1);closeDialog();assert.equal(q.s.quest,4);closeReward();closeDialog();
 q.player.x=4270;q.player.y=568;q.interact();closeDialog();assert.ok(q.s.accepted);
 const boss=q.enemies.find(e=>e.type==='boss');q.player.x=boss.x-110;q.player.dir=1;q.player.y=568;tick(.05);snapshot('09-boss');
 while(boss.hp>0){if(q.s.energy<20){q.openQuiz();const m=q.modal;q.answerQuiz(m.order.findIndex(i=>i===m.question.correct));q.closeQuiz();}q.attack(true);tick(.84);}
 assert.ok(q.s.bossDead);q.player.x=4850;q.player.y=568;q.interact();assert.equal(q.modal.type,'plans');snapshot('10-village-actions');q.choosePlan(q.modal.order.findIndex(i=>i>=3));assert.ok(q.modal.wrong);const correct=q.modal.order.map((v,i)=>v<3?i:-1).filter(i=>i>=0);for(const i of correct)q.choosePlan(i);assert.ok(q.s.finished);closeReward();assert.equal(q.mode,'ending');snapshot('11-first-village-ending');q.save();
 assert.deepEqual(Array.from(q.s.completed),[0,1,2,3,4]);
});


test('대사 바로 표시·카메라 정지·획득 연출과 퀘스트 여백을 확인한다',async()=>{
 const e=await engine(),{q,tick,key,snapshot,closeDialog}=e;
 q.start(true);q.finishIntro();q.player.x=320;q.interact();
 assert.equal(q.modal.elapsed,0);assert.equal(q.typed(q.modal.lines[0],q.modal.elapsed),'');
 tick(.12);assert.ok(q.typed(q.modal.lines[0],q.modal.elapsed).length>0);assert.ok(!q.typingDone(q.modal.lines[0],q.modal.elapsed));
 q.nextDialog();assert.equal(q.modal.index,0,'first tap reveals the current line');assert.ok(q.typingDone(q.modal.lines[0],q.modal.elapsed));
 snapshot('12-dialog-revealed');q.nextDialog();assert.equal(q.modal.index,1);assert.equal(q.modal.elapsed,0);closeDialog();
 q.player.x=900;q.syncCamera();const worldLandmark=1000-q.cam,beforeX=q.player.x;
 key('ArrowRight',.5);assert.ok(Math.abs((q.player.x-beforeX)-95)<.01,'movement is slower');
 assert.ok(Math.abs((worldLandmark-(1000-q.cam))-(q.player.x-beforeX))<.01,'camera uses exactly the world displacement');
 const stopped=q.cam;tick(.8);assert.equal(q.cam,stopped,'camera does not drift after input stops');
 q.s.quest=2;q.s.accepted=true;q.s.supplies=['water'];q.s.killed=['thorn-0','thorn-1'];q.player.x=2850;q.player.y=568;q.syncCamera();q.interact();
 assert.equal(q.pickups.length,1);assert.equal(q.s.supplies.length,2);assert.equal(q.pickups[0].elapsed,0);
 tick(.25);assert.ok(q.pickups[0].elapsed>0);snapshot('13-pickup-and-tracker');
 snapshot('14-tracker-tablet',1024,768);snapshot('15-tracker-phone',932,430);
 for(let i=0;i<5;i++){q.s.quest=i;snapshot(`16-tracker-quest-${i}`,932,430);}
 tick(1.3);assert.equal(q.pickups.length,0,'pickup image effect expires');
 assert.ok(!q.hits.some(h=>/듣기|읽기/.test(h.label)),'no voice-reading buttons');
});
