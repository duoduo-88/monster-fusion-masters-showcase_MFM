# Monster Fusion Masters

**官方遊戲百科（規則、計分與開發歷史）：** [MFM Wiki](https://duoduo-88.github.io/monster-fusion-masters-showcase_MFM/)（需啟用 GitHub Pages）

**Showcase 儲存庫名稱：** `monster-fusion-masters-showcase`

![Monster Fusion Masters Showcase 封面](assets/showcase-cover.png?v=d8be5338)

**遊玩／線上版本：** [https://mfm.monster-fusion-masters-online.workers.dev/](https://mfm.monster-fusion-masters-online.workers.dev/)

## 遊玩 Monster Fusion Masters

- [線上遊玩 — 瀏覽器版本](https://mfm.monster-fusion-masters-online.workers.dev/)
- [下載 MFM Desktop — Windows x64](https://github.com/duoduo-88/monster-fusion-masters-showcase_MFM/releases/latest)

MFM Desktop 是使用 Microsoft Edge WebView2 的 Windows 免安裝桌面版本。下載 ZIP 並完整解壓縮後，執行 `MFMDesktop.exe` 即可。

程式需要 Microsoft Edge WebView2 Evergreen Runtime。Windows 11 已內建，大多數 Windows 10 裝置也已安裝；若電腦缺少 Runtime，請至 [Microsoft 官方網站下載](https://developer.microsoft.com/microsoft-edge/webview2/)。

此版本尚未進行程式碼簽署，Windows 可能會對尚未建立信譽的應用程式顯示 SmartScreen 警告。

Monster Fusion Masters 是一款原創競技策略棋盤遊戲。最初是我設計的實體桌遊，後來由 Codex 協助把既有設計逐步實作成軟體。

## 遊戲功能

- 免費遊玩，使用瀏覽器即可開始
- 即時多人 PvP 與房間
- AI 對手與積分對戰
- 觀戰模式與新手教學
- 英文及繁體中文介面

## 介面導覽

以下畫面取自本機示範環境，玩家與房間資料皆為示範資料。遊戲持續開發中，線上介面可能調整。

### 大廳

![大廳顯示玩家資料、積分配對、房間列表與線上玩家](assets/lobby.png)

大廳集中各種遊玩入口：查看積分、勝率、賽季排名與排行榜，尋找積分對戰，或建立、加入及觀戰房間。玩家資訊區也可開啟對戰重播、新手教學與色彩實驗室；右側可查看目前在線的玩家。

### 房間

![房間顯示玩家與觀戰席、色彩選擇、邀請 QR Code 及對戰控制](assets/room.png)

每個房間最多可有四名玩家，並另設觀戰席。可透過房間代碼、邀請連結或 QR Code 邀請朋友，選擇玩家色彩並設定每回合時間。房主也能加入 AI 對手，準備好後開始對戰。

### 色彩實驗室

![色彩實驗室顯示色彩庫、圖案設定、色彩代碼與預覽棋盤](assets/color-lab.png)

在色彩實驗室可設定圖案、主色與輔色，並調整尺寸、角度、粗糙度等細節。設計可在練習棋盤上試看，儲存到本機色彩庫，或複製與載入色彩代碼來分享。

### 戰鬥畫面

![戰鬥畫面顯示六角棋盤、手牌、玩家分數、牌庫與遊戲紀錄](assets/battle.png)

戰鬥以 61 格六角棋盤為核心。從手牌選取棋子、旋轉方向、預覽落點，再放到合法位置；側欄可查看牌庫、玩家分數與遊戲紀錄，棋盤上方則顯示回合資訊。

## Build process

### 1. 原始實體桌遊 — 2020

Monster Fusion Masters 最初是我設計的原創策略桌遊。核心概念、棋盤與棋子設計、規則、計分方式、平衡設計和實體版本，都早於這次 AI 輔助的開發。2020 年，我公開了可 3D 列印的版本：[Monster Fusion Masters V1 棋盤遊戲](https://www.printables.com/model/35556-monster-fusion-masters-v1board-game)。

### 2. 數位版本的構想

當時我就希望把桌遊做成電子遊戲和線上版本，但缺乏遊戲與程式開發經驗，也不熟悉多人連線和伺服器開發，並且沒有足夠預算完成整個專案。光靠當時的能力，無法把桌遊構想做成可線上遊玩的遊戲。

### 3. 專案暫停

我曾嘗試尋求外部開發協助，但受到開發成本與專案規模影響，始終未能順利推進。數位化的構想因此擱置了多年。

### 4. Codex 協助重啟專案

隨著 AI 輔助軟體開發逐漸成熟，我重新投入這個專案。Codex 協助把已存在的遊戲設計實作成軟體；遊戲本身、規則和平衡設計並不是 Codex 創造的。協助內容包括：

- 將既有規則轉換成程式
- 實作規劃與程式碼分析
- 除錯與重構
- 介面與多人功能實作
- 反覆迭代開發

### 5. 第一個可遊玩的數位版本

原本的桌遊設計逐步轉成可在瀏覽器遊玩的遊戲。這包括以軟體呈現棋盤狀態、棋子放置、回合、計分、遊戲流程和可操作的介面。此處只概述開發工作，不包含 production 實作。

### 6. 線上多人遊戲

要支援線上競技，需要房間、同步的玩家與遊戲狀態、觀戰功能和多人基礎架構。線上服務使用 Cloudflare Workers 與 Durable Objects；伺服器實作不包含在這份 Showcase repository 中。

### 7. AI 對手與積分對戰

數位遊戲後續加入 AI 對手與積分對戰功能。Codex 協助相關實作、除錯與迭代；production AI 和排名系統不包含在這個 repository 中。

### 8. 教學與易用性

新手教學、英文與繁體中文介面，以及持續改進的 UI，讓第一次接觸遊戲的玩家更容易理解規則並開始對戰。

### 9. 持續迭代與平衡調整

遊戲目前仍在開發中。Codex 協助實作、分析程式碼、除錯、修正回歸問題、重構、調整介面與改善系統；原始遊戲設計、規則、平衡決策、玩法方向和功能需求仍由我負責。

### 10. 目前版本

Monster Fusion Masters 已成為免費遊玩的瀏覽器線上競技策略遊戲，包含即時 PvP、AI 對手與積分對戰，目前仍持續開發。

## 本儲存庫內容

本儲存庫僅包含精選 Showcase 素材與非敏感的程式碼範例。

完整 production 原始碼、遊戲 AI、排名邏輯及其他核心系統不會公開發佈。

此資料夾中的範例是通用、精簡的示範，並非 production 實作的副本，也不包含遊戲規則、AI、計分、配對、安全或伺服器系統。

## Showcase 圖片素材

`assets/` 資料夾包含 Showcase 封面與上方四張介面截圖；之後也可補上實體棋盤照片。


