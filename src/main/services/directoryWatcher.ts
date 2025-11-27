import chokidar, { FSWatcher } from 'chokidar';
import { extname } from 'path';
import { SUPPORTED_IMAGE_EXTENSIONS } from '../../shared/constants';
import type { WatchEvent } from '../../shared/types';

type WatchCallback = (event: WatchEvent) => void;

class DirectoryWatcher {
  private watcher: FSWatcher | null = null;
  private callback: WatchCallback | null = null;

  /**
   * 开始监听目录
   * @param directory 目录路径
   * @param callback 回调函数
   */
  watch(directory: string, callback: WatchCallback): void {
    // 先停止之前的监听
    this.stop();

    this.callback = callback;

    // 创建新的监听器
    this.watcher = chokidar.watch(directory, {
      ignored: /(^|[\/\\])\../, // 忽略隐藏文件
      persistent: true,
      ignoreInitial: true, // 忽略初始扫描
      depth: 0 // 只监听一级目录
    });

    // 监听文件添加事件
    this.watcher.on('add', (path) => {
      if (this.isImageFile(path)) {
        this.callback?.({ type: 'add', path });
      }
    });

    // 监听文件修改事件
    this.watcher.on('change', (path) => {
      if (this.isImageFile(path)) {
        this.callback?.({ type: 'change', path });
      }
    });

    // 监听文件删除事件
    this.watcher.on('unlink', (path) => {
      if (this.isImageFile(path)) {
        this.callback?.({ type: 'unlink', path });
      }
    });

    // 监听错误
    this.watcher.on('error', (error) => {
      console.error('Directory watcher error:', error);
    });
  }

  /**
   * 停止监听
   */
  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      this.callback = null;
    }
  }

  /**
   * 检查是否是支持的图片文件
   */
  private isImageFile(filePath: string): boolean {
    const ext = extname(filePath).toLowerCase();
    return SUPPORTED_IMAGE_EXTENSIONS.includes(ext);
  }
}

export const directoryWatcher = new DirectoryWatcher();
