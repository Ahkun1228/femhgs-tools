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

document.getElementById('presetBookmarksBtn').addEventListener('click', function(){
  var builtin = builtinPresets(), local = loadLocalPresets();
  var merged = {};
  Object.keys(builtin).forEach(function(n){ merged[n] = builtin[n]; });
  Object.keys(local).forEach(function(n){ merged[n] = local[n]; });
  var names = Object.keys(merged).filter(function(n){ return isPlainObj(merged[n]); });
  if(!names.length){ alert('目前沒有任何預設可以匯出。'); return; }
  var tree = [{ title: '手術排程預約', children: names.map(function(n){
    return { title: n, href: 'javascript:' + encodeURIComponent(buildScript(merged[n])) };
  }) }];
  downloadTextFile('surgery-schedule-bookmarks.html', buildBookmarksHtml(tree));
});

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
