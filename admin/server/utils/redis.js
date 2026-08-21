const redis = require('redis');

let redisClient;
let isRedisConnected = false;

// Create and connect to the Redis client
const connectRedis = async () => {
    if (!process.env.REDIS_URL) {
        console.warn('REDIS_URL is not defined in environment variables. Caching will be disabled.');
        return;
    }

    try {
        redisClient = redis.createClient({
            url: process.env.REDIS_URL
        });

        redisClient.on('error', (err) => {
            console.error('Redis Client Error:', err.message);
            isRedisConnected = false;
        });

        redisClient.on('connect', () => {
            console.log('Redis connected successfully');
            isRedisConnected = true;
        });

        redisClient.on('end', () => {
            console.log('Redis disconnected');
            isRedisConnected = false;
        });

        await redisClient.connect();
    } catch (err) {
        console.error('Initial Redis connection error:', err.message);
        isRedisConnected = false;
    }
};

const getCache = async (key) => {
    if (!isRedisConnected || !redisClient) return null;
    try {
        const data = await redisClient.get(key);
        if (data) {
            console.log(`[Cache Hit] Key: ${key}`);
            return JSON.parse(data);
        }
        console.log(`[Cache Miss] Key: ${key}`);
        return null;
    } catch (err) {
        console.error(`Error retrieving cache for ${key}:`, err.message);
        return null;
    }
};

const setCache = async (key, data, ttlSeconds = 600) => {
    if (!isRedisConnected || !redisClient) return;
    try {
        await redisClient.setEx(key, ttlSeconds, JSON.stringify(data));
        console.log(`[Cache Set] Key: ${key} TTL: ${ttlSeconds}s`);
    } catch (err) {
        console.error(`Error setting cache for ${key}:`, err.message);
    }
};

const deleteCache = async (key) => {
    if (!isRedisConnected || !redisClient) return;
    try {
        await redisClient.del(key);
        console.log(`[Cache Invalidated] Key: ${key}`);
    } catch (err) {
        console.error(`Error deleting cache for ${key}:`, err.message);
    }
};

const deleteCacheByPattern = async (pattern) => {
    if (!isRedisConnected || !redisClient) return;
    try {
        // Warning: KEYS can be slow on large databases, but ok for a portfolio site cache
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
            console.log(`[Cache Invalidated Pattern] Pattern: ${pattern}, Keys: ${keys.join(', ')}`);
        }
    } catch (err) {
        console.error(`Error deleting cache pattern ${pattern}:`, err.message);
    }
};

const closeRedis = async () => {
    if (redisClient && isRedisConnected) {
        try {
            await redisClient.quit();
        } catch (e) {
            console.error('Error closing Redis connection:', e.message);
        }
    }
};

module.exports = {
    connectRedis,
    getCache,
    setCache,
    deleteCache,
    deleteCacheByPattern,
    closeRedis
};
