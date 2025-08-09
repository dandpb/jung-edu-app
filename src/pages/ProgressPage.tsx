import React, { useState, useEffect } from 'react';
import { UserProgress, Module, Achievement, LearningInsight } from '../types';
import { useAdmin } from '../contexts/AdminContext';
import AnalyticsPanel from '../components/progress/AnalyticsPanel';
import AchievementSystem from '../components/gamification/AchievementSystem';
import AdaptiveLearningEngine from '../services/adaptive/AdaptiveLearningEngine';
import { 
  TrendingUp, 
  Clock, 
  Target, 
  BookOpen,
  Brain,
  Award,
  Lightbulb,
  Calendar,
  BarChart3,
  Settings,
  Download,
  Share2
} from 'lucide-react';

interface ProgressPageProps {
  userProgress: UserProgress;
  updateProgress: (updates: Partial<UserProgress>) => void;
}

const ProgressPage: React.FC<ProgressPageProps> = ({
  userProgress,
  updateProgress
}) => {
  const { modules } = useAdmin();
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'achievements' | 'insights'>('overview');
  const [adaptiveEngine] = useState(() => new AdaptiveLearningEngine());
  const [learningInsights, setLearningInsights] = useState<LearningInsight[]>([]);
  const [recommendedModules, setRecommendedModules] = useState<Module[]>([]);
  const [personalizedPath, setPersonalizedPath] = useState<any>(null);

  useEffect(() => {
    // Generate learning insights
    const insights = adaptiveEngine.analyzeLearningPatterns(userProgress);
    setLearningInsights(insights);

    // Get content recommendations
    const recommendations = adaptiveEngine.recommendContent(userProgress, modules);
    setRecommendedModules(recommendations);

    // Generate personalized learning path
    const path = adaptiveEngine.generatePersonalizedPath(
      userProgress, 
      modules,
      ['Complete Jung fundamentals', 'Master archetype theory']
    );
    setPersonalizedPath(path);
  }, [userProgress, modules, adaptiveEngine]);

  const handleAchievementUnlock = (achievement: Achievement) => {
    const currentAchievements = userProgress.achievements || [];
    const updatedAchievements = [...currentAchievements, achievement];
    updateProgress({ achievements: updatedAchievements });
  };

  const exportProgress = () => {
    const data = {
      userProgress,
      generatedAt: new Date().toISOString(),
      insights: learningInsights,
      recommendations: recommendedModules.map(m => ({ id: m.id, title: m.title }))
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jung-edu-progress-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareProgress = async () => {
    const shareData = {
      title: 'Meu Progresso no Jung Edu',
      text: `Completei ${userProgress.completedModules.length} módulos com ${Math.round(Object.values(userProgress.quizScores).reduce((a, b) => a + b, 0) / Object.keys(userProgress.quizScores).length || 0)}% de média nos quizzes!`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      alert('Link copiado para a área de transferência!');
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const calculateCompletionRate = () => {
    return Math.round((userProgress.completedModules.length / modules.length) * 100);
  };

  const calculateAverageScore = () => {
    const scores = Object.values(userProgress.quizScores);
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Meu Progresso</h1>
            <p className="text-gray-600">Acompanhe seu desenvolvimento no estudo da psicologia junguiana</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={shareProgress}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Share2 className="w-4 h-4" />
              <span>Compartilhar</span>
            </button>
            <button
              onClick={exportProgress}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              <span>Exportar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
              { id: 'analytics', label: 'Análise Detalhada', icon: TrendingUp },
              { id: 'achievements', label: 'Conquistas', icon: Award },
              { id: 'insights', label: 'Insights', icon: Lightbulb }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Módulos Concluídos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {userProgress.completedModules.length}/{modules.length}
                  </p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${calculateCompletionRate()}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">{calculateCompletionRate()}% completo</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pontuação Média</p>
                  <p className="text-2xl font-bold text-gray-900">{calculateAverageScore()}%</p>
                </div>
                <Target className="w-8 h-8 text-green-600" />
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  {calculateAverageScore() >= 90 ? 'Excelente!' :
                   calculateAverageScore() >= 80 ? 'Muito bom!' :
                   calculateAverageScore() >= 70 ? 'Bom progresso' : 'Continue estudando'}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tempo de Estudo</p>
                  <p className="text-2xl font-bold text-gray-900">{formatTime(userProgress.totalTime)}</p>
                </div>
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  {userProgress.analytics?.streakDays || 0} dias consecutivos
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conquistas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {userProgress.achievements?.length || 0}
                  </p>
                </div>
                <Award className="w-8 h-8 text-orange-600" />
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600">Desbloqueadas</p>
              </div>
            </div>
          </div>

          {/* Learning Path */}
          {personalizedPath && (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Brain className="w-5 h-5 mr-2" />
                Caminho de Aprendizado Personalizado
              </h3>
              
              <div className="mb-4">
                <h4 className="font-medium text-gray-900">{personalizedPath.name}</h4>
                <p className="text-sm text-gray-600">{personalizedPath.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {personalizedPath.modules.slice(0, 3).map((moduleId: string) => {
                  const module = modules.find(m => m.id === moduleId);
                  if (!module) return null;
                  
                  return (
                    <div key={moduleId} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center mb-2">
                        <span className="text-2xl mr-2">{module.icon}</span>
                        <h5 className="font-medium text-gray-900">{module.title}</h5>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{module.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{module.difficulty}</span>
                        <span>{module.estimatedTime}min</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommended Content */}
          {recommendedModules.length > 0 && (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Lightbulb className="w-5 h-5 mr-2" />
                Conteúdo Recomendado
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendedModules.slice(0, 3).map(module => (
                  <div key={module.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">{module.icon}</span>
                      <h5 className="font-medium text-gray-900">{module.title}</h5>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{module.description}</p>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        module.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                        module.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {module.difficulty}
                      </span>
                      <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                        Estudar →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Atividade Recente
            </h3>
            
            <div className="space-y-4">
              {userProgress.analytics?.lastWeekActivity?.slice(-5).reverse().map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(activity.date).toLocaleDateString('pt-BR', { 
                        weekday: 'long', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="text-xs text-gray-600">
                      {activity.modulesCompleted} módulos • {activity.quizzesTaken} quizzes • {activity.notesCreated} anotações
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatTime(activity.timeSpent)}
                  </div>
                </div>
              )) || (
                <p className="text-gray-500 text-center py-4">Nenhuma atividade recente</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <AnalyticsPanel userProgress={userProgress} />
      )}

      {activeTab === 'achievements' && (
        <AchievementSystem 
          userProgress={userProgress} 
          onAchievementUnlock={handleAchievementUnlock}
        />
      )}

      {activeTab === 'insights' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Brain className="w-5 h-5 mr-2" />
              Insights de Aprendizado
            </h3>
            
            {learningInsights.length > 0 ? (
              <div className="space-y-4">
                {learningInsights.map((insight, index) => (
                  <div key={index} className={`p-4 rounded-lg border-l-4 ${
                    insight.type === 'strength' ? 'border-green-500 bg-green-50' :
                    insight.type === 'weakness' ? 'border-red-500 bg-red-50' :
                    insight.type === 'milestone' ? 'border-blue-500 bg-blue-50' :
                    'border-purple-500 bg-purple-50'
                  }`}>
                    <h4 className="font-medium text-gray-900 mb-2">{insight.title}</h4>
                    <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
                    {insight.suggestedActions && insight.suggestedActions.length > 0 && (
                      <div className="flex items-center text-sm text-primary-600">
                        <Settings className="w-4 h-4 mr-1" />
                        <span>Ação recomendada disponível</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Continue estudando para gerar insights personalizados sobre seu aprendizado.
                </p>
              </div>
            )}
          </div>

          {/* Learning Recommendations */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Lightbulb className="w-5 h-5 mr-2" />
              Recomendações Personalizadas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Próximos Passos</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Complete o módulo sobre tipos psicológicos</li>
                  <li>• Revise conceitos de arquétipos</li>
                  <li>• Pratique análise de sonhos</li>
                </ul>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Pontos Fortes</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Excelente compreensão do inconsciente coletivo</li>
                  <li>• Boa aplicação prática dos conceitos</li>
                  <li>• Consistência nos estudos</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressPage;