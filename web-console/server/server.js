/**
 * Meme Server - Express.js + WebSocket
 * Handles meme uploads, voting, and real-time updates
 * With Discord OAuth2 authentication
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const WebSocket = require('ws');
const session = require('express-session');
const { initDatabase, memeDB, foldersDB, logsDB, botsDB, adminsDB, serverFoldersDB, profilesDB, chatRoomsDB } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Discord OAuth2 Config
const DISCORD_CONFIG = {
    clientId: process.env.DISCORD_CLIENT_ID || '',
    clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
    redirectUri: process.env.DISCORD_REDIRECT_URI || `http://localhost:${PORT}/auth/discord/callback`,
    scopes: ['identify', 'email']
};

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
}));

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

// ===========================
// DISCORD OAUTH2 AUTH
// ===========================

// Helper function to make HTTPS requests
function httpsRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        });
        req.on('error', reject);
        if (postData) req.write(postData);
        req.end();
    });
}

// Auth middleware - check if user is authenticated
function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.status(401).json({ success: false, error: 'Not authenticated', requireLogin: true });
}

// Check auth status
app.get('/auth/me', (req, res) => {
    if (req.session && req.session.user) {
        res.json({
            success: true,
            authenticated: true,
            user: req.session.user
        });
    } else {
        res.json({
            success: true,
            authenticated: false
        });
    }
});

// Initiate Discord OAuth2 flow
app.get('/auth/discord', (req, res) => {
    if (!DISCORD_CONFIG.clientId) {
        return res.status(500).json({
            success: false,
            error: 'Discord OAuth2 not configured. Set DISCORD_CLIENT_ID in .env'
        });
    }

    const params = new URLSearchParams({
        client_id: DISCORD_CONFIG.clientId,
        redirect_uri: DISCORD_CONFIG.redirectUri,
        response_type: 'code',
        scope: DISCORD_CONFIG.scopes.join(' ')
    });

    res.redirect(`https://discord.com/api/oauth2/authorize?${params}`);
});

// Discord OAuth2 callback
app.get('/auth/discord/callback', async (req, res) => {
    const { code, error } = req.query;

    if (error) {
        return res.redirect('/?auth_error=' + encodeURIComponent(error));
    }

    if (!code) {
        return res.redirect('/?auth_error=no_code');
    }

    try {
        // Exchange code for token
        const tokenData = new URLSearchParams({
            client_id: DISCORD_CONFIG.clientId,
            client_secret: DISCORD_CONFIG.clientSecret,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: DISCORD_CONFIG.redirectUri
        });

        const tokenRes = await httpsRequest({
            hostname: 'discord.com',
            path: '/api/oauth2/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(tokenData.toString())
            }
        }, tokenData.toString());

        if (tokenRes.error) {
            console.error('Token error:', tokenRes);
            return res.redirect('/?auth_error=token_failed');
        }

        // Get user info
        const userRes = await httpsRequest({
            hostname: 'discord.com',
            path: '/api/users/@me',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${tokenRes.access_token}`
            }
        });

        if (!userRes.id) {
            console.error('User fetch error:', userRes);
            return res.redirect('/?auth_error=user_fetch_failed');
        }

        // Store user in session
        req.session.user = {
            id: userRes.id,
            username: userRes.username,
            discriminator: userRes.discriminator,
            avatar: userRes.avatar,
            email: userRes.email,
            accessToken: tokenRes.access_token
        };

        // Log the action
        logsDB.addActionLog(
            'user_login',
            userRes.id,
            userRes.username,
            'oauth',
            'discord',
            'Discord OAuth2',
            `Email: ${userRes.email || 'not provided'}`,
            null,
            null
        );

        // Redirect to dashboard
        res.redirect('/?auth_success=1');

    } catch (error) {
        console.error('OAuth callback error:', error);
        res.redirect('/?auth_error=callback_failed');
    }
});

// Logout
app.post('/auth/logout', (req, res) => {
    const user = req.session.user;

    if (user) {
        logsDB.addActionLog(
            'user_logout',
            user.id,
            user.username,
            null,
            null,
            null,
            null,
            null,
            null
        );
    }

    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, error: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true });
    });
});

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

// ===========================
// FOLDERS API
// ===========================

// Get all folders
app.get('/api/folders', (req, res) => {
    try {
        const folders = foldersDB.getAllFolders();
        res.json(folders);
    } catch (error) {
        console.error('Error getting folders:', error);
        res.status(500).json({ error: 'Failed to get folders' });
    }
});

// Create folder
app.post('/api/folders', (req, res) => {
    try {
        const { name, color, ownerId } = req.body;
        if (!name || !ownerId) {
            return res.status(400).json({ error: 'Name and ownerId are required' });
        }
        const folder = foldersDB.createFolder(name, ownerId, color);
        broadcast('folder_created', folder);
        res.json(folder);
    } catch (error) {
        console.error('Error creating folder:', error);
        res.status(500).json({ error: 'Failed to create folder' });
    }
});

// Update folder
app.put('/api/folders/:id', (req, res) => {
    try {
        const folderId = parseInt(req.params.id);
        const { name, color, ownerId } = req.body;
        const success = foldersDB.updateFolder(folderId, name, color, ownerId);
        if (success) {
            const folder = foldersDB.getFolderById(folderId);
            broadcast('folder_updated', folder);
            res.json(folder);
        } else {
            res.status(404).json({ error: 'Folder not found or not authorized' });
        }
    } catch (error) {
        console.error('Error updating folder:', error);
        res.status(500).json({ error: 'Failed to update folder' });
    }
});

// Delete folder
app.delete('/api/folders/:id', (req, res) => {
    try {
        const folderId = parseInt(req.params.id);
        const { ownerId } = req.body;
        const success = foldersDB.deleteFolder(folderId, ownerId);
        if (success) {
            broadcast('folder_deleted', { folderId });
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Folder not found or not authorized' });
        }
    } catch (error) {
        console.error('Error deleting folder:', error);
        res.status(500).json({ error: 'Failed to delete folder' });
    }
});

// Get servers in folder
app.get('/api/folders/:id/servers', (req, res) => {
    try {
        const folderId = parseInt(req.params.id);
        const servers = foldersDB.getServersInFolder(folderId);
        res.json(servers);
    } catch (error) {
        console.error('Error getting servers:', error);
        res.status(500).json({ error: 'Failed to get servers' });
    }
});

// Add server to folder
app.post('/api/folders/:id/servers', (req, res) => {
    try {
        const folderId = parseInt(req.params.id);
        const { serverId, serverName, serverIcon } = req.body;
        if (!serverId || !serverName) {
            return res.status(400).json({ error: 'serverId and serverName are required' });
        }
        foldersDB.addServerToFolder(folderId, serverId, serverName, serverIcon);
        const servers = foldersDB.getServersInFolder(folderId);
        broadcast('server_added', { folderId, servers });
        res.json({ success: true, servers });
    } catch (error) {
        console.error('Error adding server:', error);
        res.status(500).json({ error: 'Failed to add server' });
    }
});

// Remove server from folder
app.delete('/api/folders/:folderId/servers/:serverId', (req, res) => {
    try {
        const folderId = parseInt(req.params.folderId);
        const serverId = req.params.serverId;
        const success = foldersDB.removeServerFromFolder(folderId, serverId);
        if (success) {
            broadcast('server_removed', { folderId, serverId });
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Server not found in folder' });
        }
    } catch (error) {
        console.error('Error removing server:', error);
        res.status(500).json({ error: 'Failed to remove server' });
    }
});

// ===========================
// MESSAGE LOGS API
// ===========================

// Get message logs with pagination
app.get('/api/logs/messages', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const cursor = req.query.cursor ? parseInt(req.query.cursor) : null;
        const serverId = req.query.serverId || null;

        const result = logsDB.getMessageLogs(limit, cursor, serverId);
        const total = logsDB.getMessageLogsCount(serverId);

        res.json({ success: true, ...result, total });
    } catch (error) {
        console.error('Error getting message logs:', error);
        res.status(500).json({ success: false, error: 'Failed to get message logs' });
    }
});

// Add message log (for testing or bot integration)
app.post('/api/logs/messages', (req, res) => {
    try {
        const { serverId, serverName, userId, username, content, channelName } = req.body;
        if (!userId || !username || !content) {
            return res.status(400).json({ error: 'userId, username, and content are required' });
        }
        const logId = logsDB.addMessageLog(serverId, serverName, userId, username, content, channelName);
        broadcast('message_logged', { id: logId, ...req.body, created_at: new Date().toISOString() });
        res.json({ success: true, id: logId });
    } catch (error) {
        console.error('Error adding message log:', error);
        res.status(500).json({ error: 'Failed to add message log' });
    }
});

// Get action logs with pagination
app.get('/api/logs/actions', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const cursor = req.query.cursor ? parseInt(req.query.cursor) : null;
        const serverId = req.query.serverId || null;
        const actionType = req.query.actionType || null;

        const result = logsDB.getActionLogs(limit, cursor, serverId, actionType);
        const total = logsDB.getActionLogsCount(serverId, actionType);

        res.json({ success: true, ...result, total });
    } catch (error) {
        console.error('Error getting action logs:', error);
        res.status(500).json({ success: false, error: 'Failed to get action logs' });
    }
});

// Add action log
app.post('/api/logs/actions', (req, res) => {
    try {
        const { actionType, actorId, actorName, targetType, targetId, targetName, details, serverId, serverName } = req.body;
        if (!actionType || !actorId || !actorName) {
            return res.status(400).json({ error: 'actionType, actorId, and actorName are required' });
        }
        const logId = logsDB.addActionLog(actionType, actorId, actorName, targetType, targetId, targetName, details, serverId, serverName);
        broadcast('action_logged', { id: logId, ...req.body, created_at: new Date().toISOString() });
        res.json({ success: true, id: logId });
    } catch (error) {
        console.error('Error adding action log:', error);
        res.status(500).json({ error: 'Failed to add action log' });
    }
});

// ===========================
// BOTS API
// ===========================

// Get bot settings
app.get('/api/bots/:id', (req, res) => {
    try {
        const botId = parseInt(req.params.id) || 1;
        const bot = botsDB.getOrCreateBot(botId);

        if (!bot) {
            return res.status(404).json({ success: false, error: 'Bot not found' });
        }

        // Convert snake_case to camelCase for frontend
        res.json({
            success: true,
            bot: {
                id: bot.id,
                name: bot.name,
                commandPrefix: bot.command_prefix,
                serverLogs: !!bot.server_logs,
                bigActions: !!bot.big_actions,
                autoModeration: !!bot.auto_moderation,
                activityLogging: !!bot.activity_logging,
                welcomeMessages: !!bot.welcome_messages,
                updatedAt: bot.updated_at,
                createdAt: bot.created_at
            }
        });
    } catch (error) {
        console.error('Error getting bot:', error);
        res.status(500).json({ success: false, error: 'Failed to get bot settings' });
    }
});

// Update bot settings (PATCH)
app.patch('/api/bots/:id', (req, res) => {
    try {
        const botId = parseInt(req.params.id) || 1;
        const updates = req.body;
        const actorName = req.body.actorName || 'System';

        // Remove actorName from updates
        delete updates.actorName;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, error: 'No fields to update' });
        }

        const updatedBot = botsDB.updateBot(botId, updates);

        if (!updatedBot) {
            return res.status(404).json({ success: false, error: 'Bot not found or no valid fields' });
        }

        // Log the action
        const changedFields = Object.keys(updates).join(', ');
        logsDB.addActionLog(
            'bot_updated',
            'admin',
            actorName,
            'bot',
            String(botId),
            updatedBot.name,
            `Changed: ${changedFields}`,
            null,
            null
        );

        // Broadcast update
        broadcast('bot_updated', { botId, updates });

        res.json({
            success: true,
            bot: {
                id: updatedBot.id,
                name: updatedBot.name,
                commandPrefix: updatedBot.command_prefix,
                serverLogs: !!updatedBot.server_logs,
                bigActions: !!updatedBot.big_actions,
                autoModeration: !!updatedBot.auto_moderation,
                activityLogging: !!updatedBot.activity_logging,
                welcomeMessages: !!updatedBot.welcome_messages,
                updatedAt: updatedBot.updated_at
            }
        });
    } catch (error) {
        console.error('Error updating bot:', error);
        res.status(500).json({ success: false, error: 'Failed to update bot settings' });
    }
});

// ===========================
// ADMINS API
// ===========================

// Get admins list
app.get('/api/admins', (req, res) => {
    try {
        const botId = parseInt(req.query.botId) || 1;
        const admins = adminsDB.getAdmins(botId);
        res.json({ success: true, admins });
    } catch (error) {
        console.error('Error getting admins:', error);
        res.status(500).json({ success: false, error: 'Failed to get admins' });
    }
});

// Add admin
app.post('/api/admins', (req, res) => {
    try {
        const { userId, username, role, botId, actorName } = req.body;

        if (!userId || !username) {
            return res.status(400).json({ success: false, error: 'userId and username are required' });
        }

        const result = adminsDB.addAdmin(userId, username, role || 'admin', botId || 1);

        if (!result.success) {
            return res.status(400).json(result);
        }

        // Log the action
        logsDB.addActionLog(
            'admin_added',
            'admin',
            actorName || 'System',
            'user',
            userId,
            username,
            `Role: ${role || 'admin'}`,
            null,
            null
        );

        // Broadcast update
        broadcast('admin_added', { id: result.id, userId, username, role: role || 'admin' });

        res.json({ success: true, id: result.id });
    } catch (error) {
        console.error('Error adding admin:', error);
        res.status(500).json({ success: false, error: 'Failed to add admin' });
    }
});

// Remove admin
app.delete('/api/admins/:id', (req, res) => {
    try {
        const adminId = parseInt(req.params.id);
        const actorName = req.body.actorName || 'System';

        const result = adminsDB.removeAdmin(adminId);

        if (!result.success) {
            return res.status(404).json(result);
        }

        // Log the action
        logsDB.addActionLog(
            'admin_removed',
            'admin',
            actorName,
            'user',
            result.admin.user_id,
            result.admin.username,
            `Was: ${result.admin.role}`,
            null,
            null
        );

        // Broadcast update
        broadcast('admin_removed', { id: adminId, username: result.admin.username });

        res.json({ success: true });
    } catch (error) {
        console.error('Error removing admin:', error);
        res.status(500).json({ success: false, error: 'Failed to remove admin' });
    }
});

// ===========================
// SERVER FOLDERS API
// ===========================

// Get all folders with servers
app.get('/api/server-folders', (req, res) => {
    try {
        const ownerId = req.session?.user?.id || 'default';
        const folders = serverFoldersDB.getFolders(ownerId);
        res.json({ success: true, folders });
    } catch (error) {
        console.error('Error getting folders:', error);
        res.status(500).json({ success: false, error: 'Failed to get folders' });
    }
});

// Create folder
app.post('/api/server-folders', (req, res) => {
    try {
        const { name, color } = req.body;
        const ownerId = req.session?.user?.id || 'default';

        if (!name) {
            return res.status(400).json({ success: false, error: 'Name is required' });
        }

        const result = serverFoldersDB.createFolder(name, ownerId, color);
        broadcast('folder_created', { id: result.id, name, color });
        res.json(result);
    } catch (error) {
        console.error('Error creating folder:', error);
        res.status(500).json({ success: false, error: 'Failed to create folder' });
    }
});

// Update folder
app.patch('/api/server-folders/:id', (req, res) => {
    try {
        const folderId = parseInt(req.params.id);
        const updated = serverFoldersDB.updateFolder(folderId, req.body);
        if (!updated) {
            return res.status(404).json({ success: false, error: 'Folder not found' });
        }
        res.json({ success: true, folder: updated });
    } catch (error) {
        console.error('Error updating folder:', error);
        res.status(500).json({ success: false, error: 'Failed to update folder' });
    }
});

// Delete folder
app.delete('/api/server-folders/:id', (req, res) => {
    try {
        const folderId = parseInt(req.params.id);
        const result = serverFoldersDB.deleteFolder(folderId);
        if (!result.success) {
            return res.status(404).json(result);
        }
        broadcast('folder_deleted', { id: folderId });
        res.json(result);
    } catch (error) {
        console.error('Error deleting folder:', error);
        res.status(500).json({ success: false, error: 'Failed to delete folder' });
    }
});

// Add server to folder
app.post('/api/server-folders/:id/servers', (req, res) => {
    try {
        const folderId = parseInt(req.params.id);
        const { serverId, serverName, serverIcon } = req.body;

        if (!serverId || !serverName) {
            return res.status(400).json({ success: false, error: 'serverId and serverName are required' });
        }

        const result = serverFoldersDB.addServerToFolder(folderId, serverId, serverName, serverIcon);
        if (!result.success) {
            return res.status(400).json(result);
        }
        broadcast('server_added_to_folder', { folderId, serverId, serverName });
        res.json(result);
    } catch (error) {
        console.error('Error adding server to folder:', error);
        res.status(500).json({ success: false, error: 'Failed to add server' });
    }
});

// Remove server from folder
app.delete('/api/server-folders/:folderId/servers/:serverId', (req, res) => {
    try {
        const folderId = parseInt(req.params.folderId);
        const serverId = req.params.serverId;

        const result = serverFoldersDB.removeServerFromFolder(folderId, serverId);
        broadcast('server_removed_from_folder', { folderId, serverId });
        res.json(result);
    } catch (error) {
        console.error('Error removing server from folder:', error);
        res.status(500).json({ success: false, error: 'Failed to remove server' });
    }
});

// ===========================
// PROFILE API
// ===========================

// Get profile
app.get('/api/profile', (req, res) => {
    try {
        const userId = req.session?.user?.id || 'default';
        const profile = profilesDB.getOrCreateProfile(userId);
        res.json({ success: true, profile });
    } catch (error) {
        console.error('Error getting profile:', error);
        res.status(500).json({ success: false, error: 'Failed to get profile' });
    }
});

// Update profile
app.patch('/api/profile', (req, res) => {
    try {
        const userId = req.session?.user?.id || 'default';
        const { name, bio, avatar } = req.body;

        const profile = profilesDB.updateProfile(userId, { name, bio, avatar });
        res.json({ success: true, profile });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, error: 'Failed to update profile' });
    }
});

// Connect Discord (simulated - stores from session if available)
app.post('/api/profile/discord', (req, res) => {
    try {
        const userId = req.session?.user?.id || 'default';
        const sessionUser = req.session?.user;

        if (sessionUser && sessionUser.id) {
            // Use session Discord data
            const profile = profilesDB.connectDiscord(
                userId,
                sessionUser.id,
                sessionUser.username,
                sessionUser.avatar ? `https://cdn.discordapp.com/avatars/${sessionUser.id}/${sessionUser.avatar}.png` : null
            );
            res.json({ success: true, profile });
        } else {
            // No Discord session - need to auth first
            res.status(400).json({ success: false, error: 'Discord not authenticated. Use /auth/discord first.' });
        }
    } catch (error) {
        console.error('Error connecting Discord:', error);
        res.status(500).json({ success: false, error: 'Failed to connect Discord' });
    }
});

// Disconnect Discord
app.delete('/api/profile/discord', (req, res) => {
    try {
        const userId = req.session?.user?.id || 'default';
        const profile = profilesDB.disconnectDiscord(userId);
        res.json({ success: true, profile });
    } catch (error) {
        console.error('Error disconnecting Discord:', error);
        res.status(500).json({ success: false, error: 'Failed to disconnect Discord' });
    }
});

// ===========================
// CHAT ROOMS API
// ===========================

// Get all rooms
app.get('/api/chat-rooms', (req, res) => {
    try {
        const rooms = chatRoomsDB.getRooms();
        res.json({ success: true, rooms });
    } catch (error) {
        console.error('Error getting chat rooms:', error);
        res.status(500).json({ success: false, error: 'Failed to get rooms' });
    }
});

// Get messages for a room
app.get('/api/chat-rooms/:roomId/messages', (req, res) => {
    try {
        const roomId = parseInt(req.params.roomId);
        const limit = parseInt(req.query.limit) || 50;
        const cursor = req.query.cursor ? parseInt(req.query.cursor) : null;

        const result = chatRoomsDB.getMessages(roomId, limit, cursor);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error('Error getting messages:', error);
        res.status(500).json({ success: false, error: 'Failed to get messages' });
    }
});

// Send message to a room
app.post('/api/chat-rooms/:roomId/messages', (req, res) => {
    try {
        const roomId = parseInt(req.params.roomId);
        const { content } = req.body;
        const userId = req.session?.user?.id || 'anonymous';
        const username = req.session?.user?.username || 'Аноним';

        if (!content || !content.trim()) {
            return res.status(400).json({ success: false, error: 'Message content required' });
        }

        const message = chatRoomsDB.addMessage(roomId, userId, username, content.trim());

        // Broadcast to websocket clients
        broadcast('new_chat_message', { roomId, message });

        res.json({ success: true, message });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ success: false, error: 'Failed to send message' });
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
async function startServer() {
    try {
        // Initialize database first
        await initDatabase();
        console.log('Database initialized');

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
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

module.exports = { app, server, wss };

