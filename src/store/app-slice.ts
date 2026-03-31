import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type VerificationStatus = 'IDLE' | 'PENDING' | 'SUCCESS' | 'FAILURE' | 'SECURITY_RISK';

interface AppState {
  isInitialized: boolean;
  deepfakeScore: number;
  verificationStatus: VerificationStatus;
  verificationMessage: string;
  biometricSimilarity: number;
}

const initialState: AppState = {
  isInitialized: false,
  deepfakeScore: 0,
  verificationStatus: 'IDLE',
  verificationMessage: '',
  biometricSimilarity: 0,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
    setVerificationResult: (
      state,
      action: PayloadAction<{
        status: VerificationStatus;
        message?: string;
        deepfakeScore?: number;
        biometricSimilarity?: number;
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
    },
    resetVerification: state => {
      state.verificationStatus = 'IDLE';
      state.deepfakeScore = 0;
      state.verificationMessage = '';
      state.biometricSimilarity = 0;
    },
  },
});

export const { setInitialized, setVerificationResult, resetVerification } = appSlice.actions;
export const appReducer = appSlice.reducer;
