import type { ImageInfo } from '../../shared/types';

// 将 Windows 路径转换为 local-file:// URL
const pathToLocalFileUrl = (filePath: string): string => {
  // 将反斜杠转为正斜杠，并对路径进行 URL 编码（但保留斜杠和冒号）
  const normalized = filePath.replace(/\\/g, '/');
  // 编码每个路径段，保留 / 和 :
  const encoded = normalized.split('/').map((segment, index) => {
    // 第一段可能是驱动器号如 "D:"，不需要编码冒号
    if (index === 0 && segment.includes(':')) {
      return segment;
    }
    return encodeURIComponent(segment);
  }).join('/');
  return `local-file:///${encoded}`;
};

interface ImageGridProps {
  images: ImageInfo[];
  favorites: string[];
  selectedImage: ImageInfo | null;
  onSelectImage: (image: ImageInfo) => void;
}

export function ImageGrid({
  images,
  favorites,
  selectedImage,
  onSelectImage,
}: ImageGridProps) {
  return (
    <div className="image-grid">
      {images.map((image) => (
        <div
          key={image.path}
          className={`image-card ${selectedImage?.path === image.path ? 'ring-2 ring-accent' : ''}`}
          onClick={() => onSelectImage(image)}
        >
          {/* 图片 */}
          <img
            src={image.thumbnail || pathToLocalFileUrl(image.path)}
            alt={image.name}
            loading="lazy"
          />

          {/* 收藏标记 */}
          {favorites.includes(image.path) && (
            <div className="absolute top-2 right-2 text-yellow-400 text-lg drop-shadow-lg">
              ⭐
            </div>
          )}

          {/* 悬停遮罩 */}
          <div className="overlay">
            <div className="text-center">
              <span className="text-4xl">🔍</span>
              <p className="text-sm mt-2">点击选择查看详情</p>
            </div>
          </div>

          {/* 文件名 */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <p className="text-sm truncate">{image.name}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
