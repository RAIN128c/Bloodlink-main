const NodeCache = require('node-cache');

// Standard TTL: 5 minutes (300 seconds)
// Check period: 1 minute (60 seconds)
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

const CacheKeys = {
    PATIENTS: 'all_patients',
    BLOOD_TESTS: 'all_blood_tests'
};

module.exports = {
    cache,
    CacheKeys,

    /**
     * Get value from cache
     * @param {string} key 
     * @returns {any} Cached value or undefined
     */
    get: (key) => cache.get(key),

    /**
     * Set value to cache
     * @param {string} key 
     * @param {any} value 
     * @param {number} [ttl] - Optional TTL in seconds 
     */
    set: (key, value, ttl) => cache.set(key, value, ttl),

    /**
     * Delete key from cache
     * @param {string} key 
     */
    del: (key) => cache.del(key),

    /**
     * Flush all data
     */
    flush: () => cache.flushAll(),

    /**
     * Wrap an async function with caching
     * @param {string} key - Cache key
     * @param {Function} fetchFunction - Async function to fetch data if cache miss
     * @param {number} [ttl] - Optional TTL
     * @returns {Promise<any>} Data
     */
    getOrFetch: async (key, fetchFunction, ttl) => {
        const cached = cache.get(key);
        if (cached) {
            return cached;
        }

        console.log(`[Cache] Miss for key: ${key}`);
        const data = await fetchFunction();

        if (data) {
            cache.set(key, data, ttl);
        }

        return data;
    }
};
