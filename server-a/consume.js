import amqp from "amqplib";

const QUEUE = "meaningful_moments";

const RABBIT_URL = process.env.RABBITMQ_URL

export async function startConsumer(onMessage) {
  while (true) {
    try {
      const conn = await amqp.connect(RABBIT_URL);
      const channel = await conn.createChannel();
      await channel.assertQueue(QUEUE, { durable: true });
      channel.consume(QUEUE, (msg) => {
        if (msg !== null) {
          const data = JSON.parse(msg.content.toString());
          onMessage(data);
          channel.ack(msg);
        }
      });
      break;
    } catch (err) {
      console.log("Connection failed, retry in 5s", err.message);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}