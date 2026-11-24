/* Generates a bounded 40,000-item practice pool from reviewed task families.
   Pools are built one unit at a time and cached only for the current session. */
(function(){
 const cache=new Map();
 const scene=[['りんご','こ'],['カード','まい'],['えんぴつ','本'],['花','本'],['クッキー','こ'],['シール','まい'],['リボン','cm'],['本','さつ'],['ボール','こ'],['ジュース','本'],['水','L'],['おり紙','まい'],['ビー玉','こ'],['色えんぴつ','本'],['チケット','まい'],['タイル','まい'],['小びん','本'],['木','本'],['子ども','人'],['箱','箱']];
 const mod=(x,m)=>((x%m)+m)%m;
 function rand(i,seed,m){let x=Math.imul(i+1,0x45d9f3b)^Math.imul(seed+1,0x27d4eb2d);x=Math.imul(x^(x>>>16),0x45d9f3b);x=(x^(x>>>16))>>>0;return x%m}
 const pick=(i,seed,min,max)=>min+rand(i,seed,max-min+1);
 const f=(n,d)=>`〔F${n}:${d}〕`;
 const comma=n=>Number(n).toLocaleString('ja-JP');
 function make(unit,kind,i,skill,prompt,answer,hint,explain,extra={}){return {id:`u${unit}g${kind[0]}${i+1}`,kind,skill,prompt:String(prompt),answer:String(answer),hint,explain,...extra}}
 function choices(q,right,wrong,i){const opts=[];for(const x of [right,...wrong])if(x!==undefined&&!opts.includes(String(x)))opts.push(String(x));let step=1;while(opts.length<4){const x=Number(right)+step;if(Number.isFinite(x)&&!opts.includes(String(x)))opts.push(String(x));step++}const vals=opts.slice(0,4),shift=rand(i,q.id.length,4),c=vals.map((v,j)=>[String.fromCharCode(65+mod(j+shift,4)),v]);return {...q,answer:c.find(x=>x[1]===String(right))[0],choices:c,correctValue:String(right)}}
 function autoChoice(q,i){
  if(q.kind!=='cbt'||i%2||q.choices)return q;
  const answer=String(q.answer),time=/^(\d+)時(\d+)分$/.exec(answer);
  if(time){const total=Number(time[1])*60+Number(time[2]),wrong=[];for(const offset of [5,-5,10,-10,15,-15,1,-1]){const v=total+offset;if(v<0)continue;const value=`${Math.floor(v/60)}時${String(v%60).padStart(2,'0')}分`;if(value!==answer&&!wrong.includes(value))wrong.push(value)}return choices(q,answer,wrong,i)}
  const rem=/^(\d+)あまり(\d+)$/.exec(answer);
  if(rem){const quotient=Number(rem[1]),remainder=Number(rem[2]),divisor=Number((/÷(\d+)/.exec(q.prompt)||/([0-9]+)こずつ/.exec(q.prompt)||[])[1]),wrong=[];for(const value of [`${quotient+1}あまり${remainder}`,`${Math.max(0,quotient-1)}あまり${remainder}`,`${quotient}あまり${remainder+1}`,`${quotient}あまり${Math.max(0,remainder-1)}`,`${quotient+2}あまり${remainder}`])if(value!==answer&&(!divisor||Number(value.match(/あまり(\d+)/)[1])<divisor)&&!wrong.includes(value))wrong.push(value);if(wrong.length>=3)return choices(q,answer,wrong,i)}
  const packed=/^(\d+)箱、(\d+)こあまり$/.exec(answer);
  if(packed){const boxes=Number(packed[1]),left=Number(packed[2]),wrong=[`${boxes+1}箱、${left}こあまり`,`${Math.max(0,boxes-1)}箱、${left}こあまり`,`${boxes}箱、${left+1}こあまり`,`${boxes}箱、${Math.max(0,left-1)}こあまり`].filter(v=>v!==answer);return choices(q,answer,wrong,i)}
  const n=Number(answer);if(!Number.isFinite(n))return q;
  const decimal=answer.split('.')[1]?.length||0,step=10**(-decimal),offsets=decimal?[step,-step,2*step,-2*step,1,-1,3*step,-3*step]:n<10?[1,-1,2,-2,3,-3,4,-4]:n<20?[1,-1,2,-2,5,-5,10,-10]:n<100?[1,-1,2,-2,5,-5,10,-10]:[1,-1,10,-10,2,-2,100,-100],factor=10**decimal,wrong=[];for(const offset of offsets){const value=Math.round((n+offset)*factor)/factor;if(value>=0&&value!==n&&!wrong.includes(value))wrong.push(value)}return choices(q,n,wrong,i)
 }
 const totals=[600,1800,2500,2000,2400,2000,2600,2400,2000,2200,300,2200,2000,2600,2000,600,1000,2800,3000,3000];
 function build(unit,kind,i){const u=unit+1,t=i%6,n=i,a=pick(n,u*17+0,1,99),b=pick(n,u*19+1,1,89),c=pick(n,u*23+2,1,79),sc=scene[rand(n,u*29+3,scene.length)];let skill,prompt,answer,hint,explain,extra={};
  switch(u){
   case 1:{const x=pick(n,u+4,1,9),y=pick(n,u+7,1,9),z=pick(n,u+11,1,8),s=scene[rand(n,u+13,scene.length)];skill=['九九','かけ算の表し方','□に入る数','かけ算のきまり','まとまりの数','九九の活用'][t];
    if(t===0){const form=rand(n,u+31,5);prompt=[`${x}×${y}＝？`,`1つに${x}こずつ入った${s[0]}が${y}つあります。全部で何こですか。`,`たてに${x}こ、横に${y}こならんだ${s[0]}は全部で何こですか。`,`${x}こずつのまとまりが${y}つあります。全部で何こですか。`,`${x}を${y}回たした数はいくつですか。`][form];answer=x*y;hint=`${x}が${y}こ分だよ。`;explain=`${x}×${y}＝${answer}です.`;}
    else if(t===1){const form=rand(n,u+32,4),ten=1+rand(n,u+33,9);prompt=[`${ten*10}×${x}＝？`,`10が${ten}こずつ${x}組あります。全部でいくつですか。`,`${ten*10}を${x}回たすといくつですか。`,`10のまとまりが${ten*x}こあります。いくつですか。`][form];answer=ten*10*x;hint='10のまとまりの数を先に考えよう。';explain=`${ten}×${x}＝${ten*x}。10が${ten*x}こで${answer}です.`;}
    else if(t===2){const form=rand(n,u+34,4);prompt=[`□×${x}＝${x*y}。□はいくつ？`,`${x}こずつ${y}組で${x*y}こです。組の数は？`,`${x}×□＝${x*y}。□に入る数は？`,`${x*y}この${sc[0]}を${x}こずつ分けると何組？`][form];answer=y;hint=`${x}の段で${x*y}になる数を探そう。`;explain=`${x}×${y}＝${x*y}なので、答えは${y}です.`;}
    else if(t===3){prompt=`${x}×${y}と${x}×${y+z}では、後の答えは前よりいくつ大きいですか。`;answer=x*z;hint=`かける数が${z}ふえると、${x}が何こ分ふえるかな。`;explain=`${x}が${z}こ分ふえるので、答えは${x*z}大きくなります.`;}
    else if(t===4){const form=rand(n,u+35,4);prompt=[`${x}×${y}の答えは？`,`${y}×${x}の答えは？`,`${x}の段で${y}番目の答えはいくつ？`,`${x}を${y}つ分集めるといくつ？`][form];answer=x*y;hint=`${x}の段を使おう。`;explain=`${x}×${y}＝${answer}です.`;}
    else{const groups=pick(n,u+36,1,9),each=pick(n,u+37,1,9);prompt=`${sc[0]}が1ふくろに${each}${sc[1]}あります。${groups}ふくろでは何${sc[1]}ですか。`;answer=groups*each;hint=`${each}${sc[1]}が${groups}つ分だよ。`;explain=`${each}×${groups}＝${answer}${sc[1]}です.`;extra.unit=sc[1]}
    break;}
   case 2:{const d=pick(n,u+4,2,9),q=pick(n,u+7,2,30),r=rand(n,u+9,d);skill=['わり算','答えが10をこえるわり算','わり算の確かめ','同じ数ずつ分ける','商とあまり','わり算の活用'][t];const total=d*q+([2,4].includes(t)?r:0);
    if(t===2){prompt=`${total}÷${d}＝${q}${r?'あまり'+r:''}をたしかめる式は？`;answer=`${d}×${q}${r?'＋'+r:''}＝${total}`;hint='わる数×商に、あまりを足してみよう。';explain=`${d}×${q}${r?'＋'+r:''}＝${total}です.`;}
    else if(t===3){const s=scene[rand(n,u+13,scene.length)];prompt=`${total}${s[1]}の${s[0]}を${d}人に同じ数ずつ分けます。1人分は何${s[1]}ですか。`;answer=q;hint=`${total}を${d}人に分けよう。`;explain=`${total}÷${d}＝${q}${s[1]}です.`;extra.unit=s[1]}
    else if(t===4){prompt=`${total}÷${d}の商とあまりを答えよう。`;answer=`${q}あまり${r}`;hint=`${d}×${q}を計算して、残りを考えよう。`;explain=`${total}＝${d}×${q}＋${r}なので${q}あまり${r}です.`;}
    else{prompt=`${total}÷${d}＝？`;answer=q;hint=`${d}×□＝${total}になる数を考えよう。`;explain=`${d}×${q}＝${total}なので${total}÷${d}＝${q}です.`;}
    break;}
   case 3:{const x=100+pick(n,u+4,1,899),y=100+pick(n,u+8,1,899),hi=Math.max(x,y),lo=Math.min(x,y);skill=['たし算筆算','ひき算筆算','計算の工夫','文章題','数の計算','計算の説明'][t];
    if(t%3===0){prompt=`${x}＋${y}＝？`;answer=x+y;hint='位をそろえて、一の位から計算しよう。';explain=`${comma(x)}＋${comma(y)}＝${comma(answer)}です.`}
    else if(t%3===1){prompt=`${hi}－${lo}＝？`;answer=hi-lo;hint='位をそろえて、一の位からひこう。';explain=`${comma(hi)}－${comma(lo)}＝${answer}です.`}
    else{prompt=`${x}＋${y}の答えは？先に十の位と一の位に分けて計算しよう。`;answer=x+y;hint='数を位ごとに分けて考えよう。';explain=`答えは${comma(answer)}です.`}
    if(kind==='applied'){const s=scene[rand(n,u+14,scene.length)];prompt=`図書室に本が${x}さつあり、${y}さつ増えました。全部で何さつですか。`;answer=x+y;hint='増えた数を足そう。';explain=`${x}＋${y}＝${comma(answer)}さつです.`;extra.unit='さつ'}break;}
   case 4:{const h=6+rand(n,u+5,13),m=rand(n,u+9,12)*5,dt=(1+rand(n,u+12,11))*5,end=h*60+m+dt,eh=Math.floor(end/60),em=end%60;skill=['時こく','時間','時こくの計算','時間の文章題','分と秒','時間の読み取り'][t];
    if(t===0||t===3){prompt=`${h}時${String(m).padStart(2,'0')}分の${dt}分後は何時何分ですか。`;answer=`${eh}時${String(em).padStart(2,'0')}分`;hint='次の時こくまで何分か考えよう。';explain=`${h}時${String(m).padStart(2,'0')}分から${dt}分後は${answer}です.`;}
    else if(t===1){prompt=`${h}時${String(m).padStart(2,'0')}分から${eh}時${String(em).padStart(2,'0')}分までは何分ですか。`;answer=dt;hint='終わりまで何分進んだか考えよう。';explain=`かかった時間は${dt}分です.`;extra.unit='分'}
    else if(t===2){const hours=1+rand(n,u+18,4),mins=rand(n,u+19,6)*10;prompt=`${hours}時間${mins}分は何分ですか。`;answer=hours*60+mins;hint='1時間は60分だよ。';explain=`${hours}×60＋${mins}＝${answer}分です.`;extra.unit='分'}
    else{const mins=1+rand(n,u+20,59);prompt=`${mins}分は何秒ですか。`;answer=mins*60;hint='1分は60秒だよ。';explain=`${mins}×60＝${answer}秒です.`;extra.unit='秒'}break;}
   case 5:{const x=1000+pick(n,u+4,0,99998999),digits=String(x).split('').map(Number),expanded=digits.map((v,i)=>v*Math.pow(10,digits.length-i-1)).filter(Boolean).map(comma).join('＋');skill=['位取り','数の構成','数の大小','万を単位にした数','10倍・100倍・1000倍','10でわる'][t];
    if(t===0){const placeDigit=Math.floor(x/10000)%10;prompt=`${comma(x)}の万の位の数字はいくつですか。`;answer=placeDigit;hint='右から5番目の数字を見よう。';explain=`万の位の数字は${placeDigit}です.`}
    else if(t===1){prompt=`${expanded}を計算しよう。`;answer=x;hint='位ごとの数を合わせよう。';explain=`答えは${comma(x)}です.`}
    else if(t===2){const y=pick(n,u+25,x+1,99999999);prompt=`${comma(x)}と${comma(y)}では、どちらが大きいですか。`;answer=y;hint='けた数を比べ、同じなら左の位から比べよう。';explain=`${comma(y)}のほうが大きいです.`}
    else if(t===3){const tenThousands=1+rand(n,u+27,9999),value=tenThousands*10000;prompt=`10,000を${comma(tenThousands)}こ集めると、いくつですか。`;answer=value;hint='10,000が何こ分か考えよう。';explain=`10,000×${comma(tenThousands)}＝${comma(value)}です.`}
    else if(t===4){const base=1+rand(n,u+33,99999),scale=[10,100,1000][rand(n,u+34,3)];prompt=`${comma(base)}を${scale}倍した数はいくつですか。`;answer=base*scale;hint='かける数だけ位を左に動かそう。';explain=`${comma(base)}×${scale}＝${comma(answer)}です.`}
    else{const quotient=1+rand(n,u+35,9999999),multiple=quotient*10;prompt=`${comma(multiple)}を10でわると、いくつですか。`;answer=quotient;hint='10でわると、位が1つ右へ移るよ。';explain=`${comma(multiple)}÷10＝${comma(quotient)}です.`}break;}
   case 6:{const x=1+rand(n,u+5,70),y=1+rand(n,u+9,70),z=1+rand(n,u+13,70);skill=['表を読む','資料の合計','ぼうグラフ','資料をくらべる','目盛りを読む','その他の数'][t];
    if(t===0){prompt=`表に、月曜日${x}人・火曜日${y}人・水曜日${z}人とあります。火曜日は何人ですか。`;answer=y;hint='火曜日の数を見よう。';explain=`火曜日は${y}人です.`;extra.unit='人'}
    else if(t===1){prompt=`好きな遊びは、なわとび${x}人・おにごっこ${y}人・ドッジボール${z}人です。合計は何人ですか。`;answer=x+y+z;hint='3つの人数を足そう。';explain=`${x}＋${y}＋${z}＝${answer}人です.`;extra.unit='人'}
    else if(t===2){const perTick=1+rand(n,u+17,9),ticks=1+rand(n,u+21,20);prompt=`1目盛りが${perTick}人のぼうグラフで、ぼうは${ticks}目盛りです。何人ですか。`;answer=perTick*ticks;hint=`${perTick}人が${ticks}つ分だよ。`;explain=`${perTick}×${ticks}＝${answer}人です.`;extra.unit='人'}
    else if(t===3){const hi=Math.max(x,y),lo=Math.min(x,y);prompt=`赤組は${hi}点、青組は${lo}点でした。赤組は何点多いですか。`;answer=hi-lo;hint='大きい数から小さい数をひこう。';explain=`${hi}－${lo}＝${answer}点です.`;extra.unit='点'}
    else if(t===4){prompt=`表に、りんご${x}人・みかん${y}人・ぶどう${z}人とあります。みかんは何人ですか。`;answer=y;hint='みかんの数を読もう。';explain=`みかんは${y}人です.`;extra.unit='人'}
    else{const other=1+rand(n,u+29,70),total=x+y+z+other;prompt=`全部で${total}人に聞きました。りんご${x}人、みかん${y}人、ぶどう${z}人です。その他は何人ですか。`;answer=other;hint='分かっている人数を合わせて、全体からひこう。';explain=`${total}－(${x}＋${y}＋${z})＝${other}人です.`;extra.unit='人'}break;}
   case 7:{const x=10+rand(n,u+5,89),y=10+rand(n,u+11,89);skill=['暗算','計算の工夫','100からひく','買い物','文章題','計算の説明'][t];
    if(t===0||t===1){prompt=`${x}＋${y}＝？`;answer=x+y;hint='十のまとまりと一の位に分けて計算しよう。';explain=`${x}＋${y}＝${answer}です.`}
    else if(t===2){const hi=Math.max(x,y),lo=Math.min(x,y);prompt=`${hi}－${lo}＝？`;answer=hi-lo;hint='位ごとに分けてひこう。';explain=`${hi}－${lo}＝${answer}です.`}
    else if(t===3){const s=scene[rand(n,u+17,scene.length)];prompt=`${x}円のノートと${y}円の${s[0]}を買います。合わせていくらですか。`;answer=x+y;hint='2つの代金を足そう。';explain=`${x}＋${y}＝${answer}円です.`;extra.unit='円'}
    else{const start=Math.max(x,y),used=Math.min(x,y);prompt=`カードが${start}まいあり、${used}まい使いました。残りは何まいですか。`;answer=start-used;hint='使った数をひこう。';explain=`${start}－${used}＝${answer}まいです.`;extra.unit='まい'}break;}
   case 8:{const x=100+rand(n,u+5,899),y=100+rand(n,u+11,899);skill=['kmとm','長さの計算','長さをくらべる','道のり','長さの表し方','巻尺'][t];
    if(t===0){const km=1+rand(n,u+17,8),m=rand(n,u+19,999);prompt=`${km}km${m}mは何mですか。`;answer=km*1000+m;hint='1kmは1,000mだよ。';explain=`${km}×1,000＋${m}＝${comma(answer)}mです.`;extra.unit='m'}
    else if(t===1){prompt=`${x}m＋${y}m＝？`;answer=x+y;hint='同じ単位どうしを足そう。';explain=`答えは${comma(answer)}mです.`;extra.unit='m'}
    else if(t===2){const hi=Math.max(1000+x,y),lo=Math.min(1000+x,y);prompt=`${hi}mと${lo}mでは、どちらが何m長いですか。`;answer=hi-lo;hint='長いほうから短いほうをひこう。';explain=`差は${answer}mです.`;extra.unit='m'}
    else if(t===3){const lap=100+rand(n,u+21,900),times=2+rand(n,u+27,9);prompt=`1周${lap}mの道を${times}周しました。何m進みましたか。`;answer=lap*times;hint=`${lap}mが${times}つ分だよ。`;explain=`${lap}×${times}＝${comma(answer)}mです.`;extra.unit='m'}
    else if(t===4){const meters=1000+rand(n,u+29,9000);prompt=`${comma(meters)}mは何km何mですか。`;answer=`${Math.floor(meters/1000)}km${meters%1000}m`;hint='1,000mが何こあるか考えよう。';explain=`${comma(meters)}m＝${answer}です.`}
    else{const start=20+rand(n,u+31,70),end=start+x;prompt=`巻尺の${start}cmから${end}cmまでの長さは何cmですか。`;answer=x;hint='終わりの目盛りから始めた目盛りをひこう。';explain=`${end}－${start}＝${x}cmです.`;extra.unit='cm'}break;}
   case 9:{const d=2+rand(n,u+5,8),q=2+rand(n,u+11,30),r=rand(n,u+17,d),total=d*q+r;skill=['あまりのあるわり算','商とあまり','答えの確かめ','場面に合う答え','あまりの大きさ','わり算の活用'][t];
    if(t===0||t===4){prompt=`${total}÷${d}＝？（商とあまり）`;answer=`${q}あまり${r}`;hint=`${d}×${q}を計算して、残りを考えよう。`;explain=`${total}＝${d}×${q}＋${r}なので${q}あまり${r}です.`}
    else if(t===1){prompt=`${total}÷${d}の商とあまりを答えよう。`;answer=`${q}あまり${r}`;hint=`${d}ずつのまとまりがいくつできるか考えよう。`;explain=`商は${q}、あまりは${r}です.`}
    else if(t===2){prompt=`${total}÷${d}＝${q}あまり${r}を確かめる式は？`;answer=`${d}×${q}＋${r}＝${total}`;hint='わる数×商＋あまりだよ。';explain=`${d}×${q}＋${r}＝${total}です.`}
    else if(t===3){prompt=`${total}この品物を${d}こずつ箱に入れます。いっぱいの箱は何箱でき、何こあまりますか。`;answer=`${q}箱、${r}こあまり`;hint=`${d}こずつ分けよう。`;explain=`${total}÷${d}＝${q}あまり${r}なので、${q}箱できて${r}こあまります.`}
    else{prompt=`あまりはわる数${d}より小さいです。${total}÷${d}の商はいくつですか。`;answer=q;hint=`${d}×□が${total}をこえないように考えよう。`;explain=`商は${q}、あまりは${r}です.`}break;}
   case 10:{const kg=1+rand(n,u+5,9),g=rand(n,u+11,999),x=100+rand(n,u+17,900),y=100+rand(n,u+21,900);skill=['kgとg','重さの計算','重さをくらべる','はかり','重さの文章題','単位を直す'][t];
    if(t===0){prompt=`${kg}kg${g}gは何gですか。`;answer=kg*1000+g;hint='1kgは1,000gだよ。';explain=`${kg}×1,000＋${g}＝${comma(answer)}gです.`;extra.unit='g'}
    else if(t===1){prompt=`${x}g＋${y}g＝？`;answer=x+y;hint='同じ単位どうしを足そう。';explain=`答えは${comma(answer)}gです.`;extra.unit='g'}
    else if(t===2){const hi=Math.max(1000+x,y),lo=Math.min(1000+x,y);prompt=`${hi}gと${lo}gでは、どちらが何g重いですか。`;answer=hi-lo;hint='重いほうから軽いほうをひこう。';explain=`差は${answer}gです.`;extra.unit='g'}
    else if(t===3){const tick=10+rand(n,u+23,90),ticks=2+rand(n,u+25,18);prompt=`はかりの1目盛りは${tick}gです。針が${ticks}目盛りを指すと何gですか。`;answer=tick*ticks;hint=`${tick}gが${ticks}つ分だよ。`;explain=`${tick}×${ticks}＝${answer}gです.`;extra.unit='g'}
    else if(t===4){prompt=`${kg}kg入りの土が${2+rand(n,u+29,8)}袋あります。全部で何kgですか。`;const bags=2+rand(n,u+29,8);answer=kg*bags;hint=`${kg}kgが${bags}袋分だよ。`;explain=`${kg}×${bags}＝${answer}kgです.`;extra.unit='kg'}
    else{const tonne=1+rand(n,u+31,9);prompt=`${tonne}tは何kgですか。`;answer=tonne*1000;hint='1tは1,000kgだよ。';explain=`${tonne}×1,000＝${comma(answer)}kgです.`;extra.unit='kg'}break;}
   case 11:{const r=1+rand(n,u+5,99);skill=['円の半径','円の直径','球の半径','円の半径','円の直径','球の直径'][t];
    if(t===0||t===3){prompt=`円の中心から円周までが${r}cmです。半径は何cmですか。`;answer=r;hint='中心から円周までが半径だよ。';explain=`半径は${r}cmです.`;extra.unit='cm'}
    else if(t===1||t===4){prompt=`半径${r}cmの円の直径は何cmですか。`;answer=r*2;hint='直径は半径の2つ分。';explain=`${r}×2＝${r*2}cmです.`;extra.unit='cm'}
    else if(t===2){prompt=`直径${r*2}cmの球で、中心から表面までの長さは何cmですか。`;answer=r;hint='球の半径は、直径の半分だよ。';explain=`${r*2}÷2＝${r}cmです.`;extra.unit='cm'}
    else{prompt=`半径${r}cmの球を、中心を通る平らな面で切りました。切り口の円の直径は何cmですか。`;answer=r*2;hint='中心を通る切り口の直径は、球の直径と同じだよ。';explain=`${r}×2＝${r*2}cmです.`;extra.unit='cm'}break;}
   case 12:{const x=2+rand(n,u+5,98),factor=2+rand(n,u+11,9),product=x*factor;skill=['何倍か','倍の関係','もとの数を考える','何倍の文章題','長さを比べる','式を選ぶ'][t];
    if(t%3===0){prompt=`赤いリボンは${x}cm、青いリボンはその${factor}倍です。青は何cmですか。`;answer=product;hint=`${x}cmが${factor}つ分。`;explain=`${x}×${factor}＝${product}cmです.`;extra.unit='cm'}
    else if(t%3===1){prompt=`赤い道は${product}m、青い道は${x}mです。赤い道は青い道の何倍ですか。`;answer=factor;hint=`${product}の中に${x}がいくつ分あるか考えよう。`;explain=`${product}÷${x}＝${factor}なので${factor}倍です.`}
    else{prompt=`青いテープは${product}cmで、赤いテープの${factor}倍です。赤は何cmですか。`;answer=x;hint=`${product}を${factor}つに同じように分けよう。`;explain=`${product}÷${factor}＝${x}cmです.`;extra.unit='cm'}break;}
   case 13:{const x=1+rand(n,u+5,9),y=1+rand(n,u+11,9),z=1+rand(n,u+17,9);skill=['かけ算のじゅんじょ','計算のまとまり','かけ算の工夫','文章題','式の意味','計算の説明'][t];
    if(t%3===0){prompt=`${x}×${y}×${z}＝？`;answer=x*y*z;hint='計算しやすい2つを先にかけよう。';explain=`${x}×${y}×${z}＝${answer}です.`}
    else if(t%3===1){prompt=`${x}×（${y}×${z}）＝？`;answer=x*y*z;hint='かっこの中を先に計算しよう。';explain=`${y}×${z}＝${y*z}、${x}×${y*z}＝${answer}です.`}
    else{const s=scene[rand(n,u+19,scene.length)];prompt=`1ふくろに${x}この${s[0]}が入っています。${y}ふくろ入りの箱が${z}箱あります。全部で何こですか。`;answer=x*y*z;hint=`${x}こずつが${y}ふくろ、さらに${z}箱分だよ。`;explain=`${x}×${y}×${z}＝${answer}こです.`;extra.unit='こ'}break;}
   case 14:{const x=10+rand(n,u+5,990),y=2+rand(n,u+11,9);skill=['2・3けた×1けた','筆算','くり上がり','何十×1けた','文章題','計算の見通し'][t];
    if(t===3){const tens=10*(1+rand(n,u+13,90));prompt=`${tens}×${y}＝？`;answer=tens*y;hint='十のまとまりの数をかけよう。';explain=`${tens}×${y}＝${comma(answer)}です.`}
    else{prompt=`${x}×${y}＝？`;answer=x*y;hint='一の位からかけ、くり上がりに気をつけよう。';explain=`${x}×${y}＝${comma(answer)}です.`}
    if(kind==='applied'){const s=scene[rand(n,u+17,scene.length)];prompt=`1箱に${x}本の${s[0]}が入っています。${y}箱では何本ですか。`;answer=x*y;hint=`${x}本が${y}箱分。`;explain=`${x}×${y}＝${comma(answer)}本です.`;extra.unit='本'}break;}
   case 15:{const x=1+rand(n,u+5,9),y=1+rand(n,u+11,9),z=1+rand(n,u+17,9),op=t%2?'-':'+';skill=['まとまりを考える','計算のきまり','分配の考え方','文章題','式をまとめる','計算の工夫'][t];
    if(t===3){const people=y+z;prompt=`${people}人に${x}こずつ配ります。${y}人に配ったあと、残りの人にも配ると全部で何こですか。`;answer=people*x;hint=`${x}こずつ配る人数は全部で何人かな。`;explain=`${x}×${y}＋${x}×${z}＝${answer}こです.`;extra.unit='こ'}
    else if(op==='-'&&t===5){const a=Math.max(y,z),b=Math.min(y,z);prompt=`${x}×（${a}＋${b}）－${x}×${b}＝？`;answer=x*a;hint=`かっこの中を先に考え、${x}×${b}をひこう。`;explain=`${x}×（${a}＋${b}）－${x}×${b}＝${x}×${a}＝${answer}です.`}else{const a=op==='-'?Math.max(y,z):y,b=op==='-'?Math.min(y,z):z;prompt=`${x}×${a} ${op} ${x}×${b}＝？`;answer=x*(a+(op==='+'?b:-b));hint=`${x}が${a}こ分と${b}こ分あると考えよう。`;explain=`${x}×${a} ${op} ${x}×${b}＝${answer}です.`}break;}
   case 16:{let d=2+rand(n,u+5,9),p=1+rand(n,u+11,d-1),q=1+rand(n,u+17,d-1);skill=['分数の表し方','分数の大きさ','分数のたし算','分数のひき算','分数と1','分数の文章題'][t];
    if(t===0){prompt=`1mを${d}等分した長さを${p}こ分集めました。何mですか。`;answer=`F${p}:${d}`;hint=`1mの${d}等分が${p}こ分だよ。`;explain=`答えは${f(p,d)}mです.`;extra.unit='m'}
    else if(t===1){const big=Math.max(p,q),small=Math.min(p,q);prompt=`同じ分母の分数${f(big,d)}と${f(small,d)}では、どちらが大きいですか。`;answer=`F${big}:${d}`;hint='分母が同じなので、分子を比べよう。';explain=`${big}こ分のほうが大きいです.`}
    else if(t===2){let sum=Math.min(d,p+q);if(sum-p<1){p=d-1;q=1;sum=d}prompt=`${f(p,d)}＋${f(sum-p,d)}＝？`;answer=`F${sum}:${d}`;hint='同じ大きさの何等分を何こ分合わせるか考えよう。';explain=`合わせて${sum}こ分なので${f(sum,d)}です.`}
    else if(t===3){const big=Math.max(p,q),small=Math.min(p,q);prompt=`${f(big,d)}－${f(small,d)}＝？`;answer=`F${big-small}:${d}`;hint='同じ分母なので、分子の数をひこう。';explain=`${big-small}こ分なので${f(big-small,d)}です.`}
    else if(t===4){prompt=`${f(p,d)}は${f(1,d)}が何こ分ですか。`;answer=p;hint='分子の数を見よう。';explain=`${f(1,d)}が${p}こ分です.`}
    else{prompt=`1Lを${d}等分したうち${p}つ分のジュースは何Lですか。`;answer=`F${p}:${d}`;hint=`1Lの${d}等分が${p}つ分だよ。`;explain=`${f(p,d)}Lです.`;extra.unit='L'}
    if(kind==='cbt'&&i%2===0){const fraction=/^F(\d+):(\d+)$/.exec(String(answer)),right=fraction?Number(fraction[1])/Number(fraction[2]):Number(answer),opts=[String(answer)],candidates=[];if(fraction){const [rn,rd]=[Number(fraction[1]),Number(fraction[2])];for(const [a,b] of [[Math.max(1,p-1),d],[p+1,d],[p,d+1],[p,Math.max(2,d-1)],[p+2,d+1],[Math.max(1,p-2),d+1],[rn+1,rd],[rn-1,rd]])candidates.push(`F${a}:${b}`)}else candidates.push(String(Number(answer)-1),String(Number(answer)+1),String(Number(answer)+2),String(Number(answer)-2));const values=new Set([right]);for(const v of candidates){if(opts.length===4)break;if(opts.includes(v))continue;let value;const m=/^F(\d+):(\d+)$/.exec(v);value=m?Number(m[1])/Number(m[2]):Number(v);if(!Number.isFinite(value)||values.has(value))continue;values.add(value);opts.push(v)}for(let a=1;opts.length<4;a++){const v=fraction?`F${a}:${d+2}`:String(Number(answer)+10+a),m=/^F(\d+):(\d+)$/.exec(v),value=m?Number(m[1])/Number(m[2]):Number(v);if(!values.has(value)){values.add(value);opts.push(v)}}const shift=rand(i,u+9,4),choices=opts.map((v,j)=>[String.fromCharCode(65+mod(j+shift,4)),v]),q0=make(u,kind,i,skill,prompt,answer,hint,explain,extra);return {...q0,answer:choices.find(v=>v[1]===String(answer))[0],choices,correctValue:String(answer)}}
    break;}
   case 17:{const x=2+rand(n,u+5,98),third=1+rand(n,u+11,2*x-1),equil=t===2;skill=['三角形の分類','二等辺三角形','正三角形','辺の長さ','三角形の組み合わせ','正三角形のしきつめ'][t];const side=equil?`${x}cm、${x}cm、${x}cm`:`${x}cm、${x}cm、${third===x?third+1:third}cm`;answer=equil?'正三角形':'二等辺三角形';prompt=`辺の長さが${side}の三角形は何ですか。`;hint=equil?'3つの辺の長さを比べよう。':'同じ長さの辺がいくつあるか見よう。';explain=`${side}なので${answer}です.`;
    if(t===4){const a=3+rand(n,u+19,7),b=4+rand(n,u+23,7);prompt=`三角形Aの辺は${a}cm、${a}cm、${a+2}cmです。三角形Bの3辺は${b}cm、${b}cm、${b}cmです。AとBの名前の組み合わせはどれですか。`;answer='Aは二等辺三角形、Bは正三角形';hint='Aは同じ長さの辺が2本、Bは3本あるね。';explain='同じ長さの辺が2本あるAは二等辺三角形、3本とも同じBは正三角形です。';const wrong=['Aは正三角形、Bは二等辺三角形','Aは二等辺三角形、Bは二等辺三角形','Aは正三角形、Bは正三角形'];return choices(make(u,kind,i,skill,prompt,answer,hint,explain),answer,wrong,i)}if(t===5){prompt='正三角形のタイルをすき間なくならべて、大きな模様を作ります。となり合うタイルは、どの部分を合わせてならべますか。';answer='辺と辺';hint='三角形のまわりにある、まっすぐな部分に注目しよう。';explain='辺と辺をぴったり合わせると、すき間なくならべられます。';const wrong=['頂点と頂点だけ','辺の一部だけを重ねる','すき間をあける'];return choices(make(u,kind,i,skill,prompt,answer,hint,explain),answer,wrong,i)}
    if(kind==='cbt'&&i%2===0){const right=answer==='正三角形'?'正三角形（3つの辺が同じ長さ）':'二等辺三角形（2つの辺が同じ長さ）',wrong=answer==='正三角形'?['二等辺三角形（2つの辺が同じ長さ）','3つの辺の長さがすべてちがう三角形','三角形ではない']:['正三角形（3つの辺が同じ長さ）','3つの辺の長さがすべてちがう三角形','三角形ではない'];return choices(make(u,kind,i,skill,prompt,answer,hint,explain),right,wrong,i)}break;}
   case 18:{const x=1+rand(n,u+5,999),y=1+rand(n,u+11,999),hi=Math.max(x,y),lo=Math.min(x,y);skill=['小数の表し方','小数の大きさ','小数のたし算','小数のひき算','小数と分数','数直線'][t];
    if(t===0){prompt=`0.1が${x}こ分の数はいくつですか。`;answer=(x/10).toFixed(1);hint='0.1を何こ分集めたか考えよう。';explain=`答えは${answer}です.`}
    else if(t===1){prompt=`${(hi/10).toFixed(1)}と${(lo/10).toFixed(1)}ではどちらが大きいですか。`;answer=(hi/10).toFixed(1);hint='一の位、次に0.1の位を比べよう。';explain=`${answer}のほうが大きいです.`}
    else if(t===2){prompt=`${(x/10).toFixed(1)}＋${(y/10).toFixed(1)}＝？`;answer=((x+y)/10).toFixed(1);hint='0.1が何こ分か合わせよう。';explain=`答えは${answer}です.`}
    else if(t===3){prompt=`${(hi/10).toFixed(1)}－${(lo/10).toFixed(1)}＝？`;answer=((hi-lo)/10).toFixed(1);hint='位をそろえてひこう。';explain=`答えは${answer}です.`}
    else if(t===4){prompt=`${(x/10).toFixed(1)}と同じ大きさを、10等分した分数で表すと？`;answer=`F${x}:10`;hint='0.1が何こ分か考えよう。';explain=`0.1が${x}こ分なので${f(x,10)}です.`}
    else{const start=1+rand(n,u+19,8),tick=1+rand(n,u+31,9);prompt=`${start}と${start+1}の間を10等分した数直線で、${start}から${tick}つ目の目盛りはいくつですか。`;answer=(start+tick/10).toFixed(1);hint='1目盛りは0.1だよ。';explain=`答えは${answer}です.`}break;}
   case 19:{const x=10+rand(n,u+5,90),y=10+rand(n,u+11,90),z=100+rand(n,u+17,900);skill=['2けた×2けた','3けた×2けた','何十をかける','筆算の部分積','文章題','計算の見通し'][t];
    if(t===0){prompt=`${x}×${y}＝？`;answer=x*y;hint=`${x}×10と${x}×${y%10}に分けよう。`;explain=`${x}×${y}＝${comma(answer)}です.`}
    else if(t===1){prompt=`${z}×${y}＝？`;answer=z*y;hint=`${z}×${Math.floor(y/10)*10}と一の位の分を合わせよう。`;explain=`${z}×${y}＝${comma(answer)}です.`}
    else if(t===2){const ten=10*(1+rand(n,u+23,90));prompt=`${x}×${ten}＝？`;answer=x*ten;hint=`${x}×${ten/10}を計算して10倍しよう。`;explain=`${x}×${ten}＝${comma(answer)}です.`}
    else if(t===3){prompt=`${x}×${y}を筆算します。${x}×${Math.floor(y/10)*10}の部分積はいくつですか。`;answer=x*Math.floor(y/10)*10;hint='十の位の数字は何十を表すか考えよう。';explain=`${x}×${Math.floor(y/10)*10}＝${comma(answer)}です.`}
    else if(t===4){prompt=`1箱に${x}本のえんぴつが入っています。${y}箱では何本ですか。`;answer=x*y;hint=`${x}本が${y}箱分。`;explain=`${x}×${y}＝${comma(answer)}本です.`;extra.unit='本'}
    else{prompt=`${x}×${y}を計算しましょう。`;answer=x*y;hint='かけ算の筆算で位をそろえよう。';explain=`正確な答えは${comma(answer)}です.`}break;}
   case 20:{const x=1+rand(n,u+5,999),y=1+rand(n,u+11,999);skill=['□を使った式','□の答え','場面を式にする','加法の式','減法の式','乗法の式'][t];
    if(t===0){prompt=`□＋${x}＝${x+y}。□はいくつですか。`;answer=y;hint=`${x+y}から${x}をひこう。`;explain=`${x+y}－${x}＝${y}なので□＝${y}です.`}
    else if(t===1){prompt=`${x+y}－□＝${x}。□はいくつですか。`;answer=y;hint=`${x+y}から${x}までいくつへったかな。`;explain=`${x+y}－${x}＝${y}なので□＝${y}です.`}
    else if(t===2){const k=1+rand(n,u+13,9);prompt=`□×${k}＝${x*k}。□はいくつですか。`;answer=x;hint=`${x*k}を${k}つに同じように分けよう。`;explain=`${x*k}÷${k}＝${x}なので□＝${x}です.`}
    else if(t===3){prompt=`はじめに□円あり、${x}円使うと${y}円残りました。式と□の答えを考えよう。`;answer=x+y;hint='使ったお金と残ったお金を合わせよう。';explain=`□－${x}＝${y}、□＝${x+y}円です.`;extra.unit='円'}
    else if(t===4){prompt=`□本のえんぴつから${x}本使うと${y}本残りました。□はいくつですか。`;answer=x+y;hint='使った本数と残った本数を合わせよう。';explain=`□－${x}＝${y}、□＝${x+y}本です.`;extra.unit='本'}
    else{const k=1+rand(n,u+17,20);prompt=`同じ数のカードを${k}人に${x}まいずつ配ると全部で何まいですか。`;answer=k*x;hint=`${x}まいずつが${k}人分。`;explain=`${x}×${k}＝${k*x}まいです.`;extra.unit='まい'}break;}
  }
  let q=make(u,kind,i,skill,prompt,answer,hint,explain,extra);
  return autoChoice(q,i);
 }
 function canonicalChoice(v){const s=String(v).trim(),f=/^F(\d+):(\d+)$/.exec(s);if(f){let a=Number(f[1]),b=Number(f[2]),x=a,y=b;while(y){const t=x%y;x=y;y=t}return `n:${a/x}/${b/x}`}if(s!==''&&Number.isFinite(Number(s)))return `n:${Number(s)}`;return `s:${s}`}
 function evaluateExpression(raw){const s=raw.replace(/,/g,'').replace(/（/g,'(').replace(/）/g,')').replace(/×/g,'*').replace(/÷/g,'/').replace(/＋/g,'+').replace(/[－−]/g,'-').replace(/\s/g,'');if(!/^[0-9.()+*/-]+$/.test(s))return null;let i=0;function factor(){let sign=1;if(s[i]==='+'||s[i]==='-'){if(s[i++]==='-')sign=-1}let value;if(s[i]==='('){i++;value=expr();if(s[i++]!==')')throw Error('paren')}else{const m=s.slice(i).match(/^\d+(?:\.\d+)?/);if(!m)throw Error('number');value=Number(m[0]);i+=m[0].length}return sign*value}function term(){let value=factor();while(s[i]==='*'||s[i]==='/'){const op=s[i++],right=factor();value=op==='*'?value*right:value/right}return value}function expr(){let value=term();while(s[i]==='+'||s[i]==='-'){const op=s[i++],right=term();value=op==='+'?value+right:value-right}return value}try{const value=expr();return i===s.length&&Number.isFinite(value)?value:null}catch{return null}}
 function validateExplanationMath(unit,q){let checked=0;for(const m of String(q.explain||'').matchAll(/([\d,().＋－×÷+\- ]+)＝([\d,().＋－×÷+\- ]+?)(?=なので|です|cm|m|kg|g|人|本|こ|まい|さつ|秒|分|円|点|L|個|つ|。|、|$)/g)){const left=m[1].trim(),right=m[2].trim();if(/^[＋－+\-×÷]/.test(left))continue;const a=evaluateExpression(left),b=evaluateExpression(right);if(a===null||b===null)continue;checked++;if(Math.abs(a-b)>1e-8)throw new Error(`Unit ${unit}: explanation mismatch (${q.id})`)}return checked}
 function validatePool(unit,items){const ids=new Set(),prompts=new Set();let checkedEquationStatements=0;for(const q of items){checkedEquationStatements+=validateExplanationMath(unit,q);if(!q.id||!q.prompt||!q.skill||!q.answer||!['basic','applied','cbt'].includes(q.kind))throw new Error(`Unit ${unit}: incomplete question`);if(ids.has(q.id)||prompts.has(q.prompt))throw new Error(`Unit ${unit}: duplicate id or prompt (${q.id})`);ids.add(q.id);prompts.add(q.prompt);if(q.choices){if(q.choices.length!==4)throw new Error(`Unit ${unit}: choice count (${q.id})`);const letters=q.choices.map(x=>String(x[0])),values=q.choices.map(x=>canonicalChoice(x[1]));if(new Set(letters).size!==4||new Set(values).size!==4||!q.choices.some(x=>String(x[0])===String(q.answer)))throw new Error(`Unit ${unit}: invalid choices (${q.id})`);if(q.correctValue!==undefined&&canonicalChoice(q.choices.find(x=>String(x[0])===String(q.answer))[1])!==canonicalChoice(q.correctValue))throw new Error(`Unit ${unit}: answer key mismatch (${q.id})`)}}return {count:items.length,uniquePrompts:prompts.size,checkedEquationStatements}}
 function generate(unitIndex){if(cache.has(unitIndex))return cache.get(unitIndex);const unit=unitIndex+1,total=totals[unitIndex],base=window.questionBanks[unitIndex]||[],ratios=unitIndex===10?[.75,.125,.125]:unitIndex===14?[.65,.2,.15]:unitIndex===15?[.7,.15,.15]:[.6,.2,.2],want={basic:Math.round(total*ratios[0]),applied:Math.round(total*ratios[1]),cbt:0};want.cbt=total-want.basic-Math.round(total*ratios[1]);want.applied=Math.round(total*ratios[1]);for(const q of base)want[q.kind]--;const all=[...base],used=new Set(base.map(q=>q.prompt));for(const kind of ['basic','applied','cbt']){let made=0;for(let i=0;made<want[kind]&&i<want[kind]*80;i++){const q=build(unitIndex,kind,i);if(used.has(q.prompt))continue;used.add(q.prompt);all.push(q);made++}if(made!==want[kind])throw new Error(`Unit ${unit} ${kind}: ${made}/${want[kind]}`)}validatePool(unit,all);cache.set(unitIndex,all);return all}
 function rolloverSession(pool,seenIds,shuffle){const available=pool.filter(q=>!seenIds.has(q.id));if(available.length>=10)return null;const carry=shuffle(available),carryIds=new Set(carry.map(q=>q.id)),fill=shuffle(pool.filter(q=>!carryIds.has(q.id))).slice(0,10-carry.length);return {questions:[...carry,...fill],seenIds:available.length===0?new Set():new Set(seenIds),reset:available.length===0}}
 function selectSession(pool,seenIds,mode,score,shuffle){const rollover=rolloverSession(pool,seenIds,shuffle);if(rollover)return rollover;const available=pool.filter(q=>!seenIds.has(q.id)),questions=[],picked=new Set(),rank=list=>shuffle(list).sort((a,b)=>score(b)-score(a));if(mode==='cbt'){const cbt=shuffle(available.filter(q=>q.kind==='cbt'));questions.push(...cbt.slice(0,10));questions.forEach(q=>picked.add(q.id));if(questions.length<10)questions.push(...shuffle(available.filter(q=>!picked.has(q.id))).slice(0,10-questions.length))}else{for(const [kind,count] of [['basic',6],['applied',2],['cbt',2]]){const group=rank(available.filter(q=>q.kind===kind)).slice(0,count);questions.push(...group);group.forEach(q=>picked.add(q.id))}const rest=rank(available.filter(q=>!picked.has(q.id)));questions.push(...rest.slice(0,10-questions.length));if(mode==='regular')return {questions:shuffle(questions),seenIds:new Set(seenIds),reset:false}}return {questions,seenIds:new Set(seenIds),reset:false}}
 function parseCompositeAnswer(answer){const s=String(answer),patterns=[[/^(\d+)あまり(\d+)$/,['商','あまり']],[/^(\d+)km(\d+)m$/,['km','m']],[/^(\d+)kg(\d+)g$/,['kg','g']],[/^(\d+)m(\d+)cm$/,['m','cm']],[/^(\d+)時(\d+)分$/,['時','分']],[/^(\d+)(袋|箱|束|パック)、(\d+)(本|こ|個|まい)あまり$/,null],[/^(\d+)(袋|箱|束|パック)できて(\d+)(本|こ|個|まい)あまる$/,null]];for(const [pattern,labels] of patterns){const m=pattern.exec(s);if(!m)continue;if(labels)return {values:[m[1],m[2]],labels};return {values:[m[1],m[3]],labels:[m[2],`${m[4]}のあまり`]}}return null}
 function correctValueForDisplay(q){const value=q&&q.choices?(q.choices.find(x=>String(x[0])===String(q.answer))||[])[1]:q&&q.answer;if(value===undefined)return '';let text=String(value).replace(/^F(\d+):(\d+)$/,'〔F$1:$2〕');if(q&&!q.choices&&q.unit&&!text.includes(String(q.unit)))text+=q.unit;return text}
 function summarizeProgress(records,unitIndex){const prefix=new RegExp(`^u${unitIndex+1}(?:q|g)`),rows=Object.entries(records||{}).filter(([id,r])=>prefix.test(id)&&r&&typeof r==='object'),attempts=rows.reduce((s,[,r])=>s+(Number(r.attempts)||0),0),correct=rows.reduce((s,[,r])=>s+(Number(r.correct)||0),0);return {answered:rows.length,attempts,correct,accuracy:attempts?Math.round(correct/attempts*100):null,total:totals[unitIndex]||0}}
 window.questionEngine={generate,clearCache:()=>cache.clear(),total:()=>totals.reduce((a,b)=>a+b,0),count:i=>totals[i]||0,audit:i=>validatePool(i+1,generate(i)),rolloverSession,selectSession,evaluateExpression,parseCompositeAnswer,correctValueForDisplay,summarizeProgress};
})();
