const { Kafka, Partitioners } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'logistics-producer',
  brokers: ['localhost:9092'],
  // 明確設定以下參數，通常能解決計時器溢位問題
  connectionTimeout: 10000,
  authenticationTimeout: 10000,
  reauthenticationThreshold: 10000,
});

// 使用 LegacyPartitioner 確保與舊版 Key 雜湊行為一致，方便觀察
const producer = kafka.producer({ createPartitioner: Partitioners.DefaultPartitioner });

const sendMessages = async () => {
  await producer.connect();

  // 模擬 3 個不同的訂單編號
  const orders = ['ORD-101', 'ORD-202', 'ORD-303'];

  for (let i = 0; i < 10; i++) {
    const orderId = orders[i % 3]; // 循環使用這三個 ID
    const payload = {
      orderId,
      status: 'PROCESSING',
      step: i,
      timestamp: new Date().toISOString()
    };

    await producer.send({
      topic: 'tracking.events',
      messages: [
        { key: orderId, value: JSON.stringify(payload) }
      ],
    });

    console.log(`🚀 Sent: ${orderId} - Step ${i}`);
  }

  await producer.disconnect();
};

sendMessages().catch(console.error);
