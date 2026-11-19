function makeReport(){
 const d=state.data,a=d.assessment,r=result(),team=state.boot.teams.find(t=>t.TeamId===a.TeamId),p=state.boot.people.find(p=>p.PersonId===a.PersonId);
 if(a.Status!=='Submitted')throw new Error('ต้องส่งผลประเมินตนเองก่อนส่งออก');
 const details=[];
 r.kpis.filter(k=>!k.project&&k.applicable).forEach(k=>{let criteria=d.policy.criteria.filter(c=>c.KpiId===k.id);const meta=d.policy.kpis.find(x=>x.KpiId===k.id);if(k.id==='KPI5'&&(!meta.ScoreMode||meta.ScoreMode==='legacy'))criteria=criteria.filter(c=>c.Route===a.Kpi5Route);const grouped={};criteria.forEach(c=>{const id=k.id==='KPI5'&&meta.ScoreMode==='highest'?(c.Route==='speaker'?'speaker':c.Route==='km'?'km':'research'):c.GroupId;(grouped[id]||(grouped[id]=[])).push(c);});Object.values(grouped).forEach((rows,gi)=>rows.forEach((c,ci)=>{const answer=d.answers.find(x=>x.CriterionId===c.CriterionId);if(k.id==='KPI5'&&(!answer||!Number.isInteger(answer.Score)))return;details.push({kpiId:k.id,no:k.id.slice(3)+'.'+(gi+1)+(rows.length>1?'.'+(ci+1):''),title:c.Title,score:answer?.Applicability==='NA'?'ไม่เกี่ยวข้อง':typeof answer?.Score==='number'?String(answer.Score):'—',description:answer?.Applicability==='NA'?'':typeof answer?.Score==='number'?c['Grade'+answer.Score]:''});}));});
 return {round:a.RoundId,personId:a.PersonId,name:(p?.DisplayName||a.PersonId)+(p?.Role==='Demo'?' (สาธิต ไม่รวมผลจริง)':''),team:team?.TeamName||a.TeamId,group:a.CustomerGroup==='customer'?'ดูแลฟาร์มลูกค้า':'ไม่ได้ดูแลฟาร์มลูกค้า',evidence:'',submittedAt:a.SubmittedAt,exportedAt:new Date().toISOString(),status:state.boot.privateScores?'ผล KPI1–KPI5 · ไม่แสดง KPI6 และคะแนนรวมตามสิทธิ์':r.complete?'ประเมินครบแล้ว':'ส่งผลตนเองแล้ว · รอ Sponsor / ข้อมูลโครงการ',complete:r.complete,total:r.total,kpis:r.kpis.filter(k=>!k.hidden),details,projects:(state.boot.privateScores?[]:d.projects).map(p=>({name:p.name,sponsors:p.sponsors.map(s=>({name:s.name,score:s.score}))}))};
}
function dateText(value){return value?new Intl.DateTimeFormat('th-TH',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Bangkok'}).format(new Date(value)):'—';}
const REPORT_GRADE_NAMES=['ต่ำกว่าเป้ามาก','ต้องพัฒนา','ตามเป้าหมาย','สูงกว่าเป้าหมาย','ดีเยี่ยม'];
function reportGrade(k){return k.applicable&&k.complete&&Number.isInteger(k.grade)&&k.grade>=1&&k.grade<=5?k.grade+' · '+REPORT_GRADE_NAMES[k.grade-1]:'—';}
function reportDetailGroups(p){return p.kpis.filter(k=>!k.hidden).map(k=>{
 const rows=[];
 if(!k.applicable)rows.push({no:'—',title:'ไม่ใช้ประเมิน',score:'—',description:''});
 else if(k.project){
  (p.projects||[]).forEach((project,i)=>{
   const sponsors=project.sponsors?.length?project.sponsors:[{name:'',score:null}];
   sponsors.forEach(s=>rows.push({no:k.id.slice(3)+'.'+(i+1),title:project.name,score:s.score==null?'รอประเมิน':s.score+' / 5',description:s.name?'ผู้ประเมิน: '+s.name:'รอผู้ประเมิน'}));
  });
  if(!rows.length)rows.push({no:'—',title:'ยังไม่มีโครงการที่แสดงได้',score:'—',description:''});
 }else{
  rows.push(...p.details.filter(d=>(d.kpiId||'KPI'+String(d.no).split('.')[0])===k.id));
  if(!rows.length)rows.push({no:'—',title:'ยังไม่มีรายละเอียดคะแนน',score:'—',description:''});
 }
 return {id:k.id,title:k.title,rows};
});}
function reportLegend(){return `<div class="legend-title">ความหมายของเกรดราย KPI</div><div class="scales">${REPORT_GRADE_NAMES.map((name,i)=>`<div class="grade-${i+1}"><b>${i+1}</b>${name}</div>`).join('')}</div>`;}
function renderReport(){const p=state.exportReport;if(!p){state.view='dashboard';renderDashboard();return;}
 $('app').innerHTML=`<div class="intro row"><div><div class="kicker">ใบสรุปสำหรับส่งยืนยันหัวหน้าทีม</div><h1><span class="section-no">05</span> ส่งออกผลคะแนน</h1></div><div class="actions"><button class="alt" data-action="dashboard">← กลับ KPI ของฉัน</button><button id="pngDownloadPlaceholder" disabled>กำลังเตรียมภาพ…</button></div></div><details class="box report-card"><summary>ดูภาพตัวอย่างที่จะดาวน์โหลด</summary><img id="reportPngImage" alt="ภาพสรุปผลประเมินสำหรับดาวน์โหลด" style="width:100%;height:auto;display:block;margin-top:12px"></details><article class="box report-card"><div class="report-head"><h2>ใบสรุปผลประเมิน Individual KPI · ${esc(p.round)}</h2><div class="report-details"><p><b>ชื่อ:</b> ${esc(p.name)}</p><p><b>ทีม:</b> ${esc(p.team)}</p><p><b>กลุ่มงาน:</b> ${esc(p.group)}</p><p><b>ส่งผลตนเอง:</b> ${esc(dateText(p.submittedAt))}</p></div><div class="notice">${esc(p.status)}</div><div class="report-summary">Individual KPI: ${p.complete?fmt(p.total)+' / 5':'รอผลครบทุก KPI'}</div></div><h3>5.1 คะแนน KPI ทั้ง ${p.kpis.length} ข้อ</h3><div class="tablewrap"><table><thead><tr><th class="report-kpi-name">หัวข้อ</th><th>คะแนนย่อย</th><th>เปอร์เซ็นต์</th><th>เกรด / ความหมาย</th><th>น้ำหนัก</th><th>ถ่วงน้ำหนัก</th><th>สถานะ</th></tr></thead><tbody>${p.kpis.map(k=>`<tr><td><b>${esc(k.id)} ${esc(k.title)}</b></td><td class="num">${fmt(k.raw)}</td><td class="num">${fmt(k.percent)}</td><td class="center ${k.applicable&&k.complete&&k.grade?'grade-'+k.grade:''}">${esc(reportGrade(k))}</td><td class="num">${Math.round(k.weight*100)}%</td><td class="num">${k.applicable?fmt(k.weighted):'—'}</td><td>${!k.applicable?'ไม่ใช้':k.complete?'ครบแล้ว':'รอ Sponsor'}</td></tr>`).join('')}</tbody></table></div>${reportLegend()}<h3 style="margin-top:16px">5.2 รายละเอียดคะแนนที่ส่ง</h3><div class="tablewrap"><table><thead><tr><th style="width:9%">ข้อ</th><th style="width:42%">หัวข้อย่อย / โครงการ</th><th style="width:14%">คะแนน</th><th>เกณฑ์ที่เลือก / ผู้ประเมิน</th></tr></thead>${reportDetailGroups(p).map(group=>`<tbody><tr><th colspan="4" scope="rowgroup" style="text-align:left;background:#eaf2ee;color:#14594e;padding:12px"><b>${esc(group.id)} · ${esc(group.title)}</b></th></tr>${group.rows.map(d=>`<tr><td class="center">${esc(d.no)}</td><td>${esc(d.title)}</td><td class="center">${esc(d.score)}</td><td>${esc(d.description)}</td></tr>`).join('')}</tbody>`).join('')}</table></div><p class="report-note">ส่งออก ${esc(dateText(p.exportedAt))} · ภาพนี้เป็นสำเนาผลที่บันทึกในระบบ ณ เวลาส่งออก หาก Sponsor ให้คะแนนเพิ่มเติม ให้ส่งออกใหม่</p></article>`;
}
async function exportPng(){
 const p=state.exportReport;if(!p)throw new Error('กรุณาเปิดใบสรุปก่อน');
 if(document.fonts){await document.fonts.load('400 18px SVSThai','กขคไทย 0123');await document.fonts.load('700 24px SVSThai','กขคไทย 0123');await document.fonts.ready;}
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d'),W=1120,margin=40,ink='#203c37',muted='#657a75',colors=['#f4a99d','#ffc777','#cfdf78','#90d6a4','#37b884'],ops=[];let y=40;
 const rect=(x,y,w,h,color)=>ops.push({type:'rect',x,y,w,h,color});
 function text(t,x,top,size=18,color=ink,bold=false,align='left'){ops.push({type:'text',t:String(t??''),x,y:top,size,color,bold,align});}
 function lines(t,width,size=18,bold=false){ctx.font=(bold?'700 ':'400 ')+size+'px SVSThai, Tahoma, sans-serif';const out=[];for(const para of String(t??'').split('\n')){let line='';const glyphs=typeof Intl.Segmenter==='function'?Array.from(new Intl.Segmenter('th',{granularity:'grapheme'}).segment(para),x=>x.segment):Array.from(para);for(const ch of glyphs){if(line&&ctx.measureText(line+ch).width>width){out.push(line);line=ch;}else line+=ch;}out.push(line);}return out;}
 function block(t,x,top,width,size=18,color=ink,bold=false){const ls=lines(t,width,size,bold);ls.forEach((line,i)=>text(line,x,top+i*(size*1.45),size,color,bold));return ls.length*size*1.45;}
 function heading(t){y+=18;rect(margin,y,W-margin*2,42,'#eaf2ee');text(t,margin+12,y+7,21,ink,true);y+=54;}
 function tableRow(cells,widths,{header=false,grade=null}={}){const sizes=cells.map((t,i)=>lines(t,widths[i]-18,header?16:17,header)),height=Math.max(43,...sizes.map(ls=>ls.length*24+16));let x=margin;rect(x,y,W-margin*2,height,header?'#e7efeb':'#ffffff');cells.forEach((t,i)=>{if(i===3&&grade)rect(x,y,widths[i],height,colors[grade-1]);const color=i===3&&grade===5?'#103f2b':ink;const ls=sizes[i];ls.forEach((l,j)=>text(l,header?x+widths[i]/2:x+9,y+8+j*24,header?16:17,color,header,header?'center':'left'));rect(x,y+height-1,widths[i],1,'#dae5df');x+=widths[i];});y+=height;}
 rect(0,0,W,205,'#14594e');text('SVS Individual-KPI · '+p.round,margin,29,32,'#ffffff',true);text('ใบสรุปผลประเมิน Individual KPI',margin,75,24,'#ffffff',true);text(p.name,margin,116,24,'#ffffff',true);text(p.team+' · '+p.group,margin,155,19,'#e3f2e9');y=228;
 y+=block('สถานะ: '+p.status,margin,y,W-margin*2,20,ink,true)+5;
 y+=block('Individual KPI: '+(p.complete?fmt(p.total)+' / 5':'รอผลครบทุก KPI'),margin,y,W-margin*2,25,'#14594e',true)+6;
 text('ส่งผลตนเอง: '+dateText(p.submittedAt),margin,y,17,muted);y+=28;
 heading(`5.1 คะแนน KPI ทั้ง ${p.kpis.length} ข้อ`);const widths=[320,95,100,180,80,135,130];
 tableRow(['หัวข้อ KPI','คะแนนย่อย','เปอร์เซ็นต์','เกรด / ความหมาย','น้ำหนัก','ถ่วงน้ำหนัก','สถานะ'],widths,{header:true});
 p.kpis.forEach(k=>tableRow([k.id+' '+k.title,fmt(k.raw),k.percent===null?'—':fmt(k.percent)+'%',reportGrade(k),Math.round(k.weight*100)+'%',k.applicable?fmt(k.weighted):'—',!k.applicable?'ไม่ใช้ประเมิน':k.complete?'ครบแล้ว':'รอ Sponsor'],widths,{grade:k.applicable&&k.complete?k.grade:null}));
 y+=14;y+=block('ความหมายของเกรดราย KPI',margin,y,W-margin*2,17,ink,true)+6;const gradeNames=REPORT_GRADE_NAMES.map((name,i)=>(i+1)+' '+name);gradeNames.forEach((n,i)=>{const width=(W-margin*2)/5;rect(margin+i*width,y,width-4,38,colors[i]);text(n,margin+i*width+10,y+7,16,ink,true);});y+=47;
 y+=block('คะแนนย่อย ÷ 5 × 100 → เกรด → คูณน้ำหนัก KPI หลัก · KPI5 ใช้หัวข้อที่ได้คะแนนสูงสุดตามเกณฑ์ของรอบนั้น',margin,y,W-margin*2,16,muted);
 heading('5.2 รายละเอียดคะแนนที่ส่ง');const dw=[85,435,130,390];tableRow(['ข้อ','หัวข้อย่อย / โครงการ','คะแนน','เกณฑ์ที่เลือก / ผู้ประเมิน'],dw,{header:true});
 reportDetailGroups(p).forEach(group=>{const title=group.id+' · '+group.title,ls=lines(title,W-margin*2-24,19,true),height=Math.max(42,ls.length*27+16);rect(margin,y,W-margin*2,height,'#eaf2ee');ls.forEach((line,i)=>text(line,margin+12,y+8+i*27,19,'#14594e',true));y+=height;group.rows.forEach(d=>tableRow([d.no,d.title,d.score,d.description],dw));});
 y+=15;rect(margin,y,W-margin*2,1,'#dae5df');y+=14;y+=block('ส่งออก: '+dateText(p.exportedAt)+' · รหัสผล: '+p.round+'|'+p.personId,margin,y,W-margin*2,16,muted);y+=block('สำเนาผล ณ เวลาส่งออก หาก Sponsor ให้คะแนนเพิ่มเติม ให้ส่งออกใหม่จากระบบ',margin,y,W-margin*2,16,muted);y+=30;
 canvas.width=W*2;canvas.height=Math.ceil(y)*2;ctx.scale(2,2);ctx.fillStyle='#ffffff';ctx.fillRect(0,0,W,y);ctx.textBaseline='top';
 ops.forEach(o=>{ctx.fillStyle=o.color;if(o.type==='rect')ctx.fillRect(o.x,o.y,o.w,o.h);else{ctx.font=(o.bold?'700 ':'400 ')+o.size+'px SVSThai, Tahoma, sans-serif';ctx.textAlign=o.align;ctx.fillText(o.t,o.x,o.y);}});
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('สร้างภาพไม่สำเร็จ กรุณาลองใหม่');
 if(state.exportUrl)URL.revokeObjectURL(state.exportUrl);const url=URL.createObjectURL(blob);state.exportUrl=url;const link=document.createElement('a');link.href=url;link.download=('SVS_KPI_'+p.round+'_'+p.name).replace(/[\\/:*?"<>|\u0000-\u001f]/g,'_')+'.png';link.target='_self';link.className='button-link';link.id='pngDownload';link.textContent='ดาวน์โหลดภาพ PNG';$('pngDownloadPlaceholder').replaceWith(link);$('reportPngImage').src=url;

}

