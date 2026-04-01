import { lockoutService } from './lockout-service';
import * as Keychain from 'react-native-keychain';

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(),
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
  ACCESSIBLE: {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  },
}));

describe('LockoutService', () => {
  let mockStore: Record<string, string> = {};

  beforeEach(async () => {
    mockStore = {};
    (Keychain.setGenericPassword as jest.Mock).mockImplementation((username, password, options) => {
      const service = options?.service || username;
      mockStore[service] = password;
      return Promise.resolve(true);
    });
    (Keychain.getGenericPassword as jest.Mock).mockImplementation((options) => {
      const service = options?.service || 'default';
      if (mockStore[service]) {
        return Promise.resolve({ password: mockStore[service] });
      }
      return Promise.resolve(null);
    });

    // We need to reach into the singleton to reset its internal state for each test
    // since it's a singleton and we're not reloading the module
    await (lockoutService as any).reset();
    (lockoutService as any).initialized = false;
  });

  it('should start with zero fail count', async () => {
    const count = await lockoutService.getFailCount();
    expect(count).toBe(0);
  });

  it('should increment fail count', async () => {
    await lockoutService.recordFailure();
    const count = await lockoutService.getFailCount();
    expect(count).toBe(1);
  });

  it('should reset fail count on success', async () => {
    await lockoutService.recordFailure();
    await lockoutService.recordFailure();
    await lockoutService.recordSuccess();
    const count = await lockoutService.getFailCount();
    expect(count).toBe(0);
  });

  it('should not be locked out initially', async () => {
    const isLocked = await lockoutService.isLockedOut();
    expect(isLocked).toBe(false);
  });

  it('should be locked out after 5 failures', async () => {
    for (let i = 0; i < 5; i++) {
      await lockoutService.recordFailure();
    }
    const isLocked = await lockoutService.isLockedOut();
    expect(isLocked).toBe(true);
  });

  it('should return remaining time when locked out', async () => {
    jest.useFakeTimers();
    const now = Date.now();
    jest.setSystemTime(now);

    for (let i = 0; i < 5; i++) {
      await lockoutService.recordFailure();
    }

    const remainingTime = await lockoutService.getRemainingLockoutTime();
    expect(remainingTime).toBe(15 * 60 * 1000); // 15 minutes in ms

    // Advance 5 minutes
    jest.setSystemTime(now + 5 * 60 * 1000);
    const remainingTime2 = await lockoutService.getRemainingLockoutTime();
    expect(remainingTime2).toBe(10 * 60 * 1000);

    jest.useRealTimers();
  });

  it('should automatically reset lockout after 15 minutes', async () => {
    jest.useFakeTimers();
    const now = Date.now();
    jest.setSystemTime(now);

    for (let i = 0; i < 5; i++) {
      await lockoutService.recordFailure();
    }

    expect(await lockoutService.isLockedOut()).toBe(true);

    // Advance 15 minutes and 1 second
    jest.setSystemTime(now + 15 * 60 * 1000 + 1000);
    
    expect(await lockoutService.isLockedOut()).toBe(false);
    expect(await lockoutService.getFailCount()).toBe(0);

    jest.useRealTimers();
  });
});
