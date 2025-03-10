const express = require('express');
const router = express.Router();
const User = require('../database/models/user');
// GET all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find({}, 'username name');
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users', error });
    }
});

module.exports = router;