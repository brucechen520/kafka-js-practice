const { Kafka, Partitioners } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'logistics-producer',
  brokers: ['localhost:9092'],
});

// 使用 LegacyPartitioner 確保與舊版 Key 雜湊行為一致，方便觀察
const producer = kafka.producer({ createPartitioner: Partitioners.DefaultPartitioner, idempotent: true });

const sendMessages = async () => {
  await producer.connect();

  // 模擬 3 個不同的訂單編號
  const orders = [
    { id: 'ORD-101', states: ['CREATED', 'PACKING', 'SHIPPED'] },
    { id: 'ORD-202', states: ['CREATED', 'PACKING', 'SHIPPED'] },
    { id: 'ORD-303', states: ['CREATED', 'PACKING', 'SHIPPED'] }
  ];

  for (let i = 0; i < 3; i++) {
    for (const order of orders) {
      await producer.send({
        topic: 'tracking.events',
        messages: [{
          key: order.id, // 關鍵：訂單編號作為 Key
          value: JSON.stringify({ orderId: order.id, status: order.states[i], timestamp: new Date().toISOString() })
        }]
      });
      console.log(`🚀 Sent: ${order.id} -> step: ${i} - ${order.states[i]}`);
    }
  }

  await producer.disconnect();
};

sendMessages().catch(console.error);
