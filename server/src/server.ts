import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { config } from './config';
import User, { Role } from './models/user.model';
import { errorMiddleware } from './middlewares/error.middleware';

// Routes
import authRoutes from './routes/auth.routes';
import landlordRoutes from './routes/landlord.routes';
import verificationRoutes from './routes/verification.routes';
import notificationRoutes from './routes/notification.routes';
import userRoutes from './routes/user.routes';

const app = express();

// Middleware
app.use(cors({
  origin: "*",
  credentials: true,
}));
app.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true');
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});
app.use(express.json());
app.use('/uploads', express.static('public/uploads'));

// Routes
app.use('/auth', authRoutes);
app.use('/landlord', landlordRoutes);
app.use('/verification', verificationRoutes);
app.use('/notifications', notificationRoutes);
app.use('/users', userRoutes);

// Error handling
app.use(errorMiddleware);

// Database connection
mongoose
  .connect(config.mongoUri)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  })
  .catch((error) => {
    console.error('Database connection error:', error);
    process.exit(1);
  });
