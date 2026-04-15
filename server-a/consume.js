import amqp from "amqplib";

const RABBIT_URL = process.env.RABBITMQ_URL
const EXCHANGE = "meaningful_moments";

export async function startConsumer(onMessage) {
  while (true) {
    try {
      const conn = await amqp.connect(RABBIT_URL);
      const channel = await conn.createChannel();
      await channel.assertExchange(EXCHANGE, 'fanout', { durable: true });
      
      const q = await channel.assertQueue('', {exclusive: true});
      await channel.bindQueue(q.queue, EXCHANGE, '');
      
      console.log('Server A: listening to meaningful_moments exchange');

      channel.consume(q.queue, (msg) => {
        if (msg !== null) {
          try {
            const data = JSON.parse(msg.content.toString());
            console.log('Server A received:', data);
            onMessage(data);
            channel.ack(msg);
          } catch (parseErr) {
            console.error('Failed to parse message:', parseErr);
          }
        }
      });
      break;
    } catch (err) {
      console.log("Connection failed, retry in 5s", err.message);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}