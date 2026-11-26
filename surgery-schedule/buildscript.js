// 共用：把一份設定（cfg）轉成「手術排程預約」書籤的程式碼。產生器與目錄頁的整包下載都會用到。
// 需要先載入 data/procedures.js（取得 PROCEDURES_DATE）。
var GENERATOR_VERSION = '2026.11.26';
var PROC_DATE = window.PROCEDURES_DATE || '';

function esc(str){
  // 安全地把文字塞進 JS 字串字面值
  return String(str).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\n/g,'\\n').replace(/\r/g,'\\r').replace(new RegExp(String.fromCharCode(8232),'g'),'\\u2028').replace(new RegExp(String.fromCharCode(8233),'g'),'\\u2029');
}

function buildScript(cfg){
  var lines = [];
  lines.push("(async function(){");
  lines.push("var notes=[];");
  lines.push("function wait(ms){return new Promise(function(r){setTimeout(r,ms)})}");
  lines.push("function setSelect(id,value){var el=document.getElementById(id);if(!el){console.warn('[BM] missing',id);return}el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}))}");
  lines.push("function checkRadio(id){var el=document.getElementById(id);if(!el){console.warn('[BM] missing',id);return}el.checked=true;el.dispatchEvent(new Event('change',{bubbles:true}));el.dispatchEvent(new Event('click',{bubbles:true}))}");
  lines.push("function setText(id,value){var el=document.getElementById(id);if(!el){console.warn('[BM] missing',id);return}el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))}");
  lines.push("function checkRadioNV(name,value){var el=document.querySelector('input[name=\"'+name+'\"][value=\"'+value+'\"]');if(!el){console.warn('[BM] missing name='+name);return}el.checked=true;el.dispatchEvent(new Event('change',{bubbles:true}));el.dispatchEvent(new Event('click',{bubbles:true}))}");

  if(cfg.deptCode){
    lines.push("var deptEl=document.getElementById('Department');");
    lines.push("if(deptEl && deptEl.value!=='"+esc(cfg.deptCode)+"'){setSelect('Department','"+esc(cfg.deptCode)+"');await wait(1200);}");
  }
  if(cfg.doctorCode){
    lines.push("setSelect('SDoctor','"+esc(cfg.doctorCode)+"');");
  }
  if(cfg.lastFast){
    lines.push("setSelect('LastFast','"+esc(cfg.lastFast)+"');");
  }
  if(cfg.course){
    lines.push("checkRadio('"+esc(cfg.course)+"');");
  }
  if(cfg.urgency){
    lines.push("checkRadio('"+esc(cfg.urgency)+"');");
  }
  if(cfg.period){
    lines.push("checkRadio('"+esc(cfg.period)+"');");
  }
  if(cfg.diagnosis){
    lines.push("setText('Diagnosis','"+esc(cfg.diagnosis)+"');");
  }
  if(cfg.anesthesia){
    lines.push("setSelect('AnesthesiaType','"+esc(cfg.anesthesia)+"');");
  }
  if(cfg.durH !== '' && cfg.durH !== null){
    lines.push("setText('SDuration_H','"+esc(cfg.durH)+"');");
  }
  if(cfg.durM !== '' && cfg.durM !== null){
    lines.push("setText('SDuration_M','"+esc(cfg.durM)+"');");
  }
  if(cfg.antibiotic){
    lines.push("setSelect('Antibiotic','"+esc(cfg.antibiotic)+"');");
  }
  if(cfg.pacemaker){
    lines.push("checkRadioNV('Pacemaker','"+esc(cfg.pacemaker)+"');");
  }

  if(cfg.location){
    lines.push("document.getElementById('CaseVehicleBtn').click();");
    lines.push("await wait(1500);");
    lines.push("var cvIframe=[].slice.call(document.querySelectorAll('iframe')).find(function(f){return f.src.indexOf('CaseVehicle')>-1});");
    lines.push("if(cvIframe){");
    lines.push("  var cvDoc=cvIframe.contentDocument;");
    lines.push("  var locRadio=[].slice.call(cvDoc.querySelectorAll('input[name=\"Location\"]')).find(function(r){return r.value==='"+esc(cfg.location)+"'});");
    lines.push("  if(locRadio){locRadio.checked=true;locRadio.dispatchEvent(new Event('change',{bubbles:true}));locRadio.dispatchEvent(new Event('click',{bubbles:true}));}");
    lines.push("  await wait(500);");
    if(cfg.procKeyword){
      lines.push("  var kw='"+esc(cfg.procKeyword.replace(/\s+/g,' ').trim().toLowerCase())+"';");
      lines.push("  var cbs=[].slice.call(cvDoc.querySelectorAll('.procedure-item input[type=checkbox]'));");
      lines.push("  var nm=function(cb){return (cb.getAttribute('data-name_en')||'').replace(/\\s+/g,' ').trim().toLowerCase()};");
      lines.push("  var exact=cbs.filter(function(cb){return nm(cb)===kw});");
      lines.push("  var partial=cbs.filter(function(cb){return nm(cb).indexOf(kw)>-1});");
      lines.push("  var targetCb=exact[0]||partial[0];");
      lines.push("  if(!exact.length&&partial.length>1)notes.push('術式關鍵字符合 '+partial.length+' 筆，已選第一筆「'+(targetCb.getAttribute('data-name_en')||'').replace(/\\s+/g,' ').trim()+'」，請確認是否正確');");
    } else {
      lines.push("  var cbs=[].slice.call(cvDoc.querySelectorAll('.procedure-item input[type=checkbox]'));");
      lines.push("  var targetCb=cbs[0];");
    }
    lines.push("  if(targetCb){");
    lines.push("    targetCb.checked=true;targetCb.dispatchEvent(new Event('change',{bubbles:true}));targetCb.dispatchEvent(new Event('click',{bubbles:true}));");
    lines.push("  } else { console.warn('[BM] 找不到符合關鍵字的術式項目（比對 術式名稱(英) 欄位）'); notes.push('找不到符合關鍵字的術式，請手動選擇'); }");
    lines.push("  await wait(300);");
    lines.push("  var bringIn=cvDoc.getElementById('BringInSchedule');");
    lines.push("  if(bringIn) bringIn.click();");
    lines.push("  await wait(500);");
    lines.push("  var updateBtn=cvDoc.getElementById('button-update');");
    lines.push("  if(updateBtn) updateBtn.click();");
    lines.push("  await wait(800);");
    lines.push("} else { console.warn('[BM] 找不到個案車 iframe'); notes.push('找不到個案車視窗'); }");
    lines.push("var cvModals=[].slice.call(document.querySelectorAll('div')).filter(function(el){return el.textContent.indexOf('挑選個案車(手術名稱)')>-1 && el.querySelector('button')});");
    lines.push("if(cvModals.length){");
    lines.push("  var modal=cvModals.sort(function(a,b){return a.textContent.length-b.textContent.length})[0];");
    lines.push("  var closeBtn=[].slice.call(modal.querySelectorAll('button')).find(function(b){return b.textContent.trim()==='X'});");
    lines.push("  if(closeBtn) closeBtn.click();");
    lines.push("  await wait(300);");
    lines.push("}");
    if(cfg.procPrefix){
      lines.push("var surgeryNameEl=document.getElementById('SurgeryName');");
      lines.push("if(surgeryNameEl && surgeryNameEl.value.trim().indexOf('"+esc(cfg.procPrefix)+"')!==0){");
      lines.push("  surgeryNameEl.value='"+esc(cfg.procPrefix)+" '+surgeryNameEl.value;");
      lines.push("  surgeryNameEl.dispatchEvent(new Event('input',{bubbles:true}));");
      lines.push("  surgeryNameEl.dispatchEvent(new Event('change',{bubbles:true}));");
      lines.push("}");
    }
  }

  if(cfg.humanFigure){
    lines.push("document.getElementById('HumanBtn').click();");
    lines.push("await wait(800);");
    lines.push("var hf=document.getElementById('"+esc(cfg.humanFigure)+"');");
    lines.push("if(hf){hf.checked=true;hf.dispatchEvent(new Event('change',{bubbles:true}));hf.dispatchEvent(new Event('click',{bubbles:true}));}");
    lines.push("await wait(300);");
    lines.push("var humanModal=document.getElementById('popupHuman');");
    lines.push("if(humanModal){var cb2=[].slice.call(humanModal.querySelectorAll('button')).find(function(b){return b.textContent.trim()==='X'});if(cb2)cb2.click();}");
  }

  lines.push("alert('[" + esc(cfg.bmName||'Bookmarklet') + "] 自動帶入完成，請檢查欄位後再按「儲存」。'+(notes.length?'\\n\\n⚠️ '+notes.join('\\n⚠️ '):'')+'\\n\\n(產生器 v" + GENERATOR_VERSION + (PROC_DATE ? "，術式清單 " + PROC_DATE : "") + ")');");
  lines.push("})();");

  return lines.join('');
}
