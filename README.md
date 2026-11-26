# femhgs-tools

一般外科的瀏覽器書籤（bookmarklet）工具目錄，用 GitHub Pages 發佈。

網址：https://ahkun1228.github.io/femhgs-tools/

## 結構

| 路徑 | 說明 |
|---|---|
| `index.html` | 工具目錄頁（由 `tools/build.js` 產生，請勿手改） |
| `bookmarklets/*.js` | 各書籤的可讀原始碼（不含 `javascript:` 前綴） |
| `tools/build.js` | 讀 `bookmarklets/*.js`，驗證語法並重新產生 `index.html` |
| `surgery-schedule/` | 手術排程 Bookmarklet 產生器（純靜態，無需建置） |
| `surgery-schedule/data/procedures.js` | HIS 個案車術式清單（更新術式只改這裡，並同步改檔內日期） |
| `surgery-schedule/data/presets.js` | 內建預設集，所有人可見（唯讀） |

## 維護

- **改既有書籤**：編輯 `bookmarklets/<id>.js` → `node tools/build.js` → commit。
- **新增書籤**：新增 `bookmarklets/<id>.js`，在 `tools/build.js` 的 `tools` 清單加一筆說明 → `node tools/build.js`。
- **更新術式清單**：改 `surgery-schedule/data/procedures.js` 與 `PROCEDURES_DATE`。
- **改產生器**：改 `surgery-schedule/app.js` 時，同步更新檔頭的 `GENERATOR_VERSION`；生成的書籤結尾提示會顯示此版本，方便判斷舊書籤是否需要重新產生。
- GitHub Pages 有數分鐘的快取，更新後若看到舊版，稍等或強制重新整理。

## 注意

- 本 repo 與 Pages 網站為公開。請勿放入病人資料、帳號密碼或其他不宜公開的內容。
- 書籤程式刻意保持自包含，不從網路載入外部腳本。
- 範本填入類書籤（如入院病歷）填入的是預設範本，使用者須自行核對後再儲存。
