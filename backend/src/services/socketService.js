// Socket.IO service for real-time communication
const jwt = require('jsonwebtoken');

function setupSocketHandlers(io) {
  // Optional auth middleware for sockets
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
      } catch (e) {
        // Allow unauthenticated connections for price data
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log(`📡 Client connected: ${socket.id}`);

    // Subscribe to specific stock
    socket.on('subscribe:stock', (symbol) => {
      socket.join(`stock:${symbol}`);
      console.log(`${socket.id} subscribed to ${symbol}`);
    });

    // Unsubscribe
    socket.on('unsubscribe:stock', (symbol) => {
      socket.leave(`stock:${symbol}`);
    });

    // Subscribe to user portfolio updates
    socket.on('subscribe:portfolio', (userId) => {
      if (socket.userId === userId || userId) {
        socket.join(`portfolio:${userId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`📡 Client disconnected: ${socket.id}`);
    });
  });

  console.log('🔌 Socket handlers ready');
}

module.exports = { setupSocketHandlers };
