import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { adaptiveSecurityService } from '../adaptive-security-service';
import { useScreenProtection } from './useScreenProtection';
import { setSecurityContext, SecurityContext } from '../../../store/app-slice';
import { RootState } from '../../../store';

const POLLING_INTERVAL_MS = 5000;

/**
 * Hook to manage and subscribe to adaptive security context changes.
 * Monitors device health and environment to adjust verification rigor.
 */
export const useAdaptiveSecurity = () => {
  const dispatch = useDispatch();
  const { securityContext } = useSelector((state: RootState) => state.app);
  const { isRecording } = useScreenProtection();

  const updateContext = useCallback(async () => {
    const newContext = await adaptiveSecurityService.evaluateSecurityContext(isRecording);
    if (newContext !== securityContext) {
      dispatch(setSecurityContext(newContext));
    }
  }, [dispatch, isRecording, securityContext]);

  useEffect(() => {
    updateContext();

    const interval = setInterval(updateContext, POLLING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [updateContext]);

  return { securityContext, isRecording };
};
