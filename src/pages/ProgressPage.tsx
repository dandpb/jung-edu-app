import React from 'react';
import { UserProgress, Module } from '../types';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  Award, 
  BarChart3,
  Target,
  BookOpen
} from 'lucide-react';

interface ProgressPageProps {
  userProgress: UserProgress;
  modules: Module[];
}

const ProgressPage: React.FC<ProgressPageProps> = ({ userProgress, modules }) => {
  const completionPercentage = Math.round(
    (userProgress.completedModules.length / modules.length) * 100
  );

  const averageQuizScore = () => {
    const scores = Object.values(userProgress.quizScores);
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const getModuleProgress = (module: Module) => {
    const isCompleted = userProgress.completedModules.includes(module.id);
    const quizScore = userProgress.quizScores[module.id];
    
    return {
      isCompleted,
      quizScore,
      status: isCompleted ? 'completed' : 
              module.prerequisites?.some(req => !userProgress.completedModules.includes(req)) ? 'locked' : 'available'
    };
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const achievements = [
    {
      id: 'first-module',
      title: 'First Steps',
      description: 'Complete your first module',
      icon: BookOpen,
      unlocked: userProgress.completedModules.length >= 1,
      color: 'bg-green-500'
    },
    {
      id: 'halfway',
      title: 'Halfway There',
      description: 'Complete 50% of all modules',
      icon: Target,
      unlocked: completionPercentage >= 50,
      color: 'bg-blue-500'
    },
    {
      id: 'quiz-master',
      title: 'Quiz Master',
      description: 'Score 90% or higher on any quiz',
      icon: Award,
      unlocked: Object.values(userProgress.quizScores).some(score => score >= 90),
      color: 'bg-purple-500'
    },
    {
      id: 'dedicated',
      title: 'Dedicated Learner',
      description: 'Study for more than 2 hours',
      icon: Clock,
      unlocked: userProgress.totalTime >= 7200,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-4">
          Your Learning Progress
        </h1>
        <p className="text-gray-600">
          Track your journey through Jung's analytical psychology
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-primary-50 to-primary-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-primary-900">Overall Progress</h3>
            <TrendingUp className="w-5 h-5 text-primary-600" />
          </div>
          <p className="text-3xl font-bold text-primary-900 mb-1">
            {completionPercentage}%
          </p>
          <p className="text-sm text-primary-700">Complete</p>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-green-900">Modules</h3>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-900 mb-1">
            {userProgress.completedModules.length}/{modules.length}
          </p>
          <p className="text-sm text-green-700">Completed</p>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-blue-900">Study Time</h3>
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-900 mb-1">
            {formatTime(userProgress.totalTime)}
          </p>
          <p className="text-sm text-blue-700">Total time</p>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-purple-900">Quiz Average</h3>
            <BarChart3 className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-purple-900 mb-1">
            {averageQuizScore()}%
          </p>
          <p className="text-sm text-purple-700">Average score</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
            Module Progress
          </h2>
          <div className="space-y-3">
            {modules.map(module => {
              const progress = getModuleProgress(module);
              
              return (
                <div key={module.id} className="card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{module.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{module.title}</h3>
                        <p className="text-sm text-gray-500">
                          {progress.status === 'completed' && 'Completed'}
                          {progress.status === 'available' && 'Available'}
                          {progress.status === 'locked' && 'Locked - Complete prerequisites'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {progress.quizScore !== undefined && (
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Quiz Score</p>
                          <p className="font-semibold text-gray-900">{progress.quizScore}%</p>
                        </div>
                      )}
                      {progress.isCompleted && (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
            Achievements
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {achievements.map(achievement => {
              const Icon = achievement.icon;
              
              return (
                <div
                  key={achievement.id}
                  className={`card ${!achievement.unlocked && 'opacity-50'}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-3 rounded-lg ${achievement.unlocked ? achievement.color : 'bg-gray-300'}`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {achievement.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {achievement.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {achievement.unlocked ? '✓ Unlocked' : 'Locked'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressPage;