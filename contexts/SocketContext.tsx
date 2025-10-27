import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  joinReport: (reportId: string) => void;
  leaveReport: (reportId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
  joinReport: () => {},
  leaveReport: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const initSocket = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        
        // Replace with your computer's IP address
        const socketInstance = io('http://192.168.10.127:4000', {
          auth: { token },
          transports: ['websocket'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 10,
        });

        socketInstance.on('connect', () => {
          console.log('🔌 Socket connected:', socketInstance.id);
          setConnected(true);
        });

        socketInstance.on('disconnect', () => {
          console.log('❌ Socket disconnected');
          setConnected(false);
        });

        socketInstance.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
        });

        socketInstance.on('error', (error) => {
          console.error('Socket error:', error);
        });

        setSocket(socketInstance);

        return () => {
          socketInstance.disconnect();
        };
      } catch (error) {
        console.error('Failed to initialize socket:', error);
      }
    };

    initSocket();
  }, []);

  const joinReport = (reportId: string) => {
    if (socket && connected) {
      socket.emit('joinReport', reportId);
      console.log(`📍 Joining report room: ${reportId}`);
    }
  };

  const leaveReport = (reportId: string) => {
    if (socket && connected) {
      socket.emit('leaveReport', reportId);
      console.log(`👋 Leaving report room: ${reportId}`);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, connected, joinReport, leaveReport }}>
      {children}
    </SocketContext.Provider>
  );
};
