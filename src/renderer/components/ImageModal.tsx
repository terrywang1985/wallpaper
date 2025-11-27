import { useEffect, useCallback } from 'react';
import type { ImageInfo } from '../../shared/types';

interface ImageModalProps {
  image: ImageInfo;
  onClose: () => void;
  onSetWallpaper: () => void;
  onToggleFavorite: () => void;
  isFavorite: boolean;
}

export function ImageModal({
  image,
  onClose,
  onSetWallpaper,
  onToggleFavorite,
  isFavorite,
}: ImageModalProps) {
  // ESC 键关闭
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // 阻止点击图片关闭
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content relative" onClick={handleContentClick}>
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          ✕
        </button>

        {/* 收藏标记 */}
        {isFavorite && (
          <div className="absolute top-4 left-4 z-10 text-yellow-400 text-2xl">⭐</div>
        )}

        {/* 图片 */}
        <div className="max-w-[90vw] max-h-[80vh] overflow-hidden">
          <img
            src={`file://${image.path}`}
            alt={image.name}
            className="w-full h-full object-contain"
          />
        </div>

        {/* 底部操作栏 */}
        <div className="bg-dark-surface border-t border-dark-border p-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{image.name}</h3>
            <p className="text-sm text-dark-text-secondary">按 ESC 关闭</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onToggleFavorite}
              className={`btn ${isFavorite ? 'btn-secondary text-yellow-400' : 'btn-secondary'}`}
            >
              {isFavorite ? '⭐ 已收藏' : '☆ 收藏'}
            </button>
            <button onClick={onSetWallpaper} className="btn btn-primary">
              🖼️ 设为壁纸
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
