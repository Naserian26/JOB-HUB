import { io } from 'socket.io-client';

let socket = null;

export const initSocket = (userId, token) => {
  if (socket) return socket;

  socket = io('http://localhost:5000', {
    query: { userId },
    auth: { token },
    transports: ['websocket'],
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;