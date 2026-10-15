# Monster Fusion Masters Wiki

繁體中文與英文的公開靜態遊戲百科。沿用遊戲的六角點陣 Logo、黑色面板、像素字與灰／綠／金色系，上方為橫幅，下方為分類、文章與章節目錄。桌面版三欄同頂對齊，中央文章外框隨視窗高度伸縮，內容獨立捲動；桌面版沿用遊戲的 12px 自繪像素捲動軌、14px 內容預留空間與可拖曳的固定滑塊（Firefox 與 Chromium 外觀一致）。窄螢幕改為單欄、一般頁面捲動與可收合的章節目錄。所有連結的右上方向箭頭已移除。

## 頁面與語言

- `index.html`、`rules.html`、`modes.html`、`history.html`：繁體中文。
- `en/`：相同四篇文章的完整英文版。
- `wiki.css`：本站唯一的版面樣式來源。
- `wiki.js`：記住語言偏好、切換時保留文章與章節、手機目錄收合、依桌面內部捲動或手機頁面捲動追蹤目前章節。

兩種語言皆為完整的 HTML，無需前端框架或建置程序。停用 JavaScript 仍能閱讀所有文章並透過語言連結切換。語言偏好儲存在本站的 `mfm:wiki:language`，不存取遊戲帳號資料。所有站內路徑均相對於目前頁面，適用於 GitHub Pages 專案子路徑。

## 本機預覽與檢查

```sh
python -m http.server 8080 --directory docs
python scripts/check-site.py
node --test scripts/test-language.mjs
```

開啟 http://127.0.0.1:8080/ 。檢查會核對雙語文章、語言切換的文章對應、章節 ID、站內連結及素材檔案。互動驗證包括語言偏好、切換後的章節位置，以及桌面／手機版面。

## 發佈

使用既有公開倉庫 `duoduo-88/monster-fusion-masters-showcase_MFM` 的 GitHub Pages：

- Source：Deploy from a branch
- Branch：main
- Folder：/docs

網址：https://duoduo-88.github.io/monster-fusion-masters-showcase_MFM/

不需另外設定 Worker、資料庫、前端建置或輪詢。

## 更新原則與素材

- 修改文章時同步更新兩種語言，並保留相同章節 ID，讓語言切換維持閱讀位置。
- 核心玩法及數值須先核對遊戲規則；不把私人遊戲核心程式、機密或部署設定帶入此公開倉庫。
- 歷史按可查來源撰寫，不捏造日期、報導或里程碑。
- `assets/battle.png` 為既有公開 Showcase 的示範對局截圖。
- `assets/mfm-wordmark.svg` 為遊戲品牌的靜態六角點陣字標，不載入遊戲 runtime。
- 全站只使用隨站提供的 Cubic11（`fonts/mfm-reading.ttf`），不連接字體 CDN；授權與原作者資訊保留在 `fonts/Cubic11-LICENSE.txt`。
