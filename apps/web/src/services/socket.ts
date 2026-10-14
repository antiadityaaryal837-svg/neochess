import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    const socketUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:3001'
      : window.location.origin;
    socketInstance = io(socketUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('📡 Connected to NeoChess real-time server');
      const token = localStorage.getItem('chess_auth_token');
      const storedUser = localStorage.getItem('chess_user_data');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          socketInstance?.emit('auth:identify', {
            userId: user.id,
            username: user.username,
          });
        } catch {}
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('🔌 Disconnected from real-time server');
    });
  }

  return socketInstance;
}
