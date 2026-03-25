import { combineReducers } from '@reduxjs/toolkit';
import { appReducer } from './app-slice';

export const rootReducer = combineReducers({
  app: appReducer,
});
