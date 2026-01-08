# Environment
- `docker-compose up -d`

# Kafka UI Dashboard
- http://localhost:8080

# Project Topics
### Scenario 1: Message Ordering & Partitioning (scenario1-partition-key-ordering/producer.js)
- Objective: To demonstrate that messages with the same Partition Key (e.g., Order ID) are consistently routed to the same Kafka Partition, ensuring strictly ordered message delivery within that partition.
證明同一個訂單（Key）永遠進入同一個分區（Partition），且順序不亂。
- `node scenario1-partition-key-ordering/producer.js`
- Expected Result:
  - **ORD-101** -> Key: `ORD-101` -> **Partition 0** (Statuses: CREATED, PACKING, SHIPPED)
  - **ORD-202** -> Key: `ORD-202` -> **Partition 1** (Statuses: CREATED, PACKING, SHIPPED)
  - **ORD-303** -> Key: `ORD-303` -> **Partition 2** (Statuses: CREATED, PACKING, SHIPPED)
> **Conclusion:** Messages with the same Order ID (Key) are consistently routed to the same partition, ensuring that order updates are processed in the correct sequence.

### Scenario 2: Consume Message, 1 consumer -> 1 partition (scenario2-1-consumer-consume-1-partition/consumer.js)
- Objective: To verify how Kafka balances the workload between multiple consumers.
- `node scenario2-1-consumer-consume-1-partition/producer.js`
- `node scenario2-1-consumer-consume-1-partition/consumer.js`
- Expected Result:
  - Check your console output. You should see different Consumer IDs claiming different partitions:
  - **Terminal A:** `Consumer 1 started. Assigned partitions: [0]`
  - **Terminal B:** `Consumer 2 started. Assigned partitions: [1]`
  - **Terminal C:** `Consumer 3 started. Assigned partitions: [2]`

### Scenario 3:
- The primary goal of this experiment was to verify Kafka's At-Least-Once delivery guarantee. We simulated transient downstream failures (e.g., database timeouts) to observe how the consumer manages offsets and retries without losing data.
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
