import { COLORS, THEME } from './index';

describe('Theme', () => {
  it('should have the correct primary colors from specs', () => {
    expect(COLORS.BACKGROUND).toBe('#0A0E1A');
    expect(COLORS.PRIMARY).toBe('#007AFF');
  });

  it('should have a consistent spacing object', () => {
    expect(THEME.spacing.MD).toBe(16);
  });
});
