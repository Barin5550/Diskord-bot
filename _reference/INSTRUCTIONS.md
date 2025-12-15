# How to Run Nexus Console

This project consists of two parts:
1. **Frontend**: The `index.html` website.
2. **Backend**: The `project.py` Discord bot + API server.

---

## Prerequisities
- Python 3.8+
- PostgreSQL Database
- A Discord Bot Token

---

## Step 1: Database Setup
1. Install [PostgreSQL](https://www.postgresql.org/download/).
2. Create a new database (e.g., `discord_dashboard`).
3. Remember your username (default: `postgres`) and password.

---

## Step 2: Backend Setup
1. **Prepare the Code**:
   - Copy the content of `Diskord-bot-main/project_code.txt`.
   - Paste it into a new file named `project.py`.

2. **Configure Environment**:
   - Create a file named `.env` in the same folder.
   - Add the following configurations:
     ```ini
     DISCORD_TOKEN=your_discord_bot_token
     DB_NAME=discord_dashboard
     DB_USER=postgres
     DB_PASSWORD=your_password
     DB_HOST=localhost
     DB_PORT=5432
     ```

3. **Install Libraries**:
   Open your terminal and run:
   ```bash
   pip install discord.py asyncpg python-dotenv aiohttp
   ```

4. **Start the Bot**:
   ```bash
   python project.py
   ```
   *Keep this terminal window open. It runs the API server on port 5000.*

---

## Step 3: Frontend Setup
1. Locate `index.html` in the main folder.
2. Open it directly in Chrome/Firefox/Edge.
3. **Login**: Click "Sign in with Discord". (Since this is a demo, it will simulate a login).

**Note:** If the website cannot fetch data (folders, logs), ensure `project.py` is running and there are no errors in the Python console.
