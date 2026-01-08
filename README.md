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