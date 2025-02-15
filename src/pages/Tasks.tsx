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

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) {
      toast({
        description: "请输入任务内容",
        variant: "destructive",
      });
      return;
    }
    
    const task: Task = {
      id: Date.now(),
      content: newTask.trim(),
      completed: false,
    };
    
    setTasks([...tasks, task]);
    setNewTask("");
    toast({
      description: "任务添加成功！",
    });
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
                className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm"
              >
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
