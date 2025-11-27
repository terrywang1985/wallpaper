import type { ImageInfo } from '../../shared/types';

interface PreviewPanelProps {
  image: ImageInfo;
  isFavorite: boolean;
  onSetWallpaper: () => void;
  onToggleFavorite: () => void;
  onShowInFolder: () => void;
  onClose: () => void;
}

export function PreviewPanel({
  image,
  isFavorite,
  onSetWallpaper,
  onToggleFavorite,
  onShowInFolder,
  onClose,
}: PreviewPanelProps) {
  // 格式化文件大小
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  // 格式化日期
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <aside className="preview-panel animate-fade-in">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-dark-border">
        <h2 className="font-semibold">图片详情</h2>
        <button
          onClick={onClose}
          className="btn btn-ghost p-1 text-xl"
          title="关闭"
        >
          ✕
        </button>
      </div>

      {/* 预览图 */}
      <div className="p-4">
        <div className="relative rounded-lg overflow-hidden bg-dark-border">
          <img
            src={image.thumbnail || `file://${image.path}`}
            alt={image.name}
            className="w-full aspect-video object-cover"
          />
          {isFavorite && (
            <div className="absolute top-2 right-2 text-yellow-400 text-xl">⭐</div>
          )}
        </div>
      </div>

      {/* 文件信息 */}
      <div className="px-4 space-y-3">
        <div>
          <label className="text-xs text-dark-text-secondary block mb-1">文件名</label>
          <p className="text-sm break-all">{image.name}</p>
        </div>
        <div>
          <label className="text-xs text-dark-text-secondary block mb-1">文件路径</label>
          <p className="text-xs text-dark-text-secondary break-all">{image.path}</p>
        </div>
        <div className="flex gap-4">
          <div>
            <label className="text-xs text-dark-text-secondary block mb-1">文件大小</label>
            <p className="text-sm">{formatSize(image.size)}</p>
          </div>
          <div>
            <label className="text-xs text-dark-text-secondary block mb-1">修改时间</label>
            <p className="text-sm">{formatDate(image.modifiedTime)}</p>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="mt-auto p-4 space-y-2">
        <button onClick={onSetWallpaper} className="btn btn-primary w-full">
          🖼️ 设为壁纸
        </button>
        <div className="flex gap-2">
          <button
            onClick={onToggleFavorite}
            className={`btn flex-1 ${isFavorite ? 'btn-secondary text-yellow-400' : 'btn-secondary'}`}
          >
            {isFavorite ? '⭐ 已收藏' : '☆ 收藏'}
          </button>
          <button onClick={onShowInFolder} className="btn btn-secondary flex-1">
            📂 打开位置
          </button>
        </div>
      </div>
    </aside>
  );
}
