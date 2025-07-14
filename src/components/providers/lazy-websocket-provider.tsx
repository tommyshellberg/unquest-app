import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { useAuth } from '@/lib/auth';
import { getItem } from '@/lib/storage';
import {
  webSocketService,
  WebSocketEvents,
} from '@/lib/services/websocket-service';
import { TypedWebSocketEvents } from '@/lib/services/websocket-events.types';

interface LazyWebSocketContextValue {
  isConnected: boolean;
  isEnabled: boolean;
  connect: () => void;
  disconnect: () => void;
  on: {
    <K extends keyof TypedWebSocketEvents>(
      event: K,
      handler: TypedWebSocketEvents[K]
    ): void;
    (event: string, handler: (...args: any[]) => void): void;
  };
  off: {
    <K extends keyof TypedWebSocketEvents>(
      event: K,
      handler?: TypedWebSocketEvents[K]
    ): void;
    (event: string, handler?: (...args: any[]) => void): void;
  };
  emit: (event: string, data?: any) => void;
  joinQuestRoom: (questRunId: string) => void;
  leaveQuestRoom: (questRunId: string) => void;
  forceReconnect: () => void;
}

const LazyWebSocketContext = createContext<LazyWebSocketContextValue | null>(null);

export const useLazyWebSocket = () => {
  const context = useContext(LazyWebSocketContext);
  if (!context) {
    throw new Error('useLazyWebSocket must be used within LazyWebSocketProvider');
  }
  return context;
};

// Compatibility layer for existing components
export const useWebSocket = () => {
  const lazyContext = useLazyWebSocket();
  
  // Auto-connect for components that expect an active connection
  useEffect(() => {
    lazyContext.connect();
  }, [lazyContext]);
  
  // Return interface compatible with old WebSocketProvider
  return {
    isConnected: lazyContext.isConnected,
    on: lazyContext.on,
    off: lazyContext.off,
    emit: lazyContext.emit,
    joinQuestRoom: lazyContext.joinQuestRoom,
    leaveQuestRoom: lazyContext.leaveQuestRoom,
    forceReconnect: lazyContext.forceReconnect,
    // Add aliases for compatibility
    addListener: lazyContext.on,
    removeListener: lazyContext.off,
  };
};

export const LazyWebSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { authStatus } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [hasProvisionalToken, setHasProvisionalToken] = useState(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Check for provisional token
  useEffect(() => {
    const provisionalToken = getItem('provisionalAccessToken');
    setHasProvisionalToken(!!provisionalToken);
  }, [authStatus]);

  // Manual connect function
  const connect = () => {
    if ((authStatus === 'signIn' || hasProvisionalToken) && !isEnabled) {
      console.log('[LazyWebSocket] Manually connecting WebSocket...');
      setIsEnabled(true);
      webSocketService.connect();
    }
  };

  // Manual disconnect function
  const disconnect = () => {
    console.log('[LazyWebSocket] Manually disconnecting WebSocket...');
    setIsEnabled(false);
    webSocketService.disconnect();
  };

  // Handle connection state changes
  useEffect(() => {
    const handleConnect = () => {
      console.log('[LazyWebSocket] Connected');
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      console.log('[LazyWebSocket] Disconnected');
      setIsConnected(false);
    };

    webSocketService.on('connect', handleConnect);
    webSocketService.on('disconnect', handleDisconnect);

    return () => {
      webSocketService.off('connect', handleConnect);
      webSocketService.off('disconnect', handleDisconnect);
    };
  }, []);

  // Handle app state changes only if enabled
  useEffect(() => {
    if (!isEnabled) return;

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        (authStatus === 'signIn' || hasProvisionalToken)
      ) {
        // App has come to foreground, reconnect
        console.log('[LazyWebSocket] App foregrounded, reconnecting...');
        webSocketService.forceReconnect();
      } else if (
        appStateRef.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // App going to background
        console.log('[LazyWebSocket] App backgrounded');
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [authStatus, hasProvisionalToken, isEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isEnabled) {
        webSocketService.disconnect();
      }
    };
  }, [isEnabled]);

  const value: LazyWebSocketContextValue = {
    isConnected,
    isEnabled,
    connect,
    disconnect,
    on: webSocketService.on.bind(webSocketService),
    off: webSocketService.off.bind(webSocketService),
    emit: webSocketService.emit.bind(webSocketService),
    joinQuestRoom: webSocketService.joinQuestRoom.bind(webSocketService),
    leaveQuestRoom: webSocketService.leaveQuestRoom.bind(webSocketService),
    forceReconnect: webSocketService.forceReconnect.bind(webSocketService),
  };

  return (
    <LazyWebSocketContext.Provider value={value}>
      {children}
    </LazyWebSocketContext.Provider>
  );
};