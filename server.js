const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { MongoClient } = require('mongodb');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Global MongoDB client instance
let mongoClient;
let db;

// Connect to MongoDB
async function connectToDatabase() {
  if (db) return db;

  try {
    // Use connection pooling with appropriate settings
    mongoClient = new MongoClient(process.env.MONGODB_URI, {
      maxPoolSize: 50,  // Increase connection pool size
      minPoolSize: 10,  // Minimum connections maintained in the pool
      maxIdleTimeMS: 30000, // How long a connection can remain idle before being removed
      connectTimeoutMS: 5000 // Timeout for initial connection
    });
    
    await mongoClient.connect();
    db = mongoClient.db();
    console.log('Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

app.prepare().then(async () => {
  try {
    // Connect to database
    await connectToDatabase();

    const server = createServer((req, res) => {
      // Don't let socket.io requests slow down regular API routes
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    });

    // Initialize Socket.IO server
    const io = new Server(server, {
      path: '/api/socket',
      cors: {
        origin: process.env.NEXT_PUBLIC_API_URL || '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      connectTimeout: 10000,
      pingTimeout: 5000
    });

    // Store active sockets to prevent memory leaks
    const activeSockets = new Map();

    // Handle socket connections
    io.on('connection', async (socket) => {
      console.log('User connected:', socket.id);
      
      // Extract user ID from query params
      const userId = socket.handshake.query.userId;
      if (!userId) {
        console.error('No user ID provided, disconnecting socket');
        socket.disconnect();
        return;
      }
      
      console.log(`User ${userId} connected`);
      
      // Store socket in the active sockets map
      activeSockets.set(socket.id, { userId, socket });
      
      // Join server room
      socket.on('join_server', (serverId) => {
        socket.join(`server:${serverId}`);
        console.log(`User ${userId} joined server ${serverId}`);
      });
      
      // Join channel room
      socket.on('join_channel', (channelId) => {
        socket.join(`channel:${channelId}`);
        console.log(`User ${userId} joined channel ${channelId}`);
      });
      
      // Leave channel room
      socket.on('leave_channel', (channelId) => {
        socket.leave(`channel:${channelId}`);
        console.log(`User ${userId} left channel ${channelId}`);
      });
      
      // Handle new message
      socket.on('new_message', async (message, callback) => {
        try {
          const { channelId, serverId, content, authorId } = message;
          
          // Validate required fields
          if (!channelId || !serverId || !content || !authorId) {
            socket.emit('error', { message: 'Missing required fields' });
            if (callback) callback({ error: 'Missing required fields' });
            return;
          }
          
          // Create new message in database
          const newMessage = {
            id: require('crypto').randomUUID(),
            content,
            authorId,
            channelId,
            serverId,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...(message.replyToId && { replyToId: message.replyToId }),
            ...(message.mentions && { mentions: message.mentions }),
            ...(message.attachments && { attachments: message.attachments })
          };
          
          // Use Promise.all to run these database operations in parallel
          const [messageResult, author] = await Promise.all([
            db.collection('messages').insertOne(newMessage),
            db.collection('users').findOne({ id: authorId })
          ]);
          
          const messageWithAuthor = {
            ...newMessage,
            author: {
              id: author?.id,
              name: author?.name,
              discriminator: author?.discriminator,
              avatarUrl: author?.avatarUrl
            }
          };
          
          // Emit to all clients in the channel
          io.to(`channel:${channelId}`).emit('message', messageWithAuthor);
          
          if (callback) callback({ success: true, message: messageWithAuthor });
        } catch (error) {
          console.error('Error handling new message:', error);
          socket.emit('error', { message: 'Failed to process message' });
          if (callback) callback({ error: 'Failed to process message' });
        }
      });
      
      // Handle disconnect event
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${userId}`);
        // Clean up the socket from our map
        activeSockets.delete(socket.id);
      });
    });

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://localhost:${PORT}`);
    });
    
    // Handle graceful shutdown
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
    async function gracefulShutdown() {
      console.log('Shutting down server...');
      
      // Close all socket connections
      for (const [id, { socket }] of activeSockets.entries()) {
        socket.disconnect(true);
      }
      
      // Close the Socket.IO server
      io.close();
      
      // Close the MongoDB connection
      if (mongoClient) {
        await mongoClient.close();
      }
      
      process.exit(0);
    }
    
  } catch (error) {
    console.error('An error occurred starting the server:', error);
    process.exit(1);
  }
}); 