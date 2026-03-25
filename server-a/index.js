import { startConsumer } from "./consume.js";
import { broadcast } from "./broadcaster.js";

startConsumer((data) => {
  broadcast(data);
});