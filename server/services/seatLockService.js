import { cacheService } from "./cacheService.js";

const LOCK_TTL = 300; // 5 minutes in seconds

export const seatLockService = {
  async acquireLock(eventId, seatCode, email) {
    const lockKey = `seatlock:${eventId}:${seatCode}`;
    if (cacheService.setIfNotExists) {
      return cacheService.setIfNotExists(lockKey, email, LOCK_TTL);
    }
    if (await cacheService.exists(lockKey)) {
      return false;
    }
    return cacheService.set(lockKey, email, LOCK_TTL);
  },

  async releaseLock(eventId, seatCode) {
    const lockKey = `seatlock:${eventId}:${seatCode}`;
    // Assuming cacheService has a del method. We added delPattern/exists earlier.
    // If not, it will just expire.
    if (cacheService.del) {
      await cacheService.del(lockKey);
    }
  },
};
