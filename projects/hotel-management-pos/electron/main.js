const { app, BrowserWindow, shell } = require('electron');
const path   = require('path');
const { fork } = require('child_process');

let mainWindow;
let serverProcess;

const PORT       = 5000;
const SERVER_URL = `http://localhost:${PORT}`;

function startServer() {
  const serverPath = path.join(__dirname, '../server/index.js');
  serverProcess = fork(serverPath, [], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'inherit',
  });
  serverProcess.on('error', (err) => console.error('Server error:', err));
}

function waitForServer(url, retries = 20, delay = 500) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      fetch(url + '/api/network-info')
        .then(() => resolve())
        .catch(() => {
          if (n <= 0) return reject(new Error('Server did not start in time'));
          setTimeout(() => attempt(n - 1), delay);
        });
    };
    attempt(retries);
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 600,
    title: 'Smart Hotel POS',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: '#0f172a',
    show: false,
  });

  // Show a loading screen first
  mainWindow.loadURL('data:text/html,<body style="background:#0f172a;color:#14b8a6;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-size:1.5rem">Starting Smart Hotel POS…</body>');
  mainWindow.show();

  startServer();

  try {
    await waitForServer(SERVER_URL);
    mainWindow.loadURL(SERVER_URL);
  } catch (_) {
    mainWindow.loadURL('data:text/html,<body style="background:#0f172a;color:#ef4444;font-family:sans-serif;padding:2rem">Error: Could not start server. Please check if port 5000 is free.</body>');
  }

  mainWindow.on('closed', () => { mainWindow = null; });

  // Open external links in browser, not Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
