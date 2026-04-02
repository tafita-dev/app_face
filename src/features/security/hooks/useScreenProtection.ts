import { useState, useEffect } from 'react';
import ScreenGuard from 'react-native-screenguard';

export const useScreenProtection = () => {
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    const setupScreenGuard = async () => {
      try {
        // ScreenGuard.initSettings() is now called in index.js for global initialization

        // 2. Activation du blocage (Register)
        // Note: register returns a Promise in recent versions
        await ScreenGuard.register({
          color: '#000000',
          status: 'on',
          time: 1000,
        } as any);

        // 3. Gestion des Listeners
        const guard = ScreenGuard as any;

        if (guard.listenScreenshot) {
          guard.listenScreenshot(() => {
            console.warn("Capture d'écran détectée !");
          });
        }

        if (guard.listenVideoRecording) {
          guard.listenVideoRecording((res: any) => {
            setIsRecording(!!res);
          });
        }
      } catch (error) {
        console.error('Failed to setup ScreenGuard:', error);
      }
    };

    setupScreenGuard();

    // 4. Nettoyage
    return () => {
      try {
        ScreenGuard.unregister();
      } catch (error) {
        console.warn('Failed to unregister ScreenGuard:', error);
      }
    };
  }, []);

  return { isRecording };
};
