// 用法：node tools/build.js
// 讀取 bookmarklets/<id>.js（可讀原始碼）、驗證語法，重新產生根目錄的 index.html（目錄頁）。
// 新增或修改 bookmarklet：改 bookmarklets/*.js 與下面的 tools 清單，再執行本檔。
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = ROOT;

const tools = [
  {
    id: 'auto-class',
    title: '自動上課計時',
    tag: '線上課程',
    desc: '輸入分鐘數後開始倒數:影片播放時才計時、暫停時計時也暫停,並防止切換分頁時影片自動暫停。時間到會自動點擊「回傳時數並離開」按鈕。輸入 <code>t</code> 可只測試(標出按鈕、檢查影片,不計時)。',
    notes: [
      '畫面右下角會出現黑色倒數小視窗,點一下可取消。',
      '會自動搜尋頁面與 iframe 內的 <code>&lt;video&gt;</code> 與 <code>.toolbar-button.exit</code> 按鈕,只適用有這個按鈕的課程平台。',
      '請依所屬單位對線上課程的規定使用。'
    ],
    warn: null
  },
  {
    id: 'pe-template',
    title: '入院病歷:過去病史 / 理學檢查範本填入',
    tag: '院內 HIS',
    desc: '在 HIS 入院病歷編輯頁,依目前所在頁籤(過去病史 或 入院理學檢查),把<strong>空白欄位</strong>填入預設範本文字。已有內容的欄位不會被覆蓋,生命徵象(身高、體重、BT、BP、PR、RR)不會被碰,也不會自動送出,填完請自行檢查並按「暫存」。',
    notes: [
      '腳動脈搏欄位為單選鈕(+),其餘為文字欄位。',
      '欄位名稱對應 FEMH HIS 入院病歷頁面的結構(<code>QuestionList[n].Question</code>),其他系統無法使用。',
      '填入的內容全是通用範本,可在程式碼開頭的 <code>PAST</code>、<code>PHYSICAL</code> 兩個物件自行修改預設值。'
    ],
    warn: '範本預設多為正常或陰性結果(例如 denied、no tenderness)。<strong>每一項都必須依實際問診與理學檢查核對、修改後才能存檔</strong>,病歷內容的正確性由使用者本人負責。'
  }
];

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const built = tools.map(t => {
  const body = fs.readFileSync(path.join(ROOT, 'bookmarklets', t.id + '.js'), 'utf8').trim();
  if (body.startsWith('javascript:')) throw new Error(t.id + ': 檔案內容不要含 javascript: 前綴');
  new Function(body); // 語法檢查（只解析，不執行）
  return { ...t, body, href: 'javascript:' + encodeURIComponent(body) };
});

const generators = [
  {
    id: 'surgery-schedule',
    title: '手術排程 Bookmarklet 產生器',
    tag: '院內 HIS・產生器',
    desc: '依個案設定固定欄位（科別、醫師、診斷、麻醉、術式、人形圖…），產生專屬的「手術排程預約」自動帶入書籤。預設的內容只存在你自己的瀏覽器。',
    notes: [
      '產生的書籤只填欄位，跑完會提示檢查，不會自動儲存。',
      '術式清單是 2026/08 從 HIS 個案車抓取的一般外科（10310）資料；HIS 改版後請重新產生書籤。',
      '欄位 ID 對應 FEMH HIS「手術排程預約」頁面，其他系統無法使用。'
    ],
    href: 'surgery-schedule/'
  }
];

const generatorCards = generators.map(g => `
    <article class="card" id="${g.id}">
      <header>
        <h2>${g.title}</h2>
        <span class="tag">${g.tag}</span>
      </header>
      <p>${g.desc}</p>
      <div class="actions">
        <a class="drag" href="${g.href}" style="cursor:pointer">開啟產生器 →</a>
      </div>
      <ul class="notes">${g.notes.map(n => `<li>${n}</li>`).join('')}</ul>
    </article>`).join('\n');

const cards = built.map(t => `
    <article class="card" id="${t.id}">
      <header>
        <h2>${t.title}</h2>
        <span class="tag">${t.tag}</span>
      </header>
      <p>${t.desc}</p>
      ${t.warn ? `<div class="warn" role="note">⚠️ ${t.warn}</div>` : ''}
      <div class="actions">
        <a class="drag" href="${t.href}" draggable="true" title="拖曳到書籤列" onclick="alert('請把這個按鈕「拖曳」到瀏覽器的書籤列,不要直接點擊。');return false;">🔖 ${t.title}</a>
        <button type="button" class="copy" data-id="${t.id}">複製程式碼</button>
      </div>
      <ul class="notes">${t.notes.map(n => `<li>${n}</li>`).join('')}</ul>
      <details>
        <summary>查看原始碼</summary>
        <pre><code>${esc(t.body)}</code></pre>
      </details>
    </article>`).join('\n');

const codeMap = {};
built.forEach(t => { codeMap[t.id] = 'javascript:' + t.body; });
const codeJson = JSON.stringify(codeMap).replace(/</g, '\\u003c');

const html = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>書籤小工具 Bookmarklets</title>
<style>
  :root { --bg:#f6f7f9; --fg:#1d2330; --muted:#5d6678; --card:#fff; --line:#e1e5ec; --accent:#2457d6; --warn-bg:#fff4e0; --warn-line:#f0b45a; --code:#f0f2f6; }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#12151b; --fg:#e6e9ef; --muted:#9aa3b5; --card:#1a1f28; --line:#2a313d; --accent:#7ba2ff; --warn-bg:#33270f; --warn-line:#a87a2c; --code:#222936; }
  }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--fg); font:16px/1.65 system-ui,-apple-system,"Segoe UI","Noto Sans TC","Microsoft JhengHei",sans-serif; }
  main { max-width: 820px; margin: 0 auto; padding: 32px 18px 64px; }
  h1 { font-size: 1.7rem; margin: 0 0 6px; }
  .lead { color: var(--muted); margin: 0 0 24px; }
  .how { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:16px 20px; margin-bottom:28px; }
  .how h2 { font-size:1.05rem; margin:0 0 8px; }
  .how ol { margin:0; padding-left:1.3em; }
  .how li { margin:4px 0; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:18px 20px; margin-bottom:20px; }
  .card header { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .card h2 { font-size:1.2rem; margin:0; }
  .tag { font-size:.75rem; color:var(--accent); border:1px solid var(--accent); border-radius:999px; padding:1px 9px; }
  .card p { margin:10px 0; }
  .warn { background:var(--warn-bg); border:1px solid var(--warn-line); border-radius:8px; padding:10px 12px; margin:10px 0; font-size:.95rem; }
  .actions { display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin:14px 0 6px; }
  a.drag { display:inline-block; background:var(--accent); color:#fff; text-decoration:none; padding:9px 16px; border-radius:8px; font-weight:600; cursor:grab; }
  @media (prefers-color-scheme: dark) { a.drag { color:#0d1220; } }
  button.copy { font:inherit; background:transparent; color:var(--fg); border:1px solid var(--line); border-radius:8px; padding:8px 14px; cursor:pointer; }
  button.copy:hover { border-color:var(--accent); }
  .notes { color:var(--muted); font-size:.92rem; padding-left:1.2em; margin:8px 0; }
  code { background:var(--code); padding:1px 5px; border-radius:4px; font-size:.88em; }
  details { margin-top:10px; }
  summary { cursor:pointer; color:var(--muted); font-size:.92rem; }
  pre { background:var(--code); border-radius:8px; padding:12px; overflow:auto; max-height:320px; font-size:.78rem; line-height:1.45; white-space:pre-wrap; word-break:break-all; }
  pre code { background:none; padding:0; font-size:inherit; }
  footer { color:var(--muted); font-size:.88rem; margin-top:30px; }
  #toast { position:fixed; left:50%; bottom:24px; transform:translateX(-50%); background:#000; color:#fff; padding:8px 16px; border-radius:8px; opacity:0; transition:opacity .2s; pointer-events:none; }
  #toast.show { opacity:.92; }
</style>
</head>
<body>
<main>
  <h1>🔖 書籤小工具</h1>
  <p class="lead">一鍵執行的瀏覽器書籤(bookmarklet)。程式只在你自己的瀏覽器裡執行,不會把任何資料傳到外部。</p>

  <section class="how">
    <h2>安裝方式</h2>
    <ol>
      <li><strong>電腦版</strong>:按 <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd> 顯示書籤列,把下方藍色按鈕<strong>拖曳</strong>到書籤列。</li>
      <li><strong>拖曳不了</strong>(手機、被管制的電腦):按「複製程式碼」,新增任一書籤,然後把書籤的「網址」整個換成剛複製的內容並儲存。</li>
      <li>到對應的網頁,點一下書籤列上的書籤就會執行。</li>
    </ol>
  </section>

${generatorCards}

${cards}

  <footer>
    <p>使用前請先閱讀原始碼確認內容。這些工具為個人輔助用途,使用所造成的結果由使用者自行負責。</p>
  </footer>
</main>
<div id="toast"></div>
<script>
  var CODE = ${codeJson};
  function toast(msg){ var t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); setTimeout(function(){t.classList.remove('show')},1800); }
  document.querySelectorAll('button.copy').forEach(function(b){
    b.addEventListener('click', function(){
      var text = CODE[b.getAttribute('data-id')];
      function fallback(){
        var ta=document.createElement('textarea'); ta.value=text; ta.style.position='fixed'; ta.style.opacity='0';
        document.body.appendChild(ta); ta.select();
        try{ document.execCommand('copy'); toast('已複製'); }catch(e){ toast('複製失敗,請展開原始碼手動複製'); }
        ta.remove();
      }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function(){ toast('已複製'); }, fallback);
      } else { fallback(); }
    });
  });
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(OUT, 'index.html'), html, 'utf8');
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
console.log('OK', built.map(t => t.id + ' body=' + t.body.length + ' href=' + t.href.length).join(' | '));
