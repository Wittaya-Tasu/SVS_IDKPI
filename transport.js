/* Direct browser-to-GAS transport. Never attach Google account cookies. */
const SVS_API_URL='https://script.google.com/macros/s/AKfycbw1HXV2BFFzeXn8xFao9qkByxuTab_eZqFd4G4YyFoQtWZKggz_YCLb8xFkRAJQnjsg/exec';
async function gasRequest(kind,payload={}){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),90000);
 try{
  const response=await fetch(SVS_API_URL,{method:'POST',mode:'cors',credentials:'omit',redirect:'follow',referrerPolicy:'no-referrer',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify({protocol:'svs-kpi-v1',kind,...payload}),signal:controller.signal});
  if(!response.ok)throw new Error('เซิร์ฟเวอร์ตอบกลับไม่สำเร็จ ('+response.status+')');
  let envelope;try{envelope=JSON.parse(await response.text());}catch(e){throw new Error('การเชื่อมต่อไม่สำเร็จ กรุณาลองใหม่หรือติดต่อผู้ดูแล');}
  if(!envelope||envelope.protocol!=='svs-kpi-v1'||typeof envelope.ok!=='boolean')throw new Error('รูปแบบคำตอบจากระบบไม่ถูกต้อง');
  if(!envelope.ok)throw new Error(envelope.error||'ดำเนินการไม่สำเร็จ');
  try{if(typeof updatePresenceIndicator==='function')updatePresenceIndicator(envelope.presence);}catch(e){}
  return envelope.data;
 }catch(e){
  if(e.name==='AbortError')throw new Error('ยังยืนยันผลการดำเนินการไม่ได้ กรุณาโหลดข้อมูลล่าสุดก่อนลองบันทึกอีกครั้ง');
  if(e instanceof TypeError)throw new Error('เชื่อมต่อระบบไม่ได้ กรุณาตรวจอินเทอร์เน็ต แล้วโหลดข้อมูลล่าสุดก่อนลองบันทึกอีกครั้ง');
  throw e;
 }finally{clearTimeout(timer);}
}
async function checkConnection(){
 const button=document.getElementById('checkConnection'),out=document.getElementById('connectionResult');button.disabled=true;out.textContent='กำลังทดสอบการเชื่อมต่อ…';
 try{
  const h=await gasRequest('health');
  let denied=false;try{await gasRequest('call',{token:'',action:'getBootstrap',request:{}});}catch(e){if(String(e.message).includes('AUTH_REQUIRED'))denied=true;else throw e;}
  if(!denied)throw new Error('ระบบยังไม่พร้อม กรุณาติดต่อผู้ดูแล');
  out.textContent='เชื่อมต่อ GAS โดยตรงสำเร็จ · รุ่น '+h.version+' · ตรวจสอบสิทธิ์ก่อนเปิดข้อมูลแล้ว';
 }catch(e){out.textContent=e.message;}finally{button.disabled=false;}
}
document.addEventListener('click',e=>{if(e.target.closest('#checkConnection'))checkConnection();});
