const amqp = require('amqplib');

// ENV vsr from compose
const RABBIT_URL = process.env.RABBITMQ_URL || 'amqp://admin:securepassword@rabbitmq:5672';

const RAW_EXCHANGE = 'emote_channel'; 
const AGGREGATED_EXCHANGE = 'meaningful_moments';

//Saving timestamps from the latest emojis
const reactionWindow = [];
const WINDOW_MS = 1000;   //Window of one second
const THRESHOLD = 4;      //Over four reactions per second are flagged as a meaningful moment

async function start() {
    try {
        const connection = await amqp.connect(RABBIT_URL);
        const channel = await connection.createChannel();

        //Fanout for now
        await channel.assertExchange(RAW_EXCHANGE, 'fanout', { durable: false });
        //durable: true, so meaningful_moments queue does not disappear
        await channel.assertExchange(AGGREGATED_EXCHANGE, 'fanout', { durable: true });

        const q = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(q.queue, RAW_EXCHANGE, '');

        console.log(`Server B Connected to RabbitMQ. Monitoring ${RAW_EXCHANGE}`);

        channel.consume(q.queue, (msg) => {
if (!msg.content) return;

            const data = JSON.parse(msg.content.toString());
            const now = Date.now();

            reactionWindow.push(now);

            //Deletion of more than one second old reactions
            while (reactionWindow.length > 0 && reactionWindow[0] < now - WINDOW_MS) {
                reactionWindow.shift();
            }

            console.log(`Server B: ${reactionWindow.length} reaktiota/s (emote: ${data.emoji})`);

            //Meaningful moment is sent forward when recognized
            if (reactionWindow.length > THRESHOLD) {
                const moment = {
                    timestamp: new Date(now).toISOString(),
                    count: reactionWindow.length,
                    emote: data.emoji
                };
                channel.publish(
                    AGGREGATED_EXCHANGE,
                    '',
                    Buffer.from(JSON.stringify(moment))
                );
                console.log('Meaningful moment lähetetty:', moment);

                //Emptying the window
                reactionWindow.length = 0;
            }

        }, { noAck: true });

    } catch (err) {
        console.error("Server B Connection failed, retry in 5s", err.message);
        setTimeout(start, 5000);
    }
}

start();