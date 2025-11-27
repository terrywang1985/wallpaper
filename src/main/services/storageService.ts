import Store from 'electron-store';
import { DEFAULT_SETTINGS } from '../../shared/constants';
import type { AppSettings } from '../../shared/types';

interface StoreSchema {
  favorites: string[];
  settings: AppSettings;
  directories: Record<string, string>; // gameId -> directory
}

class StorageService {
  private store: Store<StoreSchema>;

  constructor() {
    this.store = new Store<StoreSchema>({
      name: 'gameshot-wallpaper',
      defaults: {
        favorites: [],
        settings: DEFAULT_SETTINGS,
        directories: {}
      }
    });
  }

  // ============ 收藏相关 ============

  getFavorites(): string[] {
    return this.store.get('favorites', []);
  }

  addFavorite(filePath: string): void {
    const favorites = this.getFavorites();
    if (!favorites.includes(filePath)) {
      favorites.push(filePath);
      this.store.set('favorites', favorites);
    }
  }

  removeFavorite(filePath: string): void {
    const favorites = this.getFavorites();
    const index = favorites.indexOf(filePath);
    if (index > -1) {
      favorites.splice(index, 1);
      this.store.set('favorites', favorites);
    }
  }

  isFavorite(filePath: string): boolean {
    return this.getFavorites().includes(filePath);
  }

  // ============ 设置相关 ============

  getSettings(): AppSettings {
    return this.store.get('settings', DEFAULT_SETTINGS);
  }

  saveSettings(settings: Partial<AppSettings>): void {
    const currentSettings = this.getSettings();
    this.store.set('settings', { ...currentSettings, ...settings });
  }

  // ============ 目录记录 ============

  getDirectory(gameId: string): string | undefined {
    const directories = this.store.get('directories', {});
    return directories[gameId];
  }

  setDirectory(gameId: string, directory: string): void {
    const directories = this.store.get('directories', {});
    directories[gameId] = directory;
    this.store.set('directories', directories);
  }
}

export const storageService = new StorageService();
