import React, { useState, useEffect, useMemo } from 'react';
import { Achievement, UserProgress, AchievementCategory } from '../../types';
import { 
  Trophy, 
  Star, 
  Crown, 
  Award,
  Target,
  Zap,
  Brain,
  Users,
  Book,
  TrendingUp,
  CheckCircle,
  Lock,
  Gift,
  Sparkles,
  Medal,
  Flame
} from 'lucide-react';

interface AchievementSystemProps {
  userProgress: UserProgress;
  onAchievementUnlock?: (achievement: Achievement) => void;
  className?: string;
}

const AchievementSystem: React.FC<AchievementSystemProps> = ({
  userProgress,
  onAchievementUnlock,
  className = ''
}) => {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [showUnlockAnimation, setShowUnlockAnimation] = useState<Achievement | null>(null);
  const [userLevel, setUserLevel] = useState(1);
  const [userXP, setUserXP] = useState(0);
  const [nextLevelXP, setNextLevelXP] = useState(100);

  // Sample achievements data
  const allAchievements: Achievement[] = [
    // Progress Achievements
    {
      id: 'first-module',
      title: 'Primeiro Passo',
      description: 'Complete seu primeiro módulo',
      icon: '🎯',
      category: 'progress',
      points: 50,
      unlockedAt: new Date('2024-01-01'),
      rarity: 'common',
      requirements: [{ type: 'complete_modules', value: 1, operator: '>=' }]
    },
    {
      id: 'jung-explorer',
      title: 'Explorador Junguiano',
      description: 'Complete 5 módulos sobre Jung',
      icon: '🗺️',
      category: 'progress',
      points: 200,
      unlockedAt: new Date('2024-01-15'),
      rarity: 'rare',
      requirements: [{ type: 'complete_modules', value: 5, operator: '>=' }]
    },
    {
      id: 'master-student',
      title: 'Estudante Mestre',
      description: 'Complete todos os módulos disponíveis',
      icon: '👑',
      category: 'progress',
      points: 1000,
      unlockedAt: new Date(),
      rarity: 'legendary',
      requirements: [{ type: 'complete_modules', value: 10, operator: '>=' }]
    },

    // Knowledge Achievements
    {
      id: 'quiz-master',
      title: 'Mestre dos Quizzes',
      description: 'Obtenha 90% ou mais em 10 quizzes',
      icon: '🧠',
      category: 'knowledge',
      points: 300,
      unlockedAt: new Date('2024-01-10'),
      rarity: 'rare',
      requirements: [{ type: 'quiz_score', value: 90, operator: '>=' }]
    },
    {
      id: 'perfect-score',
      title: 'Pontuação Perfeita',
      description: 'Obtenha 100% em um quiz',
      icon: '💯',
      category: 'knowledge',
      points: 100,
      unlockedAt: new Date('2024-01-05'),
      rarity: 'common',
      requirements: [{ type: 'quiz_score', value: 100, operator: '=' }]
    },
    {
      id: 'knowledge-seeker',
      title: 'Buscador do Conhecimento',
      description: 'Mantenha uma média de 85% nos quizzes',
      icon: '📚',
      category: 'knowledge',
      points: 250,
      unlockedAt: new Date(),
      rarity: 'epic',
      requirements: [{ type: 'quiz_score', value: 85, operator: '>=' }]
    },

    // Engagement Achievements
    {
      id: 'dedicated-learner',
      title: 'Aprendiz Dedicado',
      description: 'Estude por 10 horas consecutivas',
      icon: '⏰',
      category: 'engagement',
      points: 150,
      unlockedAt: new Date('2024-01-12'),
      rarity: 'common',
      requirements: [{ type: 'time_spent', value: 600, operator: '>=' }]
    },
    {
      id: 'streak-champion',
      title: 'Campeão da Sequência',
      description: 'Mantenha uma sequência de 30 dias',
      icon: '🔥',
      category: 'engagement',
      points: 500,
      unlockedAt: new Date(),
      rarity: 'epic',
      requirements: [{ type: 'consecutive_days', value: 30, operator: '>=' }]
    },
    {
      id: 'night-owl',
      title: 'Coruja Noturna',
      description: 'Complete um módulo após 22h',
      icon: '🦉',
      category: 'engagement',
      points: 75,
      unlockedAt: new Date(),
      rarity: 'common',
      requirements: [{ type: 'complete_modules', value: 1, operator: '>=' }]
    },

    // Social Achievements
    {
      id: 'forum-contributor',
      title: 'Contribuidor do Fórum',
      description: 'Faça 10 posts no fórum',
      icon: '💬',
      category: 'social',
      points: 200,
      unlockedAt: new Date(),
      rarity: 'rare',
      requirements: [{ type: 'forum_posts', value: 10, operator: '>=' }]
    },
    {
      id: 'helpful-peer',
      title: 'Colega Prestativo',
      description: 'Receba 50 curtidas em seus posts',
      icon: '🤝',
      category: 'social',
      points: 300,
      unlockedAt: new Date(),
      rarity: 'rare',
      requirements: [{ type: 'forum_posts', value: 50, operator: '>=' }]
    },

    // Exploration Achievements
    {
      id: 'dream-analyst',
      title: 'Analista de Sonhos',
      description: 'Complete o módulo de análise de sonhos',
      icon: '🌙',
      category: 'exploration',
      points: 150,
      unlockedAt: new Date(),
      rarity: 'common',
      requirements: [{ type: 'complete_modules', value: 1, operator: '>=' }]
    },
    {
      id: 'archetype-master',
      title: 'Mestre dos Arquétipos',
      description: 'Explore todos os arquétipos principais',
      icon: '🎭',
      category: 'exploration',
      points: 400,
      unlockedAt: new Date(),
      rarity: 'epic',
      requirements: [{ type: 'complete_modules', value: 3, operator: '>=' }]
    },

    // Mastery Achievements
    {
      id: 'jung-scholar',
      title: 'Estudioso Junguiano',
      description: 'Demonstre domínio avançado em todos os conceitos',
      icon: '🎓',
      category: 'mastery',
      points: 1500,
      unlockedAt: new Date(),
      rarity: 'legendary',
      requirements: [
        { type: 'complete_modules', value: 10, operator: '>=' },
        { type: 'quiz_score', value: 90, operator: '>=' },
        { type: 'time_spent', value: 2400, operator: '>=' }
      ]
    }
  ];

  // Calculate user level and XP
  useEffect(() => {
    const totalPoints = (userProgress.achievements || []).reduce((sum, achievement) => sum + achievement.points, 0);
    const level = Math.floor(totalPoints / 1000) + 1;
    const xp = totalPoints % 1000;
    const nextLevel = 1000;
    
    setUserLevel(level);
    setUserXP(xp);
    setNextLevelXP(nextLevel);
  }, [userProgress.achievements]);

  // Check for newly unlocked achievements
  useEffect(() => {
    const unlockedAchievements = userProgress.achievements || [];
    const unlockedIds = new Set(unlockedAchievements.map(a => a.id));
    
    allAchievements.forEach(achievement => {
      if (!unlockedIds.has(achievement.id) && isAchievementUnlocked(achievement)) {
        // Simulate achievement unlock
        setShowUnlockAnimation(achievement);
        onAchievementUnlock?.(achievement);
        
        // Hide animation after 3 seconds
        setTimeout(() => setShowUnlockAnimation(null), 3000);
      }
    });
  }, [userProgress, onAchievementUnlock]);

  const isAchievementUnlocked = (achievement: Achievement): boolean => {
    const unlockedIds = new Set((userProgress.achievements || []).map(a => a.id));
    return unlockedIds.has(achievement.id);
  };

  const canUnlockAchievement = (achievement: Achievement): boolean => {
    if (isAchievementUnlocked(achievement)) return true;
    
    return achievement.requirements.every(req => {
      switch (req.type) {
        case 'complete_modules':
          const completedCount = userProgress.completedModules.length;
          return evaluateCondition(completedCount, req.operator, req.value);
        case 'quiz_score':
          const avgScore = Object.values(userProgress.quizScores).reduce((a, b) => a + b, 0) / Object.keys(userProgress.quizScores).length || 0;
          return evaluateCondition(avgScore, req.operator, req.value);
        case 'time_spent':
          return evaluateCondition(userProgress.totalTime, req.operator, req.value);
        case 'consecutive_days':
          return evaluateCondition(userProgress.analytics?.streakDays || 0, req.operator, req.value);
        case 'forum_posts':
          // This would come from forum data
          return false;
        default:
          return false;
      }
    });
  };

  const evaluateCondition = (value: number, operator: string, target: number): boolean => {
    switch (operator) {
      case '>=': return value >= target;
      case '<=': return value <= target;
      case '=': return value === target;
      case '>': return value > target;
      default: return false;
    }
  };

  const getRarityColor = (rarity: Achievement['rarity']) => {
    const colors = {
      common: 'text-gray-600 bg-gray-100',
      rare: 'text-blue-600 bg-blue-100',
      epic: 'text-purple-600 bg-purple-100',
      legendary: 'text-yellow-600 bg-yellow-100'
    };
    return colors[rarity] || colors.common;
  };

  const getRarityIcon = (rarity: Achievement['rarity']) => {
    const icons = {
      common: Star,
      rare: Award,
      epic: Crown,
      legendary: Trophy
    };
    return icons[rarity] || Star;
  };

  const getCategoryIcon = (category: AchievementCategory) => {
    const icons = {
      progress: Target,
      knowledge: Brain,
      engagement: Zap,
      social: Users,
      exploration: Book,
      mastery: Trophy
    };
    return icons[category] || Star;
  };

  const getCategoryLabel = (category: AchievementCategory) => {
    const labels = {
      progress: 'Progresso',
      knowledge: 'Conhecimento',
      engagement: 'Engajamento',
      social: 'Social',
      exploration: 'Exploração',
      mastery: 'Maestria'
    };
    return labels[category] || category;
  };

  const filteredAchievements = useMemo(() => {
    if (selectedCategory === 'all') return allAchievements;
    return allAchievements.filter(achievement => achievement.category === selectedCategory);
  }, [selectedCategory, allAchievements]);

  const achievementStats = useMemo(() => {
    const unlocked = allAchievements.filter(a => isAchievementUnlocked(a)).length;
    const total = allAchievements.length;
    const totalPoints = (userProgress.achievements || []).reduce((sum, a) => sum + a.points, 0);
    
    return {
      unlocked,
      total,
      percentage: Math.round((unlocked / total) * 100),
      totalPoints
    };
  }, [allAchievements, userProgress.achievements]);

  return (
    <div className={`achievement-system ${className}`}>
      {/* Header with User Level */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Sistema de Conquistas</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Crown className="w-5 h-5" />
                  <span>Nível {userLevel}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5" />
                  <span>{achievementStats.unlocked}/{achievementStats.total} Conquistadas</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5" />
                  <span>{achievementStats.totalPoints} XP</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm opacity-90 mb-1">Próximo Nível</div>
              <div className="w-48 bg-white/20 rounded-full h-3 mb-2">
                <div
                  className="bg-white h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(userXP / nextLevelXP) * 100}%` }}
                />
              </div>
              <div className="text-sm opacity-90">{userXP}/{nextLevelXP} XP</div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievement Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-green-600">{achievementStats.unlocked}</div>
          <div className="text-sm text-gray-600">Conquistadas</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-blue-600">{achievementStats.percentage}%</div>
          <div className="text-sm text-gray-600">Progresso</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-purple-600">{achievementStats.totalPoints}</div>
          <div className="text-sm text-gray-600">Pontos Totais</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-orange-600">{userLevel}</div>
          <div className="text-sm text-gray-600">Nível Atual</div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todas
          </button>
          {(['progress', 'knowledge', 'engagement', 'social', 'exploration', 'mastery'] as AchievementCategory[]).map(category => {
            const Icon = getCategoryIcon(category);
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                  selectedCategory === category
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{getCategoryLabel(category)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAchievements.map(achievement => {
          const unlocked = isAchievementUnlocked(achievement);
          const canUnlock = canUnlockAchievement(achievement);
          const RarityIcon = getRarityIcon(achievement.rarity);
          
          return (
            <div
              key={achievement.id}
              className={`bg-white rounded-lg border-2 p-6 transition-all duration-300 ${
                unlocked 
                  ? 'border-green-200 bg-green-50' 
                  : canUnlock 
                    ? 'border-blue-200 bg-blue-50' 
                    : 'border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`text-4xl ${unlocked ? '' : 'grayscale'}`}>
                    {achievement.icon}
                  </div>
                  <div>
                    <h3 className={`font-semibold ${unlocked ? 'text-green-900' : 'text-gray-900'}`}>
                      {achievement.title}
                    </h3>
                    <div className={`flex items-center space-x-2 text-sm ${getRarityColor(achievement.rarity)}`}>
                      <RarityIcon className="w-4 h-4" />
                      <span className="capitalize">{achievement.rarity}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {unlocked ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : canUnlock ? (
                    <Gift className="w-6 h-6 text-blue-600" />
                  ) : (
                    <Lock className="w-6 h-6 text-gray-400" />
                  )}
                </div>
              </div>
              
              <p className={`text-sm mb-4 ${unlocked ? 'text-green-800' : 'text-gray-600'}`}>
                {achievement.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">{achievement.points} XP</span>
                </div>
                
                {unlocked && achievement.unlockedAt && (
                  <div className="text-xs text-gray-500">
                    {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
              
              {/* Progress Bar for Locked Achievements */}
              {!unlocked && canUnlock && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: '80%' }} // This would be calculated based on actual progress
                    />
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Quase lá!</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Achievement Unlock Animation */}
      {showUnlockAnimation && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center animate-bounce-in">
            <div className="mb-4">
              <Sparkles className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-pulse" />
              <div className="text-6xl mb-4">{showUnlockAnimation.icon}</div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Conquista Desbloqueada!
            </h2>
            
            <h3 className="text-xl font-semibold text-primary-600 mb-2">
              {showUnlockAnimation.title}
            </h3>
            
            <p className="text-gray-600 mb-4">
              {showUnlockAnimation.description}
            </p>
            
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-2 text-yellow-600">
                <Star className="w-5 h-5" />
                <span className="font-semibold">+{showUnlockAnimation.points} XP</span>
              </div>
              
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRarityColor(showUnlockAnimation.rarity)}`}>
                {showUnlockAnimation.rarity}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AchievementSystem;