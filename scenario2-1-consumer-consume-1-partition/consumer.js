const { Kafka, Partitioners } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'monitor-service',
  brokers: ['localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'logistics-group' });

const run = async () => {
  await consumer.connect();

  await consumer.subscribe({ topic: 'tracking.events', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const data = JSON.parse(message.value.toString());

      console.log(`[Partition ${partition}] 處理訂單: ${data.orderId}, 狀態: ${data.status}`);

      // 模擬處理耗時，方便觀察負載平衡
      await new Promise(resolve => setTimeout(resolve, 5000));
    },
  });

};

run().catch(console.error);
