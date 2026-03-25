import { useState, useCallback, useEffect } from 'react';
import { Camera, CameraPermissionStatus } from 'react-native-vision-camera';

export const useCameraPermissions = () => {
  const [status, setStatus] = useState<CameraPermissionStatus>(
    Camera.getCameraPermissionStatus()
  );

  const checkPermission = useCallback(() => {
    const currentStatus = Camera.getCameraPermissionStatus();
    setStatus(currentStatus);
    return currentStatus;
  }, []);

  const requestPermission = useCallback(async () => {
    const newStatus = await Camera.requestCameraPermission();
    setStatus(newStatus);
    return newStatus;
  }, []);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return {
    status,
    requestPermission,
    checkPermission,
    isGranted: status === 'granted',
    isDenied: status === 'denied',
    isRestricted: status === 'restricted',
    isNotDetermined: status === 'not-determined',
  };
};
