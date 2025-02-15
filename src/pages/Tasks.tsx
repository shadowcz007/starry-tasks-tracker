import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

interface Task {
  id: number;
  content: string;
  completed: boolean;
  plan?: string;
  reasoning?: string;
  isGeneratingPlan?: boolean;
}

interface TaskPlan {
  content: string;
}

const STORAGE_KEY = 'starry-tasks';

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  // 从 localStorage 加载数据
  useEffect(() => {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  // 当任务列表变化时保存到 localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const generateTaskPlan = async (taskContent: string): Promise<string> => {
    try {
      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer sk-mmamfmsytbytlppkomdzhyrgtxsuqyhxtbqqsrglzwjfuags',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "deepseek-ai/DeepSeek-R1",
          messages: [
            {
              role: "user",
              content: `请为这个任务制定一个详细的执行计划，字数控制在100字以内：${taskContent}`
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

      if (!reader) {
        throw new Error('无法获取响应流');
      }

      let currentPlan = '';
      let currentReasoning = '';

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
              const reasoningContent = data.choices[0]?.delta?.reasoning_content || '';
              
              currentPlan += content;
              currentReasoning += reasoningContent;
              
              // 更新：在生成过程中同时显示当前计划内容和推理内容
              setTasks(prevTasks => 
                prevTasks.map(t => 
                  t.content === taskContent 
                    ? { 
                        ...t, 
                        plan: currentPlan,
                        reasoning: currentReasoning,
                        isGeneratingPlan: true
                      }
                    : t
                )
              );
            } catch (e) {
              console.error('解析响应数据失败:', e);
            }
          }
        }
      }

      // 生成完成后，更新最终状态
      setTasks(prevTasks => 
        prevTasks.map(t => 
          t.content === taskContent 
            ? { 
                ...t, 
                plan: currentPlan, 
                reasoning: currentReasoning,
                isGeneratingPlan: false 
              }
            : t
        )
      );

      return currentPlan;
    } catch (error) {
      console.error('生成计划失败:', error);
      throw error;
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) {
      toast({
        description: "请输入任务内容",
        variant: "destructive",
      });
      return;
    }
    
    // 创建新任务，初始计划为空，设置生成中状态
    const task: Task = {
      id: Date.now(),
      content: newTask.trim(),
      completed: false,
      plan: '',
      reasoning: '',
      isGeneratingPlan: true,
    };
    
    setTasks(prev => [...prev, task]);
    setNewTask("");
    
    try {
      await generateTaskPlan(task.content);
      toast({
        description: "任务添加成功！",
      });
    } catch (error) {
      toast({
        description: "生成计划失败，请重试",
        variant: "destructive",
      });
      // 移除失败的任务
      setTasks(prev => prev.filter(t => t.id !== task.id));
    }
  };

  const toggleTask = (taskId: number) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (taskId: number) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    toast({
      description: "任务已删除",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-starry-soft via-white to-starry-light p-6">
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回主页
        </Button>

        <Card className="p-6">
          <h1 className="text-2xl font-bold text-starry-dark mb-6">待办事项</h1>
          
          <form onSubmit={addTask} className="flex gap-2 mb-6">
            <Input
              placeholder="添加新任务..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">
              <Plus className="h-4 w-4 mr-2" />
              添加
            </Button>
          </form>

          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => toggleTask(task.id)}
                    />
                    <span className={`${task.completed ? 'line-through text-gray-400' : ''}`}>
                      {task.content}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTask(task.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    删除
                  </Button>
                </div>
                {(task.plan || task.isGeneratingPlan) && (
                  <div className="px-4 py-2 bg-gray-50 border-t text-sm text-gray-600">
                    {task.reasoning && (
                      <div className="mb-3">
                        <p className="font-medium mb-1">推理过程：</p>
                        <p className="whitespace-pre-wrap text-gray-500">{task.reasoning}</p>
                      </div>
                    )}
                    <p className="font-medium mb-1">执行计划：</p>
                    <div>
                      {task.plan && <p className="whitespace-pre-wrap">{task.plan}</p>}
                      {task.isGeneratingPlan && (
                        <div className="flex items-center space-x-2 mt-2">
                          <div className="animate-spin h-4 w-4 border-2 border-starry-dark border-t-transparent rounded-full"></div>
                          <span>正在生成计划...</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {tasks.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                暂无待办事项，开始添加吧！
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Tasks;
