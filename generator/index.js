const amqp = require('amqplib');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const RABBIT_URL = process.env.RABBITMQ_URL || 'amqp://admin:securepassword@rabbitmq:5672';
const EXCHANGE = 'emote_channel';
const EMOTES = ['🔥', '❤️', '😂', '👍', '🎉', '😭'];

function randomEmote() {
    return EMOTES[Math.floor(Math.random() * EMOTES.length)];
}

function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function start() {
    try {
        const connection = await amqp.connect(RABBIT_URL);
        const channel = await connection.createChannel();

        // Assert the exchange (Fanout = broadcast to all queues bound to it)
        // Something to consider: is Fanout the best choice for this app,
        // or would routing keys make sense here?
        await channel.assertExchange(EXCHANGE, 'fanout', { durable: false });

        console.log(`[Generator] Connected. Publishing to "${EXCHANGE}"...`);

        async function loop() {

            const roll = Math.random();
            //Generating a burst of emoji
            if (roll < 0.20) {
                const emoji = randomEmote();
                let emojiCount = randomBetween(10, 40);
                for (let i = 0; i < emojiCount; i++) {
                    const msg = JSON.stringify({ emoji, timestamp: Date.now() });
                    channel.publish(EXCHANGE, '', Buffer.from(msg));
                    console.log(`[Generator] Sent: ${emoji}`);
                    await sleep(randomBetween(50, 200));
                }
            //Generating slow emoji reactions
            } else {
                const emoji = randomEmote();
                let emojiCount = Math.floor(Math.random() * 4) + 1;
                for (let i = 0; i < emojiCount; i++) {
                    const msg = JSON.stringify({ emoji, timestamp: Date.now() });
                    channel.publish(EXCHANGE, '', Buffer.from(msg));
                    console.log(`[Generator] Sent: ${emoji}`);
                    await sleep(randomBetween(400, 800));
                }
            }

            await sleep(randomBetween(1000, 4000));
            loop();
        }  
        loop(); 

    } catch (err) {
        console.error("Generator Error:", err);
        setTimeout(start, 5000); // Retry logic
    }
}

start();
