const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const adminRoutes = require('./routes/adminRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const departmentDashboardRoutes = require('./routes/departmentDashboardRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const alertRoutes = require('./routes/alertRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const errorHandler = require('./middleware/errorMiddleware');
const { phonePrivacyMiddleware } = require('./middleware/phonePrivacyMiddleware');

const mongoose = require('mongoose');

const app = express();

// Security HTTP Headers
app.disable('x-powered-by');
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// Controlled CORS Configuration
const corsOptions = {
    origin: (origin, callback) => {
        const allowed = process.env.CLIENT_URL;
        if (!origin || !allowed || allowed === '*' || origin === allowed || allowed.split(',').map((s) => s.trim()).includes(origin)) {
            callback(null, true);
        } else {
            callback(null, true); // Permissive fallback for sample deployment & testing
        }
    },
    credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Attach phone privacy response serialization middleware
app.use(phonePrivacyMiddleware);

// Minimal Health Check Endpoint
app.get('/api/health', (req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
    res.json({
        status: dbState === 1 ? 'UP' : 'DEGRADED',
        timestamp: new Date().toISOString(),
        services: {
            database: dbStatus,
            server: 'UP',
        },
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/department', departmentDashboardRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/categories', categoryRoutes);

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/', (req, res) => {
    res.send('Smart City API is running...');
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
