# Monster Fusion Masters Wiki

繁體中文與英文的公開靜態遊戲百科。沿用遊戲的六角點陣 Logo、黑色面板、像素字與灰／綠／金色系，上方為橫幅，下方為分類、文章與章節目錄。桌面版三欄同頂對齊，中央文章外框隨視窗高度伸縮，內容獨立捲動；桌面版沿用遊戲的 12px 自繪像素捲動軌、14px 內容預留空間與可拖曳的固定滑塊（Firefox 與 Chromium 外觀一致）。窄螢幕改為單欄、一般頁面捲動與可收合的章節目錄。所有連結的右上方向箭頭已移除。

## 頁面與語言

左右側欄支援捲動，但隱藏所有捲動條與預留軌道空間；12px 自繪像素滑塊只用於中央文章。

中央文章的 `wiki-scroll-rail` 類別直接寫在 HTML，讓桌面版首屏就預留 14px 捲動軌空間；不可等 JavaScript 啟動後才加入這個版面設定。程式只更新滑塊尺寸、位置與拖曳操作，避免載入時文章重新縮排。

- `index.html`、`rules.html`、`modes.html`、`history.html`：繁體中文。
- `en/`：相同四篇文章的完整英文版。
- `wiki.css`：本站唯一的版面樣式來源。
- `wiki-search.js`：跨中英文的全文關鍵字搜尋，點選結果跳至對應語言的文章章節。索引只含公開百科內容，搜尋不傳送到外部服務。
- `wiki-search-index.js`：由 `scripts/build-search-index.py` 從雙語文章產生的本地搜尋索引。
- `wiki.js`：記住語言偏好、切換時保留文章與章節、手機目錄收合、依桌面內部捲動或手機頁面捲動追蹤目前章節。

- `wiki-media.js`：在遊戲規則的合法落子章節切換三段實際落子 GIF、預設自動播放動圖，並支援減少動態效果的系統偏好。
- `assets/media/`：局部棋盤、棋子與牌庫、封閉／DEAD、計分範例、實體桌遊照片、遊戲功能截圖，以及目前 CLASSIC 階級徽章動圖；來源與擷取說明見該目錄的 README。


兩種語言皆為完整的 HTML，無需前端框架或建置程序。停用 JavaScript 仍能閱讀所有文章並透過語言連結切換。語言偏好儲存在本站的 `mfm:wiki:language`，不存取遊戲帳號資料。所有站內路徑均相對於目前頁面，適用於 GitHub Pages 專案子路徑。

## 本機預覽與檢查

```sh
python -m http.server 8080 --directory docs
python scripts/check-site.py
python scripts/build-search-index.py --check
node --test scripts/test-language.mjs
node --test scripts/test-media.mjs
node --test scripts/test-search.mjs
```

開啟 http://127.0.0.1:8080/ 。檢查會核對雙語文章、語言切換的文章對應、章節 ID、站內連結及素材檔案。互動驗證包括語言偏好、切換後的章節位置，以及桌面／手機版面。

## 發佈

使用既有公開倉庫 `duoduo-88/monster-fusion-masters-showcase_MFM` 的 GitHub Pages：

- Source：Deploy from a branch
- Branch：main
- Folder：/docs

網址：https://duoduo-88.github.io/monster-fusion-masters-showcase_MFM/

不需另外設定 Worker、資料庫、前端建置或輪詢。

## 社群修訂建議

八個中英文百科頁面皆在右側欄的最下方，以獨立公開資訊區塊提供「提出修訂建議／Suggest an edit」連結，連到 Showcase 公開倉庫的 GitHub Issue Form（`.github/ISSUE_TEMPLATE/wiki-suggestion.yml`）。投稿者須登入 GitHub，內容會公開；維護者審核並確認內容後，再更新正式 Wiki。此流程不允許訪客直接修改網頁或私人主專案原始碼，也不使用新的後端服務。

## 更新原則與素材

- 全站介面文字最小為 12px，包含手機版、搜尋結果、圖說、側欄與頁尾。
- 次要分類、章節導覽與內文條目的裝飾性序號使用「-」，保留遊戲數值、年份與計分圖中的棋子標記。
- 修改文章時同步更新兩種語言，並保留相同章節 ID，讓語言切換維持閱讀位置。
- 文章更新後執行 `python scripts/build-search-index.py`，同步更新搜尋索引；再執行 `--check` 確認沒有過期。
- 核心玩法及數值須先核對遊戲規則；不把私人遊戲核心程式、機密或部署設定帶入此公開倉庫。
- 歷史按可查來源撰寫，不捏造日期、報導或里程碑。
- `assets/battle.png` 為既有公開 Showcase 的示範對局截圖。
- `assets/mfm-wordmark.svg` 為遊戲品牌的靜態六角點陣字標，不載入遊戲 runtime。
- 新增圖片皆為實際遊戲畫面或其繪製器的輸出。計分範例由遊戲判定後擷取，編號以 HTML 疊加，原始圖片維持局部截圖。
- 全站只使用隨站提供的 Cubic11（`fonts/mfm-reading.ttf`），不連接字體 CDN；授權與原作者資訊保留在 `fonts/Cubic11-LICENSE.txt`。
