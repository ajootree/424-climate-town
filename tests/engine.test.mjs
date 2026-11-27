import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
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
 const document={hidden:false,querySelector:n=>nodes[n]??=( {textContent:'',value:'',hidden:true,style:{},blur(){},remove(){},addEventListener(){}}),addEventListener:(n,f)=>events[n]=f,createElement:()=>createCanvas(1,1)};
 class LocalImage extends Image{set src(value){super.src=readFileSync(root+'/'+value);}get src(){return super.src;}}
 const context={CORE,console,document,innerWidth:1280,innerHeight:720,devicePixelRatio:1,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},Image:LocalImage,requestAnimationFrame:f=>context.nextFrame=f,addEventListener:(n,f)=>events[n]=f,setTimeout,clearTimeout};context.window=context;vm.createContext(context);
 let src=readFileSync(root+'/game.js','utf8').replace(/^import .*?;\n/,'const {Adventure, QUESTS, QUESTIONS, HAIRSTYLES, HAIR_COLORS, LESSONS, FINAL_TEST, REVIEW_TEST, ENERGY, clamp}=CORE;\n');
 src+='\nglobalThis.qa={get s(){return s},get player(){return player},get mode(){return mode},get modal(){return modal},get enemies(){return enemies},get hits(){return hits},get stick(){return stick},get encounter(){return encounter},get bossMagic(){return bossMagic},panoramaInfo,drawBackground,get backgrounds(){return {sun:images.bg,cold:images.winterBg,forest:images.arena,ice:images.winterArena}},objects,playerPose,questThoughtLines,nextTask,openQuestHelp,npcQuestReady,requestNumber,requestTotal,sprite,spriteRect,get characterAtlas(){return atlases},get walkDistance(){return walkDistance},skillUnlocked,content,thoughtTarget,openThought,openRoad,enterNextVillage,BOSS,expressionFor,react,hurt,pickup,activeEnemies,portalForQuest,openPortal,enterPortal,leaveArena,primaryTarget,triggerPrimary,closeMenu,chooseStyle,confirmCharacter,drawCharacter,drawHead,nextScene,introText,get intro(){return intro},get scene(){return scene},get sceneTime(){return sceneTime},get cam(){return cam},get pickups(){return pickups},get toast(){return toast},typed,typingDone,syncCamera,get W(){return W},get H(){return H},start,finishIntro,nextDialog,interact,attack,jump,openQuiz,answerQuiz,nextQuiz,closeQuiz,choosePlan,continueLesson,startPractice,answerLearning,nextLearning,openFinal,openReview,showTestReport,render,resize,update,save};';
 vm.runInContext(src,context,{filename:'game.js'});
 for(let i=0;i<100&&context.qa.mode==='loading';i++)await new Promise(r=>setTimeout(r,10));
 assert.equal(context.qa.mode,'title','all generated image assets load and atlas slices compile');
 const q=context.qa;
 function tick(seconds=.04){let remain=seconds;while(remain>0){q.update(Math.min(.04,remain));remain-=.04;}q.render();}
 function key(code,hold=.04){events.keydown({code,repeat:false,preventDefault(){}});tick(hold);events.keyup({code});}
 function pointer(n,id,x,y){canvasEvents[n]({pointerId:id,clientX:x,clientY:y,preventDefault(){}});}
 function snapshot(name,w=1280,h=720){box.width=w;box.height=h;context.innerWidth=w;context.innerHeight=h;q.resize();q.render();mkdirSync(root+'/qa',{recursive:true});writeFileSync(root+'/qa/'+name+'.png',realCanvas.toBuffer('image/png'));}
 function createProfile(name='별이',hair=3,color=0){q.chooseStyle('hair',hair);q.chooseStyle('color',color);nodes['#player-name'].value=name;q.confirmCharacter();}
 function closeDialog(){while(q.modal?.type==='dialog')q.nextDialog();}
 function finishLearning(){for(let n=0;n<100;n++){const m=q.modal;if(!m)return;if(m.type==='lesson')q.continueLesson();else if(['practice','test','review'].includes(m.type)){q.answerLearning(m.order.findIndex(i=>i===m.question.correct));q.nextLearning();}else if(m.type==='testReport'){q.render();const h=q.hits.find(h=>h.label==='수호석 받기'||h.label==='마을로 돌아가기');if(!h)return;h.fn();}else return;}throw new Error('learning did not finish');}
 function closeReward(){assert.equal(q.modal?.type,'reward');const done=q.modal.done;vm.runInContext('modal=null',context);done?.();q.render();}
 function acceptFollowUp(){q.player.x=[320,1110,2410,3440,4270][q.s.quest];q.player.y=568;q.interact();closeDialog();finishLearning();assert.equal(q.s.taskPhases[q.s.quest],2);}
 return {acceptFollowUp,q,tick,key,pointer,snapshot,createProfile,closeDialog,closeReward,finishLearning,context,box,realCanvas,events,storage,nodes};
}

test('생성 이미지 렌더링·키보드·조이패드·퀘스트 5개와 엔딩까지 실행한다',async()=>{
 const e=await engine(),{q,tick,key,pointer,snapshot,createProfile,closeDialog,closeReward,finishLearning}=e;
 snapshot('01-title-tablet',1024,768);snapshot('01-title-phone',932,430);snapshot('01-title',1280,720);q.start(true);assert.equal(q.mode,'create');snapshot('22-create-tablet',1024,768);snapshot('23-create-phone',932,430);snapshot('24-create-desktop',1280,720);createProfile();assert.equal(q.s.hair,3);assert.equal(q.s.playerName,'별이');assert.equal(q.mode,'intro');q.render();snapshot('02-intro');q.finishIntro();q.render();snapshot('03-village-desktop');snapshot('04-village-tablet',1024,768);snapshot('05-village-phone',932,430);snapshot('06-village-desktop',1280,720);
 const old=q.player.x;key('ArrowRight',.25);assert.ok(q.player.x>old+45);key('ArrowLeft',.25);assert.ok(Math.abs(q.player.x-old)<5);
 pointer('pointerdown',1,155,616);tick(.25);assert.ok(q.player.x>old+40);pointer('pointerup',1,155,616);assert.equal(q.stick.x,0);
 q.player.x=700;q.render();const beforeTouch=q.player.x,beforeEnergy=q.s.energy;pointer('pointerdown',2,155,616);pointer('pointerdown',3,1180,616);tick(.5);assert.ok(q.player.x>beforeTouch+80,'two touch contacts support moving and attacking together');assert.ok(q.s.energy<beforeEnergy,'touch attack consumes energy');pointer('pointerup',2,155,616);pointer('pointerup',3,1180,616);
 q.player.x=320;q.interact();closeDialog();assert.ok(q.s.accepted);
 for(const x of [570,810,1000]){q.player.x=x;q.interact();closeDialog();}
 finishLearning();assert.equal(q.s.quest,1);closeReward();q.player.x=1110;q.interact();closeDialog();finishLearning();
 assert.equal(q.activeEnemies().length,0,'village has no active monsters');q.player.x=1265;q.interact();assert.equal(q.modal.type,'portal');snapshot('25-portal-preparation');q.enterPortal();assert.ok(q.encounter);snapshot('26-portal-arena');
 for(const enemy of q.enemies.filter(e=>e.type==='dust')){q.player.x=enemy.x-75;q.player.y=568;q.player.dir=1;while(enemy.hp>0){q.attack();tick(.34);}}
 assert.equal(q.s.killed.filter(id=>id.startsWith('dust')).length,4);
 q.openQuiz();assert.equal(q.modal.type,'quiz');const px=q.player.x,en=q.enemies.find(e=>e.type==='thorn'),ex=en.x;tick(2);assert.equal(q.player.x,px);assert.equal(en.x,ex,'enemy motion pauses while reading');
 const m=q.modal;const wrong=m.order.findIndex(i=>i!==m.question.correct),right=m.order.findIndex(i=>i===m.question.correct),oldEnergy=q.s.energy;q.answerQuiz(wrong);assert.equal(q.s.energy,oldEnergy);q.answerQuiz(right);assert.equal(q.s.energy,Math.min(oldEnergy+20,100));snapshot('07-energy-question');q.closeQuiz();
 assert.ok(q.encounter.cleared);q.leaveArena();assert.equal(q.encounter,null);assert.equal(q.activeEnemies().length,0);e.acceptFollowUp();for(const x of [2070,2280]){q.player.x=x;q.interact();finishLearning();}q.player.x=1110;q.interact();closeDialog();assert.equal(q.s.quest,2);closeReward();
 q.player.x=2410;q.interact();closeDialog();assert.ok(q.s.accepted);q.player.x=2565;q.interact();q.enterPortal();
 for(const enemy of q.enemies.filter(e=>e.type==='thorn')){q.player.x=enemy.x-90;q.player.y=568;q.player.dir=1;while(enemy.hp>0){if(q.s.energy<CORE.ENERGY.attack){q.openQuiz();const m=q.modal;q.answerQuiz(m.order.findIndex(i=>i===m.question.correct));q.closeQuiz();}q.attack();tick(.34);}}
 q.leaveArena();e.acceptFollowUp();for(const x of [2580,2850,3230]){q.player.x=x;q.interact();finishLearning();}q.player.x=2410;q.interact();closeDialog();
 assert.equal(q.s.quest,3);closeReward();q.player.x=3440;q.interact();closeDialog();
 q.player.x=3780;q.player.y=568;q.player.onGround=true;q.jump();tick(.8);assert.equal(q.player.y,478,'jump can land on the first record platform');
 for(const [x,y] of [[3570,568],[3780,478],[4070,408]]){q.player.x=x;q.player.y=y;q.interact();}
 assert.equal(q.modal.type,'lesson');q.continueLesson();q.answerLearning(q.modal.order.findIndex(i=>i===q.modal.question.correct));q.nextLearning();assert.ok(q.modal.question.diagram);snapshot('08-observation-record');const wrongRecord=q.modal.order.findIndex(i=>i!==q.modal.question.correct);q.answerLearning(wrongRecord);assert.ok(q.modal.feedback);finishLearning();assert.equal(q.s.quest,4);closeReward();closeDialog();
 q.player.x=4270;q.player.y=568;q.interact();closeDialog();assert.ok(q.s.accepted);
 q.player.x=4425;q.interact();assert.equal(q.modal.type,'portal');q.enterPortal();const boss=q.enemies.find(e=>e.type==='boss');q.player.x=boss.x-110;q.player.dir=1;q.player.y=568;tick(.05);snapshot('09-boss');
 while(boss.hp>0){if(q.s.energy<CORE.ENERGY.skill){q.openQuiz();const m=q.modal;q.answerQuiz(m.order.findIndex(i=>i===m.question.correct));q.closeQuiz();}q.attack(true);tick(.84);}
 assert.ok(q.s.bossDead);q.leaveArena();e.acceptFollowUp();q.player.x=4425;q.player.y=568;q.interact();assert.equal(q.modal.type,'plans');snapshot('10-village-actions');q.choosePlan(q.modal.order.findIndex(i=>i>=3));assert.ok(q.modal.wrong);const correct=q.modal.order.map((v,i)=>v<3?i:-1).filter(i=>i>=0);for(const i of correct)q.choosePlan(i);finishLearning();assert.ok(q.s.finished);assert.equal(q.s.practiceDone.length,16);assert.equal(q.s.testAnswers.length,5);closeReward();assert.equal(q.mode,'play');assert.ok(q.thoughtTarget());snapshot('11-first-village-stone-thought');q.save();
 assert.deepEqual(Array.from(q.s.completed),[0,1,2,3,4]);
});


test('대사 바로 표시·카메라 정지·획득 연출과 퀘스트 여백을 확인한다',async()=>{
 const e=await engine(),{q,tick,key,snapshot,createProfile,closeDialog,finishLearning}=e;
 q.start(true);createProfile('도담',0,0);q.finishIntro();q.player.x=320;q.interact();
 assert.equal(q.modal.elapsed,0);assert.equal(q.typed(q.modal.lines[0],q.modal.elapsed),'');
 tick(.12);assert.ok(q.typed(q.modal.lines[0],q.modal.elapsed).length>0);assert.ok(!q.typingDone(q.modal.lines[0],q.modal.elapsed));
 q.nextDialog();assert.equal(q.modal.index,0,'first tap reveals the current line');assert.ok(q.typingDone(q.modal.lines[0],q.modal.elapsed));
 snapshot('12-dialog-revealed');q.nextDialog();assert.equal(q.modal.index,1);assert.equal(q.modal.elapsed,0);closeDialog();
 q.player.x=900;q.syncCamera();const worldLandmark=1000-q.cam,beforeX=q.player.x;
 key('ArrowRight',.5);assert.ok(Math.abs((q.player.x-beforeX)-95)<.01,'movement is slower');
 assert.ok(Math.abs((worldLandmark-(1000-q.cam))-(q.player.x-beforeX))<.01,'camera uses exactly the world displacement');
 const stopped=q.cam;tick(.8);assert.equal(q.cam,stopped,'camera does not drift after input stops');
 q.s.quest=2;q.s.accepted=true;q.s.learned=2;q.s.supplies=['water'];q.s.killed=['thorn-0','thorn-1','thorn-2'];q.s.taskPhases[2]=2;q.player.x=2850;q.player.y=568;q.syncCamera();q.interact();finishLearning();
 assert.equal(q.pickups.length,1);assert.equal(q.s.supplies.length,2);assert.equal(q.pickups[0].elapsed,0);
 tick(.25);assert.ok(q.pickups[0].elapsed>0);snapshot('13-pickup-and-tracker');
 snapshot('14-tracker-tablet',1024,768);snapshot('15-tracker-phone',932,430);
 for(let i=0;i<5;i++){q.s.quest=i;snapshot(`16-tracker-quest-${i}`,932,430);}
 tick(1.3);assert.equal(q.pickups.length,0,'pickup image effect expires');
 assert.ok(!q.hits.some(h=>/듣기|읽기/.test(h.label)),'no voice-reading buttons');
});


test('기존 저장을 보존해 캐릭터를 만들고 포탈에서 준비·퇴각·재입장한다',async()=>{
 const e=await engine(),{q,tick,createProfile,closeDialog,context,nodes,snapshot,finishLearning}=e;
 q.start(true);q.confirmCharacter();assert.equal(q.mode,'create','empty name cannot enter the story');
 createProfile('  새봄  ',3,0);assert.equal(q.s.playerName,'새봄');q.finishIntro();
 q.s.quest=1;q.s.accepted=true;q.s.learned=1;q.startPractice(1,[0]);finishLearning();q.player.x=1265;q.s.hp=2;q.s.energy=0;q.syncCamera();q.interact();assert.equal(q.modal.type,'portal');
 q.enterPortal();assert.equal(q.encounter,null,'empty energy keeps the player in preparation');
 assert.equal(q.s.hp,6,'portal preparation rests automatically');q.render();assert.ok(!q.hits.some(h=>h.label==='잠깐 쉬기'||h.label==='문제로 기력 채우기'));q.hits.find(h=>h.label==='마을에서 더 준비하기').fn();q.openQuiz();assert.equal(q.modal.type,'quiz');
 q.answerQuiz(q.modal.order.findIndex(i=>i===q.modal.question.correct));q.closeQuiz();assert.equal(q.modal,null);assert.equal(q.s.energy,20);q.interact();assert.equal(q.modal.type,'portal');
 q.enterPortal();assert.ok(q.encounter);assert.equal(q.activeEnemies().length,4);assert.equal(q.s.x,1265,'saving in an arena remembers the village entrance');
 const foe=q.activeEnemies()[0];q.player.x=foe.x-75;q.player.dir=1;q.attack();tick(.34);q.attack();tick(.34);assert.equal(foe.hp,0);
 q.leaveArena();assert.equal(q.player.x,1265);assert.equal(q.activeEnemies().length,0);assert.equal(q.s.killed.length,1);
 q.openQuiz();q.answerQuiz(q.modal.order.findIndex(i=>i===q.modal.question.correct));q.closeQuiz();q.interact();q.enterPortal();assert.equal(q.activeEnemies().filter(e=>e.hp>0).length,3,'retreat preserves defeated monsters');
 snapshot('27-female-arena-phone',932,430);q.leaveArena();q.save();
 const restored=new CORE.Adventure(JSON.parse(e.storage.get('five-villages-sun-v1')));assert.equal(restored.s.playerName,'새봄');assert.equal(restored.s.hair,3);assert.equal(restored.s.x,1265);assert.equal(restored.s.killed.length,1);
 const old=new CORE.Adventure({version:1,quest:3,accepted:true,introSeen:true,x:3600,records:['record-0']});assert.equal(old.s.profileReady,false);assert.equal(old.s.quest,3);assert.deepEqual(old.s.records,['record-0']);
 // Old checkpoints resume with the same appearance and progress; no character picker.
 vm.runInContext('localStorage.setItem(SAVE_KEY,JSON.stringify({version:1,quest:3,accepted:true,introSeen:true,x:3600,records:["record-0"]}));',context);
 q.start(false);assert.equal(q.mode,'play');assert.equal(q.s.playerName,'수호대원');assert.equal(q.mode,'play');assert.equal(q.s.quest,3);assert.equal(q.player.x,3600);assert.equal(q.s.records.length,1);
});


test('시작창의 헤어 4개와 머리색 4개가 16가지 다른 실제 캐릭터를 만든다',async()=>{
 const e=await engine(),{q,snapshot,realCanvas,createProfile}=e;q.start(true);q.render();
 assert.equal(q.hits.filter(h=>h.label.startsWith('헤어스타일:')).length,4);assert.equal(q.hits.filter(h=>h.label.startsWith('머리색:')).length,4);assert.ok(!q.hits.some(h=>/여성형|남성형/.test(h.label)));
 q.hits.find(h=>h.label==='헤어스타일: 일자 단발').fn();q.render();q.hits.find(h=>h.label==='머리색: 금색').fn();assert.equal(q.s.hair,1);assert.equal(q.s.color,2);
 snapshot('33-custom-create-tablet',1024,768);snapshot('34-custom-create-phone',932,430);snapshot('35-custom-create-desktop',1280,720);
 const ctx=realCanvas.getContext('2d');ctx.fillStyle='#e7d7b7';ctx.fillRect(0,0,1280,720);const hashes=new Set();
 for(let hair=0;hair<4;hair++)for(let color=0;color<4;color++){const x=color*320,y=hair*180;q.drawCharacter('hero',x+160,y+165,155,false,1,hair,color);hashes.add(createHash('sha256').update(ctx.getImageData(x,y,320,180).data).digest('hex'));}
 assert.equal(hashes.size,16,'actual generated sprite pixels differ for every hair/color pair');writeFileSync(root+'/qa/36-custom-sixteen.png',realCanvas.toBuffer('image/png'));
 ctx.fillStyle='#e7d7b7';ctx.fillRect(0,0,1280,720);for(let hair=0;hair<4;hair++)for(const [col,pose] of ['hero','walkA','walkB','attack'].entries())q.drawCharacter(pose,col*320+145,hair*180+165,155,false,1,hair,hair,col);writeFileSync(root+'/qa/37-custom-poses.png',realCanvas.toBuffer('image/png'));
 createProfile('별빛',1,2);q.finishIntro();q.save();const restored=new CORE.Adventure(JSON.parse(e.storage.get('five-villages-sun-v1')));assert.equal(restored.s.hair,1);assert.equal(restored.s.color,2);assert.equal(restored.s.playerName,'별빛');assert.equal(restored.s.appearanceReady,true);
});

test('저주 뒤 암전과 황폐한 삽화를 보여주고 재해 이름을 도입에서 미리 말하지 않는다',async()=>{
 const e=await engine(),{q,tick,createProfile,snapshot,realCanvas}=e;q.start(true);createProfile();
 assert.ok(q.intro.every(s=>!/(폭염|한파|가뭄|홍수|폭설)/.test(s.text||'')));
 const curse=q.intro.findIndex(s=>(s.text||'').includes('저주가 퍼졌어요'));
 while(q.scene<curse){q.nextScene();if(q.scene<curse&&!q.typingDone(q.introText(),q.sceneTime))q.nextScene();}
 assert.equal(q.scene,curse);tick(2);snapshot('38-intro-curse');q.nextScene();assert.ok(q.intro[q.scene].blackout);tick(.82);const blackScene=q.scene;snapshot('39-intro-blackout');
 const ctx=realCanvas.getContext('2d');for(const [x,y] of [[20,20],[640,360],[1250,690]])assert.deepEqual(Array.from(ctx.getImageData(x,y,1,1).data),[0,0,0,255]);
 q.nextScene();assert.equal(q.scene,blackScene,'taps do not skip the brief blackout');tick(.5);assert.ok(q.intro[q.scene].ruined);tick(1);snapshot('40-intro-ruins');
 assert.equal(q.introText(),'다음 날, 마을의 모습이 달라졌어요.');const pixel=Array.from(ctx.getImageData(640,300,1,1).data);assert.ok(pixel[0]+pixel[1]+pixel[2]>0,'the new ruined illustration fades into view');
});


test('물품 쓰임 선택을 해야 설치되고, 오답은 첫 기록에 남는다',async()=>{
 const e=await engine(),{q,createProfile,finishLearning,snapshot,tick}=e;q.start(true);createProfile();q.finishIntro();q.s.quest=2;q.s.learned=2;q.s.accepted=true;q.s.killed=['thorn-0','thorn-1','thorn-2'];q.s.taskPhases[2]=2;q.player.x=2580;q.interact();assert.equal(q.modal.type,'lesson');assert.equal(q.s.supplies.length,0);snapshot('45-lesson-shelter');q.continueLesson();assert.equal(q.modal.question.id,'shelter-water');const wrong=q.modal.order.findIndex(i=>i!==q.modal.question.correct);q.answerLearning(wrong);assert.equal(q.modal.answered,false);assert.equal(q.s.supplies.length,0);tick(.6);snapshot('46-shelter-choice-phone',932,430);q.nextLearning();assert.equal(q.s.supplies.length,0);finishLearning();assert.deepEqual(Array.from(q.s.supplies),['water']);assert.ok(q.s.practiceFirst.includes('shelter-water:0'));assert.ok(q.s.practiceDone.includes('shelter-water'));
});
test('최종 확인은 첫 답을 보존하며 다른 문항의 재확인 뒤에만 수호석을 준다',async()=>{
 const e=await engine(),{q,createProfile,finishLearning,tick,snapshot}=e;q.start(true);createProfile();q.finishIntro();Object.assign(q.s,{quest:4,learned:4,accepted:true,bossDead:true,plans:['shade','water','help']});q.startPractice(4);finishLearning();q.openFinal(()=>{q.s.finished=true;});
 for(let i=0;i<5;i++){const m=q.modal;assert.equal(m.type,'test');const pick=m.order.findIndex(a=>i===2?a!==m.question.correct:a===m.question.correct);q.answerLearning(pick);const recorded=q.s.testAnswers[i];q.answerLearning(m.order.findIndex(a=>a===m.question.correct));assert.equal(q.s.testAnswers[i],recorded);if(i===3){tick(1);snapshot('47-final-data-question');}q.nextLearning();}
 assert.equal(q.modal.type,'testReport');assert.equal(q.s.finished,false);snapshot('48-test-report-tablet',1024,768);snapshot('49-test-report-phone',932,430);q.openReview(q.modal.done);assert.equal(q.modal.question.id,'review-health');const m=q.modal;q.answerLearning(m.order.findIndex(i=>i!==m.question.correct));assert.equal(q.s.finished,false);assert.equal(q.s.testReviewed.length,0);finishLearning();assert.equal(q.s.finished,true);assert.equal(q.s.testReviewed.length,1);assert.equal(q.s.testAnswers.filter((a,i)=>a===CORE.FINAL_TEST[i].correct).length,4,'review does not inflate first score');
});


test('오른쪽 아래 기본 버튼이 대화·공격으로 바뀌고 메뉴 X는 터치로 닫힌다',async()=>{
 const e=await engine(),{q,createProfile,closeDialog,key,pointer,snapshot,box}=e;q.start(true);createProfile('이름여덟글자테스트');q.finishIntro();q.player.x=320;q.render();
 let h=q.hits.find(h=>h.label==='대화'&&h.x>q.W-180);assert.ok(h);assert.ok(!q.hits.some(h=>h.label==='대화'&&Math.abs(h.x+h.w/2-q.W/2)<80));const energy=q.s.energy;pointer('pointerdown',40,h.x+h.w/2,h.y+h.h/2);pointer('pointerup',40,h.x+h.w/2,h.y+h.h/2);assert.equal(q.modal.type,'dialog');assert.equal(q.s.energy,energy);closeDialog();
 q.player.x=700;q.s.accepted=false;q.render();assert.ok(q.hits.some(h=>h.label==='공격'&&h.hold==='attack'));key('KeyZ',.04);assert.equal(q.s.energy,energy-10);q.s.quest=2;q.s.accepted=true;q.player.cooldown=0;q.attack(true);assert.equal(q.s.energy,energy-35);
 key('Escape');assert.equal(q.modal.type,'menu');snapshot('56-tablet-menu-close',1024,768);h=q.hits.find(h=>h.label==='메뉴 닫기');assert.ok(h);const cx=(h.x+h.w/2)/q.W*box.width,cy=(h.y+h.h/2)/q.H*box.height;pointer('pointerdown',41,cx,cy);pointer('pointerup',41,cx,cy);assert.equal(q.modal,null);snapshot('57-hud-name-frame',1280,720);
 q.player.x=320;q.s.quest=0;q.s.accepted=false;q.render();key('KeyZ');assert.equal(q.modal.type,'dialog','Z follows the visible conversation action');snapshot('58-dialog-no-hint');
});


test('표정은 저장한 얼굴 대신 전투·피격·학습·획득 상황을 따른다',async()=>{
 const e=await engine(),{q,createProfile,tick,context,snapshot}=e;q.start(true);createProfile('구름',2,3);q.finishIntro();
 assert.equal(q.expressionFor(),0);q.player.attack=.2;assert.equal(q.expressionFor(),3);q.player.invincible=0;q.hurt();assert.equal(q.expressionFor(),2);tick(1);assert.equal(q.expressionFor(),0);
 q.pickup({art:'water',name:'물',x:230,y:568});assert.equal(q.expressionFor(),1);snapshot('54-mood-pickup');tick(1.3);assert.equal(q.expressionFor(),0);
 q.s.energy=80;q.openQuiz();assert.equal(q.expressionFor(),2);const m=q.modal;q.answerQuiz(m.order.findIndex(i=>i!==m.question.correct));assert.equal(q.expressionFor(),2);q.answerQuiz(m.order.findIndex(i=>i===m.question.correct));assert.equal(q.expressionFor(),1);snapshot('55-mood-correct');q.closeQuiz();
 q.startPractice(0);q.continueLesson();assert.equal(q.expressionFor(),2);q.answerLearning(q.modal.order.findIndex(i=>i===q.modal.question.correct));assert.equal(q.expressionFor(),1);
 vm.runInContext("modal={type:'reward'}",context);assert.equal(q.expressionFor(),1);vm.runInContext("modal=null",context);
 assert.equal(q.s.hair,2);assert.equal(q.s.color,3);assert.ok(!('face'in q.s));
 q.s.styleVersion=0;q.s.introSeen=true;q.s.quest=3;q.player.x=3600;q.save();q.start(false);assert.equal(q.mode,'play');assert.equal(q.s.hair,2);assert.equal(q.s.color,3);assert.equal(q.s.playerName,'구름');assert.equal(q.s.quest,3);assert.equal(q.player.x,3600);
});


test('보스 가장자리를 안전하게 때리고 낙하 마법의 예고·회피·피격·중단을 처리한다',async()=>{
 const e=await engine(),{q,createProfile,tick,key,snapshot}=e;q.start(true);createProfile();q.finishIntro();q.s.quest=4;q.s.learned=4;q.s.accepted=true;q.player.x=4425;q.interact();q.enterPortal();const boss=q.enemies.find(e=>e.type==='boss');
 q.player.x=boss.x-180;q.player.dir=1;q.player.invincible=0;const hp=q.s.hp;assert.equal(q.attack(),true);assert.equal(boss.hp,230);tick(.4);assert.equal(q.s.hp,hp,'attacking the visible edge does not cause contact damage');
 boss.phase='strike';boss.phaseT=0;tick(.15);assert.equal(q.s.hp,hp,'the outer body is outside the reduced slam radius');q.player.x=boss.x-120;q.player.invincible=0;tick(.04);assert.equal(q.s.hp,hp-1,'close melee still has a readable danger area');q.s.hp=hp;boss.phase='rest';boss.phaseT=.4;
 q.player.x=boss.x-350;tick(1.75);assert.equal(boss.phase,'cast');assert.equal(q.bossMagic.length,1);const target=q.bossMagic[0].x;assert.equal(target,q.player.x);snapshot('80-boss-magic-warning');
 key('Escape');assert.equal(q.modal.type,'menu');const timer=q.bossMagic[0].t;tick(2);assert.equal(q.bossMagic[0].t,timer,'menus freeze danger timers');q.closeMenu();q.openQuiz();assert.equal(q.modal.type,'quiz');tick(.5);assert.equal(q.bossMagic[0].t,timer,'questions also freeze falling attacks');q.closeQuiz();
 key('ArrowLeft',1);assert.ok(q.player.x<target-180);assert.equal(q.bossMagic[0].x,target,'warning never follows the player');tick(.6);assert.equal(q.bossMagic[0].phase,'fall');snapshot('81-boss-magic-fall');tick(1);assert.equal(q.s.hp,hp,'walking out of the marked spot avoids the entire attack');
 boss.phase='rest';boss.phaseT=2.05;boss.turn=0;q.player.x=boss.x-350;q.player.invincible=0;tick(.08);const before=q.s.hp;tick(2.5);assert.equal(q.s.hp,before-1,'standing under a seed costs one heart, not multiple hits');snapshot('82-boss-magic-impact');
 boss.hp=100;boss.phase='rest';boss.phaseT=2.05;boss.turn=0;tick(.08);assert.equal(q.bossMagic.length,2);assert.ok(Math.abs(q.bossMagic[0].x-q.bossMagic[1].x)>=200);snapshot('83-boss-magic-two-phone',932,430);snapshot('84-boss-magic-two-tablet',1024,768);
 q.leaveArena();assert.equal(q.bossMagic.length,0);const safe=q.s.hp;tick(3);assert.equal(q.s.hp,safe);
 q.player.x=4425;q.interact();q.enterPortal();assert.equal(q.bossMagic.length,0);assert.equal(boss.phase,'rest');assert.equal(boss.phaseT,0);q.player.x=boss.x-350;boss.hp=10;boss.phaseT=2.05;tick(.08);assert.equal(q.bossMagic.length,2);q.player.x=boss.x-180;q.player.dir=1;q.player.cooldown=0;q.s.energy=100;q.attack();assert.equal(boss.hp,0);assert.equal(q.bossMagic.length,0,'defeating the caster cancels outstanding magic');
});

test('물음표 혼잣말·가호120·온샘마을 다섯 퀘스트·수호석2개와 두 번째 가호까지 이어진다',async()=>{
 const e=await engine(),{q,createProfile,closeDialog,closeReward,finishLearning,tick,snapshot,storage}=e;q.start(true);createProfile('겨울별',1,3);q.finishIntro();Object.assign(q.s,{finished:true,quest:4,completed:[0,1,2,3,4],stones:[0],testAnswers:[1,0,2,0,1],practiceDone:CORE.LESSONS.flatMap(l=>l.practice.map(p=>p.id)),xp:300,x:4425});q.player.x=4425;
 q.render();assert.ok(q.hits.some(h=>h.label==='수호석 생각하기'));assert.equal(q.primaryTarget().kind,'thought');snapshot('90-stone-thought-tablet',1024,768);q.hits.find(h=>h.label==='수호석 생각하기').fn();assert.equal(q.modal.thinking,true);assert.ok(q.modal.lines.some(l=>l.includes('다음 마을로 가자')));snapshot('91-self-talk-phone',932,430);closeDialog();assert.deepEqual(Array.from(q.s.reflected),[0]);q.player.x=4270;q.interact();closeDialog();assert.equal(q.modal.type,'blessing');assert.equal(q.s.energy,120);snapshot('92-first-blessing',1280,720);q.render();q.hits.find(h=>h.label==='온샘마을로 가는 길 찾기').fn();q.player.x=4870;q.interact();assert.equal(q.modal.type,'travel');snapshot('93-cold-travel');q.enterNextVillage();assert.equal(q.s.chapter,1);assert.ok(q.skillUnlocked());assert.equal(q.s.energy,120);assert.deepEqual(Array.from(q.s.journeys[0].testAnswers),[1,0,2,0,1]);assert.deepEqual(Array.from(q.s.practiceDone),[]);closeDialog();snapshot('94-cold-arrival-tablet',1024,768);
 q.player.x=320;q.interact();closeDialog();for(const x of [570,810,1000]){q.player.x=x;q.interact();closeDialog();}assert.equal(q.modal.type,'lesson');assert.equal(q.content().name,'온샘마을');snapshot('95-cold-clue-lesson');finishLearning();assert.equal(q.s.quest,1);closeReward();
 q.player.x=1110;q.interact();closeDialog();finishLearning();assert.ok(!q.s.practiceDone.includes('cold-delivery-time'));q.player.x=1265;q.interact();q.enterPortal();snapshot('96-cold-arena');
 function fight(type,skill=false){for(const enemy of q.enemies.filter(e=>e.type===type)){q.player.x=enemy.x-(type==='boss'?180:90);q.player.y=568;q.player.dir=1;for(let n=0;n<100&&enemy.hp>0;n++){if(q.s.energy<(skill?25:10)){q.openQuiz();assert.ok(q.modal.question.q);q.answerQuiz(q.modal.order.findIndex(i=>i===q.modal.question.correct));q.closeQuiz();}q.attack(skill);tick(skill?.84:.34);}assert.equal(enemy.hp,0);}}
 fight('dust');q.leaveArena();e.acceptFollowUp();for(const x of [2070,2280]){q.player.x=x;q.interact();finishLearning();}q.player.x=1110;q.interact();closeDialog();assert.equal(q.s.quest,2);closeReward();
 q.player.x=2410;q.interact();closeDialog();q.player.x=2565;q.interact();q.enterPortal();fight('thorn');q.leaveArena();e.acceptFollowUp();for(const x of [2580,2850,3230]){q.player.x=x;q.interact();finishLearning();}snapshot('97-cold-installed-protection');assert.ok(q.s.practiceDone.includes('cold-pipe'));q.player.x=2410;q.interact();closeDialog();assert.equal(q.s.quest,3);closeReward();q.player.x=3440;q.interact();closeDialog();
 for(const [x,y] of [[3570,568],[3780,478],[4070,408]]){q.player.x=x;q.player.y=y;q.interact();}assert.equal(q.modal.type,'lesson');q.continueLesson();q.answerLearning(q.modal.order.findIndex(i=>i===q.modal.question.correct));q.nextLearning();assert.deepEqual(Array.from(q.modal.question.diagram),[3,8]);snapshot('98-cold-records');finishLearning();assert.equal(q.s.quest,4);closeReward();closeDialog();
 q.player.x=4270;q.player.y=568;q.interact();closeDialog();q.player.x=4425;q.interact();q.enterPortal();fight('boss',true);q.leaveArena();e.acceptFollowUp();q.player.x=4425;q.interact();assert.equal(q.modal.type,'plans');snapshot('99-cold-response-phone',932,430);for(const i of q.modal.order.map((v,i)=>v<3?i:-1).filter(i=>i>=0))q.choosePlan(i);finishLearning();assert.equal(q.s.finished,true);assert.equal(q.s.practiceDone.length,16);assert.ok(q.s.practiceDone.every(id=>id.startsWith('cold-')));assert.deepEqual(Array.from(q.s.stones),[0,1]);closeReward();q.openThought();closeDialog();q.player.x=4270;q.interact();closeDialog();assert.equal(q.s.energy,140);assert.equal(q.modal.type,'blessing');snapshot('100-second-blessing-tablet',1024,768);q.render();q.hits.find(h=>h.label==='다음 마을 소식 확인').fn();q.player.x=4870;q.interact();assert.equal(q.modal.type,'horizon');snapshot('101-next-letter');q.render();q.hits.find(h=>h.label==='온샘마을 더 둘러보기').fn();q.render();q.hits.find(h=>h.label==='퀘스트 수첩').fn();q.render();q.hits.find(h=>h.label==='수호석 가방').fn();assert.equal(q.modal.type,'collection');snapshot('107-stone-collection');q.save();const restored=new CORE.Adventure(JSON.parse(storage.get('five-villages-sun-v1')));assert.equal(restored.s.chapter,1);assert.equal(restored.maxEnergy(),140);assert.equal(restored.s.journeys[0].testAnswers.length,5);assert.equal(restored.s.playerName,'겨울별');
});


test('긴 배경은 각 구간 원화를 한 번씩 쓰고 카메라와 1대1로 이동한다',async()=>{
 const e=await engine(),{q,realCanvas,snapshot,createProfile}=e;q.start(true);createProfile();q.finishIntro();q.s.finished=true;
 for(const key of ['sunVillage','coldVillage']){assert.equal(q.panoramaInfo[key].width,5300);assert.equal(new Set(q.panoramaInfo[key].sources).size,3);}
 assert.equal(q.panoramaInfo.sunArena.width,2200);assert.equal(q.panoramaInfo.coldArena.sources.length,1);
 for(const [chapter,key] of [[0,'sun'],[1,'cold']]){
  q.s.chapter=chapter;const bg=q.backgrounds[key];assert.equal(bg.width,5300);assert.equal(bg.height,720);const original=bg.getContext('2d'),ctx=realCanvas.getContext('2d');const hashes=new Set();
  for(const x of [0,1050,1700,2600,3400,4020]){q.player.x=x+q.W*.42;q.syncCamera();q.render();q.drawBackground();assert.equal(q.cam,x);const visible=ctx.getImageData(0,0,1280,720).data,expected=original.getImageData(x,0,1280,720).data;assert.deepEqual(visible,expected);hashes.add(createHash('sha256').update(visible).digest('hex'));}
  assert.equal(hashes.size,6,'distant views never repeat a reused tile');
  q.player.x=600+q.W*.42;q.syncCamera();q.render();q.drawBackground();const before=ctx.getImageData(10,0,1270,720).data;q.player.x+=10;q.syncCamera();q.drawBackground();assert.deepEqual(ctx.getImageData(0,0,1270,720).data,before,'10px camera movement scrolls the same scene exactly10px');
  writeFileSync(root+'/qa/'+(chapter?'110-cold-whole-panorama.png':'109-sun-whole-panorama.png'),bg.toBuffer('image/png'));
  q.player.x=1800; snapshot(chapter?'112-cold-join-tablet':'111-sun-join-tablet',1024,768);snapshot(chapter?'114-cold-join-phone':'113-sun-join-phone',932,430);snapshot('115-panorama-desktop',1280,720);
 }
});


test('걷기는 실제 이동에 맞춘 여섯 자세이고 말풍선·주민·스킬 그림이 구분된다',async()=>{
 const e=await engine(),{q,tick,createProfile,closeDialog,snapshot,realCanvas,events}=e;q.start(true);createProfile('새봄',2,3);q.finishIntro();assert.equal(q.thoughtTarget(),null);assert.equal(q.primaryTarget().kind,'npc','self-help never steals a nearby NPC action');q.render();q.hits.find(h=>h.label==='부탁 도움말').fn();assert.equal(q.modal.thinking,true);assert.ok(q.modal.lines.some(l=>l.includes('촌장님')));assert.equal(q.s.accepted,false);closeDialog();
 q.player.x=650;const poses=new Set();events.keydown({code:'ArrowRight',repeat:false,preventDefault(){}});for(let i=0;i<36;i++){tick(.025);poses.add(q.playerPose());}events.keyup({code:'ArrowRight'});assert.equal(poses.size,6);tick(.04);assert.equal(q.playerPose(),'hero');assert.equal(q.player.moving,false);
 q.player.x=1190;events.keydown({code:'ArrowRight',repeat:false,preventDefault(){}});tick(.3);events.keyup({code:'ArrowRight'});assert.equal(q.player.x,1190);assert.equal(q.playerPose(),'hero','standing against a map boundary does not march in place');
 const frames=Array.from({length:6},(_,i)=>q.characterAtlas['body-walk'+i]);assert.equal(new Set(frames.map(a=>a.unitScale)).size,1);const necks=frames.map(a=>(a.pegY-a.groundY)*a.unitScale*110/400);assert.ok(Math.max(...necks)-Math.min(...necks)<2.5,'head follows a stable collar instead of rescaling every pose');
 const ctx=realCanvas.getContext('2d');ctx.fillStyle='#e7d7b7';ctx.fillRect(0,0,1280,720);const hashes=new Set();for(let i=0;i<6;i++){q.drawCharacter('walk'+i,i*210+100,285,230,false,1,2,3,0);hashes.add(createHash('sha256').update(ctx.getImageData(i*210,0,210,340).data).digest('hex'));q.drawCharacter('walk'+i,i*210+100,615,230,true,1,1,2,0);}assert.equal(hashes.size,6);writeFileSync(root+'/qa/121-walk-six-frames.png',realCanvas.toBuffer('image/png'));
 ctx.fillStyle='#e7d7b7';ctx.fillRect(0,0,1280,720);for(let chapter=0;chapter<2;chapter++){q.s.chapter=chapter;for(const [i,role] of ['chief','courier','caretaker','observer'].entries())q.sprite(role,i*320+160,chapter*350+325,260);}writeFileSync(root+'/qa/122-distinct-village-people.png',realCanvas.toBuffer('image/png'));assert.notEqual(q.characterAtlas.chief.img,q.characterAtlas.coldChief.img);
 const skill=q.characterAtlas.skillButton,icon=createCanvas(90,90),ic=icon.getContext('2d');ic.drawImage(skill.img,skill.x,skill.y,skill.w,skill.h,0,0,90,90);const pixels=ic.getImageData(0,0,90,90).data,seen=new Set();let pieces=0;for(let n=0;n<8100;n++){if(seen.has(n)||pixels[n*4+3]<128)continue;const queue=[n];seen.add(n);let area=0;while(queue.length){const at=queue.pop();area++;for(const next of [at%90?at-1:-1,at%90<89?at+1:-1,at-90,at+90])if(next>=0&&next<8100&&!seen.has(next)&&pixels[next*4+3]>=128){seen.add(next);queue.push(next);}}if(area>3)pieces++;}assert.equal(pieces,1,'skill image has one connected button and no neighboring cut fragments');
 q.s.chapter=0;q.s.quest=1;q.s.accepted=true;q.s.learned=1;assert.ok(q.questThoughtLines().some(l=>l.includes('포탈')));q.s.killed=['dust-0','dust-1','dust-2','dust-3'];q.s.taskPhases[1]=2;assert.ok(q.questThoughtLines().some(l=>l.includes('배달 계획')));q.s.practiceDone.push('delivery-time');assert.ok(q.questThoughtLines().some(l=>l.includes('상자')));q.player.x=1250;snapshot('123-quest-thought-and-skill',1280,720);
 q.s.finished=true;q.s.quest=4;q.s.stones=[0];assert.equal(q.thoughtTarget().art,'thoughtQuestion');q.openThought();assert.ok(q.modal.lines.some(l=>l.includes('다음 마을로 가자')));closeDialog();assert.deepEqual(Array.from(q.s.reflected),[0]);assert.equal(q.thoughtTarget(),null);q.s.blessings=[0];q.openThought();assert.equal(q.modal.cheerful,true);assert.equal(q.expressionFor(),1);closeDialog();q.player.x=4270;assert.equal(q.primaryTarget().kind,'npc');snapshot('124-completed-smile-tablet',1024,768);q.s.chapter=1;q.s.finished=false;q.s.quest=0;q.s.accepted=false;q.player.x=320;snapshot('125-cold-new-chief-phone',932,430);
});

test('이어하기 외형 보존·순차 부탁 안내·NPC 표시·목 접합을 검증한다',async()=>{
 const e=await engine(),{q,createProfile,closeDialog,finishLearning,realCanvas,nodes,snapshot,storage}=e;q.start(true);createProfile('기록별',1,2);q.finishIntro();q.s.quest=1;q.s.accepted=true;q.s.learned=1;q.s.styleVersion=0;q.s.appearanceReady=false;q.player.x=1110;q.save();q.start(true);q.chooseStyle('hair',3);q.chooseStyle('color',3);q.render();q.hits.find(h=>h.label==='시작 화면').fn();q.start(false);assert.equal(q.mode,'play');assert.equal(q.s.hair,1);assert.equal(q.s.color,2);assert.equal(q.s.playerName,'기록별');assert.equal(q.s.quest,1);assert.equal(q.player.x,1110);assert.equal(nodes['#player-name'].hidden,true);assert.equal(q.thoughtTarget(),null);
 q.s.accepted=false;q.render();assert.ok(q.hits.some(h=>h.label==='배달원의 부탁'));assert.ok(q.hits.some(h=>h.label==='부탁 도움말'));q.openQuestHelp();assert.ok(q.modal.lines.join(' ').includes('배달원'));closeDialog();q.interact();assert.ok(!/상자|시간표/.test(q.modal.lines.join(' ')));closeDialog();assert.equal(q.s.taskPhases[1]||0,0);assert.equal(q.objects().filter(o=>o.kind==='crate').length,0);assert.ok(q.portalForQuest());
 for(const enemy of q.enemies.filter(e=>e.type==='dust')){enemy.hp=0;q.s.killed.push(enemy.id);}assert.ok(q.nextTask().text.includes('처치 보고'));q.interact();assert.equal(q.s.taskPhases[1],1);assert.equal(q.objects().filter(o=>o.kind==='crate').length,0);snapshot('132-second-request-offer');q.start(false);assert.equal(q.s.taskPhases[1],1);assert.equal(q.modal,null);assert.ok(q.nextTask().text.includes('새 부탁'));q.interact();closeDialog();finishLearning();assert.equal(q.s.taskPhases[1],2);assert.equal(q.requestNumber(),3);assert.equal(q.objects().filter(o=>o.kind==='crate').length,2);
 for(const [i,x] of [2070,2280].entries()){q.player.x=x;q.interact();finishLearning();assert.equal(q.s.crates.length,i+1);if(i===0){assert.equal(q.nextTask().x,2280);assert.ok(q.nextTask().text.includes('1/2'));assert.ok(!q.nextTask().text.includes('보고'));snapshot('133-one-crate-left');}}
 assert.ok(q.nextTask().text.includes('완료 보고'));
 for(const quest of [2,4]){
  const fixture={version:1,quest,accepted:true,learned:quest,introSeen:true,playerName:'기록별',hair:1,color:2,x:quest===2?2410:4270,killed:quest===2?['thorn-0','thorn-1','thorn-2']:[],bossDead:quest===4,taskPhases:{}};storage.set('five-villages-sun-v1',JSON.stringify(fixture));q.start(false);assert.ok(q.nextTask().text.includes('처치 보고'));assert.equal(q.objects().filter(o=>['supply','stone'].includes(o.kind)).length,0);q.interact();closeDialog();assert.equal(q.s.taskPhases[quest],2);
  if(quest===2){for(const [i,x] of [2580,2850,3230].entries()){q.player.x=x;q.interact();finishLearning();if(i<2){assert.ok(q.nextTask().text.includes(`${i+1}/3`));assert.ok(!q.nextTask().text.includes('보고'));}}assert.ok(q.nextTask().text.includes('완료 보고'));}
  else{assert.equal(q.requestNumber(),8);assert.ok(q.objects().some(o=>o.kind==='stone'));assert.ok(q.nextTask().text.includes('대응'));}
 }
 const ctx=realCanvas.getContext('2d'),expected=[307,288,271,305.5,290.5,273.5];ctx.setTransform(1,0,0,1,0,0);
 for(let pose=0;pose<6;pose++){const a=q.characterAtlas['body-walk'+pose];assert.ok(Math.abs(a.pegX-pose%3*512-expected[pose])<3,'head sits in the actual collar opening');for(let hair=0;hair<4;hair++)for(let color=0;color<4;color++)for(let face=0;face<4;face++){ctx.clearRect(0,0,1280,720);q.drawCharacter('walk'+pose,640,650,400,false,1,hair,color,face);const neck=650+(a.pegY-a.groundY)*a.unitScale,pixels=ctx.getImageData(639,Math.floor(neck)-2,3,5).data;assert.ok(Array.from(pixels).filter((_,i)=>i%4===3).every(v=>v>180),'opaque head-to-collar overlap in every style, color and expression');}}
 q.s.quest=0;q.s.accepted=false;q.player.x=320;snapshot('134-unified-npc-bubble-tablet',1024,768);q.openQuestHelp();snapshot('135-header-help-phone',932,430);
});


test('기력 문제를 연속으로 풀고 직접 나가며 공격 직후 재접속해도 남은 기력을 보존한다',async()=>{
 const e=await engine(),{q,tick,key,pointer,snapshot,createProfile,storage}=e;
 q.start(true);createProfile('충전별');q.finishIntro();q.s.quest=2;q.s.learned=2;q.s.accepted=true;q.s.energy=0;q.openQuiz();
 const first=q.modal.question;const wrong=q.modal.order.findIndex(i=>i!==first.correct);q.answerQuiz(wrong);assert.equal(q.s.energy,0);q.nextQuiz();assert.equal(q.modal.question,first,'wrong answers stay on the same question');
 q.answerQuiz(q.modal.order.findIndex(i=>i===first.correct));assert.equal(q.s.energy,20);q.answerQuiz(0);assert.equal(q.s.energy,20,'a correct question cannot charge twice');q.render();assert.ok(q.hits.some(h=>h.label==='나가기'));assert.ok(q.hits.some(h=>h.label==='다음 문제'));snapshot('144-energy-next-question');
 const enemy=q.enemies[0],enemyX=enemy.x;tick(.5);assert.equal(enemy.x,enemyX);key('Enter');assert.equal(q.modal.type,'quiz');assert.notEqual(q.modal.question,first);assert.equal(q.modal.answered,false);assert.equal(q.modal.feedback,null);assert.equal(q.modal.elapsed,.04);assert.equal(q.s.energy,20);
 q.answerQuiz(q.modal.order.findIndex(i=>i===q.modal.question.correct));q.render();q.hits.find(h=>h.label==='다음 문제').fn();assert.equal(q.modal.type,'quiz');assert.equal(q.s.energy,40);q.closeQuiz();assert.equal(q.modal,null);assert.equal(JSON.parse(storage.get('five-villages-sun-v1')).energy,40);
 q.s.energy=95;q.openQuiz();q.answerQuiz(q.modal.order.findIndex(i=>i===q.modal.question.correct));assert.equal(q.s.energy,100);assert.equal(q.modal.feedback,'기력 +5!');key('Enter');assert.equal(q.modal.type,'quiz','full energy stays in the window until exit');q.render();assert.ok(!q.hits.some(h=>h.label==='다음 문제'));snapshot('145-energy-full-tablet',1024,768);q.hits.find(h=>h.label==='나가기').fn();assert.equal(q.modal,null);
 q.s.energy=10;q.player.cooldown=0;q.attack();assert.equal(q.s.energy,0);assert.equal(JSON.parse(storage.get('five-villages-sun-v1')).energy,0,'even a missed attack saves before autosave or pagehide');q.start(false);assert.equal(q.s.energy,0);q.openQuiz();q.answerQuiz(q.modal.order.findIndex(i=>i===q.modal.question.correct));q.start(false);assert.equal(q.s.energy,20,'earned energy is saved before closing the quiz');
 q.s.blessings=[0];q.s.chapter=1;q.s.energy=120;q.s.quest=2;q.s.accepted=true;q.player.cooldown=0;q.attack(true);assert.equal(q.s.energy,95);q.start(false);assert.equal(q.s.energy,95);assert.equal(q.s.chapter,1);q.s.blessings=[0,1];q.s.energy=140;q.player.cooldown=0;q.attack();q.start(false);assert.equal(q.s.energy,130);assert.equal(q.s.playerName,'충전별');
 q.s.chapter=0;q.s.quest=1;q.s.accepted=true;q.player.x=1265;q.openPortal();q.enterPortal();const arena=q.encounter;q.s.energy=90;q.openQuiz();const foe=q.activeEnemies()[0],pausedX=foe.x;tick(1);assert.equal(foe.x,pausedX);q.answerQuiz(q.modal.order.findIndex(i=>i===q.modal.question.correct));q.nextQuiz();assert.equal(q.encounter,arena);q.answerQuiz(q.modal.order.findIndex(i=>i===q.modal.question.correct));q.render();q.hits.find(h=>h.label==='나가기').fn();assert.equal(q.encounter,arena);assert.equal(q.s.energy,130);
 for(const [name,w,h] of [['146-arena-return-desktop',1280,720],['147-arena-return-tablet',1024,768],['148-arena-return-phone',932,430]]){snapshot(name,w,h);const back=q.hits.find(h=>h.label==='마을로 돌아가기'&&h.y<300);assert.ok(back);assert.ok(back.y>=181+12,'return button clears the whole portrait/name card');assert.ok(back.x+back.w<q.W-360,'return button clears the quest card');}
 const back=q.hits.find(h=>h.label==='마을로 돌아가기'&&h.y<300);pointer('pointerdown',160,(back.x+back.w/2)*e.box.width/q.W,(back.y+back.h/2)*e.box.height/720);pointer('pointerup',160,(back.x+back.w/2)*e.box.width/q.W,(back.y+back.h/2)*e.box.height/720);assert.equal(q.encounter,null);assert.equal(q.s.energy,130);
});
