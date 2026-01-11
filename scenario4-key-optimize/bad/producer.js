const { Kafka, Partitioners } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'bad-hotkey-producer',
    brokers: ['localhost:9092'],
});

const producer = kafka.producer({ createPartitioner: Partitioners.LegacyPartitioner });

const run = async () => {
    await producer.connect();

    const concertId = 'SUPER_STAR_CONCERT_2026'; // 固定 key

    console.log('🚀 Sending 1000 tickets with the SAME key...');

    const messages = Array.from({ length: 1000 }).map((_, i) => ({
        key: concertId,
        value: JSON.stringify({
            concertId,
            ticketId: `TICKET-${i}`,
            userId: `USER-${i}`,
        }),
    }));

    await producer.send({
        topic: 'bad.hotkey.ticket.events',
        messages,
    });

    await producer.disconnect();
    console.log('✅ All tickets sent.');
};

run().catch(console.error);
