// Session store with a Redis backend (Upstash) in production
// and an in-memory fallback for local development.

let store;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const { Redis } = require("@upstash/redis");
  const redis = Redis.fromEnv();
  const TTL_SECONDS = 60 * 60 * 24; // 24 hours

  store = {
    async get(id) {
      const data = await redis.get(`sess:${id}`);
      return data || { expenses: [] };
    },
    async save(id, session) {
      await redis.set(`sess:${id}`, session, { ex: TTL_SECONDS });
    },
    async clear(id) {
      await redis.del(`sess:${id}`);
    },
  };
} else {
  const sessions = {};
  store = {
    async get(id) {
      if (!sessions[id]) sessions[id] = { expenses: [] };
      return sessions[id];
    },
    async save(id, session) {
      sessions[id] = session;
    },
    async clear(id) {
      delete sessions[id];
    },
  };
}

module.exports = store;
