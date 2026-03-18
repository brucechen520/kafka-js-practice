這十個案例涵蓋了 Kafka 在 **NextDrive (能源物聯網)** 這種大規模、高穩定性需求下的核心挑戰。我為你整理的這份「實戰練習清單」，特別強化了**數據化**的情境描述。

---

## 🚀 Kafka 高階實戰：十個核心架構陷阱與對策

### 1. 熱點分區 (Hot Partition) 與負載不均
* **詳細情境：** 系統每秒接收 **50,000** 筆電力數據，擁有 100 個 Partitions。使用 `Factory_ID` 作為 Message Key。某個大型工廠（ID: A01）佔了總流量的 **40%**。
* **詳細問題：** 負責 A01 的單一 Broker CPU 飆升至 **95%**，磁碟 I/O 飽和。即便增加 Consumer 數量到 100 個，由於 A01 只會進入同一個 Partition，導致 99 個 Consumer 閒置，1 個 Consumer 處理不及，延遲（Lag）持續擴大。
* **解法：** 使用 **Composite Key**（如 `Factory_ID + Device_ID`）或在 Key 後面加上隨機後綴（Salted Key）來強制分散。
* **權衡 (Trade-off)：** 解決了負載不均，但**犧牲了工廠層級的全局順序性**，僅能保證設備層級順序。

### 2. 巨型封包 (Large Payload) 導致的 OOM
* **詳細情境：** IoT 設備回報高頻波形數據，單筆訊息大小達 **5MB**。Node.js 服務設定 `heap-size` 為 2GB，同時有 50 個併發請求試圖發送數據。
* **詳細問題：** 生產端（Producer）的 `buffer.memory` 迅速被填滿，Node.js 記憶體飆升至 **1.9GB**，頻繁觸發 GC 導致 Event Loop 阻塞超過 500ms，最終發生 **OOM (Out of Memory) 崩潰**。
* **解法：** 實施 **Claim Check Pattern**：將 5MB 數據存入 S3/MinIO，Kafka 只傳送存儲路徑 (URL)。
* **權衡 (Trade-off)：** 降低了記憶體壓力與 Kafka 負擔，但**增加了外部系統依賴**與網路往返（RTT）的延遲。



### 3. 重平衡風暴 (Rebalance Storm)
* **詳細情境：** Consumer 處理一筆複雜的能源調度運算（包含多次 DB 查詢）需要 **45 秒**。Kafka 預設 `max.poll.interval.ms` 為 30 秒。
* **詳細問題：** Kafka 認為 Consumer 死亡，將其踢出群組並觸發 Rebalance。重平衡期間所有 Consumer 停止工作。剛分配完 Partition，下一個 Consumer 又因為處理太久被踢出，導致系統陷入 **持續重平衡的死循環**。
* **解法：** 調大 `max.poll.interval.ms` 或將業務邏輯交給 **Worker Thread Pool** 異步處理，讓 Consumer Thread 能快速回到 Poll 迴圈。
* **權衡 (Trade-off)：** 調大參數會延遲「真正崩潰」的偵測時間；異步處理則**大幅增加了 Offset 管理的複雜度**（需手動確保邏輯執行完才 Commit）。

### 4. 生產端重試 (Retry) 導致的順序錯亂
* **詳細情境：** 設備依序發送「開機(A)」、「降壓(B)」、「關機(C)」指令。網路不穩導致 **5% 掉封包**。Producer 開啟 `retries=3`。
* **詳細問題：** A 發送失敗進入重試隊列，此時 B 發送成功。稍後 A 重試成功。Broker 存儲順序變為 **B -> A -> C**。工廠收到指令後先降壓再開機，導致設備跳脫。
* **解法：** 開啟生產端等冪性 `enable.idempotence=true`。
* **權衡 (Trade-off)：** 保證了即使重試也會維持正確順序，但**僅支援較新版本的 Kafka (0.11+)** 且會增加些微的生產端記憶體開銷。

### 5. 毒藥訊息 (Poison Pill) 導致的消費停滯
* **詳細情境：** 某一筆 JSON 格式錯誤的訊息進入 Topic。Consumer 使用 `JSON.parse()` 但未包裝 `try-catch`。
* **詳細問題：** Consumer 讀取該訊息後崩潰重啟。重啟後又從同一個 Offset 開始讀取，再次崩潰。導致該 Partition 的**數據處理完全卡死**，後方數百萬筆正常數據無法被消費。
* **解法：** 實作 **Dead Letter Queue (DLQ)**：在代碼中捕捉異常，將無法處理的訊息轉發到「死信隊列」並手動 Commit 原 Offset。
* **權衡 (Trade-off)：** 保證了系統持續運行，但**需要額外機制監控與人工介入處理 DLQ 中的數據**。

### 6. 消費者延遲 (Lag) 導致的磁碟爆滿
* **詳細情境：** 下游資料庫維修，Consumer 停機 12 小時。每小時產生的數據量為 100GB。Kafka `retention.size` 設定為 1TB。
* **詳細問題：** 數據持續堆積在 Broker 磁碟。當磁碟使用率達到 **90%** 時，Kafka 為了自保會停止接收任何生產端的數據（Blocked），導致全公司所有 IoT 數據接入中斷。
* **解法：** 實施 **Tiered Storage**（如將舊數據移往 S3）或嚴格監控 Consumer Lag 並設定自動擴展（Auto-scaling）機制。
* **權衡 (Trade-off)：** 提高了系統容錯力，但**分層存儲會增加讀取歷史數據時的延遲**。

### 7. 網路抖動 (Network Flapping) 與 Ack 延遲
* **詳細情境：** 雲端機房網路不穩，出現 **2% 封包丟失**。Producer 設定 `acks=all` 以確保能源計費數據不丟失。
* **詳細問題：** 每一筆寫入都要等待所有 Replica 確認。網路抖動導致 `RequestTimeoutException` 頻發，寫入延遲（Latency）從 **10ms 噴發到 2000ms**，API 端出現大規模請求堆積。
* **解法：** 調整 `min.insync.replicas` 與適度增加 `request.timeout.ms`，並在 API 端實作快速失敗（Circuit Breaker）。
* **權衡 (Trade-off)：** 維持了高可靠性，但**在網路環境惡劣時，系統可用性（Availability）會顯著下降**。

### 8. 重複消費 (Duplicate Processing) 與冪等性缺失
* **詳細情境：** Consumer 處理完數據並成功更新資料庫（計費 +100 元），但在執行 `consumer.commitSync()` 前發生網路斷線。
* **詳細問題：** 重連後 Consumer 從舊 Offset 開始讀取，**重複執行**了加錢邏輯。對能源客戶而言，這會造成重複計費的客訴。
* **解法：** 下游實作 **Idempotent Receiver**（利用資料庫 Unique Key 或處理狀態表）。
* **權衡 (Trade-off)：** 徹底解決重複問題，但**增加了資料庫的查詢負擔（每次寫入前都要先查一次）**。

### 9. 叢集元數據 (Metadata) 負載過重
* **詳細情境：** 為了區分不同客戶，系統建立了 **20,000 個 Topics**，每個 Topic 有 3 個 Replicas。
* **詳細問題：** Kafka Controller 需要維護龐大的元數據。當某個 Broker 宕機時，觸發大規模的分區領導者選舉（Leader Election），導致 **Controller 記憶體爆掉**，整個叢集癱瘓超過 30 分鐘無法恢復。
* **解法：** 進行 **Topic 合併**（使用單一大型 Topic 並在訊息內容中區分客戶 ID）並升級至 KRaft 模式（棄用 Zookeeper）。
* **權衡 (Trade-off)：** 系統變穩定了，但**喪失了在 Topic 層級進行個別客戶權限控管 (ACL) 的靈活性**。

### 10. 生產端緩衝阻塞 (Buffer Exhaustion)
* **詳細情境：** 由於網路延遲，Producer 的 `buffer.memory` (預設 32MB) 已滿。`max.block.ms` 設定為 60 秒。
* **詳細問題：** 所有的 `producer.send()` 調用都會被**阻塞 (Blocked)**。前端 Node.js API 因為這些阻塞的請求而耗盡了所有 Worker Threads / Event Loop 資源，導致整個 API 服務對外完全斷線，甚至連健康檢查都無法回應。
* **解法：** 縮短 `max.block.ms` 讓請求快速報錯，並在 API 層級實作 **Backpressure (背壓)** 機制（如回傳 HTTP 503）。
* **權衡 (Trade-off)：** 雖然部分設備資料會發送失敗，但**保證了 API 服務不會因為單一組件的延遲而整台掛掉**。


---

## 🏁 AI Results

* **「穩定性」：** 拿出 **Case 3 (Rebalance)** 和 **Case 10 (Buffer Exhaustion)**。
* **「數據正確性」：** 拿出 **Case 4 (Retry)** 和 **Case 8 (Idempotency)**。
* **「性能與規模」：** 拿出 **Case 1 (Hot Partition)** 和 **Case 9 (Metadata)**。