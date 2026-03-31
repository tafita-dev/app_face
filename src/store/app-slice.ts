import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type VerificationStatus = 'IDLE' | 'PENDING' | 'SUCCESS' | 'FAILURE' | 'SECURITY_RISK';

interface AppState {
  isInitialized: boolean;
  deepfakeScore: number;
  verificationStatus: VerificationStatus;
}

const initialState: AppState = {
  isInitialized: false,
  deepfakeScore: 0,
  verificationStatus: 'IDLE',
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
    setVerificationResult: (state, action: PayloadAction<{ status: VerificationStatus; deepfakeScore?: number }>) => {
      state.verificationStatus = action.payload.status;
      if (action.payload.deepfakeScore !== undefined) {
        state.deepfakeScore = action.payload.deepfakeScore;
      }
    },
    resetVerification: (state) => {
      state.verificationStatus = 'IDLE';
      state.deepfakeScore = 0;
    },
  },
});

export const { setInitialized, setVerificationResult, resetVerification } = appSlice.actions;
export const appReducer = appSlice.reducer;
