/** Approximate unique authenticated accounts seen within two minutes.
 * Cache only; never writes presence to Sheets or delays assessment writes.
 */
let REQUEST_PRESENCE_=null;
function presenceEntries_(cache,now){
 let stored;try{stored=JSON.parse(cache.get('svs-presence-v1')||'{}');}catch(e){stored={};}
 const active={};Object.keys(stored||{}).forEach(function(key){const at=Number(stored[key]);if(Number.isFinite(at)&&at<=now+5000&&now-at<120000)active[key]=at;});return active;
}
function presenceSummary_(entries,now){return {count:Object.keys(entries).length,updatedAt:now,windowSeconds:120};}
function presenceUpdate_(actor){
 try{
  if(!actor||!actor.username)return null;
  const cache=CacheService.getScriptCache(),now=Date.now(),key=digest_('presence|'+actor.username),entries=presenceEntries_(cache,now);
  if(entries[key]&&now-entries[key]<25000)return presenceSummary_(entries,now);
  const lock=LockService.getScriptLock();if(!lock.tryLock(100))return presenceSummary_(entries,now);
  try{const latest=presenceEntries_(cache,now);latest[key]=now;cache.put('svs-presence-v1',JSON.stringify(latest),180);return presenceSummary_(latest,now);}finally{lock.releaseLock();}
 }catch(e){return null;}
}
