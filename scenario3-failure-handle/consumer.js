const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'retry-tester',
  brokers: ['localhost:9092'],
  // 配置重試策略：最大重試 5 次
  retry: {
    initialRetryTime: 300,
    retries: 5
  }
});

const consumer = kafka.consumer({ groupId: 'error-test-group' });

const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'tracking.events', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      // 模擬 30% 的機率出錯
      if (Math.random() < 0.3) {
        console.error(`⚠️ [Partition ${partition}] 處理失敗，準備觸發 Kafka 重試...`);
        throw new Error('Database Connection Timeout!');
      }

      console.log(`✅ [Partition ${partition}] 處理成功: ${message.offset}`);
    },
  });
};

run();