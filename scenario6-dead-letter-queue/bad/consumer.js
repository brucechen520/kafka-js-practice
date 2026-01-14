const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'dlq-blocking-group-consumer',
    brokers: ['localhost:9092'],
});
const consumer = kafka.consumer({ groupId: 'dlq-blocking-group' });

const run = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: 'orders-topic', fromBeginning: true });

    console.log('🚀 DLQ Bad Consumer is running...');

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const data = JSON.parse(message.value.toString());

            // Simulate processing failure for invalid order amount
            if (data.amount < 0) {
                // ❌ 錯誤做法：直接拋出異常而不處理
                // 這會導致 KafkaJS 認為處理失敗，根據重試策略不斷重新拉取這一筆訊息
                console.error(`🔥 [P-${partition}] Offset: ${message.offset} 處理失敗！這是一筆壞帳，但我會卡在這裡一直試...`);
                throw new Error('Critical Business Error: Negative Amount');
            }

            console.log(`✅ [P-${partition}] Offset: ${message.offset} 處理成功！OrderID: ${data.orderId}, Amount: ${data.amount}`);
        },
    });
}

run().catch(console.error);
