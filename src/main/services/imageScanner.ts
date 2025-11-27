import { readdir, stat } from 'fs/promises';
import { join, extname } from 'path';
import { SUPPORTED_IMAGE_EXTENSIONS } from '../../shared/constants';
import type { ImageInfo } from '../../shared/types';
import { thumbnailService } from './thumbnailService';

class ImageScanner {
  /**
   * 扫描目录中的所有图片
   * @param directory 目录路径
   * @returns 图片信息数组
   */
  async scanDirectory(directory: string): Promise<ImageInfo[]> {
    try {
      const files = await readdir(directory);
      const imageFiles = files.filter(file => 
        SUPPORTED_IMAGE_EXTENSIONS.includes(extname(file).toLowerCase())
      );

      const images: ImageInfo[] = [];

      for (const file of imageFiles) {
        const filePath = join(directory, file);
        try {
          const fileStat = await stat(filePath);
          if (fileStat.isFile()) {
            // 生成缩略图
            const thumbnail = await thumbnailService.getThumbnail(filePath);
            
            images.push({
              name: file,
              path: filePath,
              size: fileStat.size,
              modifiedTime: fileStat.mtimeMs,
              thumbnail
            });
          }
        } catch (error) {
          console.error(`Error reading file ${file}:`, error);
        }
      }

      // 按修改时间降序排列（最新的在前面）
      return images.sort((a, b) => b.modifiedTime - a.modifiedTime);
    } catch (error) {
      console.error('Error scanning directory:', error);
      return [];
    }
  }
}

export const imageScanner = new ImageScanner();
