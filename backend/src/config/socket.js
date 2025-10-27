import { Server } from 'socket.io';

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // In production, specify your frontend URL
      methods: ["GET", "POST", "PATCH"]
    }
  });

  io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id);

    // Join a specific report room
    socket.on('joinReport', (reportId) => {
      socket.join(`report-${reportId}`);
      console.log(`📍 User ${socket.id} joined report room: ${reportId}`);
    });

    // Leave a report room
    socket.on('leaveReport', (reportId) => {
      socket.leave(`report-${reportId}`);
      console.log(`👋 User ${socket.id} left report room: ${reportId}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('❌ User disconnected:', socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
