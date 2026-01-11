const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'good-hotkey-consumer',
    brokers: ['localhost:9092'],
    retry: {
        initialRetryTime: 300,
        retries: 5,
    },
});

const consumer = kafka.consumer({ groupId: 'good-hotkey-group'});

const run = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: 'good.hotkey.ticket.events', fromBeginning: true });
    await consumer.run({
        eachMessage: async ({ partition, message }) => {
            const data = JSON.parse(message.value.toString());
            // Partition 0, 1, 2會平均分散處理相同 concertId 的訊息
            console.log(`✅ [Partition ${partition}] 處理訂單: ${data.ticketId}`); // Partition 會分散在不同的號碼

            // 模擬處理耗時，方便觀察負載平衡
            await new Promise(resolve => setTimeout(resolve, 1000));
        },
    });
};

run().catch(console.error);
