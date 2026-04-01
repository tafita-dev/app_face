import { store } from './index';
import { 
  setInitialized, 
  setVerificationResult, 
  resetVerification, 
  setDeviceStatus,
  setSecurityContext 
} from './app-slice';
import { appReducer } from './app-slice';

describe('Redux Store', () => {
  it('should have initial state', () => {
    const state = store.getState();
    expect(state.app.isInitialized).toBe(false);
    expect(state.app.verificationStatus).toBe('IDLE');
    expect(state.app.deepfakeScore).toBe(0);
    expect(state.app.deviceStatus).toBe('UNKNOWN');
    expect(state.app.securityContext).toBe('NORMAL');
  });

  it('should update state when action is dispatched', () => {
    store.dispatch(setInitialized(true));
    let state = store.getState();
    expect(state.app.isInitialized).toBe(true);

    store.dispatch(setVerificationResult({ status: 'SUCCESS', deepfakeScore: 0.1 }));
    state = store.getState();
    expect(state.app.verificationStatus).toBe('SUCCESS');
    expect(state.app.deepfakeScore).toBe(0.1);

    store.dispatch(setVerificationResult({ status: 'SECURITY_RISK', deepfakeScore: 0.85 }));
    state = store.getState();
    expect(state.app.verificationStatus).toBe('SECURITY_RISK');
    expect(state.app.deepfakeScore).toBe(0.85);

    store.dispatch(setDeviceStatus('SAFE'));
    state = store.getState();
    expect(state.app.deviceStatus).toBe('SAFE');

    store.dispatch(setSecurityContext('HIGH_RISK'));
    state = store.getState();
    expect(state.app.securityContext).toBe('HIGH_RISK');

    store.dispatch(resetVerification());
    state = store.getState();
    expect(state.app.verificationStatus).toBe('IDLE');
    expect(state.app.deepfakeScore).toBe(0);
  });
});
