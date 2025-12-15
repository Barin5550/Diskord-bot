"""
Discord Bot with Web API - Nexus Console
Based on ra1d9r/thing project, integrated into Diskord-bot
"""

import discord
from discord.ext import commands
import asyncio
import asyncpg
from datetime import datetime, timezone
import os
from dotenv import load_dotenv
from aiohttp import web
import json

load_dotenv()

# --- CONFIGURATION ---
TOKEN = os.getenv("DISCORD_TOKEN")
DB_CONFIG = {
    "database": os.getenv("DB_NAME", "discord_dashboard"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", ""),
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
}

# Channel IDs (configure in .env or here)
CHANNEL_ID_LOGS = int(os.getenv("CHANNEL_ID_LOGS", "0"))
ADMIN_IDS = set(map(int, os.getenv("ADMIN_IDS", "").split(",") if os.getenv("ADMIN_IDS") else []))

# Bot Setup
intents = discord.Intents.default()
intents.message_content = True
intents.messages = True
intents.members = True
bot = commands.Bot(command_prefix="C7/", intents=intents)

# Globals
db_pool = None
logs_channel = None
waiting_users = {}

# Colors
psi_yellow = 0xffe989

# --- API SERVER ---
routes = web.RouteTableDef()

def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    }

def json_response(data, status=200):
    return web.Response(
        text=json.dumps(data, default=str),
        content_type='application/json',
        status=status,
        headers=cors_headers()
    )

@routes.options('/{tail:.*}')
async def handle_options(request):
    return web.Response(status=204, headers=cors_headers())

# Status
@routes.get('/api/status')
async def handle_status(request):
    return json_response({
        'status': 'online',
        'latency': round(bot.latency * 1000),
        'guilds': len(bot.guilds)
    })

# Servers List
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

# --- FOLDER ROUTES ---
@routes.get('/api/folders')
async def handle_folders_get(request):
    if not db_pool: return json_response([])
    async with db_pool.acquire() as conn:
        try:
            rows = await conn.fetch("SELECT id, name, color, owner_id FROM folders ORDER BY id ASC")
            folders = [{'id': r['id'], 'name': r['name'], 'color': r['color'] or '#FFE989', 'owner_id': r['owner_id']} for r in rows]
            return json_response(folders)
        except Exception as e:
            print(f"Folders error: {e}")
            return json_response([])

@routes.post('/api/folders')
async def handle_folder_create(request):
    data = await request.json()
    name = data.get('name')
    owner_id = data.get('ownerId', 'system')
    color = data.get('color', '#FFE989')
    if not name: return json_response({'error': 'Name required'}, 400)
    async with db_pool.acquire() as conn:
        result = await conn.fetchrow(
            "INSERT INTO folders (name, color, owner_id) VALUES ($1, $2, $3) RETURNING id, name, color, owner_id",
            name, color, owner_id
        )
        return json_response({'id': result['id'], 'name': result['name'], 'color': result['color']})

@routes.put('/api/folders/{id}')
async def handle_folder_update(request):
    folder_id = int(request.match_info['id'])
    data = await request.json()
    name = data.get('name')
    color = data.get('color')
    async with db_pool.acquire() as conn:
        await conn.execute("UPDATE folders SET name=$1, color=$2 WHERE id=$3", name, color, folder_id)
    return json_response({'status': 'updated'})

@routes.delete('/api/folders/{id}')
async def handle_folder_delete(request):
    folder_id = int(request.match_info['id'])
    async with db_pool.acquire() as conn:
        await conn.execute("DELETE FROM folders WHERE id=$1", folder_id)
    return json_response({'status': 'deleted'})

@routes.get('/api/folders/{id}/servers')
async def handle_folder_servers_get(request):
    folder_id = int(request.match_info['id'])
    if not db_pool: return json_response([])
    async with db_pool.acquire() as conn:
        rows = await conn.fetch("SELECT server_id, server_name FROM server_folders WHERE folder_id=$1", folder_id)
        servers = [{'server_id': str(r['server_id']), 'server_name': r['server_name']} for r in rows]
        return json_response(servers)

@routes.post('/api/folders/{id}/servers')
async def handle_folder_server_add(request):
    folder_id = int(request.match_info['id'])
    data = await request.json()
    server_id = data.get('serverId')
    server_name = data.get('serverName', f"Server {server_id}")
    
    # Try to get real name from bot
    try:
        guild = bot.get_guild(int(server_id))
        if guild: server_name = guild.name
    except:
        pass

    if not server_id: return json_response({'error': 'Server ID required'}, 400)
    
    async with db_pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO server_folders (folder_id, server_id, server_name) 
            VALUES ($1, $2, $3)
            ON CONFLICT (folder_id, server_id) DO NOTHING
        """, folder_id, int(server_id), server_name)
    return json_response({'status': 'added'})

@routes.delete('/api/folders/{folder_id}/servers/{server_id}')
async def handle_folder_server_remove(request):
    folder_id = int(request.match_info['folder_id'])
    server_id = int(request.match_info['server_id'])
    async with db_pool.acquire() as conn:
        await conn.execute("DELETE FROM server_folders WHERE folder_id=$1 AND server_id=$2", folder_id, server_id)
    return json_response({'status': 'removed'})

# --- LOG ROUTES ---
@routes.get('/api/logs/messages')
async def handle_logs_messages(request):
    if not db_pool: return json_response([])
    try:
        limit = int(request.query.get('limit', 50))
        async with db_pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT folder, username, content, timestamp, user_id FROM saved_msg ORDER BY timestamp DESC LIMIT $1",
                limit
            )
        logs = []
        for r in rows:
            logs.append({
                'server_name': r['folder'],
                'username': r['username'],
                'user_id': str(r['user_id']),
                'content': r['content'],
                'created_at': r['timestamp'].isoformat() if r['timestamp'] else None
            })
        return json_response(logs)
    except Exception as e:
        print(f"Logs error: {e}")
        return json_response([])

# Global Send
@routes.post('/api/send')
async def handle_api_send(request):
    data = await request.json()
    target_id = data.get('targetId')
    message = data.get('message')
    if not target_id or not message:
        return json_response({'error': 'Missing fields'}, 400)
    try:
        channel = bot.get_channel(int(target_id))
        if channel:
            await channel.send(message)
            return json_response({'status': 'sent to channel'})
        user = await bot.fetch_user(int(target_id))
        if user:
            await user.send(message)
            return json_response({'status': 'sent to user'})
        return json_response({'error': 'not found'}, 404)
    except Exception as e:
        return json_response({'error': str(e)}, 500)

# --- BOT EVENTS ---
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
    global logs_channel
    if CHANNEL_ID_LOGS:
        logs_channel = bot.get_channel(CHANNEL_ID_LOGS)
    print(f"✅ {bot.user} is ready!")
    print(f"📊 Connected to {len(bot.guilds)} servers")
    
    # Initialize Database Tables
    if db_pool:
        async with db_pool.acquire() as conn:
            await conn.execute("""
            CREATE TABLE IF NOT EXISTS members (
                id SERIAL PRIMARY KEY,
                user_id BIGINT UNIQUE NOT NULL,
                username TEXT,
                join_date TIMESTAMPTZ
            );
            """)
            await conn.execute("""
            CREATE TABLE IF NOT EXISTS saved_msg (
                id SERIAL PRIMARY KEY,
                user_id BIGINT,
                folder TEXT,
                username TEXT,
                content TEXT,
                timestamp TIMESTAMPTZ,
                channel_id BIGINT,
                message_id BIGINT
            );
            """)
            await conn.execute("""
            CREATE TABLE IF NOT EXISTS folders (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                color TEXT DEFAULT '#FFE989',
                owner_id TEXT
            );
            """)
            await conn.execute("""
            CREATE TABLE IF NOT EXISTS server_folders (
                folder_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
                server_id BIGINT,
                server_name TEXT,
                PRIMARY KEY (folder_id, server_id)
            );
            """)
            print("📦 Database tables ready")
    bot.add_view(SaveView())

@bot.event
async def on_message(message: discord.Message):
    if message.author == bot.user: return
    if message.content.startswith(bot.command_prefix):
        await bot.process_commands(message)
        return

    # Log member
    if db_pool:
        async with db_pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO members (user_id, username, join_date)
                VALUES ($1, $2, $3)
                ON CONFLICT (user_id) DO NOTHING
            """, message.author.id, str(message.author), datetime.now(timezone.utc))

    # Folder saving response
    user_id = message.author.id
    if user_id in waiting_users:
        folder_input = message.content.strip()
        saved_message = waiting_users[user_id]
        if folder_input.lower() in ['no', 'none', 'default', '-']:
            folder_input = 'default'
        
        if db_pool:
            async with db_pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO saved_msg (user_id, folder, username, content, timestamp, channel_id, message_id)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                """, saved_message['user_id'], folder_input, saved_message['username'], 
                saved_message['content'], datetime.now(timezone.utc),
                saved_message['channel_id'], saved_message['message_id'])
        await message.reply("✅ Message saved!")
        del waiting_users[user_id]
        return

    # Log to channel
    if logs_channel:
        embed = discord.Embed(
            title="Message sent",
            description=f"**{message.author}** ({message.author.id}) sent\n```{message.content}```\nin {message.channel.mention}",
            color=psi_yellow
        )
        embed.set_author(name=str(message.author), icon_url=message.author.avatar.url if message.author.avatar else None)
        view = SaveView(message)
        await logs_channel.send(embed=embed, view=view)

    await bot.process_commands(message)

# --- COMMANDS ---
@bot.command(name="show_saved")
async def show_saved(ctx, folder: str = None):
    folder = folder or "default"
    if not db_pool: return await ctx.send("❌ DB Error")
    async with db_pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM saved_msg WHERE folder=$1 ORDER BY timestamp ASC", folder)
    if not rows: return await ctx.send(f"📭 No logs in {folder}")
    await ctx.send(f"📬 Found {len(rows)} messages in '{folder}'")

@bot.command(name="global_send")
async def global_sending(ctx, channel_id: int, *, content: str):
    if ctx.author.id not in ADMIN_IDS: return
    channel = bot.get_channel(channel_id)
    if channel:
        await channel.send(content)
        await ctx.send("✅ Sent!")

@bot.command(name="servers")
async def list_servers(ctx):
    if ctx.author.id not in ADMIN_IDS: return
    servers = [f"• {g.name} ({g.id})" for g in bot.guilds]
    await ctx.send(f"**Connected Servers:**\n" + "\n".join(servers[:20]))

# --- MAIN ---
async def main():
    global db_pool
    
    # Connect to Database
    if DB_CONFIG["password"]:
        try:
            db_pool = await asyncpg.create_pool(**DB_CONFIG)
            print("✅ Database connected")
        except Exception as e:
            print(f"⚠️ Database failed: {e}")
            print("Bot will run without database features")
    
    # Start API Server
    app = web.Application()
    app.add_routes(routes)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', 5000)
    await site.start()
    print("🌐 API Server listening on http://localhost:5000")

    # Start Bot
    if TOKEN:
        async with bot:
            await bot.start(TOKEN)
    else:
        print("❌ DISCORD_TOKEN not found in .env!")
        print("   Bot features disabled. API server still running.")
        while True:
            await asyncio.sleep(3600)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Bot stopped")
