import discord
from discord.ext import commands    
import asyncio
import asyncpg
from datetime import datetime, timedelta, timezone
import os
from dotenv import load_dotenv
from aiohttp import web
import aiohttp
import json
import random
import base64

load_dotenv()

# --- CONFIGURATION ---
TOKEN = os.getenv("DISCORD_TOKEN") 
CLIENT_ID = "1441381190371246261"
CLIENT_SECRET = os.getenv("DISCORD_CLIENT_SECRET")

# Channels
CHANNEL_ID_SEND = 1441380472579162285
CHANNEL_ID_LOGS = 1441383049794420746
GLOBAL_SEND_ID = 1441380472579162285
BIG_ACTION_ID = 1441383700368724078
ADMIN_ROLE_ID = 1441382969628426240

# Colors
psi_yellow = 0xffe989

# Database Config
DB_CONFIG = {
    "database": os.getenv("DB_NAME", "postgres"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "password"),
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
}

# The Owner ID that cannot be removed
OWNER_ID = 777206368389038081

intents = discord.Intents.default()
intents.message_content = True
intents.messages = True
intents.members = True 
bot = commands.Bot(command_prefix="C7/", intents=intents)

# Globals
db_pool = None
waiting_users = {}
logs_channel = None

# --- WEB SERVER CONFIG ---
routes = web.RouteTableDef()
MAX_UPLOAD_SIZE = 10 * 1024 * 1024 # 10MB

def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    }

def json_response(data, status=200):
    return web.Response(
        text=json.dumps(data, default=str),
        content_type='application/json',
        status=status,
        headers=cors_headers()
    )

def find_static_folder():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(current_dir, 'Diskord-bot-main', 'web-console'),
        os.path.join(current_dir, 'web-console'),
        os.path.join(os.getcwd(), 'Diskord-bot-main', 'web-console'),
        os.path.join(os.getcwd(), 'web-console'),
    ]
    for path in candidates:
        if os.path.exists(os.path.join(path, 'index.html')):
            print(f"[WEB] ✅ Serving website from: {path}")
            return path
    return None

STATIC_PATH = find_static_folder()
UPLOADS_PATH = os.path.join(STATIC_PATH, 'uploads') if STATIC_PATH else 'uploads'
os.makedirs(UPLOADS_PATH, exist_ok=True)

# admin check
ADMIN = {777206368389038081}
async def is_admin(user: discord.User | discord.Member):
    if user.id in ADMIN or user.id == OWNER_ID:
        return True
    if not db_pool:
        return False
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT 1 FROM bot_admins WHERE user_id = $1",
            user.id
        )
        return row is not None

# --- API ENDPOINTS ---

@routes.options('/{tail:.*}')
async def handle_options(request):
    return web.Response(status=204, headers=cors_headers())

@routes.get('/api/status')
async def handle_status(request):
    return json_response({
        'status': 'online' if bot.is_ready() else 'connecting',
        'latency': round(bot.latency * 1000) if bot.is_ready() else 0,
        'guilds': len(bot.guilds) if bot.is_ready() else 0
    })

# --- AUTH ---
@routes.post('/api/auth/login')
async def handle_auth_login(request):
    data = await request.json()
    code = data.get('code')
    if not code: return json_response({'error': 'No code provided'}, 400)
    if not CLIENT_SECRET: return json_response({'error': 'Server Config Error: Missing Client Secret'}, 500)

    async with aiohttp.ClientSession() as session:
        try:
            payload = {
                'client_id': CLIENT_ID,
                'client_secret': CLIENT_SECRET,
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': 'http://localhost:5000/folders'
            }
            async with session.post('https://discord.com/api/oauth2/token', data=payload) as resp:
                if resp.status != 200:
                    text = await resp.text()
                    return json_response({'error': f'Discord Auth Failed: {text}'}, 400)
                token_data = await resp.json()
                access_token = token_data['access_token']

            async with session.get('https://discord.com/api/users/@me', headers={'Authorization': f'Bearer {access_token}'}) as resp:
                if resp.status != 200: return json_response({'error': 'Failed to fetch user profile'}, 400)
                user_data = await resp.json()
                
        except Exception as e:
            return json_response({'error': str(e)}, 500)

    # Upsert Member
    user_id = int(user_data['id'])
    username = user_data['username']
    email = user_data.get('email')
    avatar = user_data.get('avatar')
    avatar_url = f"https://cdn.discordapp.com/avatars/{user_id}/{avatar}.png" if avatar else None

    if db_pool:
        async with db_pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO members (user_id, username, email, avatar, join_date)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (user_id) DO UPDATE 
                SET username = EXCLUDED.username, email = EXCLUDED.email, avatar = EXCLUDED.avatar
            """, user_id, username, email, avatar_url, datetime.now(timezone.utc))

    return json_response({
        'success': True,
        'user': {'id': str(user_id), 'username': username, 'email': email, 'avatar': avatar_url}
    })

# --- MEME API ---
@routes.get('/api/memes')
async def handle_memes_get(request):
    sort_by = request.query.get('sort', 'new')
    user_id = request.query.get('userId')
    
    order_clause = "created_at DESC"
    if sort_by == 'popular':
        order_clause = "like_count DESC, created_at DESC"
        
    if not db_pool: return json_response({'memes': []})
    
    async with db_pool.acquire() as conn:
        rows = await conn.fetch(f"""
            SELECT m.*, 
                   (SELECT vote_type FROM votes WHERE meme_id = m.id AND user_id = $1) as user_vote 
            FROM memes m 
            ORDER BY {order_clause}
        """, int(user_id) if user_id and user_id.isdigit() else 0)
        
        memes = [{
            'id': r['id'],
            'url': r['image_path'],
            'caption': r['caption'],
            'likes': r['like_count'],
            'dislikes': r['dislike_count'],
            'author_id': str(r['user_id']),
            'user_vote': r['user_vote']
        } for r in rows]
        return json_response({'memes': memes})

@routes.post('/api/memes')
async def handle_meme_upload(request):
    reader = await request.multipart()
    field = await reader.next()
    
    caption = ""
    user_id = 0
    filename = None
    
    # Simple multipart parser loop
    while field:
        if field.name == 'caption':
            caption = await field.read_chunk()
            caption = caption.decode('utf-8')
        elif field.name == 'userId':
            uid = await field.read_chunk()
            user_id = int(uid.decode('utf-8'))
        elif field.name == 'image':
            filename = f"meme_{int(datetime.now().timestamp())}_{random.randint(1000,9999)}.jpg"
            filepath = os.path.join(UPLOADS_PATH, filename)
            size = 0
            with open(filepath, 'wb') as f:
                while True:
                    chunk = await field.read_chunk()
                    if not chunk: break
                    size += len(chunk)
                    f.write(chunk)
        field = await reader.next()
    
    if not filename: return json_response({'error': 'No image'}, 400)
    
    url = f"/uploads/{filename}"
    
    async with db_pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO memes (image_path, caption, user_id) VALUES ($1, $2, $3)",
            url, caption, user_id
        )
    return json_response({'success': True})

@routes.post('/api/memes/{id}/vote')
async def handle_meme_vote(request):
    meme_id = int(request.match_info['id'])
    data = await request.json()
    user_id = int(data.get('userId'))
    vote_type = data.get('voteType') # 'like' or 'dislike'
    
    if not db_pool: return json_response({'error': 'DB Error'}, 500)
    
    async with db_pool.acquire() as conn:
        # Check existing vote
        existing = await conn.fetchrow("SELECT vote_type FROM votes WHERE meme_id=$1 AND user_id=$2", meme_id, user_id)
        
        if existing:
            if existing['vote_type'] == vote_type:
                # Remove vote
                await conn.execute("DELETE FROM votes WHERE meme_id=$1 AND user_id=$2", meme_id, user_id)
                col = "like_count" if vote_type == 'like' else "dislike_count"
                await conn.execute(f"UPDATE memes SET {col} = {col} - 1 WHERE id=$1", meme_id)
            else:
                # Change vote
                await conn.execute("UPDATE votes SET vote_type=$1 WHERE meme_id=$2 AND user_id=$3", vote_type, meme_id, user_id)
                if vote_type == 'like':
                    await conn.execute("UPDATE memes SET like_count = like_count + 1, dislike_count = dislike_count - 1 WHERE id=$1", meme_id)
                else:
                    await conn.execute("UPDATE memes SET like_count = like_count - 1, dislike_count = dislike_count + 1 WHERE id=$1", meme_id)
        else:
            # New vote
            await conn.execute("INSERT INTO votes (meme_id, user_id, vote_type) VALUES ($1, $2, $3)", meme_id, user_id, vote_type)
            col = "like_count" if vote_type == 'like' else "dislike_count"
            await conn.execute(f"UPDATE memes SET {col} = {col} + 1 WHERE id=$1", meme_id)
            
    return json_response({'success': True})

# --- MODERATION API ---
@routes.get('/api/admins')
async def handle_admins_get(request):
    admins = []
    admins.append({'user_id': str(OWNER_ID), 'added_at': 'Owner', 'is_owner': True})
    if db_pool:
        async with db_pool.acquire() as conn:
            rows = await conn.fetch("SELECT user_id, added_at FROM bot_admins ORDER BY added_at DESC")
            for r in rows:
                if r['user_id'] != OWNER_ID:
                    admins.append({'user_id': str(r['user_id']), 'added_at': r['added_at'].strftime('%Y-%m-%d %H:%M'), 'is_owner': False})
    return json_response({'admins': admins})

@routes.post('/api/admins')
async def handle_admins_add(request):
    data = await request.json()
    try:
        user_id = int(data.get('userId'))
        if db_pool:
            async with db_pool.acquire() as conn:
                await conn.execute("INSERT INTO bot_admins (user_id, added_at) VALUES ($1, $2) ON CONFLICT DO NOTHING", user_id, datetime.now(timezone.utc))
        return json_response({'success': True})
    except:
        return json_response({'error': 'Invalid ID'}, 400)

@routes.delete('/api/admins/{id}')
async def handle_admins_delete(request):
    user_id = int(request.match_info['id'])
    if user_id == OWNER_ID: return json_response({'error': 'Cannot remove Owner'}, 403)
    if db_pool:
        async with db_pool.acquire() as conn:
            await conn.execute("DELETE FROM bot_admins WHERE user_id = $1", user_id)
    return json_response({'success': True})


# --- LOGS API ---
@routes.get('/api/logs/messages')
async def handle_logs_messages(request):
    limit = int(request.query.get('limit', 50))
    folder_id = request.query.get('folderId')
    
    if not db_pool: return json_response({'logs': [], 'total': 0})
    
    async with db_pool.acquire() as conn:
        try:
            if folder_id:
                srv_rows = await conn.fetch("SELECT server_id FROM server_folders WHERE folder_id=$1", int(folder_id))
                server_ids = [r['server_id'] for r in srv_rows]
                if not server_ids: return json_response({'success': True, 'logs': [], 'total': 0})
                rows = await conn.fetch("""
                    SELECT server_name, channel_name, username, content, created_at 
                    FROM message_logs WHERE server_id = ANY($1::bigint[]) ORDER BY created_at DESC LIMIT $2
                """, server_ids, limit)
            else:
                rows = await conn.fetch("SELECT server_name, channel_name, username, content, created_at FROM message_logs ORDER BY created_at DESC LIMIT $1", limit)
            
            logs = [{
                'server_name': r['server_name'] or 'Unknown',
                'channel_name': r['channel_name'] or 'Unknown',
                'username': r['username'],
                'content': r['content'],
                'created_at': r['created_at'].isoformat() if r['created_at'] else None
            } for r in rows]
            return json_response({'success': True, 'logs': logs, 'total': len(logs)})
        except:
            return json_response({'success': True, 'logs': [], 'total': 0})

# --- FOLDERS API ---
@routes.get('/api/folders')
async def handle_folders_get(request):
    if not db_pool: return json_response([], 500)
    async with db_pool.acquire() as conn:
        rows = await conn.fetch("SELECT id, name, color, owner_id FROM folders ORDER BY id ASC")
        return json_response([{'id': r['id'], 'name': r['name'], 'color': r['color'] or '#FFE989', 'owner_id': r['owner_id']} for r in rows])

@routes.post('/api/folders')
async def handle_folder_create(request):
    data = await request.json()
    name = data.get('name')
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow("INSERT INTO folders (name, color, owner_id) VALUES ($1, $2, $3) RETURNING id", name, '#FFE989', 'system')
    return json_response({'id': row['id'], 'name': name})

@routes.get('/api/folders/{id}/servers')
async def handle_folder_servers_get(request):
    folder_id = int(request.match_info['id'])
    async with db_pool.acquire() as conn:
        rows = await conn.fetch("SELECT server_id, server_name FROM server_folders WHERE folder_id=$1", folder_id)
        return json_response([{'server_id': str(r['server_id']), 'server_name': r['server_name']} for r in rows])

@routes.post('/api/folders/{id}/servers')
async def handle_folder_server_add(request):
    folder_id = int(request.match_info['id'])
    data = await request.json()
    server_id = int(data.get('serverId'))
    server_name = data.get('serverName', f'Server {server_id}')
    async with db_pool.acquire() as conn:
        await conn.execute("INSERT INTO server_folders (folder_id, server_id, server_name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", folder_id, server_id, server_name)
    return json_response({'status': 'added'})

@routes.delete('/api/folders/{folder_id}/servers/{server_id}')
async def handle_folder_server_remove(request):
    folder_id = int(request.match_info['folder_id'])
    server_id = int(request.match_info['server_id'])
    async with db_pool.acquire() as conn:
        await conn.execute("DELETE FROM server_folders WHERE folder_id=$1 AND server_id=$2", folder_id, server_id)
    return json_response({'status': 'removed'})

@routes.get('/api/stats')
async def handle_stats(request):
    folder_id = request.query.get('folderId')
    total_members = 0
    active_servers = 0
    if folder_id and db_pool:
        async with db_pool.acquire() as conn:
            rows = await conn.fetch("SELECT server_id FROM server_folders WHERE folder_id=$1", int(folder_id))
            server_ids = [r['server_id'] for r in rows]
        for guild in bot.guilds:
            if guild.id in server_ids:
                total_members += guild.member_count
                active_servers += 1
    else:
        for guild in bot.guilds:
            total_members += guild.member_count
            active_servers += 1
    return json_response({'totalMembers': total_members, 'activeServers': active_servers})

# --- STATIC & ROUTING ---
async def serve_index(request):
    if not STATIC_PATH: return web.Response(status=404, text="Web folder not found")
    return web.FileResponse(os.path.join(STATIC_PATH, 'index.html'))

@routes.get('/')
async def handle_root(request): return await serve_index(request)

@routes.get('/folders')
async def handle_folders_route(request): return await serve_index(request)

@routes.get('/uploads/{filename}')
async def serve_upload(request):
    filename = request.match_info['filename']
    path = os.path.join(UPLOADS_PATH, filename)
    if os.path.exists(path):
        return web.FileResponse(path)
    return web.Response(status=404)

@routes.get('/{tail:.*}')
async def serve_assets(request):
    if not STATIC_PATH: return web.Response(status=404)
    path = os.path.join(STATIC_PATH, request.match_info['tail'])
    if os.path.exists(path) and os.path.isfile(path):
        return web.FileResponse(path)
    return web.Response(status=404)

# --- BOT EVENTS & LOGIC ---
class SaveView(discord.ui.View):
    def __init__(self, message: discord.Message = None):
        super().__init__(timeout=None)
        if message is None: return 
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
            "message_id": int(message_id)
        }
        await interaction.response.send_message("Send folder name or No/None/Default/- for default.", ephemeral=True)
        return False

@bot.event
async def on_ready():
    global db_pool, logs_channel
    logs_channel = bot.get_channel(CHANNEL_ID_LOGS)
    try:
        db_pool = await asyncpg.create_pool(**DB_CONFIG)
        print("✅ Database connected")
        async with db_pool.acquire() as conn:
            # Create all necessary tables
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS message_logs (
                    id SERIAL PRIMARY KEY,
                    server_id BIGINT,
                    server_name TEXT,
                    channel_id BIGINT,
                    channel_name TEXT,
                    user_id BIGINT,
                    username TEXT,
                    content TEXT,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
                CREATE TABLE IF NOT EXISTS bot_admins (
                    user_id BIGINT PRIMARY KEY,
                    added_at TIMESTAMPTZ DEFAULT NOW()
                );
                CREATE TABLE IF NOT EXISTS saved_msg (
                    id SERIAL PRIMARY KEY,
                    user_id BIGINT,
                    folder TEXT,
                    username TEXT,
                    content TEXT,
                    timestamp TIMESTAMPTZ,
                    channel_id BIGINT,
                    message_id BIGINT,
                    guild_id BIGINT
                );
                CREATE TABLE IF NOT EXISTS members (
                    id SERIAL PRIMARY KEY,
                    user_id BIGINT UNIQUE NOT NULL,
                    username TEXT,
                    email TEXT,
                    avatar TEXT,
                    join_date TIMESTAMPTZ
                );
                CREATE TABLE IF NOT EXISTS folders (
                    id SERIAL PRIMARY KEY,
                    name TEXT,
                    color TEXT,
                    owner_id TEXT
                );
                CREATE TABLE IF NOT EXISTS server_folders (
                    id SERIAL PRIMARY KEY,
                    folder_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
                    server_id BIGINT,
                    server_name TEXT,
                    UNIQUE(folder_id, server_id)
                );
                CREATE TABLE IF NOT EXISTS memes (
                    id SERIAL PRIMARY KEY,
                    image_path TEXT NOT NULL,
                    caption TEXT,
                    user_id BIGINT NOT NULL,
                    like_count INTEGER DEFAULT 0,
                    dislike_count INTEGER DEFAULT 0,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
                CREATE TABLE IF NOT EXISTS votes (
                    id SERIAL PRIMARY KEY,
                    meme_id INTEGER REFERENCES memes(id) ON DELETE CASCADE,
                    user_id BIGINT NOT NULL,
                    vote_type TEXT,
                    UNIQUE(meme_id, user_id)
                );
            """)
            print("✅ DB Schema Verified")
    except Exception as e:
        print(f"❌ DB Init Failed: {e}")

    bot.add_view(SaveView())
    print(f"✅ {bot.user} ready!")

@bot.event
async def on_message(message: discord.Message):
    if message.author == bot.user:
        return

    # commands FIRST
    if message.content.startswith(bot.command_prefix):
        await bot.process_commands(message)
        return


    # 1. livelog
    if db_pool and message.guild:
        try:
            async with db_pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO message_logs (server_id, server_name, channel_id, channel_name, user_id, username, content, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                """, message.guild.id, message.guild.name, message.channel.id, message.channel.name,
                   message.author.id, str(message.author), message.content, datetime.now(timezone.utc))
        except Exception as e:
            print(f"Log Error: {e}")

    # 2. discord log
    if logs_channel:
        embed = discord.Embed(
            title="Message sent",
            description=f"**{message.author}** ({message.author.id}) sent\n```{message.content}```\nin {message.channel.mention}",
            color=psi_yellow
        )
        embed.set_author(name=str(message.author), icon_url=message.author.avatar.url if message.author.avatar else None)
        view = SaveView(message)
        await logs_channel.send(embed=embed, view=view)

    # manual save
    user_id = message.author.id
    if user_id in waiting_users:
        folder_input = message.content.strip()
        saved_message = waiting_users[user_id]
        if folder_input.lower() in ['no', 'none', 'default', '-']:
            folder_input = 'default'

        if db_pool:
            async with db_pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO saved_msg (user_id, folder, username, content, timestamp, channel_id, message_id, guild_id)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                """, saved_message['user_id'], folder_input, saved_message['username'], 
                saved_message['content'], datetime.now(timezone.utc),
                saved_message['channel_id'], saved_message['message_id'], message.guild.id if message.guild else 0)
        await message.reply("Message saved to separate saved_msg DB.")
        del waiting_users[user_id]


# on ready    
@bot.event
async def on_ready():
    global db_pool, logs_channel, global_send, big_action

    logs_channel = bot.get_channel(CHANNEL_ID_LOGS)
    global_send = bot.get_channel(GLOBAL_SEND_ID)
    big_action = bot.get_channel(BIG_ACTION_ID)

    print(f"✅ Logged in as {bot.user}")
    print(f"Logs: {logs_channel}")
    print(f"Global send: {global_send}")
    print(f"Big actions: {big_action}")

    bot.add_view(SaveView())


#commands 

@bot.command(name="show_saved")
async def show_saved(ctx, folder: str = None):
    folder = folder or "default"

    async with db_pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT user_id, username, content, timestamp, channel_id, message_id
            FROM saved_msg
            WHERE folder = $1
            ORDER BY timestamp ASC
        """, folder)

    if not rows:
        await ctx.send(f"No saved messages in '{folder}'")
        return

    embeds = []
    page = []

    for r in rows:
        content = r["content"][:500] + ("..." if len(r["content"]) > 500 else "")
        link = f"https://discord.com/channels/{ctx.guild.id}/{r['channel_id']}/{r['message_id']}"
        page.append(
            f"**{r['username']}** ({r['user_id']})\n```{content}```\n[msg]({link})"
        )

        if len("\n".join(page)) > 900:
            embeds.append(discord.Embed(
                title=f"Saved — {folder}",
                description="\n\n".join(page),
                color=psi_yellow
            ))
            page = []

    if page:
        embeds.append(discord.Embed(
            title=f"Saved — {folder}",
            description="\n\n".join(page),
            color=psi_yellow
        ))

    i = 0
    view = discord.ui.View()

    async def prev(interaction):
        nonlocal i
        i = max(0, i - 1)
        await interaction.response.edit_message(embed=embeds[i], view=view)

    async def next_(interaction):
        nonlocal i
        i = min(len(embeds) - 1, i + 1)
        await interaction.response.edit_message(embed=embeds[i], view=view)

    view.add_item(discord.ui.Button(label="prev", callback=prev))
    view.add_item(discord.ui.Button(label="next", callback=next_))

    await ctx.send(embed=embeds[i], view=view)


@bot.command(name="global_send")
async def global_send_cmd(ctx, guild_id: int, channel_id: int, *, content: str):
    if not await is_admin(ctx.author):
        await ctx.send("heaven's watching you.")
        return

    guild = bot.get_guild(guild_id)
    if not guild:
        await ctx.send("the sky is dark there")
        return

    channel = bot.get_channel(channel_id)
    if not channel:
        await ctx.send("no access to that channel")
        return

    sent = await channel.send(content)

    if logs_channel:
        embed = discord.Embed(
            title="Global send",
            description=f"[jump]({sent.jump_url})",
            color=psi_yellow
        )
        embed.add_field(name="By", value=ctx.author.mention)
        embed.add_field(name="Content", value=content[:1024])
        await logs_channel.send(embed=embed)


@bot.command(name="heaven_strike")
async def heaven_strike(ctx, big: bool, user_id: int, guild_id: int, *, reason: str = None):
    if not await is_admin(ctx.author):
        await ctx.send("heaven watches you")
        return

    guild = bot.get_guild(guild_id)
    if not guild:
        await ctx.send("the sky is dark there")
        return

    if not guild.me.guild_permissions.ban_members:
        await ctx.send("i cannot ban there")
        return

    user = await bot.fetch_user(user_id)
    await guild.ban(
        user,
        reason=f"{ctx.author} ({ctx.author.id}): {reason or '—'}"
    )

    await ctx.send(f"{user} banned in {guild.name}")

    embed = discord.Embed(
        title="BIG ACTION",
        description=f"{user} banned in {guild.name}",
        color=0xad1f1f
    )

    if logs_channel:
        await logs_channel.send(embed=embed)
    if big and big_action:
        await big_action.send(embed=embed)





async def main():
    app = web.Application()
    app.add_routes(routes)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', 5000)
    await site.start()
    print("✅ Web API running on port 5000")

    async with bot:
        await bot.start(TOKEN)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass