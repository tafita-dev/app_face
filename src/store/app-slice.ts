import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type VerificationStatus = 'IDLE' | 'PENDING' | 'SUCCESS' | 'FAILURE' | 'SECURITY_RISK' | 'LOCKOUT';
export type DeviceStatus = 'SAFE' | 'COMPROMISED' | 'UNKNOWN';
export type SecurityContext = 'NORMAL' | 'HIGH_RISK' | 'UNSTABLE';

interface AppState {
  isInitialized: boolean;
  deepfakeScore: number;
  verificationStatus: VerificationStatus;
  verificationMessage: string;
  biometricSimilarity: number;
  deviceStatus: DeviceStatus;
  lockoutRemainingTime: number;
  securityContext: SecurityContext;
}

const initialState: AppState = {
  isInitialized: false,
  deepfakeScore: 0,
  verificationStatus: 'IDLE',
  verificationMessage: '',
  biometricSimilarity: 0,
  deviceStatus: 'UNKNOWN',
  lockoutRemainingTime: 0,
  securityContext: 'NORMAL',
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
    setDeviceStatus: (state, action: PayloadAction<DeviceStatus>) => {
      state.deviceStatus = action.payload;
    },
    setSecurityContext: (state, action: PayloadAction<SecurityContext>) => {
      state.securityContext = action.payload;
    },
    setVerificationResult: (
      state,
      action: PayloadAction<{
        status: VerificationStatus;
        message?: string;
        deepfakeScore?: number;
        biometricSimilarity?: number;
        lockoutRemainingTime?: number;
      }>,
    ) => {
      state.verificationStatus = action.payload.status;
      state.verificationMessage = action.payload.message || '';
      if (action.payload.deepfakeScore !== undefined) {
        state.deepfakeScore = action.payload.deepfakeScore;
      }
      if (action.payload.biometricSimilarity !== undefined) {
        state.biometricSimilarity = action.payload.biometricSimilarity;
      }
      if (action.payload.lockoutRemainingTime !== undefined) {
        state.lockoutRemainingTime = action.payload.lockoutRemainingTime;
      }
    },
    resetVerification: state => {
      state.verificationStatus = 'IDLE';
      state.deepfakeScore = 0;
      state.verificationMessage = '';
      state.biometricSimilarity = 0;
      state.lockoutRemainingTime = 0;
      state.securityContext = 'NORMAL';
    },
  },
});

export const { 
  setInitialized, 
  setVerificationResult, 
  resetVerification, 
  setDeviceStatus,
  setSecurityContext 
} = appSlice.actions;
export const appReducer = appSlice.reducer;
