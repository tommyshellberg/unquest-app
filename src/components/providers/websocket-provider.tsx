import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import {
  webSocketService,
  WebSocketEvents,
} from '@/lib/services/websocket-service';
import { useQuestStore } from '@/store/quest-store';
import { queryClient } from '@/api/common';
import { AppState, AppStateStatus } from 'react-native';
import { getItem } from '@/lib/storage';

interface WebSocketContextValue {
  isConnected: boolean;
  on: <K extends keyof WebSocketEvents>(
    event: K,
    handler: WebSocketEvents[K]
  ) => void;
  off: <K extends keyof WebSocketEvents>(
    event: K,
    handler?: WebSocketEvents[K]
  ) => void;
  emit: (event: string, data?: any) => void;
  joinQuestRoom: (questRunId: string) => void;
  leaveQuestRoom: (questRunId: string) => void;
  forceReconnect: () => void;
  // Alias methods for compatibility
  addListener: <K extends keyof WebSocketEvents>(
    event: K,
    handler: WebSocketEvents[K]
  ) => void;
  removeListener: <K extends keyof WebSocketEvents>(
    event: K,
    handler?: WebSocketEvents[K]
  ) => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
}

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const authStatus = useAuth((state) => state.status);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const setPendingInvitations = useQuestStore(
    (state) => state.setPendingInvitations
  );
  
  // Check if provisional user has a token
  const [hasProvisionalToken, setHasProvisionalToken] = React.useState(false);
  
  React.useEffect(() => {
    const provisionalToken = getItem('provisionalAccessToken');
    setHasProvisionalToken(!!provisionalToken);
  }, [authStatus]);

  useEffect(() => {
    console.log('[WebSocketProvider] Auth status changed:', authStatus, 'Provisional token:', hasProvisionalToken);
    
    // Connect when authenticated (either full auth or provisional)
    if (authStatus === 'signIn' || hasProvisionalToken) {
      console.log('[WebSocketProvider] User authenticated, attempting WebSocket connection...');
      webSocketService.connect();
    } else {
      console.log('[WebSocketProvider] User not authenticated, disconnecting WebSocket...');
      webSocketService.disconnect();
    }

    return () => {
      webSocketService.disconnect();
    };
  }, [authStatus, hasProvisionalToken]);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        (authStatus === 'signIn' || hasProvisionalToken)
      ) {
        // App has come to foreground, reconnect
        console.log('[WebSocket] App foregrounded, reconnecting...');
        webSocketService.connect();
      } else if (
        appStateRef.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // App going to background
        console.log('[WebSocket] App backgrounded');
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [authStatus, hasProvisionalToken]);

  // Set up global event listeners
  useEffect(() => {
    if (authStatus !== 'signIn' && !hasProvisionalToken) return;

    // Handle new quest invitations
    const handleQuestInvitation = (data: any) => {
      console.log('[WebSocket] New quest invitation:', data);
      // Invalidate invitations query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['invitations', 'pending'] });
      // TODO: Show push notification or in-app notification
    };

    // Handle invitation status changes
    const handleInvitationAccepted = (data: any) => {
      console.log('========================================');
      console.log('[WebSocket] INVITATION ACCEPTED EVENT RECEIVED');
      console.log('Event data:', JSON.stringify(data, null, 2));
      console.log('InvitationId:', data.invitationId);
      console.log('Timestamp:', new Date().toISOString());
      console.log('Invalidating query key:', [
        'invitation',
        data.invitationId,
        'status',
      ]);
      console.log('========================================');
      queryClient.invalidateQueries({
        queryKey: ['invitation', data.invitationId, 'status'],
      });
    };

    const handleInvitationDeclined = (data: any) => {
      console.log('========================================');
      console.log('[WebSocket] INVITATION DECLINED EVENT RECEIVED');
      console.log('Event data:', JSON.stringify(data, null, 2));
      console.log('InvitationId:', data.invitationId);
      console.log('Timestamp:', new Date().toISOString());
      console.log('Invalidating query key:', [
        'invitation',
        data.invitationId,
        'status',
      ]);
      console.log('========================================');
      queryClient.invalidateQueries({
        queryKey: ['invitation', data.invitationId, 'status'],
      });
    };

    // Handle quest status changes
    const handleQuestStarted = (data: any) => {
      console.log('[WebSocket] Quest started:', data);
      const questStore = useQuestStore.getState();
      const cooperativeQuestRun = questStore.cooperativeQuestRun;
      
      if (cooperativeQuestRun?.id === data.questRunId) {
        // Update the cooperative quest run status
        questStore.setCooperativeQuestRun({
          ...cooperativeQuestRun,
          status: 'active',
          actualStartTime: data.actualStartTime,
        });
        
        // If we have a pending quest and phone is locked, start the quest locally
        const pendingQuest = questStore.pendingQuest;
        if (pendingQuest && !questStore.activeQuest) {
          console.log('[WebSocket] Starting cooperative quest locally');
          const startTime = data.actualStartTime || Date.now();
          questStore.startQuest({
            ...pendingQuest,
            startTime,
          });
        }
      }
    };

    const handleParticipantReady = (data: any) => {
      console.log('[WebSocket] Participant ready:', data);
      useQuestStore.getState().updateParticipantReady(data.userId, data.ready);
      // Also invalidate quest run query to get latest data
      if (data.questRunId) {
        queryClient.invalidateQueries({
          queryKey: ['questRun', data.questRunId],
        });
      }
    };

    const handleParticipantJoined = (data: any) => {
      console.log('[WebSocket] Participant joined:', data);
      // Invalidate quest run query to get latest participant list
      if (data.questRunId) {
        queryClient.invalidateQueries({
          queryKey: ['questRun', data.questRunId],
        });
      }
    };

    // Subscribe to events
    console.log('[WebSocket Provider] Setting up event listeners...');
    webSocketService.on('questInvitation', handleQuestInvitation);
    webSocketService.on('invitationAccepted', handleInvitationAccepted);
    webSocketService.on('invitationDeclined', handleInvitationDeclined);
    webSocketService.on('questStarted', handleQuestStarted);
    webSocketService.on('participantReady', handleParticipantReady);
    webSocketService.on('participantJoined', handleParticipantJoined);
    console.log('[WebSocket Provider] Event listeners set up complete');

    return () => {
      // Unsubscribe from events
      webSocketService.off('questInvitation', handleQuestInvitation);
      webSocketService.off('invitationAccepted', handleInvitationAccepted);
      webSocketService.off('invitationDeclined', handleInvitationDeclined);
      webSocketService.off('questStarted', handleQuestStarted);
      webSocketService.off('participantReady', handleParticipantReady);
      webSocketService.off('participantJoined', handleParticipantJoined);
    };
  }, [authStatus, hasProvisionalToken]);

  const contextValue: WebSocketContextValue = {
    isConnected: webSocketService.getConnectionStatus(),
    on: (event, handler) => webSocketService.on(event, handler),
    off: (event, handler) => webSocketService.off(event, handler),
    emit: (event, data) => webSocketService.emit(event, data),
    joinQuestRoom: (questRunId) => webSocketService.joinQuestRoom(questRunId),
    leaveQuestRoom: (questRunId) => webSocketService.leaveQuestRoom(questRunId),
    forceReconnect: () => webSocketService.forceReconnect(),
    // Alias methods for compatibility
    addListener: (event, handler) => webSocketService.on(event, handler),
    removeListener: (event, handler) => webSocketService.off(event, handler),
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}
