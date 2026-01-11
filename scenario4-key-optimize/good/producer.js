const { Kafka, Partitioners } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'good-hotkey-producer',
    brokers: ['localhost:9092'],
});

const producer = kafka.producer({ createPartitioner: Partitioners.LegacyPartitioner });

const run = async () => {
    await producer.connect();

    const concertId = 'SUPER_STAR_CONCERT_2026';

    console.log('🚀 Sending 1000 tickets with SALTED keys...');

    const messages = Array.from({ length: 1000 }).map((_, i) => {
        // 關鍵優化：加上隨機鹽值 (1-3，假設我們有 3 個 Partitions)
        // 這樣相同的演唱會資料會被打散到不同的分區
        const salt = Math.floor(Math.random() * 3);
        const saltedKey = `${concertId}_${salt}`;

        return {
            key: saltedKey,
            value: JSON.stringify({
                concertId,
                ticketId: `TICKET-${i}`,
                userId: `USER-${i}`,
                originalKey: concertId // 保留原始 Key 以供追蹤
            }),
        }
    });

    await producer.send({ topic: 'good.hotkey.ticket.events', messages });
    await producer.disconnect();

    console.log('✅ All tickets sent with salted keys.');
};

run().catch(console.error);
