const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Task = require('../database/models/task');
const User = require('../database/models/user');

// Helper function to validate task status
const isValidStatus = (status) => ['in progress', 'completed', 'cancelled'].includes(status);


router.get('/stats', async (req, res) => {
    try {
        const totalTasks = await Task.countDocuments();
        const inProgress = await Task.countDocuments({ status: 'in progress' });
        const completed = await Task.countDocuments({ status: 'completed' });

        res.json({ totalTasks, inProgress, completed });
    } catch (error) {
        res.status(500).json({ message: "Error fetching task stats", error });
    }
});



router.get('/', async (req, res) => {
    try {
        const tasks = await Task.find();
        res.status(200).json(tasks);
    } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
// Create Task
router.post('/', async (req, res) => {
    try {
        if (!req.body.title) {
            return res.status(400).json({ message: "Task title is required" });
        }

        const newTask = new Task(req.body);
        await newTask.save();

        if (global.io) {
            global.io.emit('taskCreated', newTask);
            global.io.emit('notification', { message: `New task created: ${newTask.title}` }); // 🔹 Notification event
        } else {
            console.error("WebSocket `io` is not initialized");
        }

        res.status(201).json(newTask);
    } catch (error) {
        console.error("Error creating task:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.put('/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid Task ID" });
        }

        // 1. Fetch the OLD task to compare assignedUser
        const currentTask = await Task.findById(req.params.id);
        if (!currentTask) {
            return res.status(404).json({ message: "Task not found" });
        }

        // 2. Update the task
        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            req.body,  // update all fields from the request body
            { new: true, runValidators: true }
        );

        if (!updatedTask) {
            return res.status(404).json({ message: "Task not found after update" });
        }

        // 3. Emit 'taskUpdated' so the UI re-renders
        if (global.io) {
            global.io.emit('taskUpdated', updatedTask);

            // 4. If assignedUser changed, emit a custom user-change notification
            if (req.body.assignedUser && req.body.assignedUser != currentTask.assignedUser) {
                let oldUserName = 'Unassigned';
                let newUserName = 'Unassigned';

                // If there was an old user, fetch their username
                if (currentTask.assignedUser) {
                    const oldUserDoc = await User.findById(currentTask.assignedUser);
                    if (oldUserDoc) oldUserName = oldUserDoc.username;
                }

                // Fetch the new user's username
                const newUserDoc = await User.findById(req.body.assignedUser);
                if (newUserDoc) newUserName = newUserDoc.username;

                global.io.emit('notification', {
                    message: `Assigned user changed for "${updatedTask.title}": ${oldUserName} -> ${newUserName}`
                });
            } else {
                // Otherwise, emit the standard update notification
                global.io.emit('notification', {
                    message: `Task updated: ${updatedTask.title}`
                });
            }
        }

        res.status(200).json(updatedTask);
    } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
// UPDATE task status only
// e.g., triggered by a dropdown change
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid Task ID" });
        }

        if (!isValidStatus(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!updatedTask) {
            return res.status(404).json({ message: "Task not found" });
        }

        if (global.io) {
            global.io.emit('taskUpdated', updatedTask);
            global.io.emit('notification', {
                message: `Task status updated: ${updatedTask.title} -> ${status}`,
            });
        }

        res.status(200).json(updatedTask);
    } catch (error) {
        console.error("Error updating task status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Delete Task
router.delete('/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid Task ID" });
        }

        const deletedTask = await Task.findByIdAndDelete(req.params.id);
        if (!deletedTask) return res.status(404).json({ message: "Task not found" });

        if (global.io) {
            global.io.emit('taskDeleted', req.params.id);
            global.io.emit('notification', { message: `Task deleted: ${deletedTask.title}` }); // 🔹 Notification event
        }

        res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;