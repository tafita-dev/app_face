import JailMonkey from 'jail-monkey';
import { checkDeviceIntegrity } from './device-integrity';

jest.mock('jail-monkey', () => ({
  isJailBroken: jest.fn(),
  canMockLocation: jest.fn(),
  trustFall: jest.fn(),
}));

describe('device-integrity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return "SAFE" when the device is not compromised', () => {
    (JailMonkey.isJailBroken as jest.Mock).mockReturnValue(false);
    (JailMonkey.canMockLocation as jest.Mock).mockReturnValue(false);
    (JailMonkey.trustFall as jest.Mock).mockReturnValue(true);

    const result = checkDeviceIntegrity();

    expect(result).toBe('SAFE');
  });

  it('should return "COMPROMISED" when the device is jailbroken', () => {
    (JailMonkey.isJailBroken as jest.Mock).mockReturnValue(true);
    (JailMonkey.canMockLocation as jest.Mock).mockReturnValue(false);
    (JailMonkey.trustFall as jest.Mock).mockReturnValue(true);

    const result = checkDeviceIntegrity();

    expect(result).toBe('COMPROMISED');
  });

  it('should return "COMPROMISED" when the device can mock location', () => {
    (JailMonkey.isJailBroken as jest.Mock).mockReturnValue(false);
    (JailMonkey.canMockLocation as jest.Mock).mockReturnValue(true);
    (JailMonkey.trustFall as jest.Mock).mockReturnValue(true);

    const result = checkDeviceIntegrity();

    expect(result).toBe('COMPROMISED');
  });

  it('should return "COMPROMISED" when trustFall fails', () => {
    (JailMonkey.isJailBroken as jest.Mock).mockReturnValue(false);
    (JailMonkey.canMockLocation as jest.Mock).mockReturnValue(false);
    (JailMonkey.trustFall as jest.Mock).mockReturnValue(false);

    const result = checkDeviceIntegrity();

    expect(result).toBe('COMPROMISED');
  });
});
