import { useState, useEffect } from 'react';
// @ts-ignore
import ScreenGuard from 'react-native-screen-guard';

/**
 * Hook to manage screen protection (recording and screenshots).
 * Uses react-native-screen-guard to detect and prevent unauthorized captures.
 */
export const useScreenProtection = () => {
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    // Register for recording events
    // ScreenGuard.registerRecordingListener(callback)
    ScreenGuard.registerRecordingListener((data: any) => {
      if (data && typeof data.isRecording !== 'undefined') {
        setIsRecording(data.isRecording);
      }
    });

    // Register for screenshot events (Scenario 3 - iOS)
    ScreenGuard.registerScreenshotListener(() => {
      console.warn('Screenshot detected on sensitive screen!');
    });

    // Cleanup on unmount
    return () => {
      ScreenGuard.unregister();
    };
  }, []);

  return { isRecording };
};
