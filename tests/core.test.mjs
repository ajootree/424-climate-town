import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,QUESTS,QUESTIONS,LESSONS,FINAL_TEST,REVIEW_TEST,ENERGY,COLD} from '../core.js';

test('기력은 정답20 회복, 기본10·스킬25 소모로 조정한다',()=>{
 const g=new Adventure();assert.equal(ENERGY.attack,10);assert.equal(ENERGY.skill,25);assert.equal(ENERGY.charge,20);assert.ok(g.spend(100));assert.equal(g.spend(10),false);assert.equal(g.charge(false),0);assert.equal(g.charge(true),20);assert.ok(g.spend(10));assert.equal(g.s.energy,10);assert.equal(g.spend(25),false);for(let i=0;i<7;i++)g.charge(true);assert.equal(g.s.energy,100);
});
test('퀘스트를 받기 전이나 다른 퀘스트의 물품으로 진행할 수 없다',()=>{
 const g=new Adventure();assert.equal(g.collect('clues','a'),false);assert.equal(g.complete(),false);g.accept();assert.equal(g.collect('records','a'),false);assert.equal(g.collect('clues','a'),true);assert.equal(g.collect('clues','a'),false);assert.equal(g.canComplete(),false);
});
function learn(g){LESSONS[g.s.quest].practice.forEach(q=>g.recordPractice(q.id,true));}

test('도입부 뒤 다섯 부탁과 수호석까지 전체 진행 조건을 지킨다',()=>{
 const g=new Adventure();g.accept();['bench','notice','resident'].forEach(id=>g.collect('clues',id));learn(g);if(g.s.quest===4)FINAL_TEST.forEach((q,i)=>g.recordTestAnswer(i,q.correct));assert.ok(g.complete());assert.equal(g.s.quest,1);
 g.accept();assert.equal(g.collect('crates','a'),false);for(let i=0;i<4;i++)g.kill(`dust-${i}`);assert.ok(g.reportBattle());assert.ok(g.acceptFollowUp());g.collect('crates','a');g.collect('crates','b');learn(g);if(g.s.quest===4)FINAL_TEST.forEach((q,i)=>g.recordTestAnswer(i,q.correct));assert.ok(g.complete());
 g.accept();assert.equal(g.collect('supplies','water'),false);for(let i=0;i<3;i++)g.kill(`thorn-${i}`);assert.ok(g.reportBattle());assert.ok(g.acceptFollowUp());['water','cups','cloth'].forEach(id=>g.collect('supplies',id));learn(g);if(g.s.quest===4)FINAL_TEST.forEach((q,i)=>g.recordTestAnswer(i,q.correct));assert.ok(g.complete());
 g.accept();for(let i=0;i<3;i++)g.collect('records',`record-${i}`);learn(g);if(g.s.quest===4)FINAL_TEST.forEach((q,i)=>g.recordTestAnswer(i,q.correct));assert.ok(g.complete());assert.equal(g.s.quest,4);
 g.accept();assert.equal(g.collect('plans','shade'),false);g.s.bossDead=true;assert.ok(g.reportBattle());assert.ok(g.acceptFollowUp());['shade','water','help'].forEach(id=>g.collect('plans',id));learn(g);if(g.s.quest===4)FINAL_TEST.forEach((q,i)=>g.recordTestAnswer(i,q.correct));assert.ok(g.complete());assert.equal(g.s.finished,true);assert.deepEqual(g.s.completed,[0,1,2,3,4]);assert.equal(g.s.xp,300);assert.equal(g.complete(),false);
});
test('패배해도 완료한 퀘스트와 수집 기록은 보존한다',()=>{
 const g=new Adventure();g.accept();g.collect('clues','bench');g.s.energy=0;g.s.checkpoint=2410;for(let i=0;i<6;i++)g.hurt();assert.equal(g.s.hp,0);g.respawn();assert.equal(g.s.hp,6);assert.equal(g.s.energy,100);assert.equal(g.s.x,2410);assert.deepEqual(g.s.clues,['bench']);
});
test('저장과 재개가 퀘스트·소지품·기력을 보존한다',()=>{
 const g=new Adventure();g.accept();g.collect('clues','bench');g.spend(40);g.s.introSeen=true;const restored=new Adventure(JSON.parse(g.serialize()));assert.equal(restored.s.accepted,true);assert.deepEqual(restored.s.clues,['bench']);assert.equal(restored.s.energy,60);assert.equal(restored.s.introSeen,true);
});
test('기력 문제는 이미 소개한 학습 범위에서 출제한다',()=>{
 const g=new Adventure();assert.ok(g.quizPool().every(q=>q.level===0));g.s.quest=2;g.accept();assert.ok(g.quizPool().every(q=>q.level<=2));assert.equal(g.quizPool().length,9);assert.equal(QUESTS.length,5);assert.equal(QUESTIONS.length,15);for(const q of QUESTIONS){assert.equal(q.a.length,3);assert.ok(q.correct>=0&&q.correct<3);}
});
test('지원하지 않는 저장 버전은 안전하게 새 게임으로 시작한다',()=>{
 const g=new Adventure({version:999,quest:4,finished:true});assert.equal(g.s.quest,0);assert.equal(g.s.finished,false);
});


test('헤어·머리색 16가지 조합과 이름을 저장하고 이전 캐릭터를 이전한다',()=>{
 const g=new Adventure({version:1,quest:2,accepted:true,supplies:['water'],avatar:'female',playerName:'새봄',profileReady:true});assert.equal(g.s.appearanceReady,false);assert.equal(g.s.hair,3);assert.equal(g.s.profileReady,true);
 assert.equal(g.setProfile(0,0,'   '),false);for(const pair of [[4,0],[-1,0],[0,4],[0,1.5]])assert.equal(g.setProfile(...pair,'새봄'),false);
 for(let hair=0;hair<4;hair++)for(let color=0;color<4;color++){assert.ok(g.setProfile(hair,color,'  새봄  '));const r=new Adventure(JSON.parse(g.serialize()));assert.equal(r.s.hair,hair);assert.equal(r.s.color,color);assert.equal(r.s.playerName,'새봄');assert.equal(r.s.appearanceReady,true);assert.equal(r.s.quest,2);assert.deepEqual(r.s.supplies,['water']);assert.ok(!('avatar'in r.s));assert.ok(!('face'in r.s));assert.equal(r.s.styleVersion,2);}
 g.setProfile(0,0,'하나둘셋넷다섯여섯일곱');assert.equal(Array.from(g.s.playerName).length,8);
 const old=new Adventure({version:1,hair:2,face:3,quest:3,playerName:'기록이',profileReady:true,appearanceReady:true});assert.equal(old.s.color,0);assert.equal(old.s.styleVersion,0);assert.equal(old.s.quest,3);assert.ok(!('face'in old.s));
 const bad=new Adventure({version:1,hair:99,color:-1});assert.equal(bad.s.hair,0);assert.equal(bad.s.color,0);
});


test('전투·물품·기력 정답만으로는 학습 확인을 건너뛸 수 없다',()=>{
 const g=new Adventure();g.accept();['a','b','c'].forEach(id=>g.collect('clues',id));assert.ok(g.evidenceReady());g.charge(true);assert.equal(g.complete(),false);g.recordPractice(LESSONS[0].practice[0].id,false);g.recordPractice(LESSONS[0].practice[0].id,true);assert.equal(g.s.practiceFirst[0],LESSONS[0].practice[0].id+':0');assert.equal(g.complete(),false);learn(g);assert.ok(g.complete());assert.equal(g.recordPractice(LESSONS[4].practice[0].id,true),false);assert.equal(g.recordTestAnswer(0,0),false);
});
test('첫 평가 점수는 재도전으로 덮어쓰지 않고 틀린 영역만 재확인한다',()=>{
 const g=new Adventure({version:1,quest:4,accepted:true,learned:4,bossDead:true,plans:['shade','water','help']});assert.equal(g.recordTestAnswer(0,1),false);learn(g);
 FINAL_TEST.forEach((q,i)=>assert.ok(g.recordTestAnswer(i,i===2?(q.correct+1)%3:q.correct)));assert.equal(g.testScore(),4);assert.equal(g.recordTestAnswer(2,FINAL_TEST[2].correct),false);assert.equal(g.complete(),false);assert.equal(g.recordReview(2,false),false);
 const r=new Adventure(JSON.parse(g.serialize()));assert.equal(r.testScore(),4);assert.deepEqual(r.testGaps(),[2]);assert.ok(r.recordReview(2,true));assert.equal(r.testScore(),4);assert.ok(r.hasPassedTest());assert.ok(r.complete());assert.equal(r.s.finished,true);
});
test('필수 선택16개·최종확인5개·재확인5개는 서로 다른 상황을 다룬다',()=>{
 assert.equal(LESSONS.flatMap(l=>l.practice).length,16);assert.equal(FINAL_TEST.length,5);assert.equal(REVIEW_TEST.length,5);const all=[...LESSONS.flatMap(l=>l.practice),...FINAL_TEST,...REVIEW_TEST];assert.equal(new Set(all.map(q=>q.id)).size,26);assert.equal(new Set(all.map(q=>q.q)).size,26);for(const q of all){assert.equal(q.a.length,3);assert.ok(q.correct>=0&&q.correct<3);assert.ok(q.why.length>8);}for(let i=0;i<5;i++){assert.equal(FINAL_TEST[i].topic,i);assert.equal(REVIEW_TEST[i].topic,i);assert.notEqual(FINAL_TEST[i].q,REVIEW_TEST[i].q);}assert.notDeepEqual(LESSONS[3].practice[1].diagram,FINAL_TEST[3].diagram);
});

test('더위의 모습과 폭염 이름을 나누고 천 문제는 천의 사용만 비교한다',()=>{const first=LESSONS[0].practice;const a=first.findIndex(q=>q.id==='heat-name');assert.ok(!first[a].a.some(v=>v.includes('폭염:')));assert.equal(first[a+1].id,'heat-label');assert.equal(first[a+1].a[first[a+1].correct],'폭염');const cloth=LESSONS[2].practice.find(q=>q.id==='shelter-shade');assert.ok(cloth.a.every(v=>v.includes('천')));assert.ok(!cloth.a.some(v=>/뛰|쉬지/.test(v)));assert.deepEqual(cloth.choiceArts,['clothShade','clothClosed','clothLayers']);});


test('옛 수호석 완료 저장은 생각과 가호를 거쳐 최대 기력120을 한 번만 받는다',()=>{
 const g=new Adventure({version:1,finished:true,quest:4,completed:[0,1,2,3,4],testAnswers:[1,0,2,0,1],playerName:'구름',energy:70});assert.deepEqual(g.s.stones,[0]);assert.equal(g.maxEnergy(),100);assert.equal(g.bless(),false);assert.equal(g.advanceVillage(),false);assert.equal(g.reflect(),true);assert.equal(g.reflect(),false);assert.equal(g.bless(),true);assert.equal(g.bless(),false);assert.equal(g.maxEnergy(),120);assert.equal(g.s.energy,120);g.spend(10);g.charge(true);assert.equal(g.s.energy,120);g.respawn();assert.equal(g.s.energy,120);assert.equal(new Adventure(JSON.parse(g.serialize())).maxEnergy(),120);
});
test('온샘마을 이동은 프로필·가호·수호석과 첫 평가를 보존하고 새 학습을 시작한다',()=>{
 const g=new Adventure({version:1,finished:true,quest:4,completed:[0,1,2,3,4],testAnswers:[1,0,2,0,1],practiceDone:['heat-clues'],playerName:'구름',hair:2,color:3,xp:300,profileReady:true,appearanceReady:true,styleVersion:2});g.reflect();g.bless();assert.ok(g.advanceVillage());assert.equal(g.advanceVillage(),false);assert.equal(g.s.chapter,1);assert.equal(g.s.quest,0);assert.equal(g.s.finished,false);assert.equal(g.s.playerName,'구름');assert.equal(g.s.hair,2);assert.equal(g.s.color,3);assert.equal(g.s.xp,300);assert.equal(g.s.energy,120);assert.deepEqual(g.s.testAnswers,[]);assert.deepEqual(g.s.practiceDone,[]);assert.deepEqual(g.s.journeys[0].testAnswers,[1,0,2,0,1]);assert.equal(g.content().name,'온샘마을');assert.equal(g.recordPractice('heat-clues',true),false);assert.equal(g.recordPractice('cold-clues',true),true);const r=new Adventure(JSON.parse(g.serialize()));assert.deepEqual(r.s.stones,[0]);assert.deepEqual(r.s.blessings,[0]);assert.equal(r.content(),COLD);assert.equal(r.maxEnergy(),120);
});
test('한파 마을도 다섯 부탁·필수16개·새 확인5개와 오답 재확인 후 두 번째 수호석을 준다',()=>{
 const g=new Adventure({version:1,chapter:1,blessings:[0],stones:[0],reflected:[0]});assert.equal(COLD.lessons.flatMap(l=>l.practice).length,16);const ids=[...COLD.lessons.flatMap(l=>l.practice),...COLD.final,...COLD.review].map(q=>q.id);assert.equal(new Set(ids).size,26);
 for(let stage=0;stage<5;stage++){
  g.accept();if(stage===0)['empty','notice','resident'].forEach(x=>g.collect('clues',x));if(stage===1){for(let i=0;i<4;i++)g.kill('dust-'+i);g.reportBattle();g.acceptFollowUp();['a','b'].forEach(x=>g.collect('crates',x));}if(stage===2){for(let i=0;i<3;i++)g.kill('thorn-'+i);g.reportBattle();g.acceptFollowUp();['water','cups','cloth'].forEach(x=>g.collect('supplies',x));}if(stage===3)[0,1,2].forEach(x=>g.collect('records','record-'+x));if(stage===4){g.s.bossDead=true;g.reportBattle();g.acceptFollowUp();['shade','water','help'].forEach(x=>g.collect('plans',x));}
  assert.equal(g.complete(),false);COLD.lessons[stage].practice.forEach(q=>g.recordPractice(q.id,true));if(stage===4){COLD.final.forEach((q,i)=>g.recordTestAnswer(i,i===3?(q.correct+1)%3:q.correct));assert.equal(g.testScore(),4);assert.equal(g.complete(),false);assert.equal(g.recordReview(3,true),true);assert.equal(g.testScore(),4);}assert.ok(g.complete());
 }
 assert.deepEqual(g.s.stones,[0,1]);assert.equal(g.s.finished,true);assert.ok(g.reflect());assert.ok(g.bless());assert.equal(g.maxEnergy(),140);assert.equal(g.advanceVillage(),false);
});


test('모든 복합 부탁은 전투·보고·새 부탁 수락·물품 순서를 저장한다',()=>{
 for(const chapter of [0,1])for(const quest of [1,2,4]){
  const g=new Adventure({version:1,chapter,quest,accepted:true,learned:quest}),r=g.request();assert.equal(g.collect(r.collection,'first'),false);assert.equal(g.acceptFollowUp(),false);assert.equal(g.reportBattle(),false);
  if(r.enemy==='boss')g.s.bossDead=true;else for(let i=0;i<r.count;i++)g.kill(r.enemy+'-'+i);assert.equal(g.collect(r.collection,'first'),false);assert.ok(g.reportBattle());assert.equal(g.taskPhase(),1);const restored=new Adventure(JSON.parse(g.serialize()));assert.equal(restored.taskPhase(),1);assert.equal(restored.collect(r.collection,'first'),false);assert.ok(restored.acceptFollowUp());assert.equal(restored.acceptFollowUp(),false);assert.ok(restored.collect(r.collection,'first'));assert.equal(restored.complete(),false);
 }
 const legacy=new Adventure({version:1,quest:1,accepted:true,crates:['crate-0'],killed:['dust-0','dust-1','dust-2','dust-3']});assert.equal(legacy.taskPhase(),2);assert.deepEqual(legacy.s.crates,['crate-0']);assert.ok(legacy.collect('crates','crate-1'));
});
