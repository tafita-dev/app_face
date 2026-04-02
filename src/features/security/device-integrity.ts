import JailMonkey from 'jail-monkey';

export type DeviceStatus = 'SAFE' | 'COMPROMISED' | 'UNKNOWN';

/**
 * Checks the integrity of the device to ensure it is not rooted or jailbroken.
 * @returns 'SAFE' if the device is secure, 'COMPROMISED' otherwise.
 */
export const checkDeviceIntegrity = (): DeviceStatus => {
  if (__DEV__ && process.env.NODE_ENV !== 'test') {
    return 'SAFE';
  }

  const isJailBroken = JailMonkey.isJailBroken();
  const canMockLocation = JailMonkey.canMockLocation();
  const trustFall = JailMonkey.trustFall(); // hook for multiple checks

  if (isJailBroken || canMockLocation || !trustFall) {
    return 'COMPROMISED';
  }

  return 'SAFE';
};
