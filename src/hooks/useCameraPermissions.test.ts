import { renderHook, act } from '@testing-library/react-native';
import { Camera } from 'react-native-vision-camera';
import { useCameraPermissions } from './useCameraPermissions';

const mockedCamera = Camera as jest.Mocked<typeof Camera>;

describe('useCameraPermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should check permission on mount', async () => {
    mockedCamera.getCameraPermissionStatus.mockReturnValue('not-determined');
    
    const { result } = renderHook(() => useCameraPermissions());
    
    expect(mockedCamera.getCameraPermissionStatus).toHaveBeenCalled();
    expect(result.current.status).toBe('not-determined');
  });

  it('should request permission when requestPermission is called', async () => {
    mockedCamera.getCameraPermissionStatus.mockReturnValue('not-determined');
    mockedCamera.requestCameraPermission.mockResolvedValue('granted');
    
    const { result } = renderHook(() => useCameraPermissions());
    
    await act(async () => {
      const status = await result.current.requestPermission();
      expect(status).toBe('granted');
    });
    
    expect(mockedCamera.requestCameraPermission).toHaveBeenCalled();
    expect(result.current.status).toBe('granted');
  });

  it('should update status to denied when request fails', async () => {
    mockedCamera.getCameraPermissionStatus.mockReturnValue('not-determined');
    mockedCamera.requestCameraPermission.mockResolvedValue('denied');
    
    const { result } = renderHook(() => useCameraPermissions());
    
    await act(async () => {
      await result.current.requestPermission();
    });
    
    expect(result.current.status).toBe('denied');
  });
});
