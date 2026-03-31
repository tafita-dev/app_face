import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen } from '../features/auth/WelcomeScreen';
import { ScanScreen } from '../features/camera/ScanScreen';
import { SecurityAlertScreen } from '../features/verification/deepfake/SecurityAlertScreen';

export type RootStackParamList = {
  Welcome: undefined;
  Scan: undefined;
  SecurityAlert: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Scan" component={ScanScreen} />
      <Stack.Screen name="SecurityAlert" component={SecurityAlertScreen} />
    </Stack.Navigator>
  );
};
