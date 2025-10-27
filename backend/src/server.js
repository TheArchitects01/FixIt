import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import http from 'http';
import { connectDB } from './config/db.js';
import { initializeSocket } from './config/socket.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import reportRoutes from './routes/reports.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json({ limit: '2mb' }));
// Also accept text/plain (some clients send JSON with text/plain)
app.use(express.text({ type: '*/*', limit: '2mb' }));
app.use((req, _res, next) => {
  if (typeof req.body === 'string' && req.body.length > 0) {
    try {
      req.body = JSON.parse(req.body);
    } catch (_e) {
      // leave body as-is if not valid JSON
    }
  }
  next();
});
app.use(morgan('dev'));

// Health check
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'campus-report-backend' });
});

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/reports', reportRoutes);

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDB();
  
  // Initialize Socket.IO
  const io = initializeSocket(server);
  console.log('🔌 Socket.IO initialized');
  
  // Make io accessible in routes
  app.set('io', io);
  
  server.listen(PORT, () => {
    console.log(`🚀 API running on http://localhost:${PORT}`);
    console.log('💬 Socket.IO ready for real-time messaging');
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
