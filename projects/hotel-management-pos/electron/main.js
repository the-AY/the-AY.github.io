const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Start the Express Server
  const serverPath = path.join(__dirname, '../server/index.js');
  serverProcess = fork(serverPath, [], {
    env: { PORT: 5000 },
    stdio: 'inherit'
  });

  // Load the React App (In production, load the built dist/index.html)
  // For dev, connect to localhost:5173
  const isDev = !app.isPackaged;
  if (isDev) {
    // We assume Vite is running on localhost:5173
    setTimeout(() => {
        mainWindow.loadURL('http://localhost:5173');
    }, 2000); 
  } else {
    mainWindow.loadFile(path.join(__dirname, '../client/dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
