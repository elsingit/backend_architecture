import amqp from "amqplib";

const RABBIT_URL = process.env.RABBITMQ_URL
const EXCHANGE = "meaningful_moments";

export async function startConsumer(onMessage) {
  while (true) {
    try {
      const conn = await amqp.connect(RABBIT_URL);
      const channel = await conn.createChannel();

      //Matches Server B: durable: false
      await channel.assertExchange(EXCHANGE, 'fanout', { durable: false });
      
      const q = await channel.assertQueue('', {exclusive: true});
      await channel.bindQueue(q.queue, EXCHANGE, '');
      
      console.log('Server A: listening to meaningful_moments exchange');

      //Handles connection-level errors so the while loop can retry
      conn.on("error", (err) => {
        console.error("Server A: RabbitMQ connection error:", err.message);
      });
      conn.on("close", () => {
        console.log("Server A: RabbitMQ connection closed, retrying...");
      });

      channel.consume(q.queue, (msg) => {
        if (msg !== null) {
          try {
            const data = JSON.parse(msg.content.toString());
            console.log('Server A received:', data);
            onMessage(data);
            channel.ack(msg);
          } catch (parseErr) {
            console.error('Failed to parse message:', parseErr.message);
          }
        }
      });

      //Waits here until the connection closes, then retries
      await new Promise((_, reject) => {
        conn.on("close", reject);
        conn.on("error", reject);
      });

    } catch (err) {
      console.log("Server A: Connection failed, retry in 5s", err.message);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}