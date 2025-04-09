import { useIsFocused } from '@react-navigation/native';
import * as React from 'react';
import { Platform } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';

type Props = { hidden?: boolean };
export const FocusAwareStatusBar = ({ hidden = false }: Props) => {
  const isFocused = useIsFocused();
  // disabling dark mode for now
  // const { colorScheme } = useColorScheme();

  if (Platform.OS === 'web') return null;

  return isFocused ? <SystemBars style="light" hidden={hidden} /> : null;
};
