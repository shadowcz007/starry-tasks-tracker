import { chromium } from 'playwright';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '方法不允许' });
  }

  let browser = null;
  
  try {
    console.log('开始启动浏览器');
    browser = await chromium.launch({
      headless: true, // 改为 headless 模式
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
    console.log('浏览器启动成功');

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    console.log('浏览器上下文创建成功');

    const page = await context.newPage();
    console.log('新页面创建成功');
    
    console.log('开始访问Google News...');
    await page.goto('https://news.google.com/home?hl=zh-CN&gl=CN&ceid=CN:zh-Hans', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    console.log('页面加载完成');
    
    // 等待文章元素加载
    await page.waitForSelector('article', { timeout: 10000 });
    console.log('开始查找新闻元素');
    const newsElements = await page.$$('article');
    console.log(`找到 ${newsElements.length} 个新闻元素`);
    
    const newsSummaries = await Promise.all(
      newsElements.slice(0, 5).map(async (element) => {
        try {
          const title = await element.$eval('h4', el => el.textContent || '');
          const snippet = await element.$eval('div[class*="summary"]', el => el.textContent || '');
          return {
            title: title.trim(),
            snippet: snippet.trim()
          };
        } catch (error) {
          console.error('提取新闻元素失败:', error);
          return null;
        }
      })
    );

    // 过滤掉null值并返回结果
    const validNews = newsSummaries.filter(item => item !== null);
    
    await browser.close();
    console.log('浏览器已关闭');
    
    return res.status(200).json({
      success: true,
      data: validNews
    });
    
  } catch (error) {
    console.error('新闻抓取失败:', error);
    
    // 确保浏览器被关闭
    if (browser) {
      try {
        await browser.close();
        console.log('浏览器已关闭');
      } catch (closeError) {
        console.error('关闭浏览器失败:', closeError);
      }
    }
    
    return res.status(500).json({
      success: false,
      error: error.message || '获取新闻数据失败'
    });
  }
} 