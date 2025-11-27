import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import { join } from 'path';
import { imageScanner } from './services/imageScanner';
import { wallpaperService } from './services/wallpaperService';
import { directoryWatcher } from './services/directoryWatcher';
import { storageService } from './services/storageService';
import { thumbnailService } from './services/thumbnailService';

// 确保只运行一个实例
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  let mainWindow: BrowserWindow | null = null;

  const createWindow = () => {
    mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1000,
      minHeight: 700,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false
      },
      titleBarStyle: 'hiddenInset',
      backgroundColor: '#0d1117',
      show: false
    });

    // 开发模式加载本地服务器
    if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
      mainWindow.loadURL('http://localhost:5173');
      mainWindow.webContents.openDevTools();
    } else {
      mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
    }

    mainWindow.once('ready-to-show', () => {
      mainWindow?.show();
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  };

  // 注册 IPC 处理器
  const registerIpcHandlers = () => {
    // 选择目录
    ipcMain.handle('ipc/chooseDirectory', async () => {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        title: '选择截图目录'
      });
      return result.canceled ? null : result.filePaths[0];
    });

    // 扫描图片
    ipcMain.handle('ipc/scanImages', async (_, { directory }: { directory: string }) => {
      return await imageScanner.scanDirectory(directory);
    });

    // 设置壁纸
    ipcMain.handle('ipc/setWallpaper', async (_, { filePath }: { filePath: string }) => {
      return await wallpaperService.setWallpaper(filePath);
    });

    // 监听目录
    ipcMain.handle('ipc/watchDirectory', async (_, { directory }: { directory: string }) => {
      directoryWatcher.watch(directory, (event) => {
        mainWindow?.webContents.send('ipc/directoryChange', event);
      });
      return { success: true };
    });

    // 停止监听
    ipcMain.handle('ipc/stopWatchDirectory', async () => {
      directoryWatcher.stop();
      return { success: true };
    });

    // 获取缩略图
    ipcMain.handle('ipc/getThumbnail', async (_, { filePath }: { filePath: string }) => {
      return await thumbnailService.getThumbnail(filePath);
    });

    // 获取收藏
    ipcMain.handle('ipc/getFavorites', async () => {
      return storageService.getFavorites();
    });

    // 添加收藏
    ipcMain.handle('ipc/addFavorite', async (_, { filePath }: { filePath: string }) => {
      storageService.addFavorite(filePath);
      return { success: true };
    });

    // 移除收藏
    ipcMain.handle('ipc/removeFavorite', async (_, { filePath }: { filePath: string }) => {
      storageService.removeFavorite(filePath);
      return { success: true };
    });

    // 获取设置
    ipcMain.handle('ipc/getSettings', async () => {
      return storageService.getSettings();
    });

    // 保存设置
    ipcMain.handle('ipc/saveSettings', async (_, settings: Record<string, unknown>) => {
      storageService.saveSettings(settings);
      return { success: true };
    });

    // 在文件管理器中显示
    ipcMain.handle('ipc/showInFolder', async (_, { filePath }: { filePath: string }) => {
      shell.showItemInFolder(filePath);
      return { success: true };
    });
  };

  app.whenReady().then(() => {
    registerIpcHandlers();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    directoryWatcher.stop();
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}
