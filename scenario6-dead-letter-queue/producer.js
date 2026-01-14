const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'dlq-producer',
    brokers: ['localhost:9092'],
});
const producer = kafka.producer();

const run = async () => {
    await producer.connect();

    console.log('🚀 Sending messages to topic with potential failures...');

    const messages = [];

    // 這個生產者會發送 10 筆訂單，其中第 5 筆和第 8 筆是「負數金額」的無效訂單。
    for (let i = 1; i <= 10; i++) {
        // simulate: 5th and 8th orders are invalid (negative amount)
        const amount = (i === 5 || i === 8) ? -100 : i * 50;

        messages.push({
            key: `order-${i}`,
            value: JSON.stringify({
                orderId: `ORD-00${i}`,
                amount,
                timestamp: new Date().toISOString(),
            }),
        })
    }

    await producer.send({
        topic: 'orders-topic',
        messages,
    });

    console.log('✅ All messages sent (including potential failures) to orders topic.');

    await producer.disconnect();
};

run().catch(console.error);
