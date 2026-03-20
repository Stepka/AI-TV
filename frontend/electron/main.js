const { app, BrowserWindow, session } = require("electron");
const path = require("path");
const express = require("express");
const serveStatic = require("serve-static");

let server;

function createWindow() {
  // Мини-сервер для отдачи dist
  const appServer = express();
  appServer.use(serveStatic(path.join(__dirname, "../dist"))); // dist от Vite
  server = appServer.listen(3030, () => {
    console.log("Server started on http://localhost:3030");
  });

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    // fullscreen: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Загружаем через локальный сервер
  win.loadURL("http://localhost:3030");
  
  // Опционально DevTools
  // win.webContents.openDevTools();
}

// Закрываем сервер при выходе
app.on("window-all-closed", () => {
  if (server) server.close();
  if (process.platform !== "darwin") app.quit();
});

app.whenReady().then(() => {

  // Блокируем телеметрию VK player
  session.defaultSession.webRequest.onBeforeRequest(
    {
      urls: [
        "*://vk.com/video.php?act=track_player_events*",
        "*://vk.com/al_video.php?act=log*",
        "*://vk.com/al_video.php?act=stats*"
      ]
    },
    (details, callback) => callback({ cancel: true })
  );

  createWindow();
});