import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

let socket = null;

export function getSocket() {
    if (!socket) {
        socket = io(SOCKET_URL, {
            autoConnect: false,
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });
    }
    return socket;
}

export function connectSocket(userId) {
    const s = getSocket();

    // Remove previous connect listeners to avoid duplicates on re-calls
    s.off('connect');

    // Emit user_online on every (re)connect so the server always knows we're online
    s.on('connect', () => {
        console.log('[Socket] Connected, registering user_online:', userId);
        s.emit('user_online', userId);
    });

    if (!s.connected) {
        s.connect();
    } else {
        // Already connected — emit immediately
        s.emit('user_online', userId);
    }

    return s;
}

export function disconnectSocket() {
    if (socket) {
        socket.off('connect');
        socket.disconnect();
        socket = null;
    }
}
