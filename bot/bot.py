# Diskord Bot + Web API Server
# Unified Python server with Discord bot and REST API

import discord
from discord.ext import commands
import asyncio
import aiosqlite
from datetime import datetime, timezone
import os
from dotenv import load_dotenv
from aiohttp import web
import aiohttp
import json
import random
import hashlib

load_dotenv()

# --- CONFIGURATION ---
TOKEN = os.getenv("DISCORD_TOKEN")
CLIENT_ID = os.getenv("DISCORD_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("DISCORD_CLIENT_SECRET", "")

# Channels (configure these for your server)
_logs_channel = os.getenv("CHANNEL_ID_LOGS", "0")
CHANNEL_ID_LOGS = int(_logs_channel) if _logs_channel else 0
_big_action = os.getenv("BIG_ACTION_ID", "0")
BIG_ACTION_ID = int(_big_action) if _big_action else 0

# Colors
PSI_YELLOW = 0xffe989
DARK_RED = 0xad1f1f

# Owner ID (cannot be removed from admins)
_owner_id = os.getenv("OWNER_ID", "777206368389038081")
OWNER_ID = int(_owner_id) if _owner_id else 777206368389038081

# Bot setup
intents = discord.Intents.default()
intents.message_content = True
intents.messages = True
intents.members = True
bot = commands.Bot(command_prefix="C7/", intents=intents)

# Globals
db_conn = None
waiting_users = {}
logs_channel = None
big_action_channel = None
connected_websockets = set()

# --- DATABASE ---
DB_PATH = os.path.join(os.path.dirname(__file__), 'database.db')

async def init_database():
    """Initialize SQLite database with all required tables"""
    global db_conn
    db_conn = await aiosqlite.connect(DB_PATH)
    db_conn.row_factory = aiosqlite.Row
    
    await db_conn.executescript("""
        -- Members table
        CREATE TABLE IF NOT EXISTS members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            username TEXT,
            email TEXT,
            avatar TEXT,
            join_date TEXT
        );
        
        -- Message logs
        CREATE TABLE IF NOT EXISTS message_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            server_id INTEGER,
            server_name TEXT,
            channel_id INTEGER,
            channel_name TEXT,
            user_id INTEGER,
            username TEXT,
            content TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Bot admins
        CREATE TABLE IF NOT EXISTS bot_admins (
            user_id INTEGER PRIMARY KEY,
            username TEXT,
            role TEXT DEFAULT 'admin',
            added_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Saved messages
        CREATE TABLE IF NOT EXISTS saved_msg (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            folder TEXT DEFAULT 'default',
            username TEXT,
            content TEXT,
            timestamp TEXT,
            channel_id INTEGER,
            message_id INTEGER,
            guild_id INTEGER
        );
        
        -- Folders
        CREATE TABLE IF NOT EXISTS folders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            color TEXT DEFAULT '#FFE989',
            owner_id TEXT
        );
        
        -- Server folders mapping
        CREATE TABLE IF NOT EXISTS server_folders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            folder_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
            server_id INTEGER,
            server_name TEXT,
            server_icon TEXT,
            UNIQUE(folder_id, server_id)
        );
        
        -- Memes
        CREATE TABLE IF NOT EXISTS memes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            image_path TEXT NOT NULL,
            caption TEXT,
            user_id INTEGER NOT NULL,
            like_count INTEGER DEFAULT 0,
            dislike_count INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Votes
        CREATE TABLE IF NOT EXISTS votes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            meme_id INTEGER REFERENCES memes(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL,
            vote_type TEXT,
            UNIQUE(meme_id, user_id)
        );
        
        -- Chat rooms
        CREATE TABLE IF NOT EXISTS chat_rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            created_by INTEGER,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Chat messages
        CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id INTEGER REFERENCES chat_rooms(id) ON DELETE CASCADE,
            user_id INTEGER,
            username TEXT,
            content TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Bot settings
        CREATE TABLE IF NOT EXISTS bot_settings (
            key TEXT PRIMARY KEY,
            value TEXT
        );
    """)
    await db_conn.commit()
    print("[DB] + Database initialized")

# --- WEB SERVER ---
routes = web.RouteTableDef()

def find_static_folder():
    """Find web-console folder"""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(current_dir, '..', 'web-console'),
        os.path.join(current_dir, 'web-console'),
        os.path.join(os.getcwd(), 'web-console'),
    ]
    for path in candidates:
        resolved = os.path.abspath(path)
        if os.path.exists(os.path.join(resolved, 'index.html')):
            print(f"[WEB] + Serving from: {resolved}")
            return resolved
    print("[WEB] X web-console not found!")
    return None

STATIC_PATH = find_static_folder()
UPLOADS_PATH = os.path.join(STATIC_PATH, 'uploads') if STATIC_PATH else 'uploads'
os.makedirs(UPLOADS_PATH, exist_ok=True)

def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true'
    }

def json_response(data, status=200):
    return web.Response(
        text=json.dumps(data, default=str),
        content_type='application/json',
        status=status,
        headers=cors_headers()
    )

# --- API ENDPOINTS ---

@routes.options('/{tail:.*}')
async def handle_options(request):
    return web.Response(status=204, headers=cors_headers())

# Status
@routes.get('/api/status')
async def handle_status(request):
    return json_response({
        'status': 'online' if bot.is_ready() else 'connecting',
        'latency': round(bot.latency * 1000) if bot.is_ready() else 0,
        'guilds': len(bot.guilds) if bot.is_ready() else 0,
        'uptime': '99.9%'
    })

# Stats (filtered by folder)
@routes.get('/api/stats')
async def handle_stats(request):
    folder_id = request.query.get('folderId')
    
    total_members = 0
    active_servers = 0
    
    if folder_id and folder_id.isdigit():
        # Get servers in this folder
        cursor = await db_conn.execute(
            "SELECT server_id FROM server_folders WHERE folder_id = ?", 
            (int(folder_id),)
        )
        rows = await cursor.fetchall()
        server_ids = set(r['server_id'] for r in rows)
        
        # Sum stats only for these servers
        for guild in bot.guilds:
            if guild.id in server_ids:
                total_members += guild.member_count or 0
                active_servers += 1
    else:
        # Global stats (no folder filter)
        for guild in bot.guilds:
            total_members += guild.member_count or 0
            active_servers += 1
    
    return json_response({
        'totalMembers': total_members,
        'activeServers': active_servers,
        'commandsToday': 0,
        'uptime': '99.9%'
    })

# Servers
@routes.get('/api/servers')
async def handle_servers(request):
    servers = []
    for guild in bot.guilds:
        servers.append({
            'id': str(guild.id),
            'name': guild.name,
            'icon': str(guild.icon.url) if guild.icon else None,
            'member_count': guild.member_count
        })
    return json_response(servers)

# --- AUTH ---
@routes.post('/api/auth/login')
async def handle_auth_login(request):
    data = await request.json()
    code = data.get('code')
    
    if not code:
        return json_response({'error': 'No code provided'}, 400)
    if not CLIENT_SECRET:
        return json_response({'error': 'Server not configured for OAuth'}, 500)
    
    async with aiohttp.ClientSession() as session:
        try:
            # Exchange code for token
            payload = {
                'client_id': CLIENT_ID,
                'client_secret': CLIENT_SECRET,
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': 'http://localhost:5000/'
            }
            async with session.post('https://discord.com/api/oauth2/token', data=payload) as resp:
                if resp.status != 200:
                    return json_response({'error': 'Discord auth failed'}, 400)
                token_data = await resp.json()
                access_token = token_data['access_token']
            
            # Get user info
            async with session.get('https://discord.com/api/users/@me', 
                                   headers={'Authorization': f'Bearer {access_token}'}) as resp:
                if resp.status != 200:
                    return json_response({'error': 'Failed to get user'}, 400)
                user_data = await resp.json()
                
        except Exception as e:
            return json_response({'error': str(e)}, 500)
    
    # Save user
    user_id = int(user_data['id'])
    username = user_data['username']
    avatar = user_data.get('avatar')
    avatar_url = f"https://cdn.discordapp.com/avatars/{user_id}/{avatar}.png" if avatar else None
    
    await db_conn.execute("""
        INSERT OR REPLACE INTO members (user_id, username, avatar, join_date)
        VALUES (?, ?, ?, ?)
    """, (user_id, username, avatar_url, datetime.now(timezone.utc).isoformat()))
    await db_conn.commit()
    
    return json_response({
        'success': True,
        'user': {'id': str(user_id), 'username': username, 'avatar': avatar_url}
    })

# --- ADMINS ---
@routes.get('/api/admins')
async def handle_admins_get(request):
    admins = [{'user_id': str(OWNER_ID), 'username': 'Owner', 'role': 'owner', 'added_at': 'System', 'is_owner': True}]
    
    cursor = await db_conn.execute("SELECT user_id, username, role, added_at FROM bot_admins ORDER BY added_at DESC")
    rows = await cursor.fetchall()
    
    for r in rows:
        if r['user_id'] != OWNER_ID:
            admins.append({
                'user_id': str(r['user_id']),
                'username': r['username'] or f"User {r['user_id']}",
                'role': r['role'],
                'added_at': r['added_at'],
                'is_owner': False
            })
    
    return json_response({'success': True, 'admins': admins})

@routes.post('/api/admins')
async def handle_admins_add(request):
    data = await request.json()
    try:
        user_id = int(data.get('userId'))
        username = data.get('username', f'User {user_id}')
        role = data.get('role', 'admin')
        
        await db_conn.execute(
            "INSERT OR REPLACE INTO bot_admins (user_id, username, role, added_at) VALUES (?, ?, ?, ?)",
            (user_id, username, role, datetime.now(timezone.utc).isoformat())
        )
        await db_conn.commit()
        return json_response({'success': True})
    except:
        return json_response({'error': 'Invalid ID'}, 400)

@routes.delete('/api/admins/{id}')
async def handle_admins_delete(request):
    user_id = int(request.match_info['id'])
    if user_id == OWNER_ID:
        return json_response({'error': 'Cannot remove Owner'}, 403)
    
    await db_conn.execute("DELETE FROM bot_admins WHERE user_id = ?", (user_id,))
    await db_conn.commit()
    return json_response({'success': True})

# --- FOLDERS ---
@routes.get('/api/server-folders')
async def handle_folders_get(request):
    cursor = await db_conn.execute("SELECT id, name, color, owner_id FROM folders ORDER BY id ASC")
    rows = await cursor.fetchall()
    folders = [{'id': r['id'], 'name': r['name'], 'color': r['color'] or '#FFE989', 'owner_id': r['owner_id']} for r in rows]
    return json_response({'success': True, 'folders': folders})

@routes.post('/api/server-folders')
async def handle_folder_create(request):
    data = await request.json()
    name = data.get('name')
    color = data.get('color', '#FFE989')
    
    if not name:
        return json_response({'error': 'Name required'}, 400)
    
    cursor = await db_conn.execute(
        "INSERT INTO folders (name, color, owner_id) VALUES (?, ?, ?)",
        (name, color, 'system')
    )
    await db_conn.commit()
    
    return json_response({'success': True, 'folder': {'id': cursor.lastrowid, 'name': name, 'color': color}})

@routes.get('/api/server-folders/{id}')
async def handle_folder_get(request):
    folder_id = int(request.match_info['id'])
    
    cursor = await db_conn.execute("SELECT id, name, color FROM folders WHERE id = ?", (folder_id,))
    folder = await cursor.fetchone()
    
    if not folder:
        return json_response({'error': 'Folder not found'}, 404)
    
    cursor = await db_conn.execute(
        "SELECT server_id, server_name, server_icon FROM server_folders WHERE folder_id = ?",
        (folder_id,)
    )
    servers = await cursor.fetchall()
    
    return json_response({
        'success': True,
        'folder': {'id': folder['id'], 'name': folder['name'], 'color': folder['color']},
        'servers': [{'id': str(s['server_id']), 'name': s['server_name'], 'icon': s['server_icon']} for s in servers]
    })

@routes.post('/api/server-folders/{id}/servers')
async def handle_folder_add_server(request):
    folder_id = int(request.match_info['id'])
    data = await request.json()
    server_id = int(data.get('serverId'))
    server_name = data.get('serverName', f'Server {server_id}')
    server_icon = data.get('serverIcon')
    
    # Try to get real server info from bot
    guild = bot.get_guild(server_id)
    if guild:
        server_name = guild.name
        server_icon = str(guild.icon.url) if guild.icon else None
    
    await db_conn.execute(
        "INSERT OR REPLACE INTO server_folders (folder_id, server_id, server_name, server_icon) VALUES (?, ?, ?, ?)",
        (folder_id, server_id, server_name, server_icon)
    )
    await db_conn.commit()
    
    return json_response({'success': True})

@routes.delete('/api/server-folders/{folder_id}/servers/{server_id}')
async def handle_folder_remove_server(request):
    folder_id = int(request.match_info['folder_id'])
    server_id = int(request.match_info['server_id'])
    
    await db_conn.execute(
        "DELETE FROM server_folders WHERE folder_id = ? AND server_id = ?",
        (folder_id, server_id)
    )
    await db_conn.commit()
    return json_response({'success': True})

@routes.delete('/api/server-folders/{id}')
async def handle_folder_delete(request):
    folder_id = int(request.match_info['id'])
    await db_conn.execute("DELETE FROM folders WHERE id = ?", (folder_id,))
    await db_conn.commit()
    return json_response({'success': True})

# --- LOGS ---
@routes.get('/api/logs/messages')
async def handle_logs_messages(request):
    limit = int(request.query.get('limit', 50))
    folder_id = request.query.get('folderId')
    
    if folder_id and folder_id.isdigit():
        # Get server IDs for this folder
        cursor = await db_conn.execute(
            "SELECT server_id FROM server_folders WHERE folder_id = ?",
            (int(folder_id),)
        )
        folder_rows = await cursor.fetchall()
        server_ids = [r['server_id'] for r in folder_rows]
        
        if not server_ids:
            return json_response({'success': True, 'logs': [], 'total': 0})
        
        # Build query with IN clause for server filtering
        placeholders = ','.join('?' * len(server_ids))
        cursor = await db_conn.execute(f"""
            SELECT server_id, server_name, channel_name, username, user_id, content, created_at 
            FROM message_logs 
            WHERE server_id IN ({placeholders})
            ORDER BY created_at DESC LIMIT ?
        """, (*server_ids, limit))
    else:
        # No folder filter
        cursor = await db_conn.execute("""
            SELECT server_id, server_name, channel_name, username, user_id, content, created_at 
            FROM message_logs ORDER BY created_at DESC LIMIT ?
        """, (limit,))
    
    rows = await cursor.fetchall()
    
    logs = [{
        'server_name': r['server_name'] or 'Unknown',
        'channel_name': r['channel_name'] or 'Unknown',
        'username': r['username'],
        'user_id': str(r['user_id']),
        'content': r['content'],
        'created_at': r['created_at']
    } for r in rows]
    
    return json_response({'success': True, 'logs': logs, 'total': len(logs)})

@routes.get('/api/logs/actions')
async def handle_logs_actions(request):
    return json_response({'success': True, 'logs': [], 'total': 0})

# --- MEMES ---
@routes.get('/api/memes')
async def handle_memes_get(request):
    sort_by = request.query.get('sort', 'new')
    user_id = request.query.get('userId', '0')
    
    order = "created_at DESC" if sort_by == 'new' else "like_count DESC, created_at DESC"
    
    cursor = await db_conn.execute(f"""
        SELECT m.*, 
               (SELECT vote_type FROM votes WHERE meme_id = m.id AND user_id = ?) as user_vote
        FROM memes m ORDER BY {order}
    """, (int(user_id) if user_id.isdigit() else 0,))
    rows = await cursor.fetchall()
    
    memes = [{
        'id': r['id'],
        'image_path': r['image_path'],
        'caption': r['caption'],
        'user_id': str(r['user_id']),
        'like_count': r['like_count'],
        'dislike_count': r['dislike_count'],
        'user_vote': r['user_vote'],
        'created_at': r['created_at']
    } for r in rows]
    
    return json_response({'success': True, 'memes': memes})

@routes.post('/api/memes')
async def handle_meme_upload(request):
    reader = await request.multipart()
    
    caption = ""
    user_id = 0
    filename = None
    
    async for field in reader:
        if field.name == 'caption':
            caption = (await field.read()).decode('utf-8')
        elif field.name == 'userId':
            user_id = int((await field.read()).decode('utf-8'))
        elif field.name == 'image':
            ext = os.path.splitext(field.filename)[1] or '.jpg'
            filename = f"meme_{int(datetime.now().timestamp())}_{random.randint(1000,9999)}{ext}"
            filepath = os.path.join(UPLOADS_PATH, filename)
            
            with open(filepath, 'wb') as f:
                while True:
                    chunk = await field.read_chunk()
                    if not chunk:
                        break
                    f.write(chunk)
    
    if not filename:
        return json_response({'error': 'No image uploaded'}, 400)
    
    url = f"/uploads/{filename}"
    
    cursor = await db_conn.execute(
        "INSERT INTO memes (image_path, caption, user_id) VALUES (?, ?, ?)",
        (url, caption, user_id)
    )
    await db_conn.commit()
    
    # Broadcast new meme
    await broadcast('new_meme', {'meme': {
        'id': cursor.lastrowid,
        'image_path': url,
        'caption': caption,
        'user_id': str(user_id),
        'like_count': 0,
        'dislike_count': 0
    }})
    
    return json_response({'success': True, 'meme': {'id': cursor.lastrowid, 'image_path': url}})

@routes.post('/api/memes/{id}/vote')
async def handle_meme_vote(request):
    meme_id = int(request.match_info['id'])
    data = await request.json()
    user_id = int(data.get('userId', 0))
    vote_type = data.get('voteType')  # 'like' or 'dislike'
    
    # Check existing vote
    cursor = await db_conn.execute(
        "SELECT vote_type FROM votes WHERE meme_id = ? AND user_id = ?",
        (meme_id, user_id)
    )
    existing = await cursor.fetchone()
    
    if existing:
        if existing['vote_type'] == vote_type:
            # Remove vote
            await db_conn.execute("DELETE FROM votes WHERE meme_id = ? AND user_id = ?", (meme_id, user_id))
            col = "like_count" if vote_type == 'like' else "dislike_count"
            await db_conn.execute(f"UPDATE memes SET {col} = {col} - 1 WHERE id = ?", (meme_id,))
        else:
            # Change vote
            await db_conn.execute("UPDATE votes SET vote_type = ? WHERE meme_id = ? AND user_id = ?", (vote_type, meme_id, user_id))
            if vote_type == 'like':
                await db_conn.execute("UPDATE memes SET like_count = like_count + 1, dislike_count = dislike_count - 1 WHERE id = ?", (meme_id,))
            else:
                await db_conn.execute("UPDATE memes SET like_count = like_count - 1, dislike_count = dislike_count + 1 WHERE id = ?", (meme_id,))
    else:
        # New vote
        await db_conn.execute("INSERT INTO votes (meme_id, user_id, vote_type) VALUES (?, ?, ?)", (meme_id, user_id, vote_type))
        col = "like_count" if vote_type == 'like' else "dislike_count"
        await db_conn.execute(f"UPDATE memes SET {col} = {col} + 1 WHERE id = ?", (meme_id,))
    
    await db_conn.commit()
    
    # Get updated counts
    cursor = await db_conn.execute("SELECT like_count, dislike_count FROM memes WHERE id = ?", (meme_id,))
    meme = await cursor.fetchone()
    
    # Broadcast vote update
    await broadcast('vote_update', {
        'memeId': meme_id,
        'likeCount': meme['like_count'],
        'dislikeCount': meme['dislike_count']
    })
    
    return json_response({'success': True, 'likeCount': meme['like_count'], 'dislikeCount': meme['dislike_count']})

@routes.delete('/api/memes/{id}')
async def handle_meme_delete(request):
    meme_id = int(request.match_info['id'])
    user_id = request.query.get('userId')
    
    # Get meme to check ownership and delete file
    cursor = await db_conn.execute("SELECT image_path, user_id FROM memes WHERE id = ?", (meme_id,))
    meme = await cursor.fetchone()
    
    if not meme:
        return json_response({'error': 'Meme not found'}, 404)
    
    # Delete file
    if meme['image_path']:
        filepath = os.path.join(STATIC_PATH, meme['image_path'].lstrip('/'))
        if os.path.exists(filepath):
            os.remove(filepath)
    
    await db_conn.execute("DELETE FROM memes WHERE id = ?", (meme_id,))
    await db_conn.commit()
    
    await broadcast('meme_deleted', {'memeId': meme_id})
    
    return json_response({'success': True})

@routes.get('/api/meme-of-day')
async def handle_meme_of_day(request):
    user_id = request.query.get('userId', '0')
    
    # Get top meme
    cursor = await db_conn.execute("""
        SELECT * FROM memes ORDER BY like_count DESC, created_at DESC LIMIT 1
    """)
    meme = await cursor.fetchone()
    
    # Get top 5
    cursor = await db_conn.execute("""
        SELECT * FROM memes ORDER BY like_count DESC, created_at DESC LIMIT 5
    """)
    top_memes = await cursor.fetchall()
    
    meme_data = None
    if meme:
        meme_data = {
            'id': meme['id'],
            'image_path': meme['image_path'],
            'caption': meme['caption'],
            'like_count': meme['like_count'],
            'dislike_count': meme['dislike_count']
        }
    
    return json_response({
        'success': True,
        'memeOfDay': meme_data,
        'topMemes': [{
            'id': m['id'],
            'image_path': m['image_path'],
            'caption': m['caption'],
            'like_count': m['like_count']
        } for m in top_memes]
    })

# --- BOT SETTINGS ---
@routes.get('/api/bots/{id}')
async def handle_bot_settings_get(request):
    cursor = await db_conn.execute("SELECT key, value FROM bot_settings")
    rows = await cursor.fetchall()
    settings = {r['key']: r['value'] for r in rows}
    
    return json_response({
        'success': True,
        'bot': {
            'name': bot.user.name if bot.user else 'Nexus Bot',
            'commandPrefix': settings.get('prefix', 'C7/'),
            'serverLogs': settings.get('serverLogs', 'true') == 'true',
            'bigActions': settings.get('bigActions', 'true') == 'true',
            'autoModeration': settings.get('autoModeration', 'false') == 'true',
            'welcomeMessages': settings.get('welcomeMessages', 'false') == 'true'
        }
    })

@routes.patch('/api/bots/{id}')
async def handle_bot_settings_update(request):
    data = await request.json()
    
    for key, value in data.items():
        if key in ['commandPrefix', 'serverLogs', 'bigActions', 'autoModeration', 'welcomeMessages']:
            db_key = key if key != 'commandPrefix' else 'prefix'
            await db_conn.execute(
                "INSERT OR REPLACE INTO bot_settings (key, value) VALUES (?, ?)",
                (db_key, str(value).lower() if isinstance(value, bool) else value)
            )
    
    await db_conn.commit()
    return json_response({'success': True})

# --- WEBSOCKET ---
async def broadcast(event_type, data):
    """Send event to all connected WebSocket clients"""
    if not connected_websockets:
        return
    
    message = json.dumps({'event': event_type, 'data': data})
    dead_sockets = set()
    
    for ws in connected_websockets:
        try:
            await ws.send_str(message)
        except:
            dead_sockets.add(ws)
    
    connected_websockets.difference_update(dead_sockets)

@routes.get('/ws')
async def websocket_handler(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    
    connected_websockets.add(ws)
    print(f"[WS] Client connected. Total: {len(connected_websockets)}")
    
    try:
        async for msg in ws:
            if msg.type == aiohttp.WSMsgType.TEXT:
                try:
                    data = json.loads(msg.data)
                    # Handle incoming messages if needed
                except:
                    pass
            elif msg.type == aiohttp.WSMsgType.ERROR:
                break
    finally:
        connected_websockets.discard(ws)
        print(f"[WS] Client disconnected. Total: {len(connected_websockets)}")
    
    return ws

# --- STATIC FILES ---
@routes.get('/')
async def handle_root(request):
    if not STATIC_PATH:
        return web.Response(status=404, text="Web console not found")
    return web.FileResponse(os.path.join(STATIC_PATH, 'index.html'))

@routes.get('/uploads/{filename}')
async def serve_upload(request):
    filename = request.match_info['filename']
    if '..' in filename:
        return web.Response(status=403)
    path = os.path.join(UPLOADS_PATH, filename)
    if os.path.exists(path):
        return web.FileResponse(path)
    return web.Response(status=404)

@routes.get('/{tail:.*}')
async def serve_static(request):
    if not STATIC_PATH:
        return web.Response(status=404)
    
    tail = request.match_info['tail']
    if '..' in tail:
        return web.Response(status=403)
    
    path = os.path.join(STATIC_PATH, tail)
    if os.path.exists(path) and os.path.isfile(path):
        return web.FileResponse(path)
    
    # SPA fallback
    return web.FileResponse(os.path.join(STATIC_PATH, 'index.html'))

# --- DISCORD BOT EVENTS ---

class SaveView(discord.ui.View):
    """View for saving messages from Discord logs channel"""
    def __init__(self, message: discord.Message = None):
        super().__init__(timeout=None)
        if message is None:
            return
        custom_id = f"save|{message.author.id}|{message.channel.id}|{message.id}"
        self.add_item(discord.ui.Button(label="Save", style=discord.ButtonStyle.primary, custom_id=custom_id))

    async def interaction_check(self, interaction: discord.Interaction):
        parts = interaction.data["custom_id"].split("|")
        _, user_id, channel_id, message_id = parts
        channel = bot.get_channel(int(channel_id))
        msg = await channel.fetch_message(int(message_id))
        
        waiting_users[interaction.user.id] = {
            "user_id": int(user_id),
            "username": str(msg.author),
            "content": msg.content,
            "channel_id": int(channel_id),
            "message_id": int(message_id),
            "guild_id": msg.guild.id if msg.guild else 0
        }
        await interaction.response.send_message("Send folder name or 'default':", ephemeral=True)
        return False

@bot.event
async def on_ready():
    global logs_channel, big_action_channel
    
    logs_channel = bot.get_channel(CHANNEL_ID_LOGS) if CHANNEL_ID_LOGS else None
    big_action_channel = bot.get_channel(BIG_ACTION_ID) if BIG_ACTION_ID else None
    
    bot.add_view(SaveView())
    
    print(f"[BOT] + Bot ready: {bot.user}")
    print(f"   Guilds: {len(bot.guilds)}")
    print(f"   Logs channel: {logs_channel}")

@bot.event
async def on_message(message: discord.Message):
    if message.author == bot.user:
        return
    
    # Process commands first
    if message.content.startswith(bot.command_prefix):
        await bot.process_commands(message)
        return
    
    # Log message to database
    if message.guild:
        await db_conn.execute("""
            INSERT INTO message_logs (server_id, server_name, channel_id, channel_name, user_id, username, content)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (message.guild.id, message.guild.name, message.channel.id, message.channel.name,
              message.author.id, str(message.author), message.content))
        await db_conn.commit()
    
    # Send to Discord logs channel
    if logs_channel:
        embed = discord.Embed(
            title="Message",
            description=f"**{message.author}** in {message.channel.mention}\n```{message.content[:1900]}```",
            color=PSI_YELLOW
        )
        if message.author.avatar:
            embed.set_author(name=str(message.author), icon_url=message.author.avatar.url)
        view = SaveView(message)
        await logs_channel.send(embed=embed, view=view)
    
    # Handle waiting save requests
    user_id = message.author.id
    if user_id in waiting_users:
        folder = message.content.strip().lower()
        if folder in ['no', 'none', '-', '']:
            folder = 'default'
        
        saved = waiting_users[user_id]
        await db_conn.execute("""
            INSERT INTO saved_msg (user_id, folder, username, content, timestamp, channel_id, message_id, guild_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (saved['user_id'], folder, saved['username'], saved['content'],
              datetime.now(timezone.utc).isoformat(), saved['channel_id'], saved['message_id'], saved['guild_id']))
        await db_conn.commit()
        
        await message.reply(f"✅ Saved to folder: `{folder}`")
        del waiting_users[user_id]

# --- BOT COMMANDS ---

@bot.command(name="ping")
async def cmd_ping(ctx):
    await ctx.send(f"🏓 Pong! Latency: {round(bot.latency * 1000)}ms")

@bot.command(name="show_saved")
async def cmd_show_saved(ctx, folder: str = "default"):
    cursor = await db_conn.execute("""
        SELECT username, content, timestamp FROM saved_msg WHERE folder = ? ORDER BY timestamp DESC LIMIT 10
    """, (folder,))
    rows = await cursor.fetchall()
    
    if not rows:
        return await ctx.send(f"No messages in folder `{folder}`")
    
    embed = discord.Embed(title=f"📁 Saved - {folder}", color=PSI_YELLOW)
    for r in rows:
        content = r['content'][:200] + "..." if len(r['content']) > 200 else r['content']
        embed.add_field(name=r['username'], value=f"```{content}```", inline=False)
    
    await ctx.send(embed=embed)

@bot.command(name="global_send")
async def cmd_global_send(ctx, channel_id: int, *, content: str):
    # Check if admin
    cursor = await db_conn.execute("SELECT 1 FROM bot_admins WHERE user_id = ?", (ctx.author.id,))
    is_admin = await cursor.fetchone() or ctx.author.id == OWNER_ID
    
    if not is_admin:
        return await ctx.send("X Not authorized")
    
    channel = bot.get_channel(channel_id)
    if not channel:
        return await ctx.send("X Channel not found")
    
    sent = await channel.send(content)
    await ctx.send(f"+ Sent: {sent.jump_url}")

# --- MODERATION COMMANDS ---

@bot.command(name="ban")
@commands.has_permissions(ban_members=True)
async def cmd_ban(ctx, member: discord.Member, *, reason: str = "Не указана"):
    """Забанить пользователя"""
    try:
        await member.ban(reason=f"{reason} (by {ctx.author})")
        embed = discord.Embed(
            title="🔨 Бан",
            description=f"**{member}** забанен\nПричина: {reason}",
            color=0xFF6B6B
        )
        await ctx.send(embed=embed)
        
        # Log to big_action_channel
        if big_action_channel:
            log_embed = discord.Embed(
                title="🔨 BAN",
                description=f"**{member}** забанен на {ctx.guild.name}",
                color=0xFF6B6B
            )
            log_embed.add_field(name="Модератор", value=str(ctx.author))
            log_embed.add_field(name="Причина", value=reason)
            await big_action_channel.send(embed=log_embed)
    except discord.Forbidden:
        await ctx.send("❌ Недостаточно прав для бана этого пользователя")

@bot.command(name="kick")
@commands.has_permissions(kick_members=True)
async def cmd_kick(ctx, member: discord.Member, *, reason: str = "Не указана"):
    """Кикнуть пользователя"""
    try:
        await member.kick(reason=f"{reason} (by {ctx.author})")
        embed = discord.Embed(
            title="👢 Кик",
            description=f"**{member}** кикнут\nПричина: {reason}",
            color=0xFFA500
        )
        await ctx.send(embed=embed)
    except discord.Forbidden:
        await ctx.send("❌ Недостаточно прав для кика этого пользователя")

@bot.command(name="mute")
@commands.has_permissions(moderate_members=True)
async def cmd_mute(ctx, member: discord.Member, duration: str = "10m", *, reason: str = "Не указана"):
    """Замутить пользователя. Время: 10s, 5m, 1h, 1d"""
    import re
    from datetime import timedelta
    
    # Parse duration
    match = re.match(r"(\d+)([smhd])", duration.lower())
    if not match:
        return await ctx.send("❌ Неверный формат времени. Используйте: 10s, 5m, 1h, 1d")
    
    amount, unit = int(match.group(1)), match.group(2)
    units = {"s": "seconds", "m": "minutes", "h": "hours", "d": "days"}
    delta = timedelta(**{units[unit]: amount})
    
    try:
        await member.timeout(delta, reason=f"{reason} (by {ctx.author})")
        embed = discord.Embed(
            title="🔇 Мут",
            description=f"**{member}** замучен на {duration}\nПричина: {reason}",
            color=0x808080
        )
        await ctx.send(embed=embed)
    except discord.Forbidden:
        await ctx.send("❌ Недостаточно прав для мута этого пользователя")

@bot.command(name="clear")
@commands.has_permissions(manage_messages=True)
async def cmd_clear(ctx, count: int = 10):
    """Удалить сообщения (1-100)"""
    count = max(1, min(100, count))
    try:
        deleted = await ctx.channel.purge(limit=count + 1)  # +1 for command message
        msg = await ctx.send(f"🗑️ Удалено {len(deleted) - 1} сообщений")
        await asyncio.sleep(3)
        await msg.delete()
    except discord.Forbidden:
        await ctx.send("❌ Недостаточно прав для удаления сообщений")

# --- INFO COMMANDS ---

@bot.command(name="bothelp")
async def cmd_help(ctx):
    """Показать список команд"""
    embed = discord.Embed(
        title="📖 Команды бота",
        description="Список доступных команд",
        color=PSI_YELLOW
    )
    
    embed.add_field(
        name="🛡️ Модерация",
        value="`!ban @user [reason]` — Забанить\n`!kick @user [reason]` — Кикнуть\n`!mute @user [time]` — Замутить\n`!clear [count]` — Удалить сообщения",
        inline=False
    )
    
    embed.add_field(
        name="ℹ️ Информация",
        value="`!help` — Эта справка\n`!ping` — Задержка бота\n`!stats` — Статистика сервера\n`!userinfo @user` — Инфо о пользователе",
        inline=False
    )
    
    embed.add_field(
        name="🎮 Развлечения",
        value="`!meme` — Случайный мем\n`!roll [max]` — Бросить кубик\n`!8ball [вопрос]` — Магический шар",
        inline=False
    )
    
    await ctx.send(embed=embed)

@bot.command(name="stats")
async def cmd_stats(ctx):
    """Статистика сервера"""
    guild = ctx.guild
    if not guild:
        return await ctx.send("❌ Команда доступна только на сервере")
    
    embed = discord.Embed(
        title=f"📊 Статистика {guild.name}",
        color=PSI_YELLOW
    )
    if guild.icon:
        embed.set_thumbnail(url=guild.icon.url)
    
    embed.add_field(name="👥 Участников", value=guild.member_count)
    embed.add_field(name="💬 Каналов", value=len(guild.channels))
    embed.add_field(name="🎭 Ролей", value=len(guild.roles))
    embed.add_field(name="😀 Эмодзи", value=len(guild.emojis))
    embed.add_field(name="🚀 Бустов", value=guild.premium_subscription_count or 0)
    embed.add_field(name="📅 Создан", value=guild.created_at.strftime("%d.%m.%Y"))
    
    await ctx.send(embed=embed)

@bot.command(name="userinfo")
async def cmd_userinfo(ctx, member: discord.Member = None):
    """Информация о пользователе"""
    member = member or ctx.author
    
    embed = discord.Embed(
        title=f"👤 {member.display_name}",
        color=member.color
    )
    if member.avatar:
        embed.set_thumbnail(url=member.avatar.url)
    
    embed.add_field(name="🏷️ Тег", value=str(member))
    embed.add_field(name="🆔 ID", value=member.id)
    embed.add_field(name="📅 Зарегистрирован", value=member.created_at.strftime("%d.%m.%Y"))
    embed.add_field(name="📥 Присоединился", value=member.joined_at.strftime("%d.%m.%Y") if member.joined_at else "N/A")
    embed.add_field(name="🎭 Ролей", value=len(member.roles) - 1)  # -1 for @everyone
    embed.add_field(name="🤖 Бот", value="Да" if member.bot else "Нет")
    
    await ctx.send(embed=embed)

# --- FUN COMMANDS ---

@bot.command(name="meme")
async def cmd_meme(ctx):
    """Случайный мем из базы"""
    cursor = await db_conn.execute("""
        SELECT image_url, caption FROM memes ORDER BY RANDOM() LIMIT 1
    """)
    meme = await cursor.fetchone()
    
    if meme:
        embed = discord.Embed(description=meme['caption'], color=PSI_YELLOW)
        embed.set_image(url=meme['image_url'])
        await ctx.send(embed=embed)
    else:
        await ctx.send("😢 Мемов пока нет. Загрузите их в веб-консоли!")

@bot.command(name="roll")
async def cmd_roll(ctx, maximum: int = 100):
    """Бросить кубик"""
    import random
    result = random.randint(1, max(1, maximum))
    embed = discord.Embed(
        title="🎲 Кубик",
        description=f"**{ctx.author.display_name}** выбросил **{result}** (1-{maximum})",
        color=PSI_YELLOW
    )
    await ctx.send(embed=embed)

@bot.command(name="8ball")
async def cmd_8ball(ctx, *, question: str = None):
    """Магический шар ответит на ваш вопрос"""
    import random
    
    if not question:
        return await ctx.send("❓ Задайте вопрос! Пример: `!8ball Будет ли завтра хорошая погода?`")
    
    answers = [
        "🟢 Бесспорно", "🟢 Определённо да", "🟢 Никаких сомнений", "🟢 Да",
        "🟡 Скорее всего", "🟡 Хорошие перспективы", "🟡 Знаки говорят — да",
        "🟠 Пока не ясно", "🟠 Спроси позже", "🟠 Лучше не рассказывать",
        "🔴 Даже не думай", "🔴 Мой ответ — нет", "🔴 Весьма сомнительно", "🔴 Нет"
    ]
    
    embed = discord.Embed(
        title="🎱 Магический шар",
        color=PSI_YELLOW
    )
    embed.add_field(name="Вопрос", value=question, inline=False)
    embed.add_field(name="Ответ", value=random.choice(answers), inline=False)
    
    await ctx.send(embed=embed)

# --- MAIN ---

async def main():
    await init_database()
    
    # Start web server
    app = web.Application(client_max_size=10*1024*1024)  # 10MB max upload
    app.add_routes(routes)
    
    runner = web.AppRunner(app)
    await runner.setup()
    
    site = web.TCPSite(runner, '0.0.0.0', 5000)
    await site.start()
    print("[WEB] + Web API running on http://localhost:5000")
    
    # Start bot
    if TOKEN:
        async with bot:
            await bot.start(TOKEN)
    else:
        print("[WARN] No DISCORD_TOKEN - bot not started, web-only mode")
        # Keep server running
        while True:
            await asyncio.sleep(3600)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Shutting down...")
