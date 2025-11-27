import { wallpaperService } from './wallpaperService';
import { storageService } from './storageService';

type RotationCallback = (filePath: string) => void;

class WallpaperRotationService {
  private timer: NodeJS.Timeout | null = null;
  private images: string[] = [];
  private currentIndex = 0;
  private callback: RotationCallback | null = null;

  /**
   * 开始壁纸轮换
   * @param images 图片路径数组
   * @param intervalMinutes 间隔分钟数
   * @param callback 轮换时的回调
   */
  start(images: string[], intervalMinutes: number, callback?: RotationCallback): void {
    this.stop();

    if (images.length === 0) {
      console.warn('No images provided for rotation');
      return;
    }

    this.images = images;
    this.currentIndex = 0;
    this.callback = callback || null;

    // 立即设置第一张
    this.rotate();

    // 设置定时器
    const intervalMs = intervalMinutes * 60 * 1000;
    this.timer = setInterval(() => {
      this.rotate();
    }, intervalMs);

    // 保存设置
    storageService.saveSettings({
      autoRotate: true,
      rotateInterval: intervalMinutes
    });
  }

  /**
   * 停止壁纸轮换
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.images = [];
    this.currentIndex = 0;

    // 保存设置
    storageService.saveSettings({
      autoRotate: false
    });
  }

  /**
   * 检查是否正在轮换
   */
  isRunning(): boolean {
    return this.timer !== null;
  }

  /**
   * 立即切换到下一张
   */
  async next(): Promise<void> {
    await this.rotate();
  }

  /**
   * 切换到上一张
   */
  async previous(): Promise<void> {
    this.currentIndex = (this.currentIndex - 2 + this.images.length) % this.images.length;
    await this.rotate();
  }

  /**
   * 执行轮换
   */
  private async rotate(): Promise<void> {
    if (this.images.length === 0) return;

    const filePath = this.images[this.currentIndex];
    const result = await wallpaperService.setWallpaper(filePath);

    if (result.success) {
      this.callback?.(filePath);
    } else {
      console.error('Failed to set wallpaper during rotation:', result.error);
    }

    // 移动到下一张
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
  }

  /**
   * 获取当前轮换状态
   */
  getStatus(): {
    isRunning: boolean;
    currentImage: string | null;
    totalImages: number;
    currentIndex: number;
  } {
    return {
      isRunning: this.isRunning(),
      currentImage: this.images[this.currentIndex] || null,
      totalImages: this.images.length,
      currentIndex: this.currentIndex
    };
  }
}

export const wallpaperRotationService = new WallpaperRotationService();
