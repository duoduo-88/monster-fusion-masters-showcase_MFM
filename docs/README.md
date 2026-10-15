# Monster Fusion Masters Wiki

此資料夾是 MFM 公開的靜態遊戲百科，內容以繁體中文為主。

## 條目

- `index.html`：入口與遊戲簡介
- `rules.html`：遊戲規則、棋子、封閉及分數
- `modes.html`：模式、Ranked、RTG
- `history.html`：2020 年實體桌遊至線上版本的沿革
- `wiki.css`：獨立且唯一的 Wiki 版面與視覺樣式

沒有使用 Worker、D1、Durable Objects、前端框架、建置步驟、資料庫或客戶端輪詢。

## 發佈

在公開倉庫 `duoduo-88/monster-fusion-masters-showcase_MFM` 的
**Settings → Pages → Build and deployment** 選取：
- Source: **Deploy from a branch**
- Branch: **main**
- Folder: **/docs**

合併至 main 並啟用 Pages 後，預期網址：
https://duoduo-88.github.io/monster-fusion-masters-showcase_MFM/

本站連結皆使用相對路徑，適用於 GitHub Pages 專案子路徑。
不需要再設定額外 GitHub Actions 工作流程；Pages 平台本身可能執行部署工作。

## 本機預覽

```bash
python -m http.server 8080 --directory docs
```

開啟 http://127.0.0.1:8080/ 。

## 更新原則

- 核心玩法及數值須先核對私人主專案的 canonical 規則，再更新 Wiki。
- 不把私人 production 程式碼、機密、驗證流程或部署設定帶入公開倉庫。
- 歷史按可查來源撰寫；不要捏造時間點、媒體報導或里程碑。
- 各頁維持一致版型與相對導航，無需額外 JavaScript。
- 僅使用 Cubic11，字體以 CSS 從 [原作者公開發佈的字型](https://github.com/ACh-K/Cubic-11) 經 jsDelivr 載入，不把字型二進位檔放進儲存庫；如 CDN 無法連線，使用等寬字體備援。
- Cubic11 授權資訊：[來源與授權](https://github.com/ACh-K/Cubic-11/blob/main/OFL.txt)。
