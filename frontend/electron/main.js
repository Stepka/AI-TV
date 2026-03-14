const { app, BrowserWindow } = require("electron");
const path = require("path");
const express = require("express");
const serveStatic = require("serve-static");

let server;

function createWindow() {
  // Мини-сервер для отдачи dist
  const appServer = express();
  appServer.use(serveStatic(path.join(__dirname, "../dist"))); // dist от Vite
  server = appServer.listen(5000, () => {
    console.log("Server started on http://localhost:5000");
  });

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Загружаем через локальный сервер
  win.loadURL("http://localhost:5000");
  
  // Опционально DevTools
  win.webContents.openDevTools();
}

// Закрываем сервер при выходе
app.on("window-all-closed", () => {
  if (server) server.close();
  if (process.platform !== "darwin") app.quit();
});

app.whenReady().then(createWindow);