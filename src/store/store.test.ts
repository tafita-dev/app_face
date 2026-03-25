import { store } from './index';
import { setInitialized } from './app-slice';
import { appReducer } from './app-slice';

describe('Redux Store', () => {
  it('should have initial state', () => {
    const state = store.getState();
    expect(state.app.isInitialized).toBe(false);
  });

  it('should update state when action is dispatched', () => {
    store.dispatch(setInitialized(true));
    const state = store.getState();
    expect(state.app.isInitialized).toBe(true);
  });
});
