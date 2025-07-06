import { useEffect, useRef } from 'react';
import io from 'socket.io-client';

const useSocket = (url = 'http://localhost:3005') => {
  const socket = useRef(null);

  useEffect(() => {
    // Create socket connection
    socket.current = io(url, {
      transports: ['websocket'],
      autoConnect: true,
    });

    // Connection event handlers
    socket.current.on('connect', () => {
      console.log('✅ Connected to server:', socket.current.id);
    });

    socket.current.on('disconnect', () => {
      console.log('❌ Disconnected from server');
    });

    socket.current.on('connect_error', (error) => {
      console.error('🔥 Socket connection error:', error);
    });

    // Cleanup on component unmount
    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, [url]);

  return socket.current;
};

export default useSocket;