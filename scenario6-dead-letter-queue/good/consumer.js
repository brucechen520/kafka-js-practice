const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'dlq-good-consumer',
    brokers: ['localhost:9092'],
});
const consumer = kafka.consumer({ groupId: 'dlq-good-group' });

const run = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: 'orders-topic', fromBeginning: true });

    console.log('🚀 DLQ Good Consumer is running...');

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const data = JSON.parse(message.value.toString());

            try {
                if (data.amount < 0) {
                    throw new Error(`[Business Error] Order ${data.orderId} has negative amount: ${data.amount}`);
                }

                console.log(`✅ [P-${partition}] Offset: ${message.offset} 處理成功！OrderID: ${data.orderId}, Amount: ${data.amount}`);
            } catch(error) {
                console.error(`⚠️ [P-${partition}] Offset: ${message.offset} 發現異常: ${error.message}`);

                // --- DLQ 轉發邏輯 ---
                console.log(`📡 正在將異常訊息轉發至 orders_dlq...`);

                const producer = kafka.producer();

                await producer.connect();

                await producer.send({
                    topic: 'orders_dlq',
                    messages: [{
                        key: message.key,
                        value: message.value,
                        headers: {
                            'x-failed-at': new Date().toISOString(),
                            'x-origin-topic': topic,
                            'x-error-message': error.message,
                            'x-error-stack': error.stack.split('\n')[0],  // 只存第一行錯誤描述
                        },
                    }],
                });

                console.log(`🚀 已成功隔離 Offset ${message.offset} 至 DLQ。`);
                // 注意：不重新 throw error，這代表此訊息已「妥善處理」，Consumer 會繼續讀取下一筆。
            }
        },
    });
};

run().catch(console.error);
