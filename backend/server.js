const path = require('path');
const express = require('express');
const dotenv = require('dotenv').config();
const { errorHandler } = require('./middleware/errorMiddleware');
const connectDB = require('./config/db');
const cors = require('cors');

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enable CORS
app.use(cors());

// Default route
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to the Smart Library API' });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/books', require('./routes/bookRoutes'));
app.use('/api/borrow-requests', require('./routes/borrowRequestRoutes'));
app.use('/api/inquiries', require('./routes/inquiryRoutes'));
app.use('/api/activities', require('./routes/activityRoutes'));
app.use('/api/waiting-list', require('./routes/waitingListRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/spaces', require('./routes/spaceRoutes'));
app.use('/api/resources', require('./routes/resourceRoutes'));
app.use('/api/reservations', require('./routes/reservationRoutes'));
app.use('/api/assistant', require('./routes/assistantRoutes'));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
