/**
 * Meme Server - Express.js + WebSocket
 * Handles meme uploads, voting, and real-time updates
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');
const memeDB = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));
app.use('/uploads', express.static(uploadsDir));

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, 'meme-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPG, PNG, GIF, and WebP are allowed.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max
    }
});

// Create HTTP server and WebSocket server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Track connected clients
const clients = new Set();

wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Client connected. Total clients:', clients.size);

    ws.on('close', () => {
        clients.delete(ws);
        console.log('Client disconnected. Total clients:', clients.size);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        clients.delete(ws);
    });
});

// Broadcast to all connected clients
function broadcast(event, data) {
    const message = JSON.stringify({ event, data });
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Track current meme of day to detect changes
let currentMemeOfDayId = null;

function checkAndBroadcastLeaderChange(userId) {
    const newLeader = memeDB.getMemeOfDay(userId);
    const newLeaderId = newLeader ? newLeader.id : null;

    if (newLeaderId !== currentMemeOfDayId) {
        currentMemeOfDayId = newLeaderId;
        memeDB.updateMemeOfDayLeader();
        broadcast('leader_change', { memeOfDay: newLeader });
    }
}

// API Routes

// Get all memes
app.get('/api/memes', (req, res) => {
    try {
        const userId = req.query.userId || '';
        const sortBy = req.query.sort || 'new'; // 'new' or 'popular'
        const memes = memeDB.getAllMemes(userId, sortBy);
        res.json({ success: true, memes });
    } catch (error) {
        console.error('Error fetching memes:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch memes' });
    }
});

// Upload new meme
app.post('/api/memes', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No image uploaded' });
        }

        const userId = req.body.userId;
        if (!userId) {
            return res.status(400).json({ success: false, error: 'User ID required' });
        }

        const caption = req.body.caption || '';
        const imagePath = '/uploads/' + req.file.filename;

        const meme = memeDB.createMeme(imagePath, caption, userId);

        // Broadcast new meme to all clients
        broadcast('new_meme', { meme });

        res.json({ success: true, meme });
    } catch (error) {
        console.error('Error uploading meme:', error);
        res.status(500).json({ success: false, error: 'Failed to upload meme' });
    }
});

// Vote on a meme
app.post('/api/memes/:id/vote', (req, res) => {
    try {
        const memeId = parseInt(req.params.id);
        const { userId, voteType } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'User ID required' });
        }

        if (!['like', 'dislike'].includes(voteType)) {
            return res.status(400).json({ success: false, error: 'Invalid vote type' });
        }

        const result = memeDB.vote(memeId, userId, voteType);
        const updatedMeme = memeDB.getMemeById(memeId, userId);

        // Broadcast vote update to all clients
        broadcast('vote_update', {
            memeId,
            likeCount: updatedMeme.like_count,
            dislikeCount: updatedMeme.dislike_count
        });

        // Check if meme of day changed
        checkAndBroadcastLeaderChange(userId);

        res.json({ success: true, result, meme: updatedMeme });
    } catch (error) {
        console.error('Error voting:', error);
        res.status(500).json({ success: false, error: 'Failed to vote' });
    }
});

// Get meme of the day
app.get('/api/meme-of-day', (req, res) => {
    try {
        const userId = req.query.userId || '';
        const memeOfDay = memeDB.getMemeOfDay(userId);
        const topMemes = memeDB.getTopMemes(userId, 5);

        res.json({ success: true, memeOfDay, topMemes });
    } catch (error) {
        console.error('Error fetching meme of day:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch meme of day' });
    }
});

// Delete a meme (only by owner)
app.delete('/api/memes/:id', (req, res) => {
    try {
        const memeId = parseInt(req.params.id);
        const userId = req.body.userId || req.query.userId;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'User ID required' });
        }

        const result = memeDB.deleteMeme(memeId, userId);

        if (!result.success) {
            return res.status(403).json(result);
        }

        // Try to delete the image file
        if (result.imagePath) {
            const filePath = path.join(__dirname, '..', result.imagePath);
            fs.unlink(filePath, (err) => {
                if (err) console.error('Failed to delete image file:', err);
            });
        }

        // Broadcast meme deletion to all clients
        broadcast('meme_deleted', { memeId });

        // Check if meme of day changed
        checkAndBroadcastLeaderChange(userId);

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting meme:', error);
        res.status(500).json({ success: false, error: 'Failed to delete meme' });
    }
});

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ success: false, error: 'File too large. Maximum size is 10MB.' });
        }
    }
    console.error('Server error:', error);
    res.status(500).json({ success: false, error: error.message || 'Server error' });
});

// Start server
server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║       MEME SERVER STARTED              ║
╠════════════════════════════════════════╣
║  HTTP: http://localhost:${PORT}          ║
║  WebSocket: ws://localhost:${PORT}       ║
╚════════════════════════════════════════╝
    `);

    // Initialize current meme of day
    const initialLeader = memeDB.getMemeOfDay('');
    currentMemeOfDayId = initialLeader ? initialLeader.id : null;
});

module.exports = { app, server, wss };
