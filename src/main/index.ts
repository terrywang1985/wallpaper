import { app, BrowserWindow, ipcMain, dialog, shell, protocol, net, Menu } from 'electron';
import { join } from 'path';
import { pathToFileURL } from 'url';
import { existsSync } from 'fs';
import { imageScanner } from './services/imageScanner';
import { wallpaperService } from './services/wallpaperService';
import { directoryWatcher } from './services/directoryWatcher';
import { storageService } from './services/storageService';
import { thumbnailService } from './services/thumbnailService';
import { logService } from './services/logService';

// 扩展环境变量并检测目录是否存在
const expandEnvVariables = (path: string): string => {
  return path.replace(/%([^%]+)%/g, (_, key) => process.env[key] || '');
};

const detectExistingDirectory = (paths: string[]): string | null => {
  for (const rawPath of paths) {
    const expandedPath = expandEnvVariables(rawPath);
    logService.debug('检查目录是否存在', { rawPath, expandedPath });
    if (existsSync(expandedPath)) {
      logService.info('找到有效目录', { path: expandedPath });
      return expandedPath;
    }
  }
  return null;
};

// 确保只运行一个实例
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  let mainWindow: BrowserWindow | null = null;

  // 注册自定义协议用于加载本地图片
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'local-file',
      privileges: {
        secure: true,
        supportFetchAPI: true,
        bypassCSP: true,
        stream: true
      }
    }
  ]);

  const createWindow = () => {
    logService.info('创建主窗口');
    
    // 移除默认菜单栏
    Menu.setApplicationMenu(null);
    
    mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1000,
      minHeight: 700,
      autoHideMenuBar: true,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        webSecurity: true
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
      logService.info('收到设置壁纸请求', { filePath });
      const result = await wallpaperService.setWallpaper(filePath);
      logService.info('设置壁纸结果', result);
      return result;
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

    // 获取游戏保存的目录
    ipcMain.handle('ipc/getDirectory', async (_, { gameId }: { gameId: string }) => {
      return storageService.getDirectory(gameId);
    });

    // 保存游戏目录
    ipcMain.handle('ipc/setDirectory', async (_, { gameId, directory }: { gameId: string; directory: string }) => {
      storageService.setDirectory(gameId, directory);
      return { success: true };
    });

    // 自动检测游戏目录
    ipcMain.handle('ipc/detectGameDirectory', async (_, { paths }: { paths: string[] }) => {
      const foundPath = detectExistingDirectory(paths);
      return { found: foundPath !== null, path: foundPath };
    });

    // 复制文本到剪贴板
    ipcMain.handle('ipc/copyToClipboard', async (_, { text }: { text: string }) => {
      const { clipboard } = await import('electron');
      clipboard.writeText(text);
      return { success: true };
    });
  };

  app.whenReady().then(() => {
    logService.info('应用启动', { 
      version: app.getVersion(),
      platform: process.platform,
      logPath: logService.getLogPath()
    });
    
    // 注册自定义协议处理器，用于安全加载本地图片
    protocol.handle('local-file', (request) => {
      // 从 URL 中提取文件路径
      // URL 格式: local-file:///D:/path/to/file.jpg
      const url = request.url.replace('local-file:///', '');
      const decodedPath = decodeURIComponent(url);
      logService.debug('加载本地文件', { url: request.url, decodedPath });
      return net.fetch(pathToFileURL(decodedPath).href);
    });
    
    registerIpcHandlers();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    logService.info('所有窗口已关闭');
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
