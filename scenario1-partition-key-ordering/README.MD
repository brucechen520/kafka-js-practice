# Test
- Objective: To demonstrate that messages with the same Partition Key (e.g., Order ID) are consistently routed to the same Kafka Partition, ensuring strictly ordered message delivery within that partition.
證明同一個訂單（Key）永遠進入同一個分區（Partition），且順序不亂。
  - `node scenario1/producer.js`
  - see [dashboard](http://localhost:8080)
  - ![Same Key in same partition](./result.png)
- Expected Result:
  - **ORD-101** -> Key: `ORD-101` -> **Partition 0** (Statuses: CREATED, PACKING, SHIPPED)
  - **ORD-202** -> Key: `ORD-202` -> **Partition 1** (Statuses: CREATED, PACKING, SHIPPED)
  - **ORD-303** -> Key: `ORD-303` -> **Partition 2** (Statuses: CREATED, PACKING, SHIPPED)
> **Conclusion:** Messages with the same Order ID (Key) are consistently routed to the same partition, ensuring that order updates are processed in the correct sequence.