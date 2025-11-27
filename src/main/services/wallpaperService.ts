import { exec } from 'child_process';
import { promisify } from 'util';
import { platform } from 'os';
import { existsSync } from 'fs';
import { logService } from './logService';

const execAsync = promisify(exec);

class WallpaperService {
  /**
   * 设置桌面壁纸（跨平台）
   * @param filePath 图片文件路径
   * @returns 操作结果
   */
  async setWallpaper(filePath: string): Promise<{ success: boolean; error?: string }> {
    logService.info('开始设置壁纸', { filePath });
    
    // 检查文件是否存在
    if (!existsSync(filePath)) {
      logService.error('壁纸文件不存在', { filePath });
      return { success: false, error: '文件不存在' };
    }

    const currentPlatform = platform();
    logService.info('当前操作系统', { platform: currentPlatform });

    try {
      if (currentPlatform === 'win32') {
        return await this.setWallpaperWindows(filePath);
      } else if (currentPlatform === 'darwin') {
        return await this.setWallpaperMac(filePath);
      } else if (currentPlatform === 'linux') {
        return await this.setWallpaperLinux(filePath);
      } else {
        logService.error('不支持的操作系统', { platform: currentPlatform });
        return { success: false, error: '不支持的操作系统' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      logService.error('设置壁纸异常', { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Windows 设置壁纸
   */
  private async setWallpaperWindows(filePath: string): Promise<{ success: boolean; error?: string }> {
    logService.info('使用 Windows 方式设置壁纸');
    logService.info('原始路径', { filePath });
    
    // 使用 PowerShell 设置壁纸
    // 关键：使用单引号避免路径中的特殊字符被解析
    const psScript = `
\$code = @'
using System;
using System.Runtime.InteropServices;

public class WallpaperSetter {
    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    public static extern int SystemParametersInfo(int uAction, int uParam, string lpvParam, int fuWinIni);
}
'@

Add-Type -TypeDefinition \$code -ErrorAction SilentlyContinue

\$SPI_SETDESKWALLPAPER = 0x0014
\$SPIF_UPDATEINIFILE = 0x01
\$SPIF_SENDCHANGE = 0x02

\$imagePath = '${filePath.replace(/'/g, "''")}'
Write-Host "Setting wallpaper to: \$imagePath"

if (Test-Path \$imagePath) {
    Write-Host "File exists, setting wallpaper..."
    \$result = [WallpaperSetter]::SystemParametersInfo(\$SPI_SETDESKWALLPAPER, 0, \$imagePath, \$SPIF_UPDATEINIFILE -bor \$SPIF_SENDCHANGE)
    Write-Host "SystemParametersInfo returned: \$result"
    if (\$result -eq 0) {
        Write-Host "Warning: SystemParametersInfo returned 0, wallpaper may not have been set"
    }
} else {
    Write-Host "ERROR: File does not exist!"
    exit 1
}
`;

    logService.info('生成的 PowerShell 脚本', { script: psScript });

    try {
      // 将 PowerShell 脚本写入临时文件执行
      const tempScriptPath = `${process.env.TEMP || 'C:\\Windows\\Temp'}\\set_wallpaper_${Date.now()}.ps1`;
      const fs = await import('fs');
      
      // 使用 UTF-8 with BOM 写入，确保 PowerShell 正确读取中文路径
      const BOM = '\uFEFF';
      fs.writeFileSync(tempScriptPath, BOM + psScript, 'utf-8');
      
      logService.info('PowerShell 脚本已写入临时文件', { tempScriptPath });
      
      const { stdout, stderr } = await execAsync(
        `powershell -ExecutionPolicy Bypass -File "${tempScriptPath}"`,
        { encoding: 'utf-8' }
      );
      
      logService.info('PowerShell 执行完成', { stdout, stderr });
      
      // 清理临时文件
      try {
        fs.unlinkSync(tempScriptPath);
      } catch {
        // 忽略清理错误
      }
      
      if (stderr && stderr.trim()) {
        logService.warn('PowerShell 有错误输出', { stderr });
      }
      
      // 检查输出中是否有错误标志
      if (stdout.includes('ERROR:') || stdout.includes('does not exist')) {
        logService.error('设置壁纸失败', { stdout });
        return { success: false, error: '文件不存在或无法访问' };
      }
      
      logService.info('壁纸设置成功');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logService.error('PowerShell 方式设置壁纸失败，尝试备用方案', { error: errorMessage });
      
      // 备选方案：使用注册表 + rundll32
      return await this.setWallpaperWindowsRegistry(filePath);
    }
  }

  /**
   * Windows 备用方案：使用注册表设置壁纸
   */
  private async setWallpaperWindowsRegistry(filePath: string): Promise<{ success: boolean; error?: string }> {
    logService.info('使用注册表方式设置壁纸');
    
    try {
      // 设置注册表
      await execAsync(`reg add "HKEY_CURRENT_USER\\Control Panel\\Desktop" /v Wallpaper /t REG_SZ /d "${filePath}" /f`);
      logService.info('注册表已更新');
      
      // 设置壁纸样式为拉伸填充
      await execAsync(`reg add "HKEY_CURRENT_USER\\Control Panel\\Desktop" /v WallpaperStyle /t REG_SZ /d "10" /f`);
      await execAsync(`reg add "HKEY_CURRENT_USER\\Control Panel\\Desktop" /v TileWallpaper /t REG_SZ /d "0" /f`);
      
      // 刷新桌面
      await execAsync('RUNDLL32.EXE user32.dll,UpdatePerUserSystemParameters 1, True');
      
      logService.info('注册表方式设置壁纸成功');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logService.error('注册表方式设置壁纸失败', { error: errorMessage });
      return { success: false, error: errorMessage };
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
