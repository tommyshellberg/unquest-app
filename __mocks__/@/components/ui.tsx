import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export const Modal = ({ children, title }: any) => (
  <View testID="modal">
    {title && <Text>{title}</Text>}
    {children}
  </View>
);

export const useModal = () => ({
  ref: { current: null },
  present: jest.fn(),
  dismiss: jest.fn(),
});

export const Button = ({ children, onPress, ...props }: any) => (
  <TouchableOpacity onPress={onPress} {...props}>
    <Text>{children}</Text>
  </TouchableOpacity>
);

export const Input = ({ ...props }: any) => (
  <View>
    <input {...props} />
  </View>
);

export const Text = ({ children, ...props }: any) => (
  <Text {...props}>{children}</Text>
);

export const Card = ({ children, ...props }: any) => (
  <View {...props}>{children}</View>
);

export const FocusAwareStatusBar = () => null;

export const BottomSheetKeyboardAwareScrollView = ({ children }: any) => children;