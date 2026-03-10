const amqp = require('amqplib');

const RABBIT_URL = 'amqp://rabbitmq';
const EXCHANGE = 'name_your_channel';
const EMOTES = ['🔥', '❤️', '😂', '👍', '🎉'];

async function start() {
    try {
        const connection = await amqp.connect(RABBIT_URL);
        const channel = await connection.createChannel();

        // Assert the exchange (Fanout = broadcast to all queues bound to it)
        // Something to consider: is Fanout the best choice for this app,
        // or would routing keys make sense here?
        await channel.assertExchange(EXCHANGE, 'fanout', { durable: false });

        console.log(`[Generator] Connected. Publishing to "${EXCHANGE}"...`);

        // TODO: This logic in now quite simplistic. 
        // To simulate the presented scenrario, we should have times of just few
        // random emotes and then times of many same emotes in brief window of time.
        // Add the needed extra logic here, but don't spend too much time on it.
        // This is just a simulation tool, after all.
        setInterval(() => {
            const emote = EMOTES[Math.floor(Math.random() * EMOTES.length)];
            const msg = JSON.stringify({ emote, timestamp: Date.now() });

            // Publish to exchange. Routing key is empty string for fanout.
            channel.publish(EXCHANGE, '', Buffer.from(msg));
            console.log(`[Generator] Sent: ${emote}`);
        }, 500);
        // 2 messages per second. 
        // A more random value would make the simulation more realistic.

    } catch (err) {
        console.error("Generator Error:", err);
        setTimeout(start, 5000); // Retry logic
    }
}

start();
