import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { chromium } from 'playwright';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    {
      name: 'news-api',
      configureServer(server:any) {
        server.middlewares.use('/api/news', async (req:any, res:any) => {
          if (req.method !== 'GET') {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: '方法不允许' }));
            return;
          }

          let browser = null;
          
          try {
            console.log('开始启动浏览器');
            browser = await chromium.launch({
              headless: false,
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
              waitUntil: 'networkidle',
              timeout: 30000
            });
            console.log('页面加载完成');
            
            // 获取页面的纯文本内容
            const content = await page.evaluate(() => {
              // 移除所有script和style标签
              const scripts = document.querySelectorAll('script, style');
              scripts.forEach(script => script.remove());
              
              // 获取body中的纯文本
              return document.body.innerText;
            });
            
            await browser.close();
            console.log('浏览器已关闭');
            
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              data: content
            }));
            
          } catch (error:any) {
            console.error('新闻抓取失败:', error);
            
            if (browser) {
              try {
                await browser.close();
                console.log('浏览器已关闭');
              } catch (closeError) {
                console.error('关闭浏览器失败:', closeError);
              }
            }
            
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: false,
              error: error.message || '获取新闻数据失败'
            }));
          }
        });
      }
    }
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
