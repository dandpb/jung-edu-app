import React, { useMemo } from 'react';
import { UserProgress, UserAnalytics, DailyActivity } from '../../types';
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Award,
  Brain,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  BookOpen,
  CheckCircle2
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AnalyticsPanelProps {
  userProgress: UserProgress;
  className?: string;
}

const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  userProgress,
  className = ''
}) => {
  const analytics = userProgress.analytics;

  // Generate sample data if analytics is not available
  const defaultAnalytics: UserAnalytics = {
    totalStudyTime: 2400, // 40 hours
    averageQuizScore: 85,
    moduleCompletionRate: 0.75,
    streakDays: 12,
    preferredLearningTime: 'evening',
    strongConcepts: ['archetypes', 'collective-unconscious', 'individuation'],
    weakConcepts: ['personality-types', 'complex-theory'],
    learningVelocity: 1.2,
    engagementScore: 78,
    lastWeekActivity: [
      { date: '2024-01-01', timeSpent: 45, modulesCompleted: 1, quizzesTaken: 2, notesCreated: 3 },
      { date: '2024-01-02', timeSpent: 60, modulesCompleted: 0, quizzesTaken: 1, notesCreated: 5 },
      { date: '2024-01-03', timeSpent: 30, modulesCompleted: 2, quizzesTaken: 3, notesCreated: 2 },
      { date: '2024-01-04', timeSpent: 90, modulesCompleted: 1, quizzesTaken: 1, notesCreated: 4 },
      { date: '2024-01-05', timeSpent: 20, modulesCompleted: 0, quizzesTaken: 0, notesCreated: 1 },
      { date: '2024-01-06', timeSpent: 75, modulesCompleted: 1, quizzesTaken: 2, notesCreated: 6 },
      { date: '2024-01-07', timeSpent: 40, modulesCompleted: 0, quizzesTaken: 1, notesCreated: 2 }
    ]
  };

  const data = analytics || defaultAnalytics;

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const conceptMasteryData = useMemo(() => {
    const strong = data.strongConcepts.map(concept => ({
      name: concept,
      level: Math.random() * 20 + 80, // 80-100%
      category: 'strong'
    }));
    
    const weak = data.weakConcepts.map(concept => ({
      name: concept,
      level: Math.random() * 30 + 40, // 40-70%
      category: 'weak'
    }));
    
    return [...strong, ...weak];
  }, [data.strongConcepts, data.weakConcepts]);

  const learningPatternData = useMemo(() => {
    const timeSlots = ['morning', 'afternoon', 'evening', 'night'];
    return timeSlots.map(slot => ({
      time: slot,
      efficiency: slot === data.preferredLearningTime ? 90 : Math.random() * 40 + 30,
      sessions: Math.floor(Math.random() * 15) + 5
    }));
  }, [data.preferredLearningTime]);

  const weeklyProgressData = useMemo(() => {
    return data.lastWeekActivity.map((day, index) => ({
      ...day,
      dayName: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][index],
      totalActivity: day.timeSpent + day.modulesCompleted * 10 + day.quizzesTaken * 5 + day.notesCreated * 2
    }));
  }, [data.lastWeekActivity]);

  const engagementData = [
    { name: 'Engajamento Atual', value: data.engagementScore },
    { name: 'Meta', value: 100 - data.engagementScore }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className={`analytics-panel ${className}`}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Análise de Aprendizado</h2>
        <p className="text-gray-600">Insights detalhados sobre seu progresso e desempenho</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Tempo Total de Estudo</p>
              <p className="text-2xl font-bold text-blue-900">{formatTime(data.totalStudyTime)}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-blue-700">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>+12% esta semana</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Pontuação Média</p>
              <p className="text-2xl font-bold text-green-900">{data.averageQuizScore}%</p>
            </div>
            <Target className="w-8 h-8 text-green-600" />
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-green-700">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>Excelente desempenho</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Taxa de Conclusão</p>
              <p className="text-2xl font-bold text-purple-900">{Math.round(data.moduleCompletionRate * 100)}%</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-purple-600" />
          </div>
          <div className="mt-4">
            <div className="w-full bg-purple-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${data.moduleCompletionRate * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Sequência Atual</p>
              <p className="text-2xl font-bold text-orange-900">{data.streakDays} dias</p>
            </div>
            <Award className="w-8 h-8 text-orange-600" />
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-orange-700">
              <Zap className="w-4 h-4 mr-1" />
              <span>Continue assim!</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Weekly Activity */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Atividade Semanal</h3>
            <Activity className="w-5 h-5 text-gray-600" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={weeklyProgressData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dayName" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'timeSpent' ? formatTime(value as number) : value,
                  name === 'timeSpent' ? 'Tempo de Estudo' :
                  name === 'modulesCompleted' ? 'Módulos Concluídos' :
                  name === 'quizzesTaken' ? 'Quizzes Realizados' : 'Anotações Criadas'
                ]}
              />
              <Area type="monotone" dataKey="timeSpent" stackId="1" stroke="#8884d8" fill="#8884d8" />
              <Area type="monotone" dataKey="modulesCompleted" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
              <Area type="monotone" dataKey="quizzesTaken" stackId="1" stroke="#ffc658" fill="#ffc658" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Learning Patterns */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Padrões de Aprendizado</h3>
            <Calendar className="w-5 h-5 text-gray-600" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={learningPatternData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  `${value}%`,
                  name === 'efficiency' ? 'Eficiência' : 'Sessões'
                ]}
              />
              <Bar dataKey="efficiency" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 text-sm text-gray-600">
            <p>💡 Você aprende melhor no período: <strong>{data.preferredLearningTime === 'morning' ? 'manhã' : 
                                                              data.preferredLearningTime === 'afternoon' ? 'tarde' :
                                                              data.preferredLearningTime === 'evening' ? 'noite' : 'madrugada'}</strong></p>
          </div>
        </div>
      </div>

      {/* Concept Mastery and Engagement */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Concept Mastery */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Domínio de Conceitos</h3>
            <Brain className="w-5 h-5 text-gray-600" />
          </div>
          
          <div className="space-y-4">
            {conceptMasteryData.map((concept, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    concept.category === 'strong' ? 'bg-green-500' : 'bg-orange-500'
                  }`} />
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {concept.name.replace(/-/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        concept.category === 'strong' ? 'bg-green-500' : 'bg-orange-500'
                      }`}
                      style={{ width: `${concept.level}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12">
                    {Math.round(concept.level)}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Recomendações</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Revise conceitos de tipos psicológicos</li>
              <li>• Pratique mais exercícios sobre teoria dos complexos</li>
              <li>• Continue explorando arquétipos - você está indo muito bem!</li>
            </ul>
          </div>
        </div>

        {/* Engagement Score */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Engajamento</h3>
            <PieChart className="w-5 h-5 text-gray-600" />
          </div>
          
          <div className="flex justify-center mb-4">
            <ResponsiveContainer width="100%" height={200}>
              <RechartsPieChart>
                <Pie
                  data={engagementData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {engagementData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {data.engagementScore}%
            </div>
            <p className="text-sm text-gray-600 mb-4">Nível de Engajamento</p>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Sessões Regulares:</span>
                <span className="font-medium">Excelente</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Interação:</span>
                <span className="font-medium">Alta</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Velocidade:</span>
                <span className="font-medium">{data.learningVelocity}x</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Insights */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights de Aprendizado</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Progresso Consistente</h4>
              <p className="text-sm text-gray-600">Você mantém uma rotina de estudos regular há {data.streakDays} dias!</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Brain className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Forte em Conceitos</h4>
              <p className="text-sm text-gray-600">Você tem excelente compreensão de arquétipos e inconsciente coletivo.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Área de Melhoria</h4>
              <p className="text-sm text-gray-600">Foque mais em tipos psicológicos para uma compreensão completa.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;