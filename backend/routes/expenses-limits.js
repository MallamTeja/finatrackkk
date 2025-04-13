const express = require('express');
const router = express.Router();
const ExpensesLimit = require('../models/ExpensesLimit');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

// Get all expenses limits for a user
router.get('/', auth, async (req, res) => {
    try {
        const expensesLimits = await ExpensesLimit.find({ user: req.user._id });
        
        // Calculate current spending for each expenses limit category
        const currentDate = new Date();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        
        const monthlyTransactions = await Transaction.find({
            user: req.user._id,
            date: { $gte: firstDayOfMonth },
            type: 'expense'
        });
        
        const expensesLimitsWithSpending = expensesLimits.map(expensesLimit => {
            const spending = monthlyTransactions
                .filter(t => t.category === expensesLimit.category)
                .reduce((sum, t) => sum + t.amount, 0);
            
            return {
                ...expensesLimit.toObject(),
                current_spending: spending
            };
        });

        res.json(expensesLimitsWithSpending);
    } catch (error) {
        console.error('Error getting expenses limits:', error);
        res.status(500).json({ error: 'Failed to get expenses limits' });
    }
});

// Add new expenses limit
router.post('/', auth, async (req, res) => {
    try {
        const { category, limit } = req.body;
        
        if (!category || !limit) {
            return res.status(400).json({ error: 'Category and limit are required' });
        }
        
        if (isNaN(limit) || limit <= 0) {
            return res.status(400).json({ error: 'Invalid expenses limit' });
        }

        // Check if budget for this category already exists
        const existingExpensesLimit = await ExpensesLimit.findOne({
            user: req.user._id,
            category
        });

        if (existingExpensesLimit) {
            return res.status(400).json({ error: 'Expenses limit for this category already exists' });
        }

        const expensesLimit = new ExpensesLimit({
            user: req.user._id,
            category,
            limit
        });

        await expensesLimit.save();
        res.status(201).json(expensesLimit);
    } catch (error) {
        console.error('Error creating expenses limit:', error);
        res.status(500).json({ error: 'Failed to create expenses limit' });
    }
});

// Update expenses limit
router.patch('/:id', auth, async (req, res) => {
    try {
        const { limit } = req.body;
        
        if (!limit || isNaN(limit) || limit <= 0) {
            return res.status(400).json({ error: 'Invalid expenses limit' });
        }

        const expensesLimit = await ExpensesLimit.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { limit },
            { new: true }
        );

        if (!expensesLimit) {
            return res.status(404).json({ error: 'Expenses limit not found' });
        }

        res.json(expensesLimit);
    } catch (error) {
        console.error('Error updating expenses limit:', error);
        res.status(500).json({ error: 'Failed to update expenses limit' });
    }
});

// Delete expenses limit
router.delete('/:id', auth, async (req, res) => {
    try {
        const expensesLimit = await ExpensesLimit.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });

        if (!expensesLimit) {
            return res.status(404).json({ error: 'Expenses limit not found' });
        }

        res.json({ message: 'Expenses limit deleted successfully' });
    } catch (error) {
        console.error('Error deleting expenses limit:', error);
        res.status(500).json({ error: 'Failed to delete expenses limit' });
    }
});

module.exports = router; 