const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'bad-hotkey-consumer',
    brokers: ['localhost:9092'],
    // 配置重試策略：最大重試 5 次
    retry: {
        initialRetryTime: 300,
        retries: 5
    }
});

const consumer = kafka.consumer({ groupId: 'bad-hotkey-group' });

const run = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: 'bad.hotkey.ticket.events', fromBeginning: true});
    await consumer.run({
        eachMessage: async ({ partition, message }) => {
            console.log(`[Partition ${partition}] 處理中...`); // Partition 永遠只會有一個號碼

            // 模擬處理耗時，方便觀察負載平衡
            await new Promise(resolve => setTimeout(resolve, 1000));
        },
    });
};

run().catch(console.error);
