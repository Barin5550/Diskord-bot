# Bot Administration Web Console

This is the single-page application (SPA) web console for the Telegram Bot Administrator.

## Features
- **Landing Page**: Stylish entry point with "Login via Telegram" simulation.
- **Dashboard**: Main control panel with server statistics and bot settings.
- **Server Folders**: Visual grid for managing multiple server contexts.
- **Logs**: Detailed log viewer with status highlighting.
- **Responsive Design**: Adapts from mobile to desktop screens.

## How to specific
1. Simply open `index.html` in any modern web browser.
2. OR serve it using a local static server, e.g., with Python:
   ```bash
   python -m http.server
   ```
   Then open `http://localhost:8000`.

## Project Structure
- `index.html`: Main entry point and layout.
- `styles.css`: All visual styles (Dark Theme + Neon Yellow accents).
- `app.js`: Logic for navigation and state management.
- `assets/img/`: SVG placeholders for images.

## Browser Support
Works in all modern browsers (Chrome, Firefox, Edge, Safari). No build step required.
