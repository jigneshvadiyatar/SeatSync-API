
import "dotenv/config";
import redisLibrary from "redis";

const { createClient } = redisLibrary;

let redisClient = null;

const getRedisClient = () => {
  if (!redisClient) {
    redisClient = createClient({
      disableOfflineQueue: true,
      url: process.env.REDIS_URL || "redis://localhost:6379",
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) return new Error("Redis max retries reached");
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisClient.on("ready", () => {
      console.log("Redis connected");
    });

    redisClient.on("error", (err) => {
      console.error("Redis error:", err.message);
    });

    redisClient.on("reconnecting", () => {
      console.log("Redis reconnecting...");
    });
  }

  return redisClient;
};

const connectRedis = async () => {
  const client = getRedisClient();
  if (!client.isOpen) {
    await client.connect();
  }
  return client;
};

const disconnectRedis = async () => {
  if (redisClient && redisClient.isOpen) {
    redisClient.destroy();
  }
};

const getReadyRedisClient = () => redisClient?.isReady ? redisClient : null;

export {
  getReadyRedisClient,
  connectRedis,
  disconnectRedis,
};
