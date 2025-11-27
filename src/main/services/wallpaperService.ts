import { exec } from 'child_process';
import { promisify } from 'util';
import { platform } from 'os';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

class WallpaperService {
  /**
   * 设置桌面壁纸（跨平台）
   * @param filePath 图片文件路径
   * @returns 操作结果
   */
  async setWallpaper(filePath: string): Promise<{ success: boolean; error?: string }> {
    // 检查文件是否存在
    if (!existsSync(filePath)) {
      return { success: false, error: '文件不存在' };
    }

    const currentPlatform = platform();

    try {
      if (currentPlatform === 'win32') {
        return await this.setWallpaperWindows(filePath);
      } else if (currentPlatform === 'darwin') {
        return await this.setWallpaperMac(filePath);
      } else if (currentPlatform === 'linux') {
        return await this.setWallpaperLinux(filePath);
      } else {
        return { success: false, error: '不支持的操作系统' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Windows 设置壁纸
   */
  private async setWallpaperWindows(filePath: string): Promise<{ success: boolean; error?: string }> {
    // 使用 PowerShell 设置壁纸
    const escapedPath = filePath.replace(/'/g, "''");
    const psScript = `
      Add-Type -TypeDefinition @"
      using System;
      using System.Runtime.InteropServices;
      public class Wallpaper {
        [DllImport("user32.dll", CharSet = CharSet.Auto)]
        public static extern int SystemParametersInfo(int uAction, int uParam, string lpvParam, int fuWinIni);
      }
"@
      [Wallpaper]::SystemParametersInfo(0x0014, 0, '${escapedPath}', 0x0001 -bor 0x0002)
    `;

    try {
      await execAsync(`powershell -Command "${psScript.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`);
      return { success: true };
    } catch (error) {
      // 备选方案：使用注册表
      const regScript = `
        reg add "HKEY_CURRENT_USER\\Control Panel\\Desktop" /v Wallpaper /t REG_SZ /d "${escapedPath}" /f
        RUNDLL32.EXE user32.dll,UpdatePerUserSystemParameters
      `;
      try {
        await execAsync(regScript);
        return { success: true };
      } catch (regError) {
        const errorMessage = regError instanceof Error ? regError.message : '设置壁纸失败';
        return { success: false, error: errorMessage };
      }
    }
  }

  /**
   * macOS 设置壁纸
   */
  private async setWallpaperMac(filePath: string): Promise<{ success: boolean; error?: string }> {
    const escapedPath = filePath.replace(/"/g, '\\"');
    const script = `
      osascript -e 'tell application "System Events" to tell every desktop to set picture to "${escapedPath}"'
    `;

    try {
      await execAsync(script);
      return { success: true };
    } catch (error) {
      // 备选方案：使用 sqlite3 直接修改数据库（适用于较新版本的 macOS）
      const alternativeScript = `
        osascript -e 'tell application "Finder" to set desktop picture to POSIX file "${escapedPath}"'
      `;
      try {
        await execAsync(alternativeScript);
        return { success: true };
      } catch (altError) {
        const errorMessage = altError instanceof Error ? altError.message : '设置壁纸失败';
        return { success: false, error: errorMessage };
      }
    }
  }

  /**
   * Linux 设置壁纸（支持 GNOME）
   */
  private async setWallpaperLinux(filePath: string): Promise<{ success: boolean; error?: string }> {
    const escapedPath = filePath.replace(/'/g, "'\\''");
    
    // 尝试 GNOME
    try {
      await execAsync(`gsettings set org.gnome.desktop.background picture-uri 'file://${escapedPath}'`);
      await execAsync(`gsettings set org.gnome.desktop.background picture-uri-dark 'file://${escapedPath}'`);
      return { success: true };
    } catch {
      // 尝试 KDE
      try {
        const kdeScript = `
          qdbus org.kde.plasmashell /PlasmaShell org.kde.PlasmaShell.evaluateScript "
            var allDesktops = desktops();
            for (var i = 0; i < allDesktops.length; i++) {
              var d = allDesktops[i];
              d.wallpaperPlugin = 'org.kde.image';
              d.currentConfigGroup = ['Wallpaper', 'org.kde.image', 'General'];
              d.writeConfig('Image', 'file://${escapedPath}');
            }
          "
        `;
        await execAsync(kdeScript);
        return { success: true };
      } catch (kdeError) {
        const errorMessage = kdeError instanceof Error ? kdeError.message : '设置壁纸失败';
        return { success: false, error: errorMessage };
      }
    }
  }
}

export const wallpaperService = new WallpaperService();
