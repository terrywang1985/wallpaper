// IPC Channel 类型定义
export interface IpcChannels {
  'ipc/chooseDirectory': {
    request: void;
    response: string | null;
  };
  'ipc/scanImages': {
    request: { directory: string };
    response: ImageInfo[];
  };
  'ipc/setWallpaper': {
    request: { filePath: string };
    response: { success: boolean; error?: string };
  };
  'ipc/watchDirectory': {
    request: { directory: string };
    response: { success: boolean };
  };
  'ipc/stopWatchDirectory': {
    request: void;
    response: { success: boolean };
  };
  'ipc/getThumbnail': {
    request: { filePath: string };
    response: string;
  };
  'ipc/getFavorites': {
    request: void;
    response: string[];
  };
  'ipc/addFavorite': {
    request: { filePath: string };
    response: { success: boolean };
  };
  'ipc/removeFavorite': {
    request: { filePath: string };
    response: { success: boolean };
  };
  'ipc/getSettings': {
    request: void;
    response: AppSettings;
  };
  'ipc/saveSettings': {
    request: Partial<AppSettings>;
    response: { success: boolean };
  };
}

// 图片信息
export interface ImageInfo {
  name: string;
  path: string;
  size: number;
  modifiedTime: number;
  thumbnail?: string;
}

// 游戏配置
export interface GameConfig {
  id: string;
  name: string;
  icon: string;
  defaultPaths: {
    windows?: string;
    mac?: string;
  };
  description: string;
}

// 应用设置
export interface AppSettings {
  theme: 'dark' | 'light';
  autoRotate: boolean;
  rotateInterval: number; // 分钟
  watchEnabled: boolean;
  lastDirectory?: string;
  lastGameId?: string;
}

// 监听事件
export interface WatchEvent {
  type: 'add' | 'change' | 'unlink';
  path: string;
}
