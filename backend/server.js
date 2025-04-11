require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

console.log('Starting server with MongoDB URI:', process.env.MONGODB_URI);

// Import models and database connection
const { connectDB } = require('./db');
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const SavingsGoal = require('./models/SavingsGoal');
const Budget = require('./models/Budget');

// Import routes
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transaction');
const budgetRoutes = require('./routes/budget');
const savingsRoutes = require('./routes/savings');

console.log('Starting server...');

// Load environment variables
console.log('Environment variables loaded');

const app = express();
console.log('Express app created');

// Middleware
app.use(cors({
  origin: '*',  // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Serve static files from frontend/public directory
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB directly'))
.catch(err => {
  console.error('MongoDB connection error (direct):', err);
  process.exit(1);
});

// Add error handler for MongoDB connection
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    process.exit(1);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/savings-goals', savingsRoutes);

// Root API route
app.get('/api', (req, res) => {
    res.json({
        message: 'Welcome to FinTrack API',
        endpoints: {
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login'
            },
            transactions: {
                list: 'GET /api/transactions',
                create: 'POST /api/transactions'
            },
            savingsGoals: {
                list: 'GET /api/savings-goals',
                create: 'POST /api/savings-goals',
                update: 'PUT /api/savings-goals/:id'
            }
        }
    });
});

// Auth middleware
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Register route
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({
            name,
            email,
            password: hashedPassword,
            balance: 0
        });

        await user.save();

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// Login route
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Failed to log in' });
    }
});

// Transaction Routes
app.get('/api/transactions', authMiddleware, async (req, res) => {
    try {
        const transactions = await Transaction.find({ user: req.user._id }).sort({ date: -1 });
        res.json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ message: 'Error fetching transactions' });
    }
});

app.post('/api/transactions', authMiddleware, async (req, res) => {
    try {
        const { type, category, amount, description, date } = req.body;
        
        if (!type || !category || !amount) {
            return res.status(400).json({ error: 'Type, category and amount are required' });
        }
        
        if (type !== 'income' && type !== 'expense') {
            return res.status(400).json({ error: 'Invalid transaction type' });
        }
        
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        const transaction = new Transaction({
            user: req.user._id,
            type,
            category,
            amount,
            description: description || '',
            date: date ? new Date(date) : new Date()
        });

        await transaction.save();
        
        if (type === 'income') {
            req.user.balance += amount;
        } else {
            req.user.balance -= amount;
        }
        await req.user.save();

        res.status(201).json(transaction);
    } catch (error) {
        console.error('Error adding transaction:', error);
        res.status(500).json({ error: 'Failed to add transaction' });
    }
});

// Get dashboard data
app.get('/api/dashboard', authMiddleware, async (req, res) => {
    try {
        const recentTransactions = await Transaction.find({ user: req.user._id })
            .sort({ date: -1 })
            .limit(5);
        
        const currentDate = new Date();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        
        const monthlyTransactions = await Transaction.find({
            user: req.user._id,
            date: { $gte: firstDayOfMonth }
        });
        
        const income = monthlyTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const expenses = monthlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        res.json({
            balance: req.user.balance || 0,
            income: income || 0,
            expenses: expenses || 0,
            recentTransactions: recentTransactions || []
        });
    } catch (error) {
        console.error('Error getting dashboard data:', error);
        res.status(500).json({ error: 'Failed to get dashboard data' });
    }
});

// Savings Goals Routes
app.get('/api/savings-goals', authMiddleware, async (req, res) => {
    try {
        const goals = await SavingsGoal.find({ user: req.user._id });
        res.json(goals);
    } catch (error) {
        console.error('Error getting savings goals:', error);
        res.status(500).json({ error: 'Failed to get savings goals' });
    }
});

app.post('/api/savings-goals', authMiddleware, async (req, res) => {
    try {
        const { title, target_amount, category, due_date, current_amount } = req.body;
        
        if (!title || !target_amount || !category || !due_date) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        if (isNaN(target_amount) || target_amount <= 0) {
            return res.status(400).json({ error: 'Invalid target amount' });
        }

        const goal = new SavingsGoal({
            user: req.user._id,
            title,
            target_amount,
            category,
            due_date: new Date(due_date),
            current_amount: current_amount || 0
        });

        await goal.save();
        res.status(201).json(goal);
    } catch (error) {
        console.error('Error creating savings goal:', error);
        res.status(500).json({ error: 'Failed to create savings goal' });
    }
});

app.put('/api/savings-goals/:id', authMiddleware, async (req, res) => {
    try {
        const { current_amount } = req.body;
        const goal = await SavingsGoal.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { current_amount },
            { new: true }
        );

        if (!goal) {
            return res.status(404).json({
                success: false,
                error: 'Not found',
                message: 'Savings goal not found'
            });
        }

        res.json({
            success: true,
            goal
        });
    } catch (error) {
        console.error('Error updating savings goal:', error);
        res.status(500).json({
            success: false,
            error: 'Server error',
            message: 'Error updating savings goal'
        });
    }
});

// Budget Routes
app.post('/api/budgets', authMiddleware, async (req, res) => {
    try {
        const { category, limit } = req.body;
        
        if (!category || !limit) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        if (isNaN(limit) || limit <= 0) {
            return res.status(400).json({ error: 'Invalid budget limit' });
        }

        const budget = new Budget({
            user: req.user._id,
            category,
            limit
        });

        await budget.save();
        res.status(201).json(budget);
    } catch (error) {
        console.error('Error creating budget:', error);
        res.status(500).json({ error: 'Failed to create budget' });
    }
});

// Get budgets
app.get('/api/budgets', authMiddleware, async (req, res) => {
    try {
        const budgets = await Budget.find({ user: req.user._id });
        
        const currentDate = new Date();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        
        const monthlyTransactions = await Transaction.find({
            user: req.user._id,
            date: { $gte: firstDayOfMonth },
            type: 'expense'
        });
        
        const budgetsWithSpending = budgets.map(budget => {
            const spending = monthlyTransactions
                .filter(t => t.category === budget.category)
                .reduce((sum, t) => sum + t.amount, 0);
            
            return {
                ...budget.toObject(),
                current_spending: spending
            };
        });

        res.json(budgetsWithSpending);
    } catch (error) {
        console.error('Error getting budgets:', error);
        res.status(500).json({ error: 'Failed to get budgets' });
    }
});

// User profile route
app.get('/api/auth/profile', authMiddleware, async (req, res) => {
    try {
        res.json({
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            balance: req.user.balance
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

const PORT = process.env.PORT || 5000;

// Serve frontend for any other route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

// Listen on all network interfaces
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Frontend URL: http://localhost:${PORT}`);
    console.log(`API URL: http://localhost:${PORT}/api`);
});

module.exports = app; 