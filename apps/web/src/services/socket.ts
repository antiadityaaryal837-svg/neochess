import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    // Dynamic connection to backend:
    // 1. If VITE_SOCKET_URL is set, use it.
    // 2. In Vite dev server (port 5173), connect directly to host:3001 (works on localhost & LAN).
    // 3. In production or behind public tunnel/reverse proxy, connect to window.location.origin.
    const host = window.location.hostname || 'localhost';
    const envUrl = (import.meta as any).env?.VITE_SOCKET_URL;
    const socketUrl = envUrl || (window.location.port === '5173' ? `http://${host}:3001` : window.location.origin);

    socketInstance = io(socketUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 25,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('📡 Connected to NeoChess real-time server at', socketUrl);
      
      // Auto-identify socket with either logged-in user or persistent guest identity
      let user: { id: string; username: string } | null = null;
      const storedUser = localStorage.getItem('chess_user_data');
      if (storedUser) {
        try {
          user = JSON.parse(storedUser);
        } catch {}
      }

      if (!user) {
        let guestId = localStorage.getItem('chess_guest_id');
        let guestName = localStorage.getItem('chess_guest_name');
        if (!guestId) {
          guestId = `guest_${Math.random().toString(36).substring(2, 8)}`;
          guestName = `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
          localStorage.setItem('chess_guest_id', guestId);
          localStorage.setItem('chess_guest_name', guestName);
        }
        user = { id: guestId, username: guestName || 'Guest' };
      }

      socketInstance?.emit('auth:identify', {
        userId: user.id,
        username: user.username,
      });
    });

    socketInstance.on('disconnect', () => {
      console.log('🔌 Disconnected from real-time server');
    });
  }

  return socketInstance;
}

export function identifySocketUser(userId: string, username: string) {
  const socket = getSocket();
  const payload = { userId, username };
  if (socket.connected) {
    socket.emit('auth:identify', payload);
  } else {
    socket.once('connect', () => {
      socket.emit('auth:identify', payload);
    });
  }
}
