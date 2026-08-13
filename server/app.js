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
const errorHandler = require('./middleware/errorMiddleware');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
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
