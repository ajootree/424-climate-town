export const VERSION=1;
export const ENERGY={attack:10,skill:25,charge:20};
export const HAIRSTYLES=['짧은 삐침','일자 단발','둥근 곱슬','가르마 묶음'];
export const HAIR_COLORS=['갈색','검정','금색','남색'];
export const QUESTS=[
 {title:'텅 빈 광장의 비밀',goal:'반짝이는 단서 3곳 찾기',fact:'폭염은 지나친 더위예요.',reward:30},
 {title:'배달원의 멈춘 수레',goal:'몬스터를 물리치고 상자 배달',fact:'폭염에는 밖에서 활동하기 힘들어요.',reward:50},
 {title:'쉼터에 필요한 물품',goal:'쉼터 물품 3개 모으기',fact:'폭염은 건강에도 피해를 줘요.',reward:60},
 {title:'관측 기록을 되찾아라',goal:'관측 기록 3장 모으기',fact:'약 30년처럼 오랜 기록을 비교해요.',reward:60},
 {title:'큰 나무 아래의 수호석',goal:'보스를 이기고 마을 돕기',fact:'지금 대비하고, 꾸준히 실천해요.',reward:100}
];
export const QUESTIONS=[
 {level:0,q:'폭염은 어떤 날씨일까요?',a:['지나친 더위','지나친 추위','너무 많은 눈'],correct:0,hint:'폭염은 지나친 더위예요.',art:'hero'},
 {level:0,q:'얇은 옷을 입어도 너무 더워요.',a:['폭설','폭염','한파'],correct:1,hint:'지나친 더위는 폭염이에요.',art:'chief'},
 {level:0,q:'폭염 마을의 모습은?',a:['눈으로 막힌 길','추워서 떠는 주민','더위에 지친 주민'],correct:2,hint:'더워서 생활이 불편해져요.',art:'caretaker'},
 {level:1,q:'배달원은 왜 힘들까요?',a:['눈이 많이 와서','밖이 너무 더워서','강물이 넘쳐서'],correct:1,hint:'폭염에는 야외 활동이 힘들어요.',art:'courier'},
 {level:1,q:'폭염에 특히 힘든 활동은?',a:['그늘에서 쉬기','실내에서 책 읽기','한낮에 오래 일하기'],correct:2,hint:'더운 밖에서 오래 일하기 힘들어요.',art:'crate'},
 {level:1,q:'아이들이 광장을 떠난 까닭은?',a:['너무 더워서','눈이 쌓여서','너무 추워서'],correct:0,hint:'폭염에는 밖에서 놀기 힘들어요.',art:'hero'},
 {level:2,q:'폭염이 몸에 주는 영향은?',a:['더위로 건강 피해','추위로 수도관 동파','눈 때문에 길 막힘'],correct:0,hint:'지나친 더위는 몸에도 해로워요.',art:'caretaker'},
 {level:2,q:'더위로 힘들 때는?',a:['계속 참아요','쉬고 도움받아요','더 오래 뛰어요'],correct:1,hint:'시원한 곳에서 쉬고 도움받아요.',art:'caretaker'},
 {level:2,q:'쉼터에 필요한 물품은?',a:['눈삽','겨울 장갑','마실 물과 컵'],correct:2,hint:'쉼터에서 물을 마시고 쉬어요.',art:'water'},
 {level:3,q:'기후 변화를 알려면?',a:['오늘만 살펴요','여러 해를 살펴요','내 기분을 살펴요'],correct:1,hint:'오랜 기간의 기록을 비교해요.',art:'record'},
 {level:3,q:'가상 기록: 6일과 12일. 더 많은 쪽은?',a:['6일','같아요','12일'],correct:2,hint:'12일이 6일보다 많아요.',art:'record'},
 {level:3,q:'오늘 덥다는 것만으로 알 수 있나요?',a:['오랜 기록도 봐요','하루만 보면 돼요','기록은 필요 없어요'],correct:0,hint:'기후는 오랜 기간 살펴봐요.',art:'observer'},
 {level:4,q:'폭염에 알맞은 대응은?',a:['한낮에 계속 뛰기','물을 마시지 않기','그늘에서 쉬기'],correct:2,hint:'더위를 피해 그늘에서 쉬어요.',art:'water'},
 {level:4,q:'더위로 힘든 친구를 보면?',a:['도움받도록 해요','계속 뛰게 해요','그냥 두어요'],correct:0,hint:'쉼터 선생님께 알려주세요.',art:'caretaker'},
 {level:4,q:'마을에 마련하면 좋은 것은?',a:['그늘 없는 놀이터','쉼터와 마실 물','더 뜨거운 길'],correct:1,hint:'쉼터와 물 마실 곳이 필요해요.',art:'water'}
];
export const LESSONS=[
 {title:'폭염의 뜻',role:'촌장님',art:'chief',source:'광장의 단서 세 곳',summary:['폭염은 지나친 더위예요.','더위 때문에 생활이 불편해져요.'],cards:[['caretaker','지나친 더위'],['platform','생활의 불편']],practice:[
  {id:'heat-clues',task:'빈 광장의 까닭 고르기',q:'주민들이 광장을 떠난 까닭은?',a:['더위를 피해 쉬려고','눈이 길을 막아서','추위 때문에 옷을 더 입으려고'],correct:0,art:'caretaker',why:'빈 벤치와 지친 주민은 더위로 야외 활동이 힘들다는 단서야.'},
  {id:'heat-name',task:'날씨의 모습 구분하기',q:'세 단서가 가리키는 날씨의 모습은?',a:['지나친 더위','지나친 추위','지나치게 많은 눈'],correct:0,art:'record',why:'지나친 더위 때문에 생활이 불편해지고 있어.'},
  {id:'heat-label',task:'현상 이름 고르기',q:'이처럼 지나친 더위로 생활이 불편한 현상의 이름은?',a:['폭염','한파','폭설'],correct:0,art:'chief',why:'이 현상의 이름은 폭염이야. 지나친 더위라는 모습과 이름을 연결해 봐.'},
  {id:'heat-transfer',task:'맑은 날 상황 판단하기',q:'맑은 날이면 모두 폭염일까?',a:['햇빛이 있으면 모두 폭염','지나친 더위인지 살펴야 해','여름은 날마다 폭염'],correct:1,art:'hero',why:'맑다는 것과 지나치게 덥다는 것은 달라. 생활의 불편도 살펴봐.'}
 ]},
 {title:'사람의 활동에 주는 영향',role:'배달원',art:'courier',source:'배달 시간표와 보급 상자',summary:['폭염에는 야외에서 일하기 힘들어요.','활동하는 시간과 장소를 조정해요.'],cards:[['courier','야외 활동이 힘듦'],['crate','활동 계획 바꾸기']],practice:[
  {id:'delivery-time',task:'배달 시간 정하기',q:'배달 시간을 어떻게 바꿀까?',a:['가장 더운 한낮에 몰아서','덜 더운 시간에 나눠서','더위를 참고 쉬지 않고'],correct:1,art:'courier',why:'더운 시간의 야외 일을 줄이는 계획이야. 힘들면 쉬고 도움받자.'},
  {id:'delivery-impact',task:'일터의 어려움 확인하기',q:'배달원이 힘든 건 어떤 영향일까?',a:['더위 때문에 밖에서 일하기 어려움','눈 때문에 길이 막힘','추위로 물이 얼어붙음'],correct:0,art:'crate',why:'기후변화 현상은 일과 이동 같은 사람의 활동을 불편하게 해.'},
  {id:'delivery-transfer',task:'집에서의 변화 확인하기',q:'상자를 받을 집에서도 달라지는 일은?',a:['폭염은 집 생활과 관계없음','더위를 피해 냉방을 더 사용','추위로 물이 얼어붙음'],correct:1,art:'crate',why:'폭염은 바깥일뿐 아니라 집에서 냉방을 사용하는 데도 영향을 줘.'}
 ]},
 {title:'건강 피해와 쉼터',role:'쉼터 선생님',art:'caretaker',source:'물·컵·쉼터 천을 쓰는 까닭',summary:['지나친 더위는 건강에도 피해를 줘요.','쉬고 물을 마시며, 힘들면 도움받아요.'],cards:[['water','물 마시기'],['shadeAction','그늘에서 쉬기'],['helpAction','어른에게 도움']],practice:[
  {id:'shelter-water',task:'물 놓을 곳 고르기',q:'찾은 물을 어떻게 쓸까?',a:['물을 마실 곳에 놓기','아무도 못 마시게 숨기기','물을 안 마시고 계속 뛰기'],correct:0,art:'water',choiceArts:['drinkAction','refuseAction','runAction'],why:'쉼터에서 물을 마실 수 있게 해. 더위에 지친 몸을 돌보는 거야.'},
  {id:'shelter-help',task:'친구 도울 방법 고르기',q:'컵을 옮기는데 친구가 어지럽대!',a:['계속 참으라고 하기','달리면 나아진다고 하기','활동을 멈추고 어른에게 알리기'],correct:2,art:'caretaker',choiceArts:['endureAction','runAction','helpAction'],why:'더위로 힘들 때는 활동을 멈추고 쉬면서 어른에게 도움을 요청해.'},
  {id:'shelter-shade',task:'천으로 그늘 만들기',q:'쉼터 천을 어떻게 쓰는 게 좋을까?',a:['위쪽에 천을 쳐 그늘 만들기','천으로 사방을 빈틈없이 막기','천을 여러 겹 두르기'],correct:0,art:'clothShade',choiceArts:['clothShade','clothClosed','clothLayers'],why:'천으로 햇볕을 가리고 바람은 통하게 해. 사방을 막거나 겹겹이 두르면 더울 수 있어.'}
 ]},
 {title:'날씨와 기후, 오랜 기록',role:'관측소 선생님',art:'observer',source:'찾아온 관측 기록 세 장',summary:['날씨는 짧은 기간의 상태예요.','기후는 약 30년처럼 오랜 기간의 날씨예요.','기후변화는 이런 기후가 오랫동안 달라지는 거예요.'],cards:[['record','오늘의 날씨'],['observer','오랜 기간의 기후']],practice:[
  {id:'records-period',task:'관측 기간 고르기',q:'기후를 살피려면 어떤 기록이 필요할까?',a:['오늘 하루의 기온만','약 30년처럼 오랜 날씨 기록','사진 한 장만'],correct:1,art:'record',why:'기후는 약 30년처럼 오랜 기간 나타난 날씨의 상태야.'},
  {id:'records-compare',task:'관측 그래프 비교하기',q:'이 자료에서는 어느 쪽이 더 많을까?',a:['예전의 폭염 일수','최근의 폭염 일수','둘이 같음'],correct:1,art:'record',diagram:[6,12],why:'이 가상 자료에서는 최근의 평균 폭염 일수가 더 많아.'},
  {id:'records-transfer',task:'날씨와 기후 구분하기',q:'오늘 선선하면 기후변화가 없다는 뜻일까?',a:['하루만으로 정할 수 없어','선선한 하루면 기후변화가 없어','오늘 기록만 남기면 충분해'],correct:0,art:'observer',why:'기후변화는 오랜 기후가 달라지는 것. 하루만으로 정할 수 없어.'}
 ]},
 {title:'지금의 대비와 꾸준한 실천',role:'촌장님',art:'chief',source:'수호석 앞에서 고른 마을 대응',summary:['쉼터와 물은 지금의 피해에 대비해요.','자원과 에너지를 아끼는 실천도 이어가요.'],cards:[['shadeAction','지금 피해 줄이기'],['recycleBadge','자원·에너지 아끼기']],practice:[
  {id:'response-now',task:'쉼터의 도움 확인하기',q:'그늘 쉼터는 무엇을 도와줄까?',a:['지금의 더위 피해 줄이기','날씨를 바로 바꾸기','더위에도 계속 뛰게 하기'],correct:0,art:'shadeAction',why:'쉼터는 당장의 더위로부터 사람을 돕는 대비 방법이야.'},
  {id:'response-long',task:'꾸준한 실천 고르기',q:'집에서 꾸준히 할 수 있는 일은?',a:['쓸 수 있는 물건 다시 쓰기','더워도 냉방을 모두 끄고 참기','일회용품을 더 많이 쓰기'],correct:0,art:'recycleBadge',why:'물건을 다시 쓰면 새 물건을 만드는 데 드는 자원과 에너지를 아낄 수 있어.'},
  {id:'response-transfer',task:'게임과 현실 구분하기',q:'수호석을 찾으면 현실의 기후도 바로 돌아올까?',a:['계속 실천할 필요가 없어','생활에서 꾸준히 실천해야 해','오늘 날씨가 바로 바뀌어'],correct:1,art:'stone',why:'게임의 저주를 풀어도 현실의 기후는 바로 바뀌지 않아. 꾸준한 실천이 필요해.'}
 ]}
];
export const FINAL_TEST=[
 {id:'test-heat',topic:0,q:'며칠째 지나친 더위로 야외 놀이가 힘들어. 어떤 현상일까?',a:['지나친 추위','폭염','지나치게 많은 눈'],correct:1,art:'hero',why:'지나친 더위로 생활이 불편해지는 현상은 폭염이야.'},
 {id:'test-activity',topic:1,q:'농부가 한낮의 바깥일을 줄였대. 어떤 영향일까?',a:['더위로 야외 작업이 어려움','눈으로 교통이 막힘','추위로 수도관이 얼어붙음'],correct:0,art:'courier',why:'농사처럼 밖에서 하는 일도 폭염의 영향을 받아.'},
 {id:'test-health',topic:2,q:'운동하던 친구가 더위로 힘들어해. 어떻게 할까?',a:['참고 더 오래 달리게 하기','그대로 혼자 두기','멈추고 쉬며 어른에게 도움받기'],correct:2,art:'caretaker',choiceArts:['runAction','endureAction','helpAction'],why:'건강 피해가 생길 수 있어. 쉬고 어른에게 도움을 요청해.'},
 {id:'test-records',topic:3,q:'새 기록을 비교해서 알 수 있는 것은?',a:['이 자료에서 최근 폭염 일수가 더 많음','모든 지역의 모든 재해가 똑같이 늘어남','오늘 하루만 보고 기후를 알 수 있음'],correct:0,art:'record',diagram:[4,9],why:'이 자료의 폭염 일수는 비교할 수 있어. 모든 지역과 모든 현상을 단정할 수는 없어.'},
 {id:'test-action',topic:4,q:'일회용 컵 대신 내 컵을 계속 쓰면?',a:['오늘 기온이 바로 내려감','자원을 아끼는 꾸준한 실천이 됨','더운 친구도 쉬지 않아도 됨'],correct:1,art:'recycleBadge',why:'자원을 아끼는 꾸준한 실천이야. 지금의 건강을 돌보는 행동도 함께 필요해.'}
];
export const REVIEW_TEST=[
 {id:'review-heat',topic:0,q:'햇빛은 있지만 선선해. 이것만으로 폭염일까?',a:['지나친 더위와 생활의 불편도 살펴야 해','햇빛이 보이면 모두 폭염','하늘이 맑으면 모두 폭염'],correct:0,art:'hero',why:'폭염은 단순히 맑은 날이 아니라 지나친 더위로 생활이 불편한 현상이야.'},
 {id:'review-activity',topic:1,q:'더운 날 야외 공연 시간을 바꾸는 까닭은?',a:['눈이 너무 많이 쌓여서','더위가 사람의 활동을 어렵게 해서','사람의 활동은 날씨와 관계없어서'],correct:1,art:'courier',why:'야외 공연도 더위의 영향을 받아. 시간과 장소를 조정할 수 있어.'},
 {id:'review-health',topic:2,q:'쉼터에서 물을 마셔도 계속 힘들다면?',a:['무조건 더 뛰기','혼자 계속 참기','활동을 멈추고 어른에게 알리기'],correct:2,art:'helpAction',why:'물만으로 모두 해결된다고 생각하지 말고 쉬며 어른에게 도움을 요청해.'},
 {id:'review-records',topic:3,q:'내일 하루의 날씨만으로 기후변화를 정할 수 있을까?',a:['약 30년처럼 오랜 기록도 필요해','하루면 충분해','기록은 전혀 필요 없어'],correct:0,art:'record',why:'짧은 날씨와 오랜 기후를 구분하고 긴 기간의 기록을 비교해.'},
 {id:'review-action',topic:4,q:'그늘에서 쉬기와 물건 다시 쓰기, 알맞은 설명은?',a:['두 행동이 오늘 날씨를 바로 바꿈','당장 피해에 대비하고 꾸준한 실천도 함','물건을 다시 쓰면 쉬지 않아도 됨'],correct:1,art:'recycleBadge',why:'지금의 피해에 대비하는 행동과 자원·에너지를 아끼는 실천의 도움을 구분해.'}
];
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function initialState(){return {version:VERSION,quest:0,accepted:false,completed:[],clues:[],killed:[],crates:[],supplies:[],records:[],plans:[],bossDead:false,finished:false,xp:0,hp:6,energy:100,x:230,checkpoint:230,learned:0,introSeen:false,sound:false,firstCharge:false,hair:0,color:0,styleVersion:0,appearanceReady:false,playerName:'',profileReady:false,lessonSeen:[],practiceDone:[],practiceFirst:[],testAnswers:[],testReviewed:[]};}
export class Adventure {
 constructor(saved){this.s=initialState();if(saved&&saved.version===VERSION){for(const key of Object.keys(this.s))if(key in saved&&typeof saved[key]===typeof this.s[key])this.s[key]=saved[key];this.s.quest=clamp(Math.floor(this.s.quest)||0,0,4);this.s.hp=clamp(this.s.hp,1,6);this.s.energy=clamp(this.s.energy,0,100);this.s.x=clamp(this.s.x,150,5100);this.s.hair=Number.isInteger(this.s.hair)&&this.s.hair>=0&&this.s.hair<4?this.s.hair:0;this.s.color=Number.isInteger(this.s.color)&&this.s.color>=0&&this.s.color<4?this.s.color:0;if(!('hair'in saved))this.s.hair=saved.avatar==='female'?3:0;this.s.playerName=Array.from(this.s.playerName.trim()).slice(0,8).join('');this.s.profileReady=!!this.s.playerName&&this.s.profileReady;for(const k of ['completed','clues','killed','crates','supplies','records','plans','lessonSeen','practiceDone','practiceFirst','testReviewed'])this.s[k]=[...new Set((Array.isArray(this.s[k])?this.s[k]:[]).filter(x=>typeof x==='string'||typeof x==='number'))];const answers=Array.isArray(this.s.testAnswers)?this.s.testAnswers:[];this.s.testAnswers=[];for(const a of answers.slice(0,5)){if(!Number.isInteger(a)||a<0||a>2)break;this.s.testAnswers.push(a);}}}
 setProfile(hair,color,name){const clean=Array.from(String(name).trim().replace(/\s+/g,' ')).slice(0,8).join('');if(!clean||!Number.isInteger(hair)||!Number.isInteger(color)||hair<0||hair>=4||color<0||color>=4)return false;this.s.hair=hair;this.s.color=color;this.s.styleVersion=2;this.s.appearanceReady=true;this.s.playerName=clean;this.s.profileReady=true;return true;}
 accept(){if(this.s.finished)return false;this.s.accepted=true;this.s.learned=Math.max(this.s.learned,this.s.quest);return true;}
 collect(type,id){if(!this.s.accepted||!['clues','crates','supplies','records','plans'].includes(type))return false;const valid={clues:0,crates:1,supplies:2,records:3,plans:4};if(this.s.quest!==valid[type]||this.s[type].includes(id))return false;this.s[type].push(id);return true;}
 kill(id){if(!this.s.killed.includes(id))this.s.killed.push(id);}
 evidenceReady(){const s=this.s;if(!s.accepted||s.finished)return false;return [s.clues.length>=3,s.crates.length>=2&&s.killed.filter(x=>String(x).startsWith('dust-')).length>=4,s.supplies.length>=3&&s.killed.filter(x=>String(x).startsWith('thorn-')).length>=3,s.records.length>=3,s.bossDead&&s.plans.length>=3][s.quest];}
 lessonComplete(q=this.s.quest){return LESSONS[q].practice.every(p=>this.s.practiceDone.includes(p.id));}
 recordPractice(id,correct){const topic=LESSONS.findIndex(l=>l.practice.some(q=>q.id===id));if(topic<0||topic>this.s.learned)return false;if(!this.s.practiceFirst.some(a=>String(a).startsWith(id+':')))this.s.practiceFirst.push(id+':'+(correct?1:0));if(correct&&!this.s.practiceDone.includes(id))this.s.practiceDone.push(id);return !!correct;}
 recordTestAnswer(index,answer){if((this.s.quest<4&&!this.s.finished)||!this.lessonComplete(4)||index!==this.s.testAnswers.length||index>=5||!Number.isInteger(answer)||answer<0||answer>2)return false;this.s.testAnswers.push(answer);return true;}
 testScore(){return this.s.testAnswers.filter((a,i)=>a===FINAL_TEST[i]?.correct).length;}
 recordReview(topic,correct){if(this.s.testAnswers.length!==5||!this.testGaps().includes(topic)||!correct)return false;if(!this.s.testReviewed.includes(topic))this.s.testReviewed.push(topic);return true;}
 testGaps(){return this.s.testAnswers.length===5?FINAL_TEST.filter((q,i)=>this.s.testAnswers[i]!==q.correct).map(q=>q.topic):[];}
 hasPassedTest(){return this.s.testAnswers.length===5&&this.testGaps().every(topic=>this.s.testReviewed.includes(topic));}
 canComplete(){return this.evidenceReady()&&this.lessonComplete()&&(this.s.quest<4||this.hasPassedTest());}
 complete(){if(!this.canComplete())return false;const q=this.s.quest;this.s.completed.push(q);this.s.xp+=QUESTS[q].reward;this.s.hp=6;this.s.energy=100;this.s.accepted=false;if(q===4){this.s.finished=true;}else this.s.quest++;return true;}
 spend(amount){if(this.s.energy<amount)return false;this.s.energy-=amount;return true;}
 charge(correct){if(correct)this.s.energy=Math.min(100,this.s.energy+ENERGY.charge);return this.s.energy;}
 hurt(){this.s.hp=Math.max(0,this.s.hp-1);return this.s.hp;}
 respawn(){this.s.hp=6;this.s.energy=100;this.s.x=this.s.checkpoint;}
 quizPool(){return QUESTIONS.filter(q=>q.level<=this.s.learned);}
 serialize(){return JSON.stringify(this.s);}
}
