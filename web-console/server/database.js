/**
 * Database module for meme storage
 * Uses sql.js (SQLite in JavaScript, no native compilation needed)
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'memes.db');

let db = null;
let isInitialized = false;

// Save database to file
function saveDatabase() {
    if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbPath, buffer);
    }
}

// Initialize database
async function initDatabase() {
    if (isInitialized) return db;

    const SQL = await initSqlJs();

    // Try to load existing database
    if (fs.existsSync(dbPath)) {
        const fileBuffer = fs.readFileSync(dbPath);
        db = new SQL.Database(fileBuffer);
    } else {
        db = new SQL.Database();
    }

    // Initialize schema
    db.run(`
        CREATE TABLE IF NOT EXISTS memes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            image_path TEXT NOT NULL,
            caption TEXT,
            user_id TEXT NOT NULL,
            like_count INTEGER DEFAULT 0,
            dislike_count INTEGER DEFAULT 0,
            leader_since DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS votes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            meme_id INTEGER NOT NULL,
            user_id TEXT NOT NULL,
            vote_type TEXT CHECK(vote_type IN ('like', 'dislike')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (meme_id) REFERENCES memes(id) ON DELETE CASCADE,
            UNIQUE(meme_id, user_id)
        );

        CREATE TABLE IF NOT EXISTS folders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            color TEXT DEFAULT '#FFE989',
            owner_id TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS server_folders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            folder_id INTEGER NOT NULL,
            server_id TEXT NOT NULL,
            server_name TEXT NOT NULL,
            server_icon TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
            UNIQUE(folder_id, server_id)
        );

        CREATE TABLE IF NOT EXISTS message_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            server_id TEXT,
            server_name TEXT,
            user_id TEXT NOT NULL,
            username TEXT NOT NULL,
            content TEXT NOT NULL,
            channel_name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS action_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action_type TEXT NOT NULL,
            actor_id TEXT NOT NULL,
            actor_name TEXT NOT NULL,
            target_type TEXT,
            target_id TEXT,
            target_name TEXT,
            details TEXT,
            server_id TEXT,
            server_name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS bots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL DEFAULT 'MyBot',
            command_prefix TEXT NOT NULL DEFAULT '!',
            server_logs INTEGER DEFAULT 1,
            big_actions INTEGER DEFAULT 1,
            auto_moderation INTEGER DEFAULT 1,
            activity_logging INTEGER DEFAULT 1,
            welcome_messages INTEGER DEFAULT 0,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            username TEXT NOT NULL,
            role TEXT DEFAULT 'admin',
            bot_id INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, bot_id)
        );

        CREATE TABLE IF NOT EXISTS server_folders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            color TEXT DEFAULT '#00d9ff',
            owner_id TEXT NOT NULL,
            position INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS server_folder_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            folder_id INTEGER NOT NULL,
            server_id TEXT NOT NULL,
            server_name TEXT NOT NULL,
            server_icon TEXT,
            position INTEGER DEFAULT 0,
            added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (folder_id) REFERENCES server_folders(id) ON DELETE CASCADE,
            UNIQUE(folder_id, server_id)
        );

        CREATE TABLE IF NOT EXISTS profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL UNIQUE,
            name TEXT DEFAULT 'User',
            bio TEXT DEFAULT '',
            avatar TEXT,
            discord_id TEXT,
            discord_name TEXT,
            discord_avatar TEXT,
            discord_connected_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Create indexes
    db.run(`CREATE INDEX IF NOT EXISTS idx_memes_like_count ON memes(like_count DESC)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_memes_created_at ON memes(created_at DESC)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_votes_meme_user ON votes(meme_id, user_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_folders_owner ON folders(owner_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_server_folders_folder ON server_folders(folder_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_message_logs_created ON message_logs(created_at DESC)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_action_logs_created ON action_logs(created_at DESC)`);

    saveDatabase();
    isInitialized = true;
    console.log('Database initialized successfully');

    return db;
}

// Helper to run query and return results as array of objects
function queryAll(sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
}

// Helper to run query and return first result
function queryOne(sql, params = []) {
    const results = queryAll(sql, params);
    return results.length > 0 ? results[0] : null;
}

// Helper to run insert/update/delete
function execute(sql, params = []) {
    db.run(sql, params);
    saveDatabase();
    return {
        lastInsertRowid: db.exec("SELECT last_insert_rowid()")[0]?.values[0][0] || 0,
        changes: db.getRowsModified()
    };
}

// Database functions
const memeDB = {
    getAllMemes(userId, sortBy = 'new') {
        const orderBy = sortBy === 'popular'
            ? 'like_count DESC, created_at DESC'
            : 'created_at DESC';
        return queryAll(`
            SELECT m.*, 
                   (SELECT vote_type FROM votes WHERE meme_id = m.id AND user_id = ?) as user_vote
            FROM memes m
            ORDER BY ${orderBy}
        `, [userId]);
    },

    getMemeById(memeId, userId) {
        return queryOne(`
            SELECT m.*, 
                   (SELECT vote_type FROM votes WHERE meme_id = m.id AND user_id = ?) as user_vote
            FROM memes m
            WHERE m.id = ?
        `, [userId, memeId]);
    },

    createMeme(imagePath, caption, userId) {
        const result = execute(
            `INSERT INTO memes (image_path, caption, user_id) VALUES (?, ?, ?)`,
            [imagePath, caption, userId]
        );
        return this.getMemeById(result.lastInsertRowid, userId);
    },

    getMemeOfDay(userId) {
        return queryOne(`
            SELECT m.*, 
                   (SELECT vote_type FROM votes WHERE meme_id = m.id AND user_id = ?) as user_vote
            FROM memes m
            WHERE like_count > 0
            ORDER BY like_count DESC, leader_since ASC NULLS LAST, created_at ASC
            LIMIT 1
        `, [userId]);
    },

    getTopMemes(userId, limit = 5) {
        return queryAll(`
            SELECT m.*, 
                   (SELECT vote_type FROM votes WHERE meme_id = m.id AND user_id = ?) as user_vote
            FROM memes m
            WHERE like_count > 0
            ORDER BY like_count DESC, created_at DESC
            LIMIT ?
        `, [userId, limit]);
    },

    vote(memeId, userId, voteType) {
        const existingVote = queryOne(
            `SELECT * FROM votes WHERE meme_id = ? AND user_id = ?`,
            [memeId, userId]
        );

        if (existingVote) {
            if (existingVote.vote_type === voteType) {
                // Remove vote (toggle off)
                execute(`DELETE FROM votes WHERE meme_id = ? AND user_id = ?`, [memeId, userId]);
                if (voteType === 'like') {
                    execute(`UPDATE memes SET like_count = like_count - 1 WHERE id = ?`, [memeId]);
                } else {
                    execute(`UPDATE memes SET dislike_count = dislike_count - 1 WHERE id = ?`, [memeId]);
                }
                return { action: 'removed', voteType: null };
            } else {
                // Change vote
                execute(`UPDATE votes SET vote_type = ? WHERE meme_id = ? AND user_id = ?`, [voteType, memeId, userId]);
                if (voteType === 'like') {
                    execute(`UPDATE memes SET like_count = like_count + 1 WHERE id = ?`, [memeId]);
                    execute(`UPDATE memes SET dislike_count = dislike_count - 1 WHERE id = ?`, [memeId]);
                } else {
                    execute(`UPDATE memes SET like_count = like_count - 1 WHERE id = ?`, [memeId]);
                    execute(`UPDATE memes SET dislike_count = dislike_count + 1 WHERE id = ?`, [memeId]);
                }
                return { action: 'changed', voteType };
            }
        } else {
            // New vote
            execute(`INSERT INTO votes (meme_id, user_id, vote_type) VALUES (?, ?, ?)`, [memeId, userId, voteType]);
            if (voteType === 'like') {
                execute(`UPDATE memes SET like_count = like_count + 1 WHERE id = ?`, [memeId]);
            } else {
                execute(`UPDATE memes SET dislike_count = dislike_count + 1 WHERE id = ?`, [memeId]);
            }
            return { action: 'added', voteType };
        }
    },

    updateMemeOfDayLeader() {
        const currentLeader = this.getMemeOfDay('');
        if (currentLeader && !currentLeader.leader_since) {
            execute(`UPDATE memes SET leader_since = CURRENT_TIMESTAMP WHERE id = ?`, [currentLeader.id]);
            execute(`UPDATE memes SET leader_since = NULL WHERE id != ?`, [currentLeader.id]);
        }
        return currentLeader;
    },

    deleteMeme(memeId, userId) {
        const meme = queryOne(`SELECT image_path FROM memes WHERE id = ?`, [memeId]);
        if (!meme) return { success: false, error: 'Meme not found' };

        const result = execute(`DELETE FROM memes WHERE id = ? AND user_id = ?`, [memeId, userId]);
        if (result.changes === 0) {
            return { success: false, error: 'Not authorized to delete this meme' };
        }
        return { success: true, imagePath: meme.image_path };
    }
};

// Folders database functions
const foldersDB = {
    getAllFolders() {
        return queryAll(`SELECT * FROM folders ORDER BY created_at DESC`);
    },

    getFoldersByOwner(ownerId) {
        return queryAll(`SELECT * FROM folders WHERE owner_id = ? ORDER BY created_at DESC`, [ownerId]);
    },

    getFolderById(folderId) {
        return queryOne(`SELECT * FROM folders WHERE id = ?`, [folderId]);
    },

    createFolder(name, ownerId, color = '#FFE989') {
        const result = execute(`INSERT INTO folders (name, color, owner_id) VALUES (?, ?, ?)`, [name, color, ownerId]);
        return this.getFolderById(result.lastInsertRowid);
    },

    updateFolder(folderId, name, color, ownerId) {
        const result = execute(
            `UPDATE folders SET name = ?, color = ? WHERE id = ? AND owner_id = ?`,
            [name, color, folderId, ownerId]
        );
        return result.changes > 0;
    },

    deleteFolder(folderId, ownerId) {
        const result = execute(`DELETE FROM folders WHERE id = ? AND owner_id = ?`, [folderId, ownerId]);
        return result.changes > 0;
    },

    getServersInFolder(folderId) {
        return queryAll(`SELECT * FROM server_folders WHERE folder_id = ? ORDER BY created_at DESC`, [folderId]);
    },

    addServerToFolder(folderId, serverId, serverName, serverIcon = null) {
        execute(
            `INSERT OR IGNORE INTO server_folders (folder_id, server_id, server_name, server_icon) VALUES (?, ?, ?, ?)`,
            [folderId, serverId, serverName, serverIcon]
        );
        return { success: true };
    },

    removeServerFromFolder(folderId, serverId) {
        const result = execute(`DELETE FROM server_folders WHERE folder_id = ? AND server_id = ?`, [folderId, serverId]);
        return result.changes > 0;
    }
};

// Message logs database functions
const logsDB = {
    // Get message logs with pagination
    getMessageLogs(limit = 50, cursor = null, serverId = null) {
        let sql = `SELECT * FROM message_logs`;
        const params = [];
        const conditions = [];

        if (cursor) {
            conditions.push('id < ?');
            params.push(cursor);
        }
        if (serverId) {
            conditions.push('server_id = ?');
            params.push(serverId);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY created_at DESC LIMIT ?';
        params.push(limit);

        const logs = queryAll(sql, params);
        const nextCursor = logs.length === limit && logs.length > 0 ? logs[logs.length - 1].id : null;

        return { logs, nextCursor, hasMore: nextCursor !== null };
    },

    addMessageLog(serverId, serverName, userId, username, content, channelName = null) {
        const result = execute(
            `INSERT INTO message_logs (server_id, server_name, user_id, username, content, channel_name) VALUES (?, ?, ?, ?, ?, ?)`,
            [serverId, serverName, userId, username, content, channelName]
        );
        return result.lastInsertRowid;
    },

    // Get action logs with pagination
    getActionLogs(limit = 50, cursor = null, serverId = null, actionType = null) {
        let sql = `SELECT * FROM action_logs`;
        const params = [];
        const conditions = [];

        if (cursor) {
            conditions.push('id < ?');
            params.push(cursor);
        }
        if (serverId) {
            conditions.push('server_id = ?');
            params.push(serverId);
        }
        if (actionType) {
            conditions.push('action_type = ?');
            params.push(actionType);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY created_at DESC LIMIT ?';
        params.push(limit);

        const logs = queryAll(sql, params);
        const nextCursor = logs.length === limit && logs.length > 0 ? logs[logs.length - 1].id : null;

        return { logs, nextCursor, hasMore: nextCursor !== null };
    },

    addActionLog(actionType, actorId, actorName, targetType = null, targetId = null, targetName = null, details = null, serverId = null, serverName = null) {
        const result = execute(
            `INSERT INTO action_logs (action_type, actor_id, actor_name, target_type, target_id, target_name, details, server_id, server_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [actionType, actorId, actorName, targetType, targetId, targetName, details, serverId, serverName]
        );
        return result.lastInsertRowid;
    },

    // Get logs count
    getMessageLogsCount(serverId = null) {
        const sql = serverId
            ? 'SELECT COUNT(*) as count FROM message_logs WHERE server_id = ?'
            : 'SELECT COUNT(*) as count FROM message_logs';
        const result = queryOne(sql, serverId ? [serverId] : []);
        return result ? result.count : 0;
    },

    getActionLogsCount(serverId = null, actionType = null) {
        let sql = 'SELECT COUNT(*) as count FROM action_logs';
        const params = [];
        const conditions = [];

        if (serverId) {
            conditions.push('server_id = ?');
            params.push(serverId);
        }
        if (actionType) {
            conditions.push('action_type = ?');
            params.push(actionType);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        const result = queryOne(sql, params);
        return result ? result.count : 0;
    }
};

// Bots database functions
const botsDB = {
    getBot(botId = 1) {
        return queryOne(`SELECT * FROM bots WHERE id = ?`, [botId]);
    },

    updateBot(botId, updates) {
        const allowedFields = ['name', 'command_prefix', 'server_logs', 'big_actions', 'auto_moderation', 'activity_logging', 'welcome_messages'];
        const setClauses = [];
        const params = [];

        for (const [key, value] of Object.entries(updates)) {
            // Convert camelCase to snake_case
            const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            if (allowedFields.includes(snakeKey)) {
                setClauses.push(`${snakeKey} = ?`);
                params.push(typeof value === 'boolean' ? (value ? 1 : 0) : value);
            }
        }

        if (setClauses.length === 0) {
            return null;
        }

        setClauses.push('updated_at = CURRENT_TIMESTAMP');
        params.push(botId);

        execute(`UPDATE bots SET ${setClauses.join(', ')} WHERE id = ?`, params);
        return this.getBot(botId);
    },

    ensureDefaultBot() {
        const existing = this.getBot(1);
        if (!existing) {
            execute(`INSERT INTO bots (id, name, command_prefix) VALUES (1, 'MyBot', '!')`);
        }
        return this.getBot(1);
    },

    getOrCreateBot(botId = 1) {
        let bot = this.getBot(botId);
        if (!bot && botId === 1) {
            bot = this.ensureDefaultBot();
        }
        return bot;
    }
};

// Admins database functions
const adminsDB = {
    getAdmins(botId = 1) {
        return queryAll(`SELECT * FROM admins WHERE bot_id = ? ORDER BY created_at DESC`, [botId]);
    },

    getAdminById(adminId) {
        return queryOne(`SELECT * FROM admins WHERE id = ?`, [adminId]);
    },

    addAdmin(userId, username, role = 'admin', botId = 1) {
        try {
            const result = execute(
                `INSERT INTO admins (user_id, username, role, bot_id) VALUES (?, ?, ?, ?)`,
                [userId, username, role, botId]
            );
            return { success: true, id: result.lastInsertRowid };
        } catch (error) {
            if (error.message && error.message.includes('UNIQUE constraint')) {
                return { success: false, error: 'Admin already exists' };
            }
            throw error;
        }
    },

    removeAdmin(adminId) {
        const admin = this.getAdminById(adminId);
        if (!admin) {
            return { success: false, error: 'Admin not found' };
        }
        const result = execute(`DELETE FROM admins WHERE id = ?`, [adminId]);
        return { success: result.changes > 0, admin };
    },

    isAdmin(userId, botId = 1) {
        const admin = queryOne(`SELECT * FROM admins WHERE user_id = ? AND bot_id = ?`, [userId, botId]);
        return !!admin;
    }
};

// Server Folders database functions
const serverFoldersDB = {
    getFolders(ownerId) {
        const folders = queryAll(`SELECT * FROM server_folders WHERE owner_id = ? ORDER BY position, id`, [ownerId]);
        // Get items for each folder
        return folders.map(folder => ({
            ...folder,
            servers: this.getServersInFolder(folder.id)
        }));
    },

    getFolder(folderId) {
        return queryOne(`SELECT * FROM server_folders WHERE id = ?`, [folderId]);
    },

    createFolder(name, ownerId, color = '#00d9ff') {
        const maxPos = queryOne(`SELECT MAX(position) as max FROM server_folders WHERE owner_id = ?`, [ownerId]);
        const position = (maxPos?.max || 0) + 1;
        const result = execute(
            `INSERT INTO server_folders (name, owner_id, color, position) VALUES (?, ?, ?, ?)`,
            [name, ownerId, color, position]
        );
        return { success: true, id: result.lastInsertRowid };
    },

    updateFolder(folderId, updates) {
        const setClauses = [];
        const params = [];

        if (updates.name !== undefined) { setClauses.push('name = ?'); params.push(updates.name); }
        if (updates.color !== undefined) { setClauses.push('color = ?'); params.push(updates.color); }
        if (updates.position !== undefined) { setClauses.push('position = ?'); params.push(updates.position); }

        if (setClauses.length === 0) return null;
        params.push(folderId);

        execute(`UPDATE server_folders SET ${setClauses.join(', ')} WHERE id = ?`, params);
        return this.getFolder(folderId);
    },

    deleteFolder(folderId) {
        const folder = this.getFolder(folderId);
        if (!folder) return { success: false, error: 'Folder not found' };

        execute(`DELETE FROM server_folder_items WHERE folder_id = ?`, [folderId]);
        execute(`DELETE FROM server_folders WHERE id = ?`, [folderId]);
        return { success: true, folder };
    },

    getServersInFolder(folderId) {
        return queryAll(`SELECT * FROM server_folder_items WHERE folder_id = ? ORDER BY position, id`, [folderId]);
    },

    addServerToFolder(folderId, serverId, serverName, serverIcon = null) {
        try {
            const maxPos = queryOne(`SELECT MAX(position) as max FROM server_folder_items WHERE folder_id = ?`, [folderId]);
            const position = (maxPos?.max || 0) + 1;
            const result = execute(
                `INSERT INTO server_folder_items (folder_id, server_id, server_name, server_icon, position) VALUES (?, ?, ?, ?, ?)`,
                [folderId, serverId, serverName, serverIcon, position]
            );
            return { success: true, id: result.lastInsertRowid };
        } catch (error) {
            if (error.message && error.message.includes('UNIQUE constraint')) {
                return { success: false, error: 'Server already in folder' };
            }
            throw error;
        }
    },

    removeServerFromFolder(folderId, serverId) {
        const result = execute(`DELETE FROM server_folder_items WHERE folder_id = ? AND server_id = ?`, [folderId, serverId]);
        return { success: result.changes > 0 };
    },

    moveServer(itemId, newFolderId, newPosition) {
        execute(`UPDATE server_folder_items SET folder_id = ?, position = ? WHERE id = ?`, [newFolderId, newPosition, itemId]);
        return { success: true };
    }
};

// Profiles database functions
const profilesDB = {
    getProfile(userId) {
        return queryOne(`SELECT * FROM profiles WHERE user_id = ?`, [userId]);
    },

    getOrCreateProfile(userId) {
        let profile = this.getProfile(userId);
        if (!profile) {
            execute(`INSERT INTO profiles (user_id) VALUES (?)`, [userId]);
            profile = this.getProfile(userId);
        }
        return profile;
    },

    updateProfile(userId, updates) {
        const profile = this.getOrCreateProfile(userId);
        const setClauses = [];
        const params = [];

        if (updates.name !== undefined) { setClauses.push('name = ?'); params.push(updates.name); }
        if (updates.bio !== undefined) { setClauses.push('bio = ?'); params.push(updates.bio); }
        if (updates.avatar !== undefined) { setClauses.push('avatar = ?'); params.push(updates.avatar); }

        if (setClauses.length === 0) return profile;

        setClauses.push('updated_at = CURRENT_TIMESTAMP');
        params.push(userId);

        execute(`UPDATE profiles SET ${setClauses.join(', ')} WHERE user_id = ?`, params);
        return this.getProfile(userId);
    },

    connectDiscord(userId, discordId, discordName, discordAvatar) {
        this.getOrCreateProfile(userId);
        execute(
            `UPDATE profiles SET discord_id = ?, discord_name = ?, discord_avatar = ?, discord_connected_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
            [discordId, discordName, discordAvatar, userId]
        );
        return this.getProfile(userId);
    },

    disconnectDiscord(userId) {
        execute(
            `UPDATE profiles SET discord_id = NULL, discord_name = NULL, discord_avatar = NULL, discord_connected_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
            [userId]
        );
        return this.getProfile(userId);
    }
};

module.exports = { initDatabase, memeDB, foldersDB, logsDB, botsDB, adminsDB, serverFoldersDB, profilesDB };

