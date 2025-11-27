import type { GameConfig } from '../../shared/types';

interface SidebarProps {
  games: GameConfig[];
  selectedGame: GameConfig | null;
  onSelectGame: (game: GameConfig) => void;
}

export function Sidebar({ games, selectedGame, onSelectGame }: SidebarProps) {
  return (
    <aside className="sidebar">
      {/* Logo 区域 */}
      <div className="drag-region p-4 border-b border-dark-border">
        <div className="flex items-center gap-2 no-drag">
          <span className="text-2xl">🎮</span>
          <div>
            <h1 className="font-bold text-sm">GameShot</h1>
            <p className="text-xs text-dark-text-secondary">Wallpaper Manager</p>
          </div>
        </div>
      </div>

      {/* 游戏列表 */}
      <nav className="flex-1 overflow-auto py-2">
        <div className="px-3 py-2">
          <span className="text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">
            游戏列表
          </span>
        </div>
        {games.map((game) => (
          <div
            key={game.id}
            className={`sidebar-item ${selectedGame?.id === game.id ? 'active' : ''}`}
            onClick={() => onSelectGame(game)}
          >
            <span className="text-xl">{game.icon}</span>
            <span className="text-sm font-medium">{game.name}</span>
          </div>
        ))}
      </nav>

      {/* 底部信息 */}
      <div className="p-4 border-t border-dark-border">
        <p className="text-xs text-dark-text-secondary text-center">
          v1.0.0 • 跨平台壁纸管理器
        </p>
      </div>
    </aside>
  );
}
