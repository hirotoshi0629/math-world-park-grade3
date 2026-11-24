/* Compact, per-unit local storage for long-running practice histories. */
(function(root){
 const marker='park-record-store-v2',legacyKey='park-record-v1',prefix='park-record-u';
 const parse=(raw,fallback={})=>{try{return raw?JSON.parse(raw):fallback}catch{return fallback}};
 const unpack=value=>Array.isArray(value)?{attempts:Number(value[0])||0,correct:Number(value[1])||0}:{attempts:Number(value&&value.attempts)||0,correct:Number(value&&value.correct)||0};
 const pack=value=>[Number(value.attempts)||0,Number(value.correct)||0];
 function legacy(){return parse(root.localStorage.getItem(legacyKey),{})}
 function migrate(){
  if(root.localStorage.getItem(marker)==='1')return true;
  const old=legacy(),byUnit=Array.from({length:20},()=>({})),compact={};
  for(const [id,value] of Object.entries(old)){const m=/^u(\d+)/.exec(id);if(!m)continue;const u=Number(m[1])-1;if(u<0||u>=20)continue;const row=unpack(value),pair=pack(row);byUnit[u][id]=pair;compact[id]=pair}
  try{
   // Shrink the legacy copy before temporarily creating the per-unit copies.
   root.localStorage.setItem(legacyKey,JSON.stringify(compact));
   for(let i=0;i<20;i++)if(Object.keys(byUnit[i]).length)root.localStorage.setItem(`${prefix}${i+1}`,JSON.stringify(byUnit[i]));
   root.localStorage.setItem(marker,'1');
   root.localStorage.removeItem(legacyKey);
   return true;
  }catch{return false}
 }
 function readAll(){
  if(!migrate())return Object.fromEntries(Object.entries(legacy()).map(([id,value])=>[id,unpack(value)]));
  const all={};for(let i=1;i<=20;i++){const rows=parse(root.localStorage.getItem(`${prefix}${i}`),{});for(const [id,value] of Object.entries(rows))all[id]=unpack(value)}return all;
 }
 function readUnit(unitNumber){
  if(!migrate())return Object.fromEntries(Object.entries(legacy()).filter(([id])=>new RegExp(`^u${unitNumber}(?:q|g)`).test(id)).map(([id,value])=>[id,unpack(value)]));
  const rows=parse(root.localStorage.getItem(`${prefix}${unitNumber}`),{});return Object.fromEntries(Object.entries(rows).map(([id,value])=>[id,unpack(value)]));
 }
 function record(id,unitNumber,correct){
  if(!migrate()){
   const rows=legacy(),old=unpack(rows[id]),next={attempts:old.attempts+1,correct:old.correct+(correct?1:0)};rows[id]=pack(next);root.localStorage.setItem(legacyKey,JSON.stringify(rows));return next;
  }
  const key=`${prefix}${unitNumber}`,rows=parse(root.localStorage.getItem(key),{}),old=unpack(rows[id]),next={attempts:old.attempts+1,correct:old.correct+(correct?1:0)};rows[id]=pack(next);root.localStorage.setItem(key,JSON.stringify(rows));return next;
 }
 root.progressStore={readAll,readUnit,record,migrate};
})(window);
