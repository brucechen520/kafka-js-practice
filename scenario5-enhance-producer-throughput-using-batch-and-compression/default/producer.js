const { Kafka, Partitioners } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'throughput-default-producer',
    brokers: ['localhost:9092'],
});
const producer = kafka.producer({
    createPartitioner: Partitioners.LegacyPartitioner,
});

const run = async () => {
    await producer.connect();

    const start = Date.now();  // 取得開始時間戳（毫秒）
    console.log('🚀 Sending 5000 messages individually...');

    for (let i = 0; i < 5000; i++) {
        await producer.send({
            topic: 'throughput-default-topic',
            messages: [{
                value: `Message ${i} - simulate data payload`
            }],
        });
    }

    const end = Date.now(); // 取得結束時間戳（毫秒）

    console.log(`⏱️  Default Send Time: ${end - start} ms`);

    await producer.disconnect();
}

run().catch(console.error);
