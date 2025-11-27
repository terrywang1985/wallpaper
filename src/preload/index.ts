import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import type { ImageInfo, AppSettings, WatchEvent } from '../shared/types';

// 定义 API 接口
export interface ElectronAPI {
  // 目录操作
  chooseDirectory: () => Promise<string | null>;
  scanImages: (directory: string) => Promise<ImageInfo[]>;
  
  // 壁纸操作
  setWallpaper: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  
  // 目录监听
  watchDirectory: (directory: string) => Promise<{ success: boolean }>;
  stopWatchDirectory: () => Promise<{ success: boolean }>;
  onDirectoryChange: (callback: (event: WatchEvent) => void) => () => void;
  
  // 缩略图
  getThumbnail: (filePath: string) => Promise<string>;
  
  // 收藏
  getFavorites: () => Promise<string[]>;
  addFavorite: (filePath: string) => Promise<{ success: boolean }>;
  removeFavorite: (filePath: string) => Promise<{ success: boolean }>;
  
  // 设置
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: Partial<AppSettings>) => Promise<{ success: boolean }>;
  
  // 文件操作
  showInFolder: (filePath: string) => Promise<{ success: boolean }>;
  
  // 目录记忆
  getDirectory: (gameId: string) => Promise<string | undefined>;
  setDirectory: (gameId: string, directory: string) => Promise<{ success: boolean }>;
  
  // 自动检测目录
  detectGameDirectory: (paths: string[]) => Promise<{ found: boolean; path: string | null }>;
  
  // 剪贴板
  copyToClipboard: (text: string) => Promise<{ success: boolean }>;
}

// 暴露 API 到渲染进程
const electronAPI: ElectronAPI = {
  chooseDirectory: () => ipcRenderer.invoke('ipc/chooseDirectory'),
  
  scanImages: (directory: string) => 
    ipcRenderer.invoke('ipc/scanImages', { directory }),
  
  setWallpaper: (filePath: string) => 
    ipcRenderer.invoke('ipc/setWallpaper', { filePath }),
  
  watchDirectory: (directory: string) => 
    ipcRenderer.invoke('ipc/watchDirectory', { directory }),
  
  stopWatchDirectory: () => 
    ipcRenderer.invoke('ipc/stopWatchDirectory'),
  
  onDirectoryChange: (callback: (event: WatchEvent) => void) => {
    const listener = (_event: IpcRendererEvent, data: WatchEvent) => callback(data);
    ipcRenderer.on('ipc/directoryChange', listener);
    return () => {
      ipcRenderer.removeListener('ipc/directoryChange', listener);
    };
  },
  
  getThumbnail: (filePath: string) => 
    ipcRenderer.invoke('ipc/getThumbnail', { filePath }),
  
  getFavorites: () => 
    ipcRenderer.invoke('ipc/getFavorites'),
  
  addFavorite: (filePath: string) => 
    ipcRenderer.invoke('ipc/addFavorite', { filePath }),
  
  removeFavorite: (filePath: string) => 
    ipcRenderer.invoke('ipc/removeFavorite', { filePath }),
  
  getSettings: () => 
    ipcRenderer.invoke('ipc/getSettings'),
  
  saveSettings: (settings: Partial<AppSettings>) => 
    ipcRenderer.invoke('ipc/saveSettings', settings),
  
  showInFolder: (filePath: string) => 
    ipcRenderer.invoke('ipc/showInFolder', { filePath }),
  
  getDirectory: (gameId: string) => 
    ipcRenderer.invoke('ipc/getDirectory', { gameId }),
  
  setDirectory: (gameId: string, directory: string) => 
    ipcRenderer.invoke('ipc/setDirectory', { gameId, directory }),
  
  detectGameDirectory: (paths: string[]) => 
    ipcRenderer.invoke('ipc/detectGameDirectory', { paths }),
  
  copyToClipboard: (text: string) => 
    ipcRenderer.invoke('ipc/copyToClipboard', { text }),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// 类型声明扩展
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
