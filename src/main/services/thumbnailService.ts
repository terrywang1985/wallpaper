import { readFile } from 'fs/promises';
import { createHash } from 'crypto';
import { join } from 'path';
import { app } from 'electron';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

class ThumbnailService {
  private cacheDir: string;
  private cache: Map<string, string> = new Map();

  constructor() {
    // 使用用户数据目录存储缩略图缓存
    this.cacheDir = join(app.getPath('userData'), 'thumbnails');
    this.ensureCacheDir();
  }

  private ensureCacheDir(): void {
    if (!existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * 获取图片的缩略图（Base64 格式）
   * @param filePath 原图路径
   * @returns Base64 格式的图片数据
   */
  async getThumbnail(filePath: string): Promise<string> {
    // 检查内存缓存
    if (this.cache.has(filePath)) {
      return this.cache.get(filePath)!;
    }

    // 生成缓存文件名
    const hash = createHash('md5').update(filePath).digest('hex');
    const cachePath = join(this.cacheDir, `${hash}.jpg`);

    try {
      // 检查磁盘缓存
      if (existsSync(cachePath)) {
        const data = await readFile(cachePath);
        const base64 = `data:image/jpeg;base64,${data.toString('base64')}`;
        this.cache.set(filePath, base64);
        return base64;
      }

      // 尝试使用 sharp 生成缩略图
      try {
        const sharp = require('sharp');
        const buffer = await sharp(filePath)
          .resize(400, 300, { 
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 80 })
          .toBuffer();

        // 保存到磁盘缓存
        writeFileSync(cachePath, buffer);

        const base64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;
        this.cache.set(filePath, base64);
        return base64;
      } catch (sharpError) {
        // 如果 sharp 不可用，直接读取原图并转换为 base64
        console.warn('Sharp not available, falling back to direct file read');
        const data = await readFile(filePath);
        const ext = filePath.toLowerCase().endsWith('.png') ? 'png' : 'jpeg';
        const base64 = `data:image/${ext};base64,${data.toString('base64')}`;
        this.cache.set(filePath, base64);
        return base64;
      }
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      // 返回一个占位符
      return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIj48cmVjdCBmaWxsPSIjMzAzNjNkIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PHRleHQgZmlsbD0iIzhiOTQ5ZSIgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMjAiPuWKoOi9veWksei0pTwvdGV4dD48L3N2Zz4=';
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const thumbnailService = new ThumbnailService();
