/**
 * AI 标签服务接口预留
 * 
 * 此模块预留了 AI 自动标签功能的接口。
 * 实际实现时可以接入各种 AI 服务（如 OpenAI Vision、Claude、本地模型等）
 */

export interface ImageTag {
  name: string;
  confidence: number;
  category: 'game' | 'scene' | 'character' | 'action' | 'other';
}

export interface AITaggingResult {
  success: boolean;
  tags: ImageTag[];
  description?: string;
  error?: string;
}

export interface AITaggingProvider {
  name: string;
  analyze(imagePath: string): Promise<AITaggingResult>;
}

class AITaggingService {
  private provider: AITaggingProvider | null = null;

  /**
   * 设置 AI 服务提供商
   */
  setProvider(provider: AITaggingProvider): void {
    this.provider = provider;
  }

  /**
   * 分析图片并生成标签
   * @param imagePath 图片路径
   */
  async analyzeImage(imagePath: string): Promise<AITaggingResult> {
    if (!this.provider) {
      return {
        success: false,
        tags: [],
        error: 'No AI provider configured'
      };
    }

    try {
      return await this.provider.analyze(imagePath);
    } catch (error) {
      return {
        success: false,
        tags: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 批量分析图片
   */
  async analyzeImages(imagePaths: string[]): Promise<Map<string, AITaggingResult>> {
    const results = new Map<string, AITaggingResult>();

    for (const path of imagePaths) {
      results.set(path, await this.analyzeImage(path));
    }

    return results;
  }

  /**
   * 检查服务是否可用
   */
  isAvailable(): boolean {
    return this.provider !== null;
  }

  /**
   * 获取当前提供商名称
   */
  getProviderName(): string | null {
    return this.provider?.name || null;
  }
}

export const aiTaggingService = new AITaggingService();

// ============ 示例提供商实现（Mock）============

/**
 * Mock AI 提供商（用于测试）
 */
export class MockAIProvider implements AITaggingProvider {
  name = 'Mock AI';

  async analyze(_imagePath: string): Promise<AITaggingResult> {
    // 模拟 AI 分析延迟
    await new Promise(resolve => setTimeout(resolve, 500));

    // 返回随机标签
    const mockTags: ImageTag[] = [
      { name: 'landscape', confidence: 0.95, category: 'scene' },
      { name: 'sunset', confidence: 0.87, category: 'scene' },
      { name: 'character', confidence: 0.72, category: 'character' }
    ];

    return {
      success: true,
      tags: mockTags,
      description: 'A beautiful game screenshot with scenic view'
    };
  }
}

// 示例：如何使用 OpenAI Vision API（预留接口）
/*
export class OpenAIVisionProvider implements AITaggingProvider {
  name = 'OpenAI Vision';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyze(imagePath: string): Promise<AITaggingResult> {
    // 读取图片并转为 base64
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');

    // 调用 OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this game screenshot and provide tags.' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
          ]
        }]
      })
    });

    // 解析响应...
  }
}
*/
