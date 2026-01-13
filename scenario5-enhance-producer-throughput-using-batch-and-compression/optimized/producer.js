const { Kafka, CompressionTypes, Partitioners } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'throughput-optimzed-producer',
    brokers: ['localhost:9092'],
});
const producer = kafka.producer({
    idempotent: true,
    maxInFlightRequests: 5,
    createPartitioner: Partitioners.LegacyPartitioner,
});

const run = async () => {
    await producer.connect();

    const start = Date.now(); // 取得開始時間戳 (毫秒)

    console.log('🚀 Sending 5000 messages in batch with Compression...');

    const messages = [];
    for (let i = 0; i < 5000; i++) {
        messages.push({
            value: `Message ${i} - simulate data payload`
        });
    }

    // 核心優化: 一次性發送大批次並啟用 Gzip 壓縮
    await producer.send({
        topic: 'throughtput-optimized-topic',
        compression: CompressionTypes.GZIP,
        messages,
    });

    const end = Date.now(); // 取得結束時間戳 (毫秒)
    console.log(`⏱️  Optimized Send Time: ${end - start} ms`);

    await producer.disconnect();
}

run().catch(console.error);
