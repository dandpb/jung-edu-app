import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Module, UserProgress, Achievement } from '../../types';
import { 
  Clock, 
  CheckCircle, 
  ArrowRight, 
  BarChart3,
  Trophy,
  Target,
  Brain,
  BookOpen,
  Play,
  MessageSquare,
  TrendingUp,
  Award,
  Zap,
  Calendar,
  Eye,
  Star,
  Lightbulb,
  Users,
  Flame
} from 'lucide-react';

interface EnhancedDashboardProps {
  modules: Module[];
  userProgress: UserProgress;
  updateProgress?: (updates: Partial<UserProgress>) => void;
}

const EnhancedDashboard: React.FC<EnhancedDashboardProps> = ({ 
  modules, 
  userProgress,
  updateProgress 
}) => {
  const [timeGreeting, setTimeGreeting] = useState('');
  const [streakCount, setStreakCount] = useState(0);
  const [weeklyGoal, setWeeklyGoal] = useState(5); // hours per week
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    // Set time-based greeting
    const hour = new Date().getHours();
    if (hour < 12) setTimeGreeting('Bom dia');
    else if (hour < 18) setTimeGreeting('Boa tarde');
    else setTimeGreeting('Boa noite');

    // Calculate streak
    setStreakCount(userProgress.analytics?.streakDays || 0);

    // Get recent achievements (mock data)
    setRecentAchievements([
      {
        id: 'first-quiz',
        title: 'Primeiro Quiz',
        description: 'Complete seu primeiro quiz',
        icon: '🎯',
        category: 'progress',
        points: 50,
        unlockedAt: new Date(),
        rarity: 'common',
        requirements: []
      }
    ]);
  }, [userProgress]);

  const completionPercentage = Math.round(
    (userProgress.completedModules.length / modules.length) * 100
  );

  const averageScore = userProgress.quizScores 
    ? Math.round(Object.values(userProgress.quizScores).reduce((a, b) => a + b, 0) / Object.keys(userProgress.quizScores).length || 0)
    : 0;

  const totalStudyTime = userProgress.totalTime || 0;
  const weeklyTime = userProgress.analytics?.lastWeekActivity?.reduce((sum, day) => sum + day.timeSpent, 0) || 0;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'intermediate':  
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'advanced':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const translateDifficulty = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'Iniciante';
      case 'intermediate': return 'Intermediário';
      case 'advanced': return 'Avançado';
      default: return difficulty;
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getNextRecommendedModule = () => {
    // Simple recommendation: next incomplete module that meets prerequisites
    return modules.find(module => {
      if (userProgress.completedModules.includes(module.id)) return false;
      
      if (module.prerequisites) {
        return module.prerequisites.every(prereq => 
          userProgress.completedModules.includes(prereq)
        );
      }
      return true;
    });
  };

  const nextModule = getNextRecommendedModule();

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {timeGreeting}! Vamos continuar sua jornada junguiana 🧠
            </h1>
            <p className="text-blue-100 text-lg">
              Você já percorreu {completionPercentage}% do caminho para dominar a psicologia analítica
            </p>
          </div>
          
          {streakCount > 0 && (
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Flame className="w-8 h-8 text-orange-400 mr-2" />
                <span className="text-3xl font-bold">{streakCount}</span>
              </div>
              <p className="text-blue-100 text-sm">dias consecutivos</p>
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Progresso Geral</p>
              <p className="text-2xl font-bold text-gray-900">{completionPercentage}%</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {userProgress.completedModules.length} de {modules.length} módulos
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pontuação Média</p>
              <p className="text-2xl font-bold text-gray-900">{averageScore}%</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-500">
              {averageScore >= 90 ? 'Desempenho excelente!' :
               averageScore >= 80 ? 'Muito bom!' :
               averageScore >= 70 ? 'Bom progresso' : 'Continue praticando'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tempo de Estudo</p>
              <p className="text-2xl font-bold text-gray-900">{formatTime(totalStudyTime)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (weeklyTime / (weeklyGoal * 60)) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formatTime(weeklyTime)} esta semana (meta: {weeklyGoal}h)
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conquistas</p>
              <p className="text-2xl font-bold text-gray-900">{userProgress.achievements?.length || 0}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-500">
              {recentAchievements.length > 0 ? 'Nova conquista desbloqueada!' : 'Continue explorando'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Continue Learning */}
          {nextModule && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Continue Aprendendo</h2>
                <Lightbulb className="w-5 h-5 text-yellow-500" />
              </div>
              
              <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-6 border border-primary-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="text-3xl">{nextModule.icon}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{nextModule.title}</h3>
                        <p className="text-sm text-gray-600">{nextModule.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatTime(nextModule.estimatedTime)}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(nextModule.difficulty)}`}>
                        {translateDifficulty(nextModule.difficulty)}
                      </span>
                    </div>
                    
                    <Link
                      to={`/module/${nextModule.id}`}
                      className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Continuar Estudando
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Modules */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Todos os Módulos</h2>
              <BookOpen className="w-5 h-5 text-gray-400" />
            </div>
            
            <div className="grid gap-6">
              {modules.map((module) => {
                const isCompleted = userProgress.completedModules.includes(module.id);
                const score = userProgress.quizScores[module.id];
                const canAccess = !module.prerequisites || 
                  module.prerequisites.every(prereq => userProgress.completedModules.includes(prereq));

                return (
                  <div
                    key={module.id}
                    className={`border-2 rounded-lg p-6 transition-all duration-200 ${
                      isCompleted 
                        ? 'border-green-200 bg-green-50' 
                        : canAccess 
                          ? 'border-gray-200 hover:border-primary-300 hover:shadow-md cursor-pointer' 
                          : 'border-gray-100 bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <span className="text-3xl">{module.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className={`text-lg font-semibold ${isCompleted ? 'text-green-900' : 'text-gray-900'}`}>
                              {module.title}
                            </h3>
                            {isCompleted && <CheckCircle className="w-5 h-5 text-green-600" />}
                          </div>
                          
                          <p className={`text-sm mb-3 ${isCompleted ? 'text-green-700' : 'text-gray-600'}`}>
                            {module.description}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {formatTime(module.estimatedTime)}
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(module.difficulty)}`}>
                              {translateDifficulty(module.difficulty)}
                            </span>
                            {score && (
                              <div className="flex items-center">
                                <Star className="w-4 h-4 mr-1 text-yellow-500" />
                                {score}%
                              </div>
                            )}
                          </div>
                          
                          {module.prerequisites && module.prerequisites.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500">
                                Pré-requisitos: {module.prerequisites.join(', ')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        {canAccess ? (
                          <Link
                            to={`/module/${module.id}`}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              isCompleted
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                            }`}
                          >
                            {isCompleted ? 'Revisar' : 'Estudar'}
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </Link>
                        ) : (
                          <span className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm">
                            Bloqueado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
            
            <div className="space-y-3">
              <Link
                to="/progress"
                className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <BarChart3 className="w-5 h-5 text-blue-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Ver Progresso</p>
                  <p className="text-xs text-gray-500">Análise detalhada</p>
                </div>
              </Link>
              
              <Link
                to="/modules"
                className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Brain className="w-5 h-5 text-purple-600 mr-3" />
                <div>
                  <p className="text-xs text-gray-500">Visualizar conceitos</p>
                </div>
              </Link>
              
              <Link
                to="/notes"
                className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <BookOpen className="w-5 h-5 text-green-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Minhas Anotações</p>
                  <p className="text-xs text-gray-500">{userProgress.notes.length} anotações</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Achievements */}
          {recentAchievements.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Trophy className="w-5 h-5 text-orange-500 mr-2" />
                Conquistas Recentes
              </h3>
              
              <div className="space-y-3">
                {recentAchievements.map(achievement => (
                  <div key={achievement.id} className="flex items-center p-3 bg-orange-50 rounded-lg">
                    <span className="text-2xl mr-3">{achievement.icon}</span>
                    <div>
                      <p className="font-medium text-gray-900">{achievement.title}</p>
                      <p className="text-xs text-orange-600">+{achievement.points} XP</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Study Stats */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Estatísticas</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Total de horas:</span>
                <span className="font-medium">{formatTime(totalStudyTime)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Sequência:</span>
                <span className="font-medium flex items-center">
                  <Flame className="w-4 h-4 text-orange-500 mr-1" />
                  {streakCount} dias
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Esta semana:</span>
                <span className="font-medium">{formatTime(weeklyTime)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Média quiz:</span>
                <span className="font-medium">{averageScore}%</span>
              </div>
            </div>
          </div>

          {/* Study Tips */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Lightbulb className="w-5 h-5 text-yellow-500 mr-2" />
              Dica de Estudo
            </h3>
            
            <p className="text-sm text-gray-700 mb-3">
              "Jung dizia que 'Quem olha para fora, sonha; quem olha para dentro, desperta.' 
              Pratique a introspecção enquanto estuda os conceitos - conecte a teoria com sua experiência pessoal."
            </p>
            
            <div className="text-xs text-gray-500">
              Dica baseada no seu progresso atual
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;