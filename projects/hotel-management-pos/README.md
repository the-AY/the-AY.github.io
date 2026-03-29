# Hotel Management POS System

A comprehensive Restaurant Management System with dynamic tables, multi-roles (Admin, Cashier, Kitchen KDS), and offline SQLite capability via Electron.

## 🚀 Installation Guide

This project contains three main components: a Backend (`server`), a Frontend (`client`), and a Desktop Wrapper (`electron`).

### 1. Prerequisites
- [Node.js](https://nodejs.org/) installed on your machine.
- Git (optional, for cloning).

### 2. Getting Started
Navigate to the project root directory:
\`\`\`bash
cd projects/hotel-management-pos
\`\`\`

#### Start the Local Backend
The backend uses SQLite to store your data locally and Express to serve the API.
\`\`\`bash
cd server
npm install
node index.js
\`\`\`
*(The server will start on port 5000 and log your local WiFi IP address for other devices to connect).*

#### Start the React Frontend
Open a new terminal window/tab:
\`\`\`bash
cd client
npm install
npm run dev
\`\`\`
*(This will start the UI on \`http://localhost:5173\`)*

### 3. Running as a Desktop App (Offline)
If you want to run this as a standalone desktop application rather than in your browser:
\`\`\`bash
cd electron
npm install
npm start
\`\`\`

---
[⬅️ Back to Main Portfolio](../../README.md)
