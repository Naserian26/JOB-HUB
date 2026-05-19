let io;

module.exports = {
  init: (httpServer) => {
    io = require('socket.io')(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL,
        methods: ["GET", "POST"]
      }
    });

    io.on('connection', (socket) => {
      console.log(`User connected: ${socket.id}`);
      
      // Join a room based on userId (passed in handshake auth or query)
      const userId = socket.handshake.query.userId;
      if (userId) {
        socket.join(userId);
        console.log(`User ${userId} joined their room.`);
      }
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};