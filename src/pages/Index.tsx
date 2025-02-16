import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  ListTodo,
  Calculator,
  Star,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useToast } from "@/components/ui/use-toast";
import { chromium } from 'playwright';

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [horoscope, setHoroscope] = useState<{
    summary: string;
    advice: string;
    lucky_time: string;
  } | null>(null);

  const handleHoroscopeClick = async () => {
    try {
      // 从 localStorage 获取任务数据
      const savedTasks = localStorage.getItem('starry-tasks');
      const tasks = savedTasks ? JSON.parse(savedTasks) : [];
      const taskContents = tasks.map(task => task.content);
      
      console.log('待办事项内容:', taskContents);
      
      // 第一步：调用 LLM 接口分析任务
      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "THUDM/glm-4-9b-chat",
          messages: [
            {
              role: "user",
              content: `基于以下待办事项列表，分析是否需要搜索新数据来辅助运势提示。只需返回 JSON 格式的结果：{"search": true/false}。待办事项：${JSON.stringify(taskContents)}`
            }
          ],
          max_tokens: 512,
          temperature: 0.7,
          stream: true,
        })
      });

      if (!response.ok) {
        throw new Error('网络请求失败');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let result = '';

      if (!reader) {
        throw new Error('无法获取响应流');
      }

      // 处理流式响应
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              if (line === 'data: [DONE]') continue;
              
              const data = JSON.parse(line.slice(6));
              const content = data.choices[0]?.delta?.content || '';
              result += content;
              
            } catch (e) {
              console.error('解析响应数据失败:', e);
            }
          }
        }
      }

      console.log('LLM 返回的原始结果:', result);

      // 清理并解析 JSON 结果
      try {
        let cleanContent = result.trim()
          .replace(/^`+|`+$/g, '')
          .replace(/^json\n/i, '');
        
        // 添加额外的验证
        if (!cleanContent || cleanContent.includes('<!DOCTYPE')) {
          throw new Error('收到无效的响应格式');
        }

        // 尝试修复可能的 JSON 格式问题
        if (!cleanContent.startsWith('{')) {
          const jsonStart = cleanContent.indexOf('{');
          if (jsonStart !== -1) {
            cleanContent = cleanContent.slice(jsonStart);
          }
        }
        
        const parsedResult = JSON.parse(cleanContent);
        console.log('解析后的结果:', parsedResult);

        if (parsedResult.search) {
          // 第二步：如果需要搜索，调用后端接口获取新闻数据
          const newsResponse = await fetch('/api/news', {
            method: 'GET',
            headers: {
              'Accept': 'application/json'
            },
          });

          if (!newsResponse.ok) {
            throw new Error(`获取新闻数据失败: ${newsResponse.status}`);
          }

          const contentType = newsResponse.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            throw new Error('新闻接口返回了非 JSON 格式的数据');
          }

          const newsData = await newsResponse.json();
          console.log('获取到的新闻数据:', newsData);

          // 生成运势提示
          const horoscopeResponse = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: "THUDM/glm-4-9b-chat",
              messages: [
                {
                  role: "user",
                  content: `基于以下信息生成今日运势提示：
                    待办事项：${JSON.stringify(taskContents)}
                    相关新闻：${JSON.stringify(newsData.data)}
                    
                    请以以下格式返回：
                    {
                      "summary": "整体运势概述",
                      "advice": "具体建议",
                      "lucky_time": "幸运时段"
                    }`
                }
              ],
              max_tokens: 1024,
              temperature: 0.7,
              stream: true,
            })
          });

          if (!horoscopeResponse.ok) {
            throw new Error('运势生成请求失败');
          }

          const reader = horoscopeResponse.body?.getReader();
          const decoder = new TextDecoder();
          let horoscopeResult = '';

          if (!reader) {
            throw new Error('无法获取响应流');
          }

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  if (line === 'data: [DONE]') continue;
                  
                  const data = JSON.parse(line.slice(6));
                  const content = data.choices[0]?.delta?.content || '';
                  horoscopeResult += content;
                } catch (e) {
                  console.error('解析响应数据失败:', e);
                }
              }
            }
          }

          // 解析运势结果
          const cleanHoroscope = horoscopeResult.trim()
            .replace(/^`+|`+$/g, '')
            .replace(/^json\n/i, '');
          
          const horoscope = JSON.parse(cleanHoroscope);

          // 更新界面显示运势
          setHoroscope(horoscope); // 需要添加新的状态

          toast({
            title: "运势分析完成",
            description: "已生成今日运势提示",
          });
        } else {
          toast({
            title: "运势分析完成",
            description: "当前信息已足够进行运势分析",
          });
        }
      } catch (error) {
        console.error('JSON 解析错误:', error);
        toast({
          title: "数据解析失败",
          description: error instanceof Error ? error.message : "解析响应数据时出错",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('运势分析失败:', error);
      toast({
        title: "分析失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-starry-soft via-white to-starry-light p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12 animate-fade-up">
          <div className="inline-block px-4 py-1 bg-starry-purple/10 rounded-full text-starry-purple text-sm mb-4">
            欢迎使用星运日记
          </div>
          <h1 className="text-4xl font-bold text-starry-dark mb-4">
            记录生活，聆听星语
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            集待办事项、星座运势和计算器于一体的实用App
          </p>
        </header>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Tasks Card */}
          <Card 
            className="glass-card p-6 hover-scale cursor-pointer"
            onClick={() => navigate("/tasks")}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-starry-purple/10 rounded-lg">
                <ListTodo className="w-6 h-6 text-starry-purple" />
              </div>
              <h2 className="text-xl font-semibold">待办事项</h2>
            </div>
            <p className="text-gray-600">轻松记录生活工作学习任务，获取星座建议</p>
          </Card>

          {/* Horoscope Card */}
          <Card className="glass-card p-6 hover-scale">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-starry-purple/10 rounded-lg">
                <Star className="w-6 h-6 text-starry-purple" />
              </div>
              <h2 className="text-xl font-semibold">星座运势</h2>
            </div>
            <p className="text-gray-600">每日星座运势分析，星座知识解读</p>
          </Card>

          {/* Calculator Card */}
          <Card className="glass-card p-6 hover-scale">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-starry-purple/10 rounded-lg">
                <Calculator className="w-6 h-6 text-starry-purple" />
              </div>
              <h2 className="text-xl font-semibold">计算器</h2>
            </div>
            <p className="text-gray-600">基础和科学计算功能，便捷实用</p>
          </Card>
        </div>

        {/* Daily Horoscope Preview */}
        <Card 
          className="glass-card p-6 mt-8 animate-float cursor-pointer hover:shadow-lg transition-all" 
          onClick={handleHoroscopeClick}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-starry-purple/10 rounded-lg">
              <Calendar className="w-6 h-6 text-starry-purple" />
            </div>
            <h2 className="text-xl font-semibold">今日运势提示</h2>
          </div>
          {horoscope ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-starry-purple mb-2">整体运势</h3>
                <p className="text-gray-600">{horoscope.summary}</p>
              </div>
              <div>
                <h3 className="font-medium text-starry-purple mb-2">建议</h3>
                <p className="text-gray-600">{horoscope.advice}</p>
              </div>
              <div>
                <h3 className="font-medium text-starry-purple mb-2">幸运时段</h3>
                <p className="text-gray-600">{horoscope.lucky_time}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">
              点击获取基于待办事项的运势分析
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Index;
