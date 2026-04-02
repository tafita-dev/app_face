import DeviceInfo from 'react-native-device-info';
import { checkDeviceIntegrity } from './device-integrity';
import { SecurityContext } from '../../store/app-slice';

class AdaptiveSecurityService {
  private _isLowLight: boolean = false;

  /**
   * Updates the ambient light status.
   * @param isLowLight True if ambient light is below threshold
   */
  setIsLowLight(isLowLight: boolean) {
    this._isLowLight = isLowLight;
  }

  /**
   * Returns true if the environment is currently in low-light conditions.
   */
  isLowLight(): boolean {
    return this._isLowLight;
  }

  /**
   * Evaluates the current security context based on device integrity,
   * screen recording state, and environmental factors like battery level.
   * 
   * @param isRecording Current screen recording state
   * @returns The calculated SecurityContext
   */
  async evaluateSecurityContext(isRecording: boolean): Promise<SecurityContext> {
    // 1. Check for HIGH_RISK (Compromised device or screen recording)
    const deviceStatus = checkDeviceIntegrity();
    if (deviceStatus === 'COMPROMISED' || isRecording) {
      return 'HIGH_RISK';
    }

    // 2. Check for UNSTABLE (Low battery without charging)
    try {
      const batteryLevel = await DeviceInfo.getBatteryLevel();
      const isCharging = await DeviceInfo.isBatteryCharging();

      // If battery < 5% and not charging, flag as UNSTABLE
      if (batteryLevel > 0 && batteryLevel < 0.05 && !isCharging) {
        return 'UNSTABLE';
      }
    } catch (error) {
      console.warn('Failed to get battery info for adaptive security:', error);
    }

    // 3. Default to NORMAL
    return 'NORMAL';
  }

  /**
   * Calculates the required Cosine Similarity threshold based on the current
   * security context and environmental factors.
   * 
   * @param isRecording Current screen recording state
   * @returns The required similarity threshold (e.g., 0.85 or 0.90)
   */
  async getRequiredThreshold(isRecording: boolean): Promise<number> {
    const context = await this.evaluateSecurityContext(isRecording);
    
    // Scenario 1: High Security Mode
    if (context === 'HIGH_RISK' || this._isLowLight) {
      return 0.90;
    }

    // Scenario 2: Normal Mode
    return 0.85;
  }
}

export const adaptiveSecurityService = new AdaptiveSecurityService();
