import { io, Socket } from 'socket.io-client';
import { getItem } from '@/lib/storage';
import { Env } from '@env';
import { getToken } from '@/lib/auth/utils';
import { TypedWebSocketEvents } from './websocket-events.types';

// Re-export the typed events for backward compatibility
export type WebSocketEvents = TypedWebSocketEvents;

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 3000;

  constructor() {
    // Bind methods to ensure correct context
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.emit = this.emit.bind(this);
    this.on = this.on.bind(this);
    this.off = this.off.bind(this);
  }

  connect(): void {
    console.log('[WebSocket] Connect method called');
    if (this.socket?.connected) {
      console.log('[WebSocket] Already connected');
      return;
    }

    // Get token from the auth store
    const tokenData = getToken();
    const provisionalToken = getItem('provisionalAccessToken');
    const accessToken = tokenData?.access || provisionalToken;
    
    console.log('[WebSocket] Token check:', {
      hasTokenData: !!tokenData,
      tokenDataAccess: tokenData?.access,
      hasProvisionalToken: !!provisionalToken,
      hasAccessToken: !!accessToken,
    });

    if (!accessToken) {
      console.warn(
        '[WebSocket] No access token available, skipping connection'
      );
      console.log('[WebSocket] Checking stored tokens:', {
        tokenData: tokenData,
        provisionalAccessToken: provisionalToken,
      });
      return;
    }

    // Extract base URL from API_URL
    const baseUrl = Env.API_URL.replace('/v1', '');

    console.log('[WebSocket] Connection details:', {
      apiUrl: Env.API_URL,
      baseUrl: baseUrl,
      hasToken: !!accessToken,
      tokenType: getItem('accessToken') ? 'full' : 'provisional',
    });

    this.socket = io(baseUrl, {
      auth: {
        token: accessToken,
      },
      transports: ['websocket', 'polling'], // Add polling as fallback
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      // Add timeout options
      timeout: 20000,
      // Force new connection
      forceNew: true,
    });
    
    console.log('[WebSocket] Socket created, setting up listeners');

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected successfully');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', {
        message: error.message,
        type: error.type,
        data: error.data,
        context: error.context,
      });

      // Log more details about the error
      if (error.message.includes('xhr')) {
        console.error('[WebSocket] XHR/Polling error - possible CORS issue');
      } else if (error.message.includes('websocket')) {
        console.error(
          '[WebSocket] WebSocket error - check if server supports WebSocket'
        );
      } else if (
        error.message.includes('unauthorized') ||
        error.message.includes('401')
      ) {
        console.error(
          '[WebSocket] Authentication error - token might be invalid'
        );
      }

      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[WebSocket] Max reconnection attempts reached');
        this.disconnect();
      }
    });

    this.socket.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
    });

    // Debug: log all incoming events
    this.socket.onAny((eventName, ...args) => {
      console.log('[WebSocket] Received event:', eventName, args);
    });
  }

  disconnect(): void {
    if (this.socket) {
      console.log('[WebSocket] Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  emit(event: string, data?: any): void {
    if (!this.socket || !this.isConnected) {
      console.warn('[WebSocket] Cannot emit, not connected');
      return;
    }

    console.log(`[WebSocket] Emitting event: ${event}`, data);
    this.socket.emit(event, data);
  }

  on<K extends keyof TypedWebSocketEvents>(
    event: K,
    handler: TypedWebSocketEvents[K]
  ): void;
  on(event: string, handler: (...args: any[]) => void): void;
  on(event: string, handler: (...args: any[]) => void): void {
    if (!this.socket) {
      console.warn('[WebSocket] Cannot subscribe to events, not connected');
      return;
    }

    console.log(`[WebSocket] Subscribing to event: ${event}`);
    this.socket.on(event, handler);
  }

  off<K extends keyof TypedWebSocketEvents>(
    event: K,
    handler?: TypedWebSocketEvents[K]
  ): void;
  off(event: string, handler?: (...args: any[]) => void): void;
  off(event: string, handler?: (...args: any[]) => void): void {
    if (!this.socket) return;

    console.log(`[WebSocket] Unsubscribing from event: ${event}`);
    if (handler) {
      this.socket.off(event, handler);
    } else {
      this.socket.off(event);
    }
  }

  joinQuestRoom(questRunId: string): void {
    this.emit('joinQuestRoom', { questRunId });
  }

  leaveQuestRoom(questRunId: string): void {
    this.emit('leaveQuestRoom', { questRunId });
  }

  updateParticipantStatus(questRunId: string, status: any): void {
    this.emit('updateParticipantStatus', { questRunId, status });
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // Debug method to force reconnection
  forceReconnect(): void {
    console.log('[WebSocket] Force reconnect requested');
    this.disconnect();
    this.reconnectAttempts = 0;
    setTimeout(() => {
      this.connect();
    }, 100);
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
