
import React from 'react';
import { Card } from "@/components/ui/card";
import {
  Calendar,
  ListTodo,
  Calculator,
  Star,
} from "lucide-react";

const Index = () => {
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
          <Card className="glass-card p-6 hover-scale">
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
        <Card className="glass-card p-6 mt-8 animate-float">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-starry-purple/10 rounded-lg">
              <Calendar className="w-6 h-6 text-starry-purple" />
            </div>
            <h2 className="text-xl font-semibold">今日运势提示</h2>
          </div>
          <p className="text-gray-600">
            选择你的星座，获取详细的每日运势分析和行动建议
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Index;
