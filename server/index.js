const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { init: initSocket } = require('./utils/socket');
const connectDB = require('./config/db');

// Routes
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');
const profileRoutes = require('./routes/profiles');
const companyProfileRoutes = require('./routes/companyProfile');
const notificationsRouter = require('./routes/notifications');
const messagesRouter = require('./routes/messages');
const interviewsRouter = require('./routes/interviews');
// Load environment variables
dotenv.config();

// ==========================================
// ADDED: Critical Environment Validation
// ==========================================
// If you don't have a .env with JWT_SECRET, the server won't start.
// This prevents "undefined" security keys.
if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in .env file');
  process.exit(1);
}

// ==========================================
// ADDED: Production-ready CORS
// ==========================================
const corsOptions = {
  // Uses CLIENT_URL from .env, fallbacks to localhost for development
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT","PATCH", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
};

const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB(); 
    console.log('Database Connected Successfully');

    const app = express();
    const httpServer = createServer(app);

    // 2. Initialize Socket.io (if available)
    initSocket(httpServer, corsOptions);

    // 3. Middleware
    app.use(cors(corsOptions));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
    // 4. API Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/jobs', jobRoutes);
    app.use('/api/applications', applicationRoutes);
    app.use('/api/profiles', profileRoutes);
app.use('/api/company-profile', companyProfileRoutes);
app.use('/api/notifications', notificationsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/interviews', interviewsRouter);
    // 5. Health Check
    app.get('/', (req, res) => {
      res.send('JobHub API Running');
    });

    // ==========================================
    // ADDED: Global Error Handling Middleware
    // ==========================================
    // This catches any errors that happen in your routes
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ message: 'Internal Server Error', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
    });

    // 6. Start Server
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();