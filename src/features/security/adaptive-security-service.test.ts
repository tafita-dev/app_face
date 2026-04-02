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

  describe('getRequiredThreshold', () => {
    it('should return 0.90 if security context is HIGH_RISK', async () => {
      (checkDeviceIntegrity as jest.Mock).mockReturnValue('COMPROMISED');
      adaptiveSecurityService.setIsLowLight(false);
      
      const threshold = await adaptiveSecurityService.getRequiredThreshold(false);
      expect(threshold).toBe(0.90);
    });

    it('should return 0.90 if it is low light environment', async () => {
      (checkDeviceIntegrity as jest.Mock).mockReturnValue('SAFE');
      (DeviceInfo.getBatteryLevel as jest.Mock).mockResolvedValue(0.5);
      adaptiveSecurityService.setIsLowLight(true);
      
      const threshold = await adaptiveSecurityService.getRequiredThreshold(false);
      expect(threshold).toBe(0.90);
    });

    it('should return 0.85 if security context is NORMAL and it is not low light', async () => {
      (checkDeviceIntegrity as jest.Mock).mockReturnValue('SAFE');
      (DeviceInfo.getBatteryLevel as jest.Mock).mockResolvedValue(0.5);
      adaptiveSecurityService.setIsLowLight(false);
      
      const threshold = await adaptiveSecurityService.getRequiredThreshold(false);
      expect(threshold).toBe(0.85);
    });

    it('should return 0.85 if security context is UNSTABLE but it is not low light', async () => {
      (checkDeviceIntegrity as jest.Mock).mockReturnValue('SAFE');
      (DeviceInfo.getBatteryLevel as jest.Mock).mockResolvedValue(0.04);
      (DeviceInfo.isBatteryCharging as jest.Mock).mockResolvedValue(false);
      adaptiveSecurityService.setIsLowLight(false);
      
      const threshold = await adaptiveSecurityService.getRequiredThreshold(false);
      expect(threshold).toBe(0.85);
    });
  });
});
