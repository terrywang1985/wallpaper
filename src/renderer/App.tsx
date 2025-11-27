import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ImageGrid } from './components/ImageGrid';
import { PreviewPanel } from './components/PreviewPanel';
import { Toast, ToastType } from './components/Toast';
import { GAMES } from '../shared/constants';
import type { GameConfig, ImageInfo } from '../shared/types';

function App() {
  // 状态
  const [selectedGame, setSelectedGame] = useState<GameConfig | null>(null);
  const [currentDirectory, setCurrentDirectory] = useState<string | null>(null);
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // 加载收藏列表
  useEffect(() => {
    const loadFavorites = async () => {
      const favs = await window.electronAPI.getFavorites();
      setFavorites(favs);
    };
    loadFavorites();
  }, []);

  // 监听目录变化
  useEffect(() => {
    if (!isWatching || !currentDirectory) return;

    const unsubscribe = window.electronAPI.onDirectoryChange(async (event) => {
      if (event.type === 'add') {
        // 新增图片时重新扫描
        const newImages = await window.electronAPI.scanImages(currentDirectory);
        setImages(newImages);
        showToast('发现新截图！', 'info');
      } else if (event.type === 'unlink') {
        // 删除图片时从列表中移除
        setImages((prev) => prev.filter((img) => img.path !== event.path));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isWatching, currentDirectory]);

  // 显示 Toast
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // 选择游戏
  const handleSelectGame = async (game: GameConfig) => {
    setSelectedGame(game);
    setCurrentDirectory(null);
    setImages([]);
    setSelectedImage(null);
    
    // 首先尝试加载上次保存的目录
    const savedDirectory = await window.electronAPI.getDirectory(game.id);
    if (savedDirectory) {
      setCurrentDirectory(savedDirectory);
      await scanDirectory(savedDirectory);
      return;
    }
    
    // 如果没有保存的目录，尝试自动检测默认路径
    const defaultPaths = game.defaultPaths?.windows;
    if (defaultPaths && defaultPaths.length > 0) {
      const result = await window.electronAPI.detectGameDirectory(defaultPaths);
      if (result.found && result.path) {
        setCurrentDirectory(result.path);
        // 保存检测到的目录
        await window.electronAPI.setDirectory(game.id, result.path);
        await scanDirectory(result.path);
        showToast(`自动找到 ${game.name} 截图目录`, 'success');
        return;
      }
    }
  };

  // 选择目录
  const handleChooseDirectory = async () => {
    const directory = await window.electronAPI.chooseDirectory();
    if (directory && selectedGame) {
      setCurrentDirectory(directory);
      // 保存选择的目录
      await window.electronAPI.setDirectory(selectedGame.id, directory);
      await scanDirectory(directory);
    }
  };

  // 扫描目录
  const scanDirectory = async (directory: string) => {
    setIsLoading(true);
    try {
      const scannedImages = await window.electronAPI.scanImages(directory);
      setImages(scannedImages);
      if (scannedImages.length === 0) {
        showToast('该目录下没有找到图片', 'info');
      } else {
        showToast(`找到 ${scannedImages.length} 张图片`, 'success');
      }
    } catch (error) {
      showToast('扫描目录失败', 'error');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // 设置壁纸
  const handleSetWallpaper = async (image: ImageInfo) => {
    const result = await window.electronAPI.setWallpaper(image.path);
    if (result.success) {
      showToast('壁纸设置成功！', 'success');
    } else {
      showToast(`设置失败: ${result.error}`, 'error');
    }
  };

  // 切换收藏
  const handleToggleFavorite = async (image: ImageInfo) => {
    const isFav = favorites.includes(image.path);
    if (isFav) {
      await window.electronAPI.removeFavorite(image.path);
      setFavorites((prev) => prev.filter((p) => p !== image.path));
      showToast('已取消收藏', 'info');
    } else {
      await window.electronAPI.addFavorite(image.path);
      setFavorites((prev) => [...prev, image.path]);
      showToast('已添加到收藏', 'success');
    }
  };

  // 切换目录监听
  const handleToggleWatch = async () => {
    if (!currentDirectory) return;

    if (isWatching) {
      await window.electronAPI.stopWatchDirectory();
      setIsWatching(false);
      showToast('已停止监听目录', 'info');
    } else {
      await window.electronAPI.watchDirectory(currentDirectory);
      setIsWatching(true);
      showToast('开始监听目录变化', 'success');
    }
  };

  // 在文件夹中显示
  const handleShowInFolder = async (image: ImageInfo) => {
    await window.electronAPI.showInFolder(image.path);
  };

  // 复制路径到剪贴板
  const handleCopyPath = async () => {
    if (currentDirectory) {
      await window.electronAPI.copyToClipboard(currentDirectory);
      showToast('路径已复制到剪贴板', 'success');
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-dark-bg">
      {/* 侧边栏 - 游戏列表 */}
      <Sidebar
        games={GAMES}
        selectedGame={selectedGame}
        onSelectGame={handleSelectGame}
      />

      {/* 主内容区 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部栏 */}
        <header className="drag-region h-12 flex items-center justify-between px-4 border-b border-dark-border bg-dark-surface">
          <div className="flex items-center gap-4 no-drag">
            {selectedGame && (
              <>
                <span className="text-lg">{selectedGame.icon}</span>
                <h1 className="text-lg font-semibold">{selectedGame.name}</h1>
                {currentDirectory && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-dark-text-secondary truncate max-w-xs" title={currentDirectory}>
                      {currentDirectory}
                    </span>
                    <button
                      onClick={handleCopyPath}
                      className="text-dark-text-secondary hover:text-dark-text transition-colors"
                      title="复制路径"
                    >
                      📋
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2 no-drag">
            {currentDirectory && (
              <button
                onClick={handleToggleWatch}
                className={`btn btn-ghost text-sm ${isWatching ? 'text-accent' : ''}`}
              >
                {isWatching ? '🔔 监听中' : '🔕 开启监听'}
              </button>
            )}
          </div>
        </header>

        {/* 内容区 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 图片网格 */}
          <div className="flex-1 overflow-auto">
            {!selectedGame ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎮</div>
                  <h2 className="text-xl font-semibold mb-2">欢迎使用 GameShot Wallpaper Manager</h2>
                  <p className="text-dark-text-secondary">请从左侧选择一个游戏开始浏览截图</p>
                </div>
              </div>
            ) : !currentDirectory ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <div className="text-6xl mb-4">{selectedGame.icon}</div>
                  <h2 className="text-xl font-semibold mb-2">{selectedGame.name}</h2>
                  <p className="text-dark-text-secondary mb-4">{selectedGame.description}</p>
                  {selectedGame.defaultPaths.windows && selectedGame.defaultPaths.windows.length > 0 && (
                    <p className="text-sm text-dark-text-secondary mb-4 bg-dark-surface p-3 rounded-lg border border-dark-border">
                      <span className="block mb-1">💡 正在检测常见位置...</span>
                      <code className="text-xs break-all">{selectedGame.defaultPaths.windows[0]}</code>
                      {selectedGame.defaultPaths.windows.length > 1 && (
                        <span className="block text-xs mt-1">等 {selectedGame.defaultPaths.windows.length} 个可能位置</span>
                      )}
                    </p>
                  )}
                  <button onClick={handleChooseDirectory} className="btn btn-primary">
                    📁 选择截图目录
                  </button>
                </div>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-4xl mb-4 animate-spin">⏳</div>
                  <p className="text-dark-text-secondary">正在扫描图片...</p>
                </div>
              </div>
            ) : images.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl mb-4">📭</div>
                  <h2 className="text-xl font-semibold mb-2">没有找到图片</h2>
                  <p className="text-dark-text-secondary mb-4">该目录下没有支持的图片文件</p>
                  <button onClick={handleChooseDirectory} className="btn btn-secondary">
                    重新选择目录
                  </button>
                </div>
              </div>
            ) : (
              <ImageGrid
                images={images}
                favorites={favorites}
                selectedImage={selectedImage}
                onSelectImage={setSelectedImage}
              />
            )}
          </div>

          {/* 预览面板 */}
          {selectedImage && (
            <PreviewPanel
              image={selectedImage}
              isFavorite={favorites.includes(selectedImage.path)}
              onSetWallpaper={() => handleSetWallpaper(selectedImage)}
              onToggleFavorite={() => handleToggleFavorite(selectedImage)}
              onShowInFolder={() => handleShowInFolder(selectedImage)}
              onClose={() => setSelectedImage(null)}
            />
          )}
        </div>
      </main>

      {/* Toast 通知 */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

export default App;
