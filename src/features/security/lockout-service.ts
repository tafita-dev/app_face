import * as Keychain from 'react-native-keychain';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_STORAGE_KEY = 'com.aurelius.secureface.lockout';

class LockoutService {
  private failCount: number = 0;
  private lastFailedTimestamp: number | null = null;
  private initialized: boolean = false;

  private async initialize() {
    if (this.initialized) return;
    try {
      const credentials = await Keychain.getGenericPassword({
        service: LOCKOUT_STORAGE_KEY,
      });
      if (credentials) {
        const data = JSON.parse(credentials.password);
        this.failCount = data.failCount || 0;
        this.lastFailedTimestamp = data.lastFailedTimestamp || null;
      }
    } catch (error) {
      console.error('Error loading lockout state:', error);
    }
    this.initialized = true;
    await this.checkLockoutStatus();
  }

  private async persist() {
    try {
      const data = JSON.stringify({
        failCount: this.failCount,
        lastFailedTimestamp: this.lastFailedTimestamp,
      });
      await Keychain.setGenericPassword(LOCKOUT_STORAGE_KEY, data, {
        service: LOCKOUT_STORAGE_KEY,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } catch (error) {
      console.error('Error persisting lockout state:', error);
    }
  }

  async getFailCount(): Promise<number> {
    await this.initialize();
    await this.checkLockoutStatus();
    return this.failCount;
  }

  async recordFailure(): Promise<void> {
    await this.initialize();
    await this.checkLockoutStatus();
    this.failCount += 1;
    this.lastFailedTimestamp = Date.now();
    await this.persist();
  }

  async recordSuccess(): Promise<void> {
    await this.initialize();
    this.failCount = 0;
    this.lastFailedTimestamp = null;
    await this.persist();
  }

  async isLockedOut(): Promise<boolean> {
    await this.initialize();
    await this.checkLockoutStatus();
    return this.failCount >= MAX_ATTEMPTS;
  }

  async getRemainingLockoutTime(): Promise<number> {
    await this.initialize();
    await this.checkLockoutStatus();
    if (this.failCount < MAX_ATTEMPTS || !this.lastFailedTimestamp) {
      return 0;
    }

    const elapsed = Date.now() - this.lastFailedTimestamp;
    const remaining = LOCKOUT_DURATION_MS - elapsed;

    return Math.max(0, remaining);
  }

  async reset(): Promise<void> {
    this.failCount = 0;
    this.lastFailedTimestamp = null;
    await this.persist();
  }

  private async checkLockoutStatus(): Promise<void> {
    if (this.lastFailedTimestamp) {
      const elapsed = Date.now() - this.lastFailedTimestamp;
      if (elapsed >= LOCKOUT_DURATION_MS) {
        this.failCount = 0;
        this.lastFailedTimestamp = null;
        await this.persist();
      }
    }
  }
}

export const lockoutService = new LockoutService();
