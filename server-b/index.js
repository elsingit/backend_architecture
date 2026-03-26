const amqp = require('amqplib');

// ENV vsr from compose
const RABBIT_URL = process.env.RABBITMQ_URL || 'amqp://admin:securepassword@rabbitmq:5672';

// Match these exactly to your Generator and Assignment specs
const RAW_EXCHANGE = 'emote_channel'; 
const AGGREGATED_EXCHANGE = 'meaningful_moments';

async function start() {
    try {
        const connection = await amqp.connect(RABBIT_URL);
        const channel = await connection.createChannel();

        // use fanout for now
        await channel.assertExchange(RAW_EXCHANGE, 'fanout', { durable: false });
        await channel.assertExchange(AGGREGATED_EXCHANGE, 'fanout', { durable: false });

        // 
        const q = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(q.queue, RAW_EXCHANGE, '');

        console.log(`Server B Connected to RabbitMQ. Monitoring ${RAW_EXCHANGE}`);

        channel.consume(q.queue, (msg) => {
            if (msg.content) {
                const data = JSON.parse(msg.content.toString());
                
                console.log('Server B Received:', data);
                

            }
        }, { noAck: true });

    } catch (err) {
        console.error("Server B Connection failed, retry in 5s", err.message);
        setTimeout(start, 5000);
    }
}

start();