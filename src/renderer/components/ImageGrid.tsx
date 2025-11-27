import type { ImageInfo } from '../../shared/types';

interface ImageGridProps {
  images: ImageInfo[];
  favorites: string[];
  selectedImage: ImageInfo | null;
  onSelectImage: (image: ImageInfo) => void;
  onDoubleClick: (image: ImageInfo) => void;
}

export function ImageGrid({
  images,
  favorites,
  selectedImage,
  onSelectImage,
  onDoubleClick,
}: ImageGridProps) {
  return (
    <div className="image-grid">
      {images.map((image) => (
        <div
          key={image.path}
          className={`image-card ${selectedImage?.path === image.path ? 'ring-2 ring-accent' : ''}`}
          onClick={() => onSelectImage(image)}
          onDoubleClick={() => onDoubleClick(image)}
        >
          {/* 图片 */}
          <img
            src={image.thumbnail || `file://${image.path}`}
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
              <p className="text-sm mt-2">点击选择 / 双击预览</p>
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
