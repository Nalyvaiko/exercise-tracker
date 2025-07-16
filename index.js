require('dotenv').config();

const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('node:path');
const rateLimit = require('express-rate-limit');

const db = require('./db');
const userModel = require('./models/user.model');
const exerciseModel = require('./models/exercise.model');
const { getValidDate } = require('./utils');

const app = express();
app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(morgan(process.env.NODE_ENV !== 'production' ? 'dev' : 'combined'));
app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 100,
        message: 'Too many requests, please try again later',
    })
);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// --- API ---

app.post('/api/users', async (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    try {
        const user = await userModel.create({ username });
        res.json({ _id: user._id, username: user.username });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to create user' });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const user = await userModel.find().select(['_id', 'username']);
        return res.json(user);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.post('/api/users/:_id/exercises', async (req, res) => {
    const { _id } = req.params;
    const { description, duration, date } = req.body;

    if (!description || !duration) {
        return res
            .status(400)
            .json({ error: 'Description and Duration are required' });
    }

    if (isNaN(duration)) {
        return res.status(400).json({ error: 'Duration should be a number' });
    }

    try {
        const user = await userModel.findById(_id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const exercise = await exerciseModel.create({
            userId: _id,
            description,
            duration,
            date: getValidDate(date),
        });

        res.json({
            username: user.username,
            description: exercise.description,
            duration: exercise.duration,
            date: exercise.date.toDateString(),
            _id: user._id,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to create exercise' });
    }
});

app.get('/api/users/:_id/logs', async (req, res) => {
    const { _id } = req.params;
    const { from, to, limit } = req.query;

    const queryParams = { userId: _id };

    if (from || to) {
        queryParams.date = {};
        if (from) queryParams.date.$gte = new Date(from);
        if (to) queryParams.date.$lt = new Date(to);
    }

    try {
        const user = await userModel.findById(_id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        let queryToExecute = exerciseModel.find(queryParams);

        const parsedLimit = parseInt(limit);

        if (!isNaN(parsedLimit)) {
            queryToExecute = queryToExecute.limit(parsedLimit);
        }

        const exercises = await queryToExecute.sort({ date: 'asc' });

        res.json({
            username: user.username,
            count: exercises.length,
            _id: user._id,
            log: exercises.map(({ description, duration, date }) => ({
                description,
                duration,
                date: date.toDateString(),
            })),
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to get logs' });
    }
});

// -----------

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const shutdown = () => {
    console.log('Gracefully shutting down ...');

    server.close(() => {
        console.log('Closed out remaining connections');
        process.exit(0);
    });

    setTimeout(() => {
        console.error('Forced shutdown');
        process.exit(1);
    }, 10000);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
