'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { storage } from './storage';
import { toast } from 'sonner';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentToken, setCurrentToken] = useState<string | null>(null);

  // Monitor token changes from localStorage
  useEffect(() => {
    const checkToken = () => {
      const token = storage.getToken();
      if (token !== currentToken) {
        setCurrentToken(token);
      }
    };

    // Check immediately
    checkToken();

    // Set up an interval to check for token changes
    const interval = setInterval(checkToken, 1000);

    return () => clearInterval(interval);
  }, [currentToken]);

  // Manage socket connection based on token
  useEffect(() => {
    // If no token, disconnect any existing socket
    if (!currentToken) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // If socket already exists and is connected, don't reconnect
    if (socket && socket.connected) {
      return;
    }

    // Disconnect old socket if it exists
    if (socket) {
      socket.disconnect();
    }

    // Initialize socket connection
    const socketInstance = io(
      process.env.NEXT_PUBLIC_API_URL?.replace('/api', ''),
      {
        auth: {
          token: currentToken,
        },
        transports: ['websocket', 'polling'],
      }
    );

    socketInstance.on('connect', () => {
      setIsConnected(true);
      toast.success('Real-time notifications active', { duration: 2000 });
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('connect_error', () => {
      setIsConnected(false);
      toast.error('Failed to connect to real-time notifications');
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentToken]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

// Hook for listening to real-time notifications
export function useNotifications(onNotification?: (notification: unknown) => void) {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for all notification events
    const notificationEvents = [
      'leave_request_created',
      'leave_request_approved',
      'leave_request_rejected',
      'leave_request_canceled',
      'notification',
    ];

    const handleNotification = (data: unknown) => {
      // Show toast notification
      const notificationData = data as {
        type?: string;
        employee?: { name?: string };
        message?: string;
      };
      if (notificationData.type || notificationData.message) {
        toast.info(notificationData.message || `New notification: ${notificationData.type}`);
      }

      // Call custom handler if provided
      if (onNotification) {
        onNotification(data);
      }
    };

    // Register listeners for all events
    notificationEvents.forEach((event) => {
      socket.on(event, handleNotification);
    });

    return () => {
      // Clean up listeners
      notificationEvents.forEach((event) => {
        socket.off(event, handleNotification);
      });
    };
  }, [socket, isConnected, onNotification]);

  return { socket, isConnected };
}
