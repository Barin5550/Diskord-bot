# NexusBot Web Console

A modern administration dashboard for the Nexus Discord Bot.

## How to Run This Website
Since this project has been converted to vanilla HTML/JS, you do not need any complex tools to run it.

1.  **Locate the File:** Find the `index.html` file in the main folder.
2.  **Open it:** Double-click `index.html` to open it in your default web browser (Chrome, Firefox, Edge, etc.).
3.  **That's it!** The website will load with the intro animation.

## Project Structure
- `index.html`: The main structure of the website.
- `styles.css`: All the colors, animations, and layouts (Dark + Neon Yellow theme).
- `script.js`: Handles the logic (Intro animation, Tab switching, Mock data, Fake login).

## What is TSX?
You mentioned you saw `.tsx` files earlier. **TSX** stands for **TypeScript XML**. It is a file extension used with **React**, a popular library for building user interfaces. It allows developers to write HTML-like code inside JavaScript logic.

We have **removed** the dependency on TSX/React for this version to make it easier for you to edit as a beginner. You can now edit standard `<div class="...">` tags in the HTML file directly!

## Features
- **Intro Animation:** Matrix-style hacking intro + "The Eyes".
- **Dashboard:** Server stats and configurable presets.
- **Action Logs:** Table showing administration actions.
- **Message Logs:** A custom view based on your Figma design showing message history across servers with color coding.
- **Global Send:** A tool to send messages to a specific ID via the console.
