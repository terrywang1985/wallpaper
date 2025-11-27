import type { GameConfig } from './types';

// 预定义的游戏列表
export const GAMES: GameConfig[] = [
  {
    id: 'infinitynikki',
    name: '无限暖暖',
    icon: '👗',
    defaultPaths: {
      windows: 'D:\\Program Files\\InfinityNikki\\InfinityNikki\\X6Game\\ScreenShot',
      mac: undefined
    },
    description: '无限暖暖截图保存在游戏安装目录的 X6Game\\ScreenShot 文件夹中'
  },
  {
    id: 'genshin',
    name: '原神',
    icon: '🎮',
    defaultPaths: {
      windows: 'C:\\Program Files\\Genshin Impact\\ScreenShot',
      mac: '~/Library/Containers/com.miHoYo.GenshinImpact/Data/ScreenShot'
    },
    description: '原神游戏截图通常保存在游戏安装目录的 ScreenShot 文件夹中'
  },
  {
    id: 'starrail',
    name: '崩坏：星穹铁道',
    icon: '🚀',
    defaultPaths: {
      windows: 'C:\\Program Files\\Star Rail\\ScreenShot',
      mac: '~/Library/Containers/com.miHoYo.StarRail/Data/ScreenShot'
    },
    description: '星穹铁道截图通常保存在游戏安装目录的 ScreenShot 文件夹中'
  },
  {
    id: 'eldenring',
    name: '艾尔登法环',
    icon: '⚔️',
    defaultPaths: {
      windows: 'C:\\Users\\%USERNAME%\\AppData\\Roaming\\EldenRing\\ScreenShot',
      mac: undefined
    },
    description: '艾尔登法环截图通常保存在 AppData\\Roaming\\EldenRing 目录中'
  },
  {
    id: 'steam',
    name: 'Steam 截图',
    icon: '🎯',
    defaultPaths: {
      windows: 'C:\\Program Files (x86)\\Steam\\userdata\\[用户ID]\\760\\remote',
      mac: '~/Library/Application Support/Steam/userdata/[用户ID]/760/remote'
    },
    description: 'Steam 截图保存在 Steam 安装目录的 userdata 文件夹中，需要找到你的用户 ID 子目录'
  },
  {
    id: 'minecraft',
    name: 'Minecraft',
    icon: '🧱',
    defaultPaths: {
      windows: 'C:\\Users\\%USERNAME%\\AppData\\Roaming\\.minecraft\\screenshots',
      mac: '~/Library/Application Support/minecraft/screenshots'
    },
    description: 'Minecraft 截图保存在 .minecraft/screenshots 目录中'
  },
  {
    id: 'valorant',
    name: 'Valorant',
    icon: '🔫',
    defaultPaths: {
      windows: 'C:\\Users\\%USERNAME%\\Videos\\Valorant',
      mac: undefined
    },
    description: 'Valorant 截图通常保存在用户的 Videos\\Valorant 目录中'
  },
  {
    id: 'lol',
    name: '英雄联盟',
    icon: '🏆',
    defaultPaths: {
      windows: 'C:\\Riot Games\\League of Legends\\Screenshots',
      mac: '/Applications/League of Legends.app/Contents/LoL/Screenshots'
    },
    description: '英雄联盟截图保存在游戏安装目录的 Screenshots 文件夹中'
  },
  {
    id: 'cyberpunk',
    name: '赛博朋克 2077',
    icon: '🌆',
    defaultPaths: {
      windows: 'C:\\Users\\%USERNAME%\\Pictures\\Cyberpunk 2077',
      mac: undefined
    },
    description: '赛博朋克 2077 截图保存在用户的 Pictures\\Cyberpunk 2077 目录中'
  },
  {
    id: 'custom',
    name: '自定义目录',
    icon: '📁',
    defaultPaths: {},
    description: '选择任意目录来浏览图片'
  }
];

// 支持的图片格式
export const SUPPORTED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif'];

// 默认设置
export const DEFAULT_SETTINGS = {
  theme: 'dark' as const,
  autoRotate: false,
  rotateInterval: 30,
  watchEnabled: false
};
