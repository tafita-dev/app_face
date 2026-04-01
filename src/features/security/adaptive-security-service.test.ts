import { adaptiveSecurityService } from './adaptive-security-service';
import { checkDeviceIntegrity } from './device-integrity';
import DeviceInfo from 'react-native-device-info';

jest.mock('./device-integrity');
jest.mock('react-native-device-info', () => ({
  getBatteryLevel: jest.fn(),
  isBatteryCharging: jest.fn(),
}));

describe('AdaptiveSecurityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return HIGH_RISK if device is compromised', async () => {
    (checkDeviceIntegrity as jest.Mock).mockReturnValue('COMPROMISED');
    (DeviceInfo.getBatteryLevel as jest.Mock).mockResolvedValue(0.8);
    
    const context = await adaptiveSecurityService.evaluateSecurityContext(false);
    expect(context).toBe('HIGH_RISK');
  });

  it('should return HIGH_RISK if screen recording is active', async () => {
    (checkDeviceIntegrity as jest.Mock).mockReturnValue('SAFE');
    (DeviceInfo.getBatteryLevel as jest.Mock).mockResolvedValue(0.8);
    
    const context = await adaptiveSecurityService.evaluateSecurityContext(true);
    expect(context).toBe('HIGH_RISK');
  });

  it('should return UNSTABLE if battery is very low and not charging', async () => {
    (checkDeviceIntegrity as jest.Mock).mockReturnValue('SAFE');
    (DeviceInfo.getBatteryLevel as jest.Mock).mockResolvedValue(0.04);
    (DeviceInfo.isBatteryCharging as jest.Mock).mockResolvedValue(false);
    
    const context = await adaptiveSecurityService.evaluateSecurityContext(false);
    expect(context).toBe('UNSTABLE');
  });

  it('should return NORMAL if battery is low but charging', async () => {
    (checkDeviceIntegrity as jest.Mock).mockReturnValue('SAFE');
    (DeviceInfo.getBatteryLevel as jest.Mock).mockResolvedValue(0.04);
    (DeviceInfo.isBatteryCharging as jest.Mock).mockResolvedValue(true);
    
    const context = await adaptiveSecurityService.evaluateSecurityContext(false);
    expect(context).toBe('NORMAL');
  });

  it('should return NORMAL if device is safe and battery is sufficient', async () => {
    (checkDeviceIntegrity as jest.Mock).mockReturnValue('SAFE');
    (DeviceInfo.getBatteryLevel as jest.Mock).mockResolvedValue(0.5);
    
    const context = await adaptiveSecurityService.evaluateSecurityContext(false);
    expect(context).toBe('NORMAL');
  });
});
