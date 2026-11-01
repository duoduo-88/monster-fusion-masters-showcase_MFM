# 通用程式範例

[回到 Showcase](../README.zh-TW.md) · [設計與技術導覽](../DESIGN.zh-TW.md) · [English](README.md)

這三個獨立 JavaScript 檔案示範製作棋盤遊戲介面時可能用到的基礎概念。每個檔案都能單獨執行，結果印在終端機；不需要安裝套件、遊戲帳號或連線服務。

## 執行方式

電腦需有 Node.js。在 Showcase 儲存庫根目錄分別執行：

```sh
node examples/hex-grid-example.js
node examples/tile-orientation-example.js
node examples/ui-state-example.js
```

## 六角座標

[`hex-grid-example.js`](hex-grid-example.js) 使用 axial 座標 `(q, r)` 示範三件事：將格子轉成畫面座標、尋找六個相鄰座標，以及計算兩個格子之間的距離。

範例從 `(2, -1)` 出發，與原點的距離輸出為 `2`。轉換結果是繪圖位置；棋盤形狀與哪些位置可落子，仍須依遊戲規則另外定義。

## 六個旋轉方向

[`tile-orientation-example.js`](tile-orientation-example.js) 用六個陣列位置表示六條邊。旋轉透過移動陣列索引表示，並把旋轉步數正規化到六個方向內。

範例中，`[A, B, C, D, E, F]` 順時針轉一步得到 `[F, A, B, C, D, E]`。`A` 到 `F` 是示範標記；方向名稱及邊編號是這個範例自己的約定，不代表 MFM 正式規則或正式程式的資料格式。

## 介面狀態

[`ui-state-example.js`](ui-state-example.js) 用 reducer 示範畫面名稱、提示文字與忙碌狀態的更新。每次更新回傳新的狀態物件，方便追蹤一次操作改變了什麼。

執行後的最後狀態是 `screen: "settings"`、`notice: "Saving preferences…"`、`busy: true`。提示文字只是示範資料，程式沒有執行儲存動作。

## 與正式規則的關係

這些範例提供個別技術概念的閱讀起點。製作同規則的遊戲時，基本玩法、合法操作、計分與特殊判定請查閱 [Wiki：遊戲規則](https://duoduo-88.github.io/monster-fusion-masters-showcase_MFM/rules.html)，競技相關內容請查閱[模式與競技](https://duoduo-88.github.io/monster-fusion-masters-showcase_MFM/modes.html)。
