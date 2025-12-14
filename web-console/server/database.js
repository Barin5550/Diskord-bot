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

    CREATE INDEX IF NOT EXISTS idx_memes_like_count ON memes(like_count DESC);
    CREATE INDEX IF NOT EXISTS idx_memes_created_at ON memes(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_votes_meme_user ON votes(meme_id, user_id);
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

module.exports = memeDB;
