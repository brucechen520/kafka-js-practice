這是一份為你整合後的 `advanced-scenarios` 完整 **README.md**。這份文件結合了你目前的高併發業務背景、技術實驗進度，以及未來晉升「Kafka 架構師」的學習藍圖。

---

# 🏗️ Advanced Scenarios: Kafka & Distributed Systems Lab

這個資料夾包含了分散式系統中進階架構模式的實作與驗證。我們以高併發(如購票)作為核心業務場景，探討如何解決資料一致性、高併發熱點以及跨服務事務等核心難題。

## 🚀 晉級之路 (Roadmap)

為了從「會用 Kafka 的工程師」進化到 **「Kafka 架構師」**，本實驗室規劃了四個階段的成長路徑：

| 階段 | 主題 | 核心目標 | 狀態 |
| --- | --- | --- | --- |
| **Repo 1** | **Resilience & Perf** | 穩固傳輸、不掉資料、分區效能調優 | ✅ 已完成 |
| **Repo 2** | **Consistency** | **Transactional Outbox Pattern** (DB 與 Kafka 一致性) | 🛠 實作中 |
| **Repo 3** | **Guaranteed Logic** | **Exactly-Once (EOS)** & **Delay Queues** (金流與延遲任務) | 📅 待實作 |
| **Repo 4** | **Real-time Analytics** | **Kafka Streams** (複雜流式狀態計算) | 📅 待實作 |

---

## 🚦 進度追蹤 (Implementation Progress)

本目錄採用 `[編號]-[pattern-name]-[target-problem]` 的格式命名，以便於追蹤特定的分散式系統痛點。

| 編號 | 情境名稱 | 核心模式 | 業務場景 | 狀態 |
| --- | --- | --- | --- | --- |
| 01 | Outbox DB Consistency | Transactional Outbox | 抽獎紀錄原子性寫入 | 🛠 實作中 |
| 02 | Saga Choreography | Saga Pattern | 跨服務失敗補償邏輯 | 📅 待實作 |
| 03 | Hotkey Partition Skewing | Key Salting | 解決高併發熱點傾斜 | ✅ 已完成 |
| 04 | Idempotent Consumer | Idempotency | 處理訊息重複消費 | 📅 待實作 |

---

## 🛠️ 情境詳細說明

<a name="01"></a>

### 01. Transactional Outbox Pattern (Consistency)

* **目標**：確保資料庫更新與 Kafka 訊息發送的原子性。
* **問題**：解決「雙寫 (Dual Write)」問題。如果資料庫寫入了訂單，但 Kafka 突然斷線沒發出訊息，該怎麼辦？
* **方案**：在同一事務中寫入業務表與 `outbox` 表，由獨立的 **Relay Worker** 負責搬運訊息。

<a name="02"></a>

### 02. Saga Choreography Flow (Advanced Architecture)

* **目標**：處理跨微服務的長事務與補償機制。
* **流程**：`結帳服務` -> `庫存扣數` -> `物流發貨`。
* **補償**：若「庫存扣數」失敗，自動觸發「結帳服務」的退款流程，確保最終一致性。

<a name="03"></a>

### 03. Hotkey Salting Logic (Performance)

* **目標**：解決單一 Partition 負載過高（Skewing）的問題。
* **場景**：極熱門演唱會聯名一番賞導致流量全部擠在同一個分區，造成單個 Consumer 過載。
* **方案**：實作 **Key Salting** 技術均勻分散流量，並探討如何權衡順序性。

<a name="04"></a>

### 04. Idempotent Consumer & Retry

* **目標**：確保訊息「至少一次（At-least-once）」傳遞時，不會造成重複業務操作。
* **場景**：當網路抖動導致重複發送「中獎訊息」時，系統應識別出該訊息已處理過，避免使用者重複領取獎品。

---

## 🧪 實驗啟動說明 (Experimental Guide)

每個子資料夾均包含獨立的實作代碼與說明文件：

```bash
# 範例：進入 Hotkey 優化實驗
cd 03-hotkey-partition-skewing

# 執行測試
node bad-hotkey-producer.js   # 觀察傾斜現象
node good-salting-producer.js # 觀察優化結果

```

---

## 📝 未來預計實作 (Upcoming Challenges)

1. **Exactly-Once Semantics (EOS)**: 透過 `transactional.id` 實現跨 Partition 的原子性寫入。
2. **Delay Queue**: 利用多級 Topic 轉發實現「訂單 30 分鐘未付款自動取消」。
3. **Kafka Streams**: 實作 Window Aggregation，在不依賴外部 DB 下計算即時熱門活動。
4. **Static Membership**: 透過 `group.instance.id` 優化大規模 Consumer 重啟時的 Rebalance 停頓。

---

### 💡 專案小提醒 (Tips)

* **關於 TimeoutNegativeWarning**: 測試高併發時若遇到此警告，請檢查 `Date.now() - startTime` 邏輯，避免非同步回調導致時間計算產生負值。
* **為什麼先做 Outbox Pattern？**: 這是微服務架構中最標準的技能。解決了 DB 與 Kafka 之間的一致性，後續的 Saga 與 EOS 才有意義。

---

**下一步建議：**
這份 README 清楚地展示了你的技術深度。如果你準備好了，我們可以開始實作 **01-transactional-outbox** 的 `relay-worker.js` 核心邏輯，或是設計對應的 MySQL Outbox 資料表 Schema？