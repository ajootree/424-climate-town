import test from 'node:test';
import assert from 'node:assert/strict';
import {Adventure,QUESTS,QUESTIONS} from '../core.js';

test('기력은 0에서도 정답으로 회복되고 최대치를 넘지 않는다',()=>{
 const g=new Adventure();assert.equal(g.spend(100),true);assert.equal(g.spend(5),false);assert.equal(g.charge(false),0);assert.equal(g.charge(true),40);assert.equal(g.spend(20),true);g.charge(true);g.charge(true);assert.equal(g.s.energy,100);
});
test('퀘스트를 받기 전이나 다른 퀘스트의 물품으로 진행할 수 없다',()=>{
 const g=new Adventure();assert.equal(g.collect('clues','a'),false);assert.equal(g.complete(),false);g.accept();assert.equal(g.collect('records','a'),false);assert.equal(g.collect('clues','a'),true);assert.equal(g.collect('clues','a'),false);assert.equal(g.canComplete(),false);
});
test('도입부 뒤 다섯 부탁과 수호석까지 전체 진행 조건을 지킨다',()=>{
 const g=new Adventure();g.accept();['bench','notice','resident'].forEach(id=>g.collect('clues',id));assert.ok(g.complete());assert.equal(g.s.quest,1);
 g.accept();g.collect('crates','a');g.collect('crates','b');assert.equal(g.canComplete(),false);for(let i=0;i<4;i++)g.kill(`dust-${i}`);assert.ok(g.complete());
 g.accept();['water','cups','cloth'].forEach(id=>g.collect('supplies',id));assert.equal(g.canComplete(),false);for(let i=0;i<3;i++)g.kill(`thorn-${i}`);assert.ok(g.complete());
 g.accept();for(let i=0;i<3;i++)g.collect('records',`record-${i}`);assert.ok(g.complete());assert.equal(g.s.quest,4);
 g.accept();['shade','water','help'].forEach(id=>g.collect('plans',id));assert.equal(g.canComplete(),false);g.s.bossDead=true;assert.ok(g.complete());assert.equal(g.s.finished,true);assert.deepEqual(g.s.completed,[0,1,2,3,4]);assert.equal(g.s.xp,300);assert.equal(g.complete(),false);
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
