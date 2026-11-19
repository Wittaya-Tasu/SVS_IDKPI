/* Best-effort presence. Does not affect saves or display other users' names. */
let presenceTimer=null,presenceKey='',presenceLatest=null,presenceReceivedAt=0,presenceInFlight=false;
function paintPresence(){
 const count=document.getElementById('presenceCount'),badge=document.getElementById('presenceStatus');if(!count||!badge)return;
 const fresh=presenceLatest&&Date.now()-presenceReceivedAt<120000;
 count.textContent=fresh?String(presenceLatest.count):'—';
 badge.classList.toggle('presence-stale',!fresh);
 badge.title=fresh?'จำนวนบัญชีที่ติดต่อระบบใน 2 นาทีล่าสุด · โดยประมาณ · อัปเดต '+new Date(presenceReceivedAt).toLocaleTimeString('th-TH'):'รออัปเดตจำนวนผู้ใช้งาน · ข้อมูลโดยประมาณใน 2 นาทีล่าสุด';
}
function updatePresenceIndicator(value){
 if(!state.token||!value||!Number.isInteger(value.count)||value.count<0)return;
 presenceLatest={count:value.count};presenceReceivedAt=Date.now();paintPresence();
}
function schedulePresence(delay){clearTimeout(presenceTimer);if(presenceKey)presenceTimer=setTimeout(refreshPresence,delay??(55000+Math.floor(Math.random()*10000)));}
async function refreshPresence(){
 const token=state.token;
 if(!token||!state.boot||presenceKey!==token)return;
 paintPresence();
 if(document.visibilityState==='hidden'||presenceInFlight||Date.now()-presenceReceivedAt<50000){schedulePresence();return;}
 presenceInFlight=true;
 try{const result=await api('getPresence');if(state.token===token)updatePresenceIndicator(result);}catch(e){paintPresence();}finally{presenceInFlight=false;if(state.token===token)schedulePresence();}
}
function startPresence(){
 if(!state.token||!state.boot)return;
 if(presenceKey===state.token){paintPresence();return;}
 clearTimeout(presenceTimer);presenceKey=state.token;paintPresence();schedulePresence(presenceLatest?undefined:1000);
}
function stopPresence(){clearTimeout(presenceTimer);presenceTimer=null;presenceKey='';presenceLatest=null;presenceReceivedAt=0;paintPresence();}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&presenceKey){paintPresence();schedulePresence(500+Math.floor(Math.random()*2000));}});
