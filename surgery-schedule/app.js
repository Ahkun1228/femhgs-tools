var GENERATOR_VERSION = '2026.11.26';
var PROC_DATE = window.PROCEDURES_DATE || '';
var PROCEDURES = window.PROCEDURES || {};
document.getElementById('verNo').textContent = GENERATOR_VERSION + (PROC_DATE ? '，術式清單 ' + PROC_DATE : '');


function populateProcPicker(){
  var loc = document.getElementById('location').value;
  var picker = document.getElementById('procPicker');
  picker.innerHTML = '';
  if(!loc || !PROCEDURES[loc]){
    var opt = document.createElement('option');
    opt.value = '';
    opt.textContent = loc ? '（此部位沒有術式資料，請手動輸入關鍵字）' : '請先選部位代號…';
    picker.appendChild(opt);
    return;
  }
  var blank = document.createElement('option');
  blank.value = '';
  blank.textContent = '— 請選擇術式 —';
  picker.appendChild(blank);
  var currentKeyword = document.getElementById('procKeyword').value.trim();
  PROCEDURES[loc].forEach(function(proc){
    var opt = document.createElement('option');
    opt.value = proc.en;
    var label = proc.en + (proc.zh ? '　' + proc.zh : '');
    opt.textContent = label.length > 68 ? label.slice(0,68) + '…' : label;
    if(currentKeyword && proc.en.indexOf(currentKeyword) > -1){ opt.selected = true; }
    picker.appendChild(opt);
  });
}
document.getElementById('location').addEventListener('change', populateProcPicker);
document.getElementById('procPicker').addEventListener('change', function(){
  if(this.value){
    document.getElementById('procKeyword').value = this.value;
  }
});
populateProcPicker();

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

function readConfigFromForm(){
  return {
    bmName: document.getElementById('bmName').value.trim() || 'Bookmarklet',
    deptCode: document.getElementById('deptCode').value.trim(),
    doctorCode: document.getElementById('doctorCode').value.trim(),
    lastFast: document.getElementById('lastFast').value,
    course: (document.querySelector('input[name=course]:checked')||{}).value || '',
    urgency: (document.querySelector('input[name=urgency]:checked')||{}).value || '',
    period: (document.querySelector('input[name=period]:checked')||{}).value || '',
    diagnosis: document.getElementById('diagnosis').value,
    anesthesia: document.getElementById('anesthesia').value,
    durH: document.getElementById('durH').value,
    durM: document.getElementById('durM').value,
    antibiotic: document.getElementById('antibiotic').value,
    pacemaker: document.getElementById('pacemaker').value,
    location: document.getElementById('location').value,
    procKeyword: document.getElementById('procKeyword').value.trim(),
    procPrefix: document.getElementById('procPrefix').value.trim(),
    humanFigure: document.getElementById('humanFigure').value
  };
}

function setRadio(name, value){
  var el = document.querySelector('input[name="'+name+'"][value="'+String(value).replace(/["\\]/g,'\\$&')+'"]');
  if(el) el.checked = true;
}

function applyConfigToForm(cfg){
  document.getElementById('bmName').value = cfg.bmName || '';
  document.getElementById('deptCode').value = cfg.deptCode || '';
  document.getElementById('doctorCode').value = cfg.doctorCode || '';
  document.getElementById('lastFast').value = cfg.lastFast || '';
  setRadio('course', cfg.course || '');
  setRadio('urgency', cfg.urgency || '');
  setRadio('period', cfg.period || '');
  document.getElementById('diagnosis').value = cfg.diagnosis || '';
  document.getElementById('anesthesia').value = cfg.anesthesia || '';
  document.getElementById('durH').value = cfg.durH || '';
  document.getElementById('durM').value = cfg.durM || '';
  document.getElementById('antibiotic').value = cfg.antibiotic || '';
  document.getElementById('pacemaker').value = cfg.pacemaker || '';
  document.getElementById('location').value = cfg.location || '';
  document.getElementById('procKeyword').value = cfg.procKeyword || '';
  document.getElementById('procPrefix').value = cfg.procPrefix || '';
  document.getElementById('humanFigure').value = cfg.humanFigure || '';
  populateProcPicker();
}

// ---------------- 預設集：內建（data/presets.js）+ 個人（localStorage） ----------------
var PRESET_KEY = 'surgery-presets-v1';
function has(o, k){ return Object.prototype.hasOwnProperty.call(o, k); }
function isPlainObj(x){ return !!x && typeof x === 'object' && !Array.isArray(x); }

function storageOK(){
  try{ var k='__t'; localStorage.setItem(k,'1'); localStorage.removeItem(k); return true; }catch(e){ return false; }
}
function loadLocalPresets(){
  try{
    var raw = localStorage.getItem(PRESET_KEY);
    var o = raw ? JSON.parse(raw) : {};
    return isPlainObj(o) ? o : {};
  }catch(e){ return {}; }
}
function saveLocalPresets(obj){
  try{ localStorage.setItem(PRESET_KEY, JSON.stringify(obj)); return true; }catch(e){ return false; }
}
function builtinPresets(){
  return isPlainObj(window.DEFAULT_PRESETS) ? window.DEFAULT_PRESETS : {};
}

function renderPresetList(){
  var listEl = document.getElementById('presetList');
  var builtin = builtinPresets(), local = loadLocalPresets();
  var names = Object.keys(builtin);
  Object.keys(local).forEach(function(n){ if(names.indexOf(n) < 0) names.push(n); });
  listEl.textContent = '';

  if(!storageOK()){
    var warn = document.createElement('div');
    warn.className = 'placeholder';
    warn.style.padding = '0 0 8px';
    warn.textContent = '⚠️ 這個瀏覽器目前無法儲存個人預設（可能是無痕視窗），請用「匯出自訂預設」自行備份。';
    listEl.appendChild(warn);
  }
  if(names.length === 0){
    var empty = document.createElement('div');
    empty.className = 'placeholder';
    empty.style.padding = '10px 0';
    empty.textContent = '還沒有任何預設。';
    listEl.appendChild(empty);
    return;
  }
  names.forEach(function(name){
    var inLocal = has(local, name), inBuiltin = has(builtin, name);
    var row = document.createElement('div');
    row.className = 'preset-row';

    var load = document.createElement('button');
    load.type = 'button';
    load.className = 'preset-load';
    load.textContent = '📋 ' + name + (inLocal ? (inBuiltin ? '（已自訂）' : '') : '（內建）');
    load.addEventListener('click', function(){
      var cfg = inLocal ? loadLocalPresets()[name] : builtin[name];
      if(isPlainObj(cfg)) applyConfigToForm(cfg);
    });
    row.appendChild(load);

    if(inLocal){
      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'preset-del';
      del.textContent = '✕';
      del.title = inBuiltin ? '刪除自訂內容（恢復內建）' : '刪除';
      del.addEventListener('click', function(){
        if(!confirm('確定要刪除「' + name + '」這個預設嗎？')) return;
        var cur = loadLocalPresets();
        delete cur[name];
        saveLocalPresets(cur);
        renderPresetList();
      });
      row.appendChild(del);
    }
    listEl.appendChild(row);
  });
}

document.getElementById('presetSaveBtn').addEventListener('click', function(){
  var cfg = readConfigFromForm();
  var btn = this;
  var original = btn.textContent;
  var local = loadLocalPresets();
  local[cfg.bmName] = cfg;
  if(saveLocalPresets(local)){
    renderPresetList();
    btn.textContent = '已儲存到這個瀏覽器！';
    setTimeout(function(){ btn.textContent = original; }, 1600);
  } else {
    alert('儲存失敗：瀏覽器封鎖了本機儲存（常見於無痕視窗）。請改用「匯出自訂預設」備份。');
  }
});

document.getElementById('presetExportBtn').addEventListener('click', function(){
  var ta = document.getElementById('presetImportExportArea');
  ta.value = JSON.stringify(loadLocalPresets(), null, 2);
  ta.style.display = 'block';
  ta.select();
});

document.getElementById('presetImportBtn').addEventListener('click', function(){
  var ta = document.getElementById('presetImportExportArea');
  ta.style.display = 'block';
  ta.focus();
  ta.placeholder = '貼上要還原/合併進來的 JSON，然後按「確認匯入」';
  document.getElementById('presetImportConfirmBtn').style.display = 'inline-block';
});

document.getElementById('presetImportConfirmBtn').addEventListener('click', function(){
  var ta = document.getElementById('presetImportExportArea');
  try{
    var incoming = JSON.parse(ta.value);
    if(!isPlainObj(incoming)) throw new Error('not object');
    var existing = loadLocalPresets();
    var count = 0;
    Object.keys(incoming).forEach(function(n){
      if(isPlainObj(incoming[n])){ existing[n] = incoming[n]; count++; }
    });
    if(!saveLocalPresets(existing)) throw new Error('save failed');
    renderPresetList();
    this.style.display = 'none';
    ta.style.display = 'none';
    ta.value = '';
    alert('匯入完成，共 ' + count + ' 筆預設。');
  }catch(e){
    alert('匯入失敗，請確認貼上的內容是完整的 JSON（用「匯出自訂預設」產生的那一串）。');
  }
});

renderPresetList();

document.getElementById('genBtn').addEventListener('click', function(){
  var cfg = readConfigFromForm();

  var code = buildScript(cfg);
  var href = 'javascript:' + encodeURIComponent(code);

  var slot = document.getElementById('bmSlot');
  slot.classList.add('ready');
  slot.innerHTML =
    '<a class="bm-link" href="' + href.replace(/"/g,'&quot;') + '" draggable="true">🔖 ' +
    cfg.bmName.replace(/</g,'&lt;') + '</a>' +
    '<div class="instructions">↑ 把這顆按鈕拖到書籤列上放開，就完成安裝了。</div>' +
    '<div class="raw-box">' +
      '<textarea id="rawUrl" readonly>' + href.replace(/</g,'&lt;') + '</textarea>' +
      '<button class="copy-btn" id="copyBtn">複製網址（手動新增書籤用）</button>' +
    '</div>';

  document.getElementById('copyBtn').addEventListener('click', function(){
    var ta = document.getElementById('rawUrl');
    ta.select();
    ta.setSelectionRange(0, 999999);
    try{
      document.execCommand('copy');
      this.textContent = '已複製！';
      setTimeout(function(btn){ if(btn) btn.textContent = '複製網址（手動新增書籤用）'; }.bind(null,this), 1500);
    }catch(e){
      navigator.clipboard && navigator.clipboard.writeText(ta.value);
    }
  });
});
