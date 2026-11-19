/** Add to the existing private Apps Script project, after its authentication module.
 * No JSONP. No secrets in URLs. Every data request uses existing authorization.
 */
function doPost(e){
 REQUEST_PRESENCE_=null;
 let envelope;
 try{
  const raw=e&&e.postData&&e.postData.contents;
  if(typeof raw!=='string'||raw.length>1000000)throw new Error('BAD_REQUEST: ขนาดคำขอไม่ถูกต้อง');
  const p=JSON.parse(raw);
  if(!p||p.protocol!=='svs-kpi-v1')throw new Error('BAD_REQUEST: รูปแบบคำขอไม่ถูกต้อง');
  let data;
  if(p.kind==='health')data={version:APP.version,transport:'direct-gas'};
  else if(p.kind==='login')data=authLogin(p.request);
  else if(p.kind==='logout')data=authLogout(p.token);
  else if(p.kind==='call')data=authCall(p.token,p.action,p.request);
  else throw new Error('BAD_REQUEST: ไม่รองรับคำขอนี้');
  envelope={protocol:'svs-kpi-v1',ok:true,data:data===undefined?null:data,presence:REQUEST_PRESENCE_};
 }catch(error){envelope={protocol:'svs-kpi-v1',ok:false,error:String(error&&error.message||'ดำเนินการไม่สำเร็จ')};}
 return ContentService.createTextOutput(JSON.stringify(envelope)).setMimeType(ContentService.MimeType.JSON);
}
