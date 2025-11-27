import { app } from 'electron';
import { existsSync, mkdirSync, appendFileSync } from 'fs';
import { join } from 'path';

class LogService {
  private logDir: string = '';
  private logFile: string = '';
  private initialized: boolean = false;

  private init(): void {
    if (this.initialized) return;
    
    try {
      // 获取应用运行路径 - 使用 process.cwd() 作为备选
      let appPath: string;
      try {
        appPath = app.isPackaged 
          ? join(app.getPath('exe'), '..') 
          : process.cwd();
      } catch {
        appPath = process.cwd();
      }
      
      this.logDir = join(appPath, 'logs');
      this.logFile = join(this.logDir, `app-${this.getDateString()}.log`);
      
      this.ensureLogDir();
      this.initialized = true;
      
      // 写入初始化成功的日志
      this.writeDirectly('INFO', '日志服务初始化成功', { logDir: this.logDir, logFile: this.logFile });
    } catch (error) {
      console.error('日志服务初始化失败:', error);
    }
  }

  private ensureLogDir(): void {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getDateString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  private getTimestamp(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ` +
           `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(now.getMilliseconds()).padStart(3, '0')}`;
  }

  private formatMessage(level: string, message: string, data?: unknown): string {
    let logLine = `[${this.getTimestamp()}] [${level}] ${message}`;
    if (data !== undefined) {
      try {
        logLine += ` | ${JSON.stringify(data, null, 0)}`;
      } catch {
        logLine += ` | [无法序列化的数据]`;
      }
    }
    return logLine + '\n';
  }

  private writeDirectly(level: string, message: string, data?: unknown): void {
    const logLine = this.formatMessage(level, message, data);
    console.log(logLine.trim());
    try {
      appendFileSync(this.logFile, logLine, 'utf-8');
    } catch (error) {
      console.error('写入日志文件失败:', error);
    }
  }

  private write(level: string, message: string, data?: unknown): void {
    // 确保已初始化
    this.init();
    
    const logLine = this.formatMessage(level, message, data);
    
    // 输出到控制台
    console.log(logLine.trim());
    
    // 写入文件
    if (this.initialized && this.logFile) {
      try {
        this.ensureLogDir();
        appendFileSync(this.logFile, logLine, 'utf-8');
      } catch (error) {
        console.error('写入日志文件失败:', error);
      }
    }
  }

  info(message: string, data?: unknown): void {
    this.write('INFO', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.write('WARN', message, data);
  }

  error(message: string, data?: unknown): void {
    this.write('ERROR', message, data);
  }

  debug(message: string, data?: unknown): void {
    this.write('DEBUG', message, data);
  }

  getLogPath(): string {
    this.init();
    return this.logDir;
  }
}

export const logService = new LogService();
