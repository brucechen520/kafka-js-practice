# Test
- The primary goal of this experiment was to verify Kafka's At-Least-Once delivery guarantee. We simulated transient downstream failures (e.g., database timeouts) to observe how the consumer manages offsets and retries without losing data.
  - ![failure handle](./result.png)
  - see [dashboard](http://localhost:8080)
  - `node scenario3-failure-handle/producer.js`
  - `node scenario3-failure-handle/consumer.js`
- Test Configuration
  - Topic: tracking.events (3 Partitions)
  - Consumer Group: error-test-group
  - Simulated Failure: 30% random probability of throwing a Database Connection Timeout error within the eachMessage handler (simulation).
  - Retry Strategy: Exponential backoff (starting at 300ms) with a maximum of 5 retries.
- Expected Result:
  - Based on the execution logs, the following behaviors were confirmed:
  1. Automatic Retries and Data Recovery
    - The logs clearly show that when a processing error occurs, the consumer does not advance the offset. Instead, it re-processes the same message until success.
    - Example (Partition 1, Offset 7):
      - 09:26:23: ⚠️ Processing failed at Offset 7.
      - 09:26:23: KafkaJS logs a Runner Error.
      - 09:26:24: ✅ Successfully re-processed Offset 7.
    - Outcome: No data was skipped or lost despite the simulated crash.
  2. Partition Independence
    - A significant observation was that a failure in one partition did not "block" the processing of others.
    - While Partition 2 was struggling with retries at Offset 3 and 4, Partition 0 continued to process Offsets 3 through 8 successfully.
    - Outcome: Confirmed that Kafka handles partition processing in parallel, ensuring that localized failures do not cause a total system standstill.
  3. Strict Sequential Consistency
    - Within a single partition, the consumer strictly followed the order.
    - In Partition 2, Offset 4 failed and was retried. The consumer did not attempt Offset 5 until Offset 4 was successfully committed.
    - Outcome: Verified that message order is preserved within a partition even during failure recovery.
# Logs
```bash
 ~/Doc/code/kafka-js-practice | on main ?1  node scenario3-failure-handle/consumer.js                                    INT | took 6m 58s | at 17:25:57
(node:61055) TimeoutNegativeWarning: -1767864358173 is a negative number.
Timeout duration was set to 1.
(Use `node --trace-warnings ...` to show where the warning was created)
{"level":"INFO","timestamp":"2026-01-08T09:25:58.181Z","logger":"kafkajs","message":"[Consumer] Starting","groupId":"error-test-group"}
{"level":"INFO","timestamp":"2026-01-08T09:26:23.879Z","logger":"kafkajs","message":"[ConsumerGroup] Consumer has joined the group","groupId":"error-test-group","memberId":"retry-tester-17ad544d-54c4-4911-9278-41f7bf375001","leaderId":"retry-tester-17ad544d-54c4-4911-9278-41f7bf375001","isLeader":true,"memberAssignment":{"tracking.events":[0,1,2]},"groupProtocol":"RoundRobinAssigner","duration":25692}
✅ [Partition 0] 處理成功: 3
✅ [Partition 0] 處理成功: 4
✅ [Partition 0] 處理成功: 5
✅ [Partition 0] 處理成功: 6
✅ [Partition 0] 處理成功: 7
✅ [Partition 0] 處理成功: 8
✅ [Partition 1] 處理成功: 3
✅ [Partition 1] 處理成功: 4
✅ [Partition 1] 處理成功: 5
✅ [Partition 1] 處理成功: 6
⚠️ [Partition 1] 處理失敗，準備觸發 Kafka 重試...
{"level":"ERROR","timestamp":"2026-01-08T09:26:23.949Z","logger":"kafkajs","message":"[Runner] Error when calling eachMessage","topic":"tracking.events","partition":1,"offset":"7","stack":"Error: Database Connection Timeout!\n    at Runner.eachMessage (/Users/nan/Documents/code/kafka-js-practice/scenario3-failure-handle/consumer.js:24:15)\n    at Runner.processEachMessage (/Users/nan/Documents/code/kafka-js-practice/node_modules/kafkajs/src/consumer/runner.js:231:20)\n    at process.processTicksAndRejections (node:internal/process/task_queues:103:5)\n    at async onBatch (/Users/nan/Documents/code/kafka-js-practice/node_modules/kafkajs/src/consumer/runner.js:447:9)\n    at async Runner.handleBatch (/Users/nan/Documents/code/kafka-js-practice/node_modules/kafkajs/src/consumer/runner.js:461:5)\n    at async /Users/nan/Documents/code/kafka-js-practice/node_modules/kafkajs/src/consumer/worker.js:29:9","error":{}}
⚠️ [Partition 2] 處理失敗，準備觸發 Kafka 重試...
{"level":"ERROR","timestamp":"2026-01-08T09:26:23.961Z","logger":"kafkajs","message":"[Runner] Error when calling eachMessage","topic":"tracking.events","partition":2,"offset":"3","stack":"Error: Database Connection Timeout!\n    at Runner.eachMessage (/Users/nan/Documents/code/kafka-js-practice/scenario3-failure-handle/consumer.js:24:15)\n    at Runner.processEachMessage (/Users/nan/Documents/code/kafka-js-practice/node_modules/kafkajs/src/consumer/runner.js:231:20)\n    at onBatch (/Users/nan/Documents/code/kafka-js-practice/node_modules/kafkajs/src/consumer/runner.js:447:20)\n    at Runner.handleBatch (/Users/nan/Documents/code/kafka-js-practice/node_modules/kafkajs/src/consumer/runner.js:461:11)\n    at handler (/Users/nan/Documents/code/kafka-js-practice/node_modules/kafkajs/src/consumer/runner.js:58:30)\n    at /Users/nan/Documents/code/kafka-js-practice/node_modules/kafkajs/src/consumer/worker.js:29:15\n    at process.processTicksAndRejections (node:internal/process/task_queues:103:5)","error":{}}
✅ [Partition 1] 處理成功: 7
✅ [Partition 1] 處理成功: 8
✅ [Partition 2] 處理成功: 3
⚠️ [Partition 2] 處理失敗，準備觸發 Kafka 重試...
{"level":"ERROR","timestamp":"2026-01-08T09:26:24.261Z","logger":"kafkajs","message":"[Runner] Error when calling eachMessage","topic":"tracking.events","partition":2,"offset":"4","stack":"Error: Database Connection Timeout!\n    at Runner.eachMessage (/Users/nan/Documents/code/kafka-js-practice/scenario3-failure-handle/consumer.js:24:15)\n    at Runner.processEachMessage (/Users/nan/Documents/code/kafka-js-practice/node_modules/kafkajs/src/consumer/runner.js:231:20)\n    at process.processTicksAndRejections (node:internal/process/task_queues:103:5)\n    at async onBatch (/Users/nan/Documents/code/kafka-js-practice/node_modules/kafkajs/src/consumer/runner.js:447:9)\n    at async Runner.handleBatch (/Users/nan/Documents/code/kafka-js-practice/node_modules/kafkajs/src/consumer/runner.js:461:5)\n    at async /Users/nan/Documents/code/kafka-js-practice/node_modules/kafkajs/src/consumer/worker.js:29:9","error":{}}
✅ [Partition 2] 處理成功: 4
✅ [Partition 2] 處理成功: 5
✅ [Partition 2] 處理成功: 6
✅ [Partition 2] 處理成功: 7
⚠️ [Partition 2] 處理失敗，準備觸發 Kafka 重試...
{"level":"ERROR","timestamp":"2026-01-08T09:26:24.787Z","logger":"kafkajs","message":"[Runner] Error when calling eachMessage","topic":"tracking.events","partition":2,"offset":"8","stack":"Error: Database Connection Timeout!\n    at Runner.eachMessage (/Users/nan/Documents/code/kafka-js-practice/scenario3-failure-handle/consumer.js:24:15)\n    at Runner.processEachMessage (/Users/nan/Documents/code/kafka-js-practice/node_modules/kafkajs/src/consumer/runner.js:231:20)\n    at process.processTicksAndRejections (node:internal/process/task_queues:103:5)\n    at async onBatch (/Users/nan/Documents/code/kafka-js-practice/node_modules/kafkajs/src/consumer/runner.js:447:9)\n    at async Runner.handleBatch (/Users/nan/Documents/code/kafka-js-practice/node_modules/kafkajs/src/consumer/runner.js:461:5)\n    at async /Users/nan/Documents/code/kafka-js-practice/node_modules/kafkajs/src/consumer/worker.js:29:9","error":{}}
✅ [Partition 2] 處理成功: 8
```
