/**
 * Database module for meme storage
 * Uses SQLite for persistent local storage
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'memes.db');
const db = new Database(dbPath);

// Initialize database schema
db.exec(`
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

    CREATE INDEX IF NOT EXISTS idx_memes_like_count ON memes(like_count DESC);
    CREATE INDEX IF NOT EXISTS idx_memes_created_at ON memes(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_votes_meme_user ON votes(meme_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_folders_owner ON folders(owner_id);
    CREATE INDEX IF NOT EXISTS idx_server_folders_folder ON server_folders(folder_id);
    CREATE INDEX IF NOT EXISTS idx_message_logs_created ON message_logs(created_at DESC);
`);

// Prepared statements for better performance
const statements = {
    // Memes
    getAllMemes: db.prepare(`
        SELECT m.*, 
               (SELECT vote_type FROM votes WHERE meme_id = m.id AND user_id = ?) as user_vote
        FROM memes m
        ORDER BY created_at DESC
    `),

    getMemesByPopularity: db.prepare(`
        SELECT m.*, 
               (SELECT vote_type FROM votes WHERE meme_id = m.id AND user_id = ?) as user_vote
        FROM memes m
        ORDER BY like_count DESC, created_at DESC
    `),

    getMemeById: db.prepare(`
        SELECT m.*, 
               (SELECT vote_type FROM votes WHERE meme_id = m.id AND user_id = ?) as user_vote
        FROM memes m
        WHERE m.id = ?
    `),

    insertMeme: db.prepare(`
        INSERT INTO memes (image_path, caption, user_id)
        VALUES (?, ?, ?)
    `),

    getMemeOfDay: db.prepare(`
        SELECT m.*, 
               (SELECT vote_type FROM votes WHERE meme_id = m.id AND user_id = ?) as user_vote
        FROM memes m
        WHERE like_count > 0
        ORDER BY like_count DESC, leader_since ASC NULLS LAST, created_at ASC
        LIMIT 1
    `),

    getTopMemes: db.prepare(`
        SELECT m.*, 
               (SELECT vote_type FROM votes WHERE meme_id = m.id AND user_id = ?) as user_vote
        FROM memes m
        WHERE like_count > 0
        ORDER BY like_count DESC, created_at DESC
        LIMIT ?
    `),

    updateLeaderSince: db.prepare(`
        UPDATE memes SET leader_since = CURRENT_TIMESTAMP WHERE id = ?
    `),

    clearLeaderSince: db.prepare(`
        UPDATE memes SET leader_since = NULL WHERE id != ?
    `),

    // Votes
    getVote: db.prepare(`
        SELECT * FROM votes WHERE meme_id = ? AND user_id = ?
    `),

    insertVote: db.prepare(`
        INSERT INTO votes (meme_id, user_id, vote_type)
        VALUES (?, ?, ?)
    `),

    updateVote: db.prepare(`
        UPDATE votes SET vote_type = ? WHERE meme_id = ? AND user_id = ?
    `),

    deleteVote: db.prepare(`
        DELETE FROM votes WHERE meme_id = ? AND user_id = ?
    `),

    incrementLikes: db.prepare(`
        UPDATE memes SET like_count = like_count + 1 WHERE id = ?
    `),

    decrementLikes: db.prepare(`
        UPDATE memes SET like_count = like_count - 1 WHERE id = ?
    `),

    incrementDislikes: db.prepare(`
        UPDATE memes SET dislike_count = dislike_count + 1 WHERE id = ?
    `),

    decrementDislikes: db.prepare(`
        UPDATE memes SET dislike_count = dislike_count - 1 WHERE id = ?
    `),

    deleteMeme: db.prepare(`
        DELETE FROM memes WHERE id = ? AND user_id = ?
    `),

    getMemeImagePath: db.prepare(`
        SELECT image_path FROM memes WHERE id = ?
    `),

    // Folders
    getAllFolders: db.prepare(`
        SELECT * FROM folders ORDER BY created_at DESC
    `),

    getFoldersByOwner: db.prepare(`
        SELECT * FROM folders WHERE owner_id = ? ORDER BY created_at DESC
    `),

    getFolderById: db.prepare(`
        SELECT * FROM folders WHERE id = ?
    `),

    insertFolder: db.prepare(`
        INSERT INTO folders (name, color, owner_id) VALUES (?, ?, ?)
    `),

    updateFolder: db.prepare(`
        UPDATE folders SET name = ?, color = ? WHERE id = ? AND owner_id = ?
    `),

    deleteFolder: db.prepare(`
        DELETE FROM folders WHERE id = ? AND owner_id = ?
    `),

    // Server Folders
    getServersByFolder: db.prepare(`
        SELECT * FROM server_folders WHERE folder_id = ? ORDER BY created_at DESC
    `),

    addServerToFolder: db.prepare(`
        INSERT OR IGNORE INTO server_folders (folder_id, server_id, server_name, server_icon) VALUES (?, ?, ?, ?)
    `),

    removeServerFromFolder: db.prepare(`
        DELETE FROM server_folders WHERE folder_id = ? AND server_id = ?
    `),

    // Message Logs
    getMessageLogs: db.prepare(`
        SELECT * FROM message_logs ORDER BY created_at DESC LIMIT ?
    `),

    insertMessageLog: db.prepare(`
        INSERT INTO message_logs (server_id, server_name, user_id, username, content, channel_name) VALUES (?, ?, ?, ?, ?, ?)
    `)
};

// Database functions
const memeDB = {
    getAllMemes(userId, sortBy = 'new') {
        if (sortBy === 'popular') {
            return statements.getMemesByPopularity.all(userId);
        }
        return statements.getAllMemes.all(userId);
    },

    getMemeById(memeId, userId) {
        return statements.getMemeById.get(userId, memeId);
    },

    createMeme(imagePath, caption, userId) {
        const result = statements.insertMeme.run(imagePath, caption, userId);
        return this.getMemeById(result.lastInsertRowid, userId);
    },

    getMemeOfDay(userId) {
        return statements.getMemeOfDay.get(userId);
    },

    getTopMemes(userId, limit = 5) {
        return statements.getTopMemes.all(userId, limit);
    },

    vote(memeId, userId, voteType) {
        const existingVote = statements.getVote.get(memeId, userId);

        const transaction = db.transaction(() => {
            if (existingVote) {
                if (existingVote.vote_type === voteType) {
                    // Remove vote (toggle off)
                    statements.deleteVote.run(memeId, userId);
                    if (voteType === 'like') {
                        statements.decrementLikes.run(memeId);
                    } else {
                        statements.decrementDislikes.run(memeId);
                    }
                    return { action: 'removed', voteType: null };
                } else {
                    // Change vote
                    statements.updateVote.run(voteType, memeId, userId);
                    if (voteType === 'like') {
                        statements.incrementLikes.run(memeId);
                        statements.decrementDislikes.run(memeId);
                    } else {
                        statements.decrementLikes.run(memeId);
                        statements.incrementDislikes.run(memeId);
                    }
                    return { action: 'changed', voteType };
                }
            } else {
                // New vote
                statements.insertVote.run(memeId, userId, voteType);
                if (voteType === 'like') {
                    statements.incrementLikes.run(memeId);
                } else {
                    statements.incrementDislikes.run(memeId);
                }
                return { action: 'added', voteType };
            }
        });

        return transaction();
    },

    updateMemeOfDayLeader() {
        const currentLeader = statements.getMemeOfDay.get('');
        if (currentLeader && !currentLeader.leader_since) {
            statements.updateLeaderSince.run(currentLeader.id);
            statements.clearLeaderSince.run(currentLeader.id);
        }
        return currentLeader;
    },

    deleteMeme(memeId, userId) {
        const meme = statements.getMemeImagePath.get(memeId);
        if (!meme) return { success: false, error: 'Meme not found' };

        const result = statements.deleteMeme.run(memeId, userId);
        if (result.changes === 0) {
            return { success: false, error: 'Not authorized to delete this meme' };
        }
        return { success: true, imagePath: meme.image_path };
    }
};

// Folders database functions
const foldersDB = {
    getAllFolders() {
        return statements.getAllFolders.all();
    },

    getFoldersByOwner(ownerId) {
        return statements.getFoldersByOwner.all(ownerId);
    },

    getFolderById(folderId) {
        return statements.getFolderById.get(folderId);
    },

    createFolder(name, ownerId, color = '#FFE989') {
        const result = statements.insertFolder.run(name, color, ownerId);
        return this.getFolderById(result.lastInsertRowid);
    },

    updateFolder(folderId, name, color, ownerId) {
        const result = statements.updateFolder.run(name, color, folderId, ownerId);
        return result.changes > 0;
    },

    deleteFolder(folderId, ownerId) {
        const result = statements.deleteFolder.run(folderId, ownerId);
        return result.changes > 0;
    },

    getServersInFolder(folderId) {
        return statements.getServersByFolder.all(folderId);
    },

    addServerToFolder(folderId, serverId, serverName, serverIcon = null) {
        statements.addServerToFolder.run(folderId, serverId, serverName, serverIcon);
        return { success: true };
    },

    removeServerFromFolder(folderId, serverId) {
        const result = statements.removeServerFromFolder.run(folderId, serverId);
        return result.changes > 0;
    }
};

// Message logs database functions
const logsDB = {
    getMessageLogs(limit = 50) {
        return statements.getMessageLogs.all(limit);
    },

    addMessageLog(serverId, serverName, userId, username, content, channelName = null) {
        const result = statements.insertMessageLog.run(serverId, serverName, userId, username, content, channelName);
        return result.lastInsertRowid;
    }
};

module.exports = { memeDB, foldersDB, logsDB };

