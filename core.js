export const VERSION=1;
export const QUESTS=[
 {title:'텅 빈 광장의 비밀',goal:'반짝이는 단서 3곳 찾기',fact:'폭염은 지나친 더위예요.',reward:30},
 {title:'배달원의 멈춘 수레',goal:'몬스터를 물리치고 상자 배달',fact:'폭염에는 밖에서 활동하기 힘들어요.',reward:50},
 {title:'쉼터에 필요한 물품',goal:'쉼터 물품 3개 모으기',fact:'폭염은 건강에도 피해를 줘요.',reward:60},
 {title:'관측 기록을 되찾아라',goal:'관측 기록 3장 모으기',fact:'오랜 기간의 기록을 비교해요.',reward:60},
 {title:'큰 나무 아래의 수호석',goal:'보스를 이기고 마을 돕기',fact:'그늘 · 물 · 도움을 기억해요.',reward:100}
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
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function initialState(){return {version:VERSION,quest:0,accepted:false,completed:[],clues:[],killed:[],crates:[],supplies:[],records:[],plans:[],bossDead:false,finished:false,xp:0,hp:6,energy:100,x:230,checkpoint:230,learned:0,introSeen:false,sound:false,firstCharge:false,avatar:'male',playerName:'',profileReady:false};}
export class Adventure {
 constructor(saved){this.s=initialState();if(saved&&saved.version===VERSION){for(const key of Object.keys(this.s))if(key in saved&&typeof saved[key]===typeof this.s[key])this.s[key]=saved[key];this.s.quest=clamp(Math.floor(this.s.quest)||0,0,4);this.s.hp=clamp(this.s.hp,1,6);this.s.energy=clamp(this.s.energy,0,100);this.s.x=clamp(this.s.x,150,5100);this.s.avatar=this.s.avatar==='female'?'female':'male';this.s.playerName=Array.from(this.s.playerName.trim()).slice(0,8).join('');this.s.profileReady=!!this.s.playerName&&this.s.profileReady;for(const k of ['completed','clues','killed','crates','supplies','records','plans'])this.s[k]=[...new Set(this.s[k].filter(x=>typeof x==='string'||typeof x==='number'))];}}
 setProfile(avatar,name){const clean=Array.from(String(name).trim().replace(/\s+/g,' ')).slice(0,8).join('');if(!clean||!['male','female'].includes(avatar))return false;this.s.avatar=avatar;this.s.playerName=clean;this.s.profileReady=true;return true;}
 accept(){if(this.s.finished)return false;this.s.accepted=true;this.s.learned=Math.max(this.s.learned,this.s.quest);return true;}
 collect(type,id){if(!this.s.accepted||!['clues','crates','supplies','records','plans'].includes(type))return false;const valid={clues:0,crates:1,supplies:2,records:3,plans:4};if(this.s.quest!==valid[type]||this.s[type].includes(id))return false;this.s[type].push(id);return true;}
 kill(id){if(!this.s.killed.includes(id))this.s.killed.push(id);}
 canComplete(){const s=this.s;if(!s.accepted||s.finished)return false;return [s.clues.length>=3,s.crates.length>=2&&s.killed.filter(x=>String(x).startsWith('dust-')).length>=4,s.supplies.length>=3&&s.killed.filter(x=>String(x).startsWith('thorn-')).length>=3,s.records.length>=3,s.bossDead&&s.plans.length>=3][s.quest];}
 complete(){if(!this.canComplete())return false;const q=this.s.quest;this.s.completed.push(q);this.s.xp+=QUESTS[q].reward;this.s.hp=6;this.s.energy=100;this.s.accepted=false;if(q===4){this.s.finished=true;}else this.s.quest++;return true;}
 spend(amount){if(this.s.energy<amount)return false;this.s.energy-=amount;return true;}
 charge(correct){if(correct)this.s.energy=Math.min(100,this.s.energy+40);return this.s.energy;}
 hurt(){this.s.hp=Math.max(0,this.s.hp-1);return this.s.hp;}
 respawn(){this.s.hp=6;this.s.energy=100;this.s.x=this.s.checkpoint;}
 quizPool(){return QUESTIONS.filter(q=>q.level<=this.s.learned);}
 serialize(){return JSON.stringify(this.s);}
}
