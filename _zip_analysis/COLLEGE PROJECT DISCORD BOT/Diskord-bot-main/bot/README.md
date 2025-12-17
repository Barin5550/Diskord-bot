# Discord Bot Backend

Python Discord bot integrated from ra1d9r/thing project.

## Setup

1. **Install Python 3.8+**

2. **Install dependencies:**
   ```bash
   cd bot
   pip install -r requirements.txt
   ```

3. **Create PostgreSQL database:**
   ```sql
   CREATE DATABASE discord_dashboard;
   ```

4. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

5. **Get Discord Bot Token:**
   - Go to https://discord.com/developers/applications
   - Create application → Bot → Copy Token
   - Paste in .env

6. **Run bot:**
   ```bash
   python bot.py
   ```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | Bot status and latency |
| `/api/servers` | GET | List connected servers |
| `/api/folders` | GET/POST | Manage folders |
| `/api/folders/:id/servers` | GET/POST | Servers in folder |
| `/api/logs/messages` | GET | Message logs |
| `/api/send` | POST | Send message to channel/user |

## Bot Commands

| Command | Description |
|---------|-------------|
| `C7/show_saved [folder]` | Show saved messages |
| `C7/global_send <channel_id> <message>` | Send to channel |
| `C7/servers` | List connected servers |
