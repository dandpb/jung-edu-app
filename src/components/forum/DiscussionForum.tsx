import React, { useState, useEffect, useMemo } from 'react';
import { ForumPost, ForumReply, ForumCategory, ReactionSummary } from '../../types';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter,
  ThumbsUp,
  ThumbsDown,
  Heart,
  Share2,
  BookmarkPlus,
  Flag,
  Clock,
  User,
  Eye,
  Pin,
  Lock,
  TrendingUp,
  Star,
  MessageCircle
} from 'lucide-react';

interface DiscussionForumProps {
  moduleId?: string;
  category?: ForumCategory;
  className?: string;
}

const DiscussionForum: React.FC<DiscussionForumProps> = ({
  moduleId,
  category = 'general-discussion',
  className = ''
}) => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'trending'>('recent');
  const [filterCategory, setFilterCategory] = useState<ForumCategory | 'all'>('all');
  const [currentUser] = useState({ id: 'user-1', name: 'João Silva' }); // Mock current user

  // Sample forum data
  useEffect(() => {
    const samplePosts: ForumPost[] = [
      {
        id: '1',
        title: 'Como aplicar o trabalho com a sombra no dia a dia?',
        content: 'Estou estudando sobre o conceito de sombra de Jung e gostaria de saber como posso aplicar essas ideias na minha vida pessoal. Alguém tem experiências práticas para compartilhar?',
        authorId: 'user-2',
        authorName: 'Maria Santos',
        moduleId: 'archetypes',
        category: 'general-discussion',
        tags: ['shadow-work', 'practical-application', 'personal-development'],
        createdAt: new Date('2024-01-05T10:30:00'),
        updatedAt: new Date('2024-01-05T15:45:00'),
        replies: [
          {
            id: 'reply-1',
            content: 'Uma técnica que me ajuda muito é a observação dos meus julgamentos sobre outras pessoas. Muitas vezes, o que mais me incomoda no outro é uma projeção da minha própria sombra.',
            authorId: 'user-3',
            authorName: 'Carlos Oliveira',
            createdAt: new Date('2024-01-05T11:15:00'),
            updatedAt: new Date('2024-01-05T11:15:00'),
            votes: 8,
            reactions: [
              { emoji: '👍', count: 5, userReacted: true },
              { emoji: '💡', count: 3, userReacted: false }
            ]
          },
          {
            id: 'reply-2',
            content: 'Recomendo o livro "Encontro com a Sombra" organizado por Connie Zweig. Tem muitos exemplos práticos e exercícios.',
            authorId: 'user-4',
            authorName: 'Ana Pereira',
            createdAt: new Date('2024-01-05T14:20:00'),
            updatedAt: new Date('2024-01-05T14:20:00'),
            votes: 12,
            reactions: [
              { emoji: '📚', count: 6, userReacted: false },
              { emoji: '👍', count: 4, userReacted: false }
            ]
          }
        ],
        votes: 15,
        isLocked: false,
        isPinned: false,
        views: 127
      },
      {
        id: '2',
        title: 'Dúvida sobre os tipos psicológicos',
        content: 'Estou com dificuldade para entender a diferença entre as funções de pensamento e sentimento. Alguém pode explicar com exemplos?',
        authorId: 'user-5',
        authorName: 'Pedro Costa',
        moduleId: 'psychological-types',
        category: 'module-questions',
        tags: ['psychological-types', 'thinking-feeling', 'functions'],
        createdAt: new Date('2024-01-04T16:20:00'),
        updatedAt: new Date('2024-01-04T16:20:00'),
        replies: [
          {
            id: 'reply-3',
            content: 'A função pensamento se baseia em lógica e análise objetiva, enquanto a função sentimento considera valores pessoais e impacto emocional. Por exemplo, ao tomar uma decisão profissional, o pensamento consideraria salário e perspectivas de carreira, enquanto o sentimento consideraria satisfação pessoal e impacto na família.',
            authorId: 'user-6',
            authorName: 'Dr. Roberto Lima',
            createdAt: new Date('2024-01-04T17:30:00'),
            updatedAt: new Date('2024-01-04T17:30:00'),
            votes: 20,
            reactions: [
              { emoji: '👍', count: 8, userReacted: false },
              { emoji: '💡', count: 5, userReacted: true },
              { emoji: '🎯', count: 3, userReacted: false }
            ]
          }
        ],
        votes: 8,
        isLocked: false,
        isPinned: true,
        views: 89
      },
      {
        id: '3',
        title: 'Compartilhando um sonho interessante',
        content: 'Tive um sonho muito simbólico ontem à noite e gostaria de compartilhar para discussão. Sonhei que estava em uma casa com muitos quartos, alguns iluminados e outros completamente escuros...',
        authorId: 'user-7',
        authorName: 'Lucia Ferreira',
        category: 'dream-sharing',
        tags: ['dream-analysis', 'symbolism', 'house-symbol'],
        createdAt: new Date('2024-01-03T09:15:00'),
        updatedAt: new Date('2024-01-03T09:15:00'),
        replies: [],
        votes: 5,
        isLocked: false,
        isPinned: false,
        views: 45
      }
    ];

    setPosts(samplePosts);
  }, []);

  const filteredAndSortedPosts = useMemo(() => {
    let filtered = posts;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(post => post.category === filterCategory);
    }

    // Apply module filter if provided
    if (moduleId) {
      filtered = filtered.filter(post => post.moduleId === moduleId);
    }

    // Sort posts
    switch (sortBy) {
      case 'popular':
        return [...filtered].sort((a, b) => b.votes - a.votes);
      case 'trending':
        return [...filtered].sort((a, b) => (b.votes + b.views) - (a.votes + a.views));
      default:
        return [...filtered].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
  }, [posts, searchQuery, filterCategory, moduleId, sortBy]);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) return `${days}d atrás`;
    if (hours > 0) return `${hours}h atrás`;
    if (minutes > 0) return `${minutes}m atrás`;
    return 'Agora mesmo';
  };

  const getCategoryLabel = (cat: ForumCategory) => {
    const labels = {
      'general-discussion': 'Discussão Geral',
      'module-questions': 'Dúvidas de Módulos',
      'dream-sharing': 'Compartilhamento de Sonhos',
      'case-studies': 'Estudos de Caso',
      'research': 'Pesquisa',
      'announcements': 'Anúncios'
    };
    return labels[cat] || cat;
  };

  const getCategoryColor = (cat: ForumCategory) => {
    const colors = {
      'general-discussion': 'bg-blue-100 text-blue-800',
      'module-questions': 'bg-green-100 text-green-800',
      'dream-sharing': 'bg-purple-100 text-purple-800',
      'case-studies': 'bg-orange-100 text-orange-800',
      'research': 'bg-red-100 text-red-800',
      'announcements': 'bg-yellow-100 text-yellow-800'
    };
    return colors[cat] || 'bg-gray-100 text-gray-800';
  };

  const handleVote = (postId: string, isUpvote: boolean) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          votes: post.votes + (isUpvote ? 1 : -1)
        };
      }
      return post;
    }));
  };

  const handleReplyVote = (postId: string, replyId: string, isUpvote: boolean) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          replies: post.replies.map(reply => {
            if (reply.id === replyId) {
              return {
                ...reply,
                votes: reply.votes + (isUpvote ? 1 : -1)
              };
            }
            return reply;
          })
        };
      }
      return post;
    }));
  };

  const handleReaction = (postId: string, replyId: string | null, emoji: string) => {
    // Implementation for adding reactions
    console.log('Reaction:', { postId, replyId, emoji });
  };

  if (selectedPost) {
    return (
      <div className={`discussion-forum ${className}`}>
        <div className="mb-6">
          <button
            onClick={() => setSelectedPost(null)}
            className="text-primary-600 hover:text-primary-700 mb-4 flex items-center"
          >
            ← Voltar ao fórum
          </button>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {/* Post Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{selectedPost.authorName}</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{formatTimeAgo(selectedPost.createdAt)}</span>
                    <Eye className="w-4 h-4 ml-2" />
                    <span>{selectedPost.views} visualizações</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {selectedPost.isPinned && <Pin className="w-4 h-4 text-yellow-600" />}
                {selectedPost.isLocked && <Lock className="w-4 h-4 text-red-600" />}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(selectedPost.category)}`}>
                  {getCategoryLabel(selectedPost.category)}
                </span>
              </div>
            </div>

            {/* Post Title and Content */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{selectedPost.title}</h1>
            <div className="prose max-w-none mb-6">
              <p className="text-gray-700 whitespace-pre-wrap">{selectedPost.content}</p>
            </div>

            {/* Post Tags */}
            {selectedPost.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedPost.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Post Actions */}
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleVote(selectedPost.id, true)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-green-600"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>{selectedPost.votes}</span>
                </button>
                
                <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
                  <MessageSquare className="w-4 h-4" />
                  <span>{selectedPost.replies.length}</span>
                </button>
                
                <button className="flex items-center space-x-2 text-gray-600 hover:text-red-600">
                  <Heart className="w-4 h-4" />
                </button>
                
                <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
                  <Share2 className="w-4 h-4" />
                  <span>Compartilhar</span>
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-600 hover:text-yellow-600">
                  <BookmarkPlus className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-600 hover:text-red-600">
                  <Flag className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Replies */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Respostas ({selectedPost.replies.length})
          </h2>
          
          {selectedPost.replies.map(reply => (
            <div key={reply.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{reply.authorName}</h4>
                    <span className="text-sm text-gray-500">{formatTimeAgo(reply.createdAt)}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleReplyVote(selectedPost.id, reply.id, true)}
                    className="flex items-center space-x-1 text-gray-600 hover:text-green-600"
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span className="text-sm">{reply.votes}</span>
                  </button>
                </div>
              </div>
              
              <p className="text-gray-700 mb-4">{reply.content}</p>
              
              {/* Reply Reactions */}
              {reply.reactions && reply.reactions.length > 0 && (
                <div className="flex items-center space-x-2">
                  {reply.reactions.map((reaction, index) => (
                    <button
                      key={index}
                      onClick={() => handleReaction(selectedPost.id, reply.id, reaction.emoji)}
                      className={`flex items-center space-x-1 px-2 py-1 rounded-full text-sm ${
                        reaction.userReacted 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span>{reaction.emoji}</span>
                      <span>{reaction.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {/* Reply Form */}
          {!selectedPost.isLocked && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">Adicionar Resposta</h3>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                rows={4}
                placeholder="Digite sua resposta..."
              />
              <div className="flex justify-end mt-4">
                <button className="btn-primary">
                  Publicar Resposta
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`discussion-forum ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fórum de Discussão</h2>
          <p className="text-gray-600">Conecte-se com outros estudantes e compartilhe insights</p>
        </div>
        
        <button
          onClick={() => setShowNewPostForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Discussão</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar discussões..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="recent">Mais Recentes</option>
            <option value="popular">Mais Populares</option>
            <option value="trending">Em Alta</option>
          </select>
          
          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">Todas as Categorias</option>
            <option value="general-discussion">Discussão Geral</option>
            <option value="module-questions">Dúvidas de Módulos</option>
            <option value="dream-sharing">Compartilhamento de Sonhos</option>
            <option value="case-studies">Estudos de Caso</option>
            <option value="research">Pesquisa</option>
          </select>
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredAndSortedPosts.map(post => (
          <div
            key={post.id}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedPost(post)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{post.authorName}</h4>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeAgo(post.createdAt)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {post.isPinned && <Pin className="w-4 h-4 text-yellow-600" />}
                {post.isLocked && <Lock className="w-4 h-4 text-red-600" />}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(post.category)}`}>
                  {getCategoryLabel(post.category)}
                </span>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
            <p className="text-gray-700 mb-4 line-clamp-2">{post.content}</p>
            
            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
                {post.tags.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    +{post.tags.length - 3}
                  </span>
                )}
              </div>
            )}
            
            {/* Post Stats */}
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <ThumbsUp className="w-4 h-4" />
                <span>{post.votes}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageCircle className="w-4 h-4" />
                <span>{post.replies.length}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Eye className="w-4 h-4" />
                <span>{post.views}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Post Form Modal */}
      {showNewPostForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Nova Discussão</h3>
                <button
                  onClick={() => setShowNewPostForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="general-discussion">Discussão Geral</option>
                    <option value="module-questions">Dúvidas de Módulos</option>
                    <option value="dream-sharing">Compartilhamento de Sonhos</option>
                    <option value="case-studies">Estudos de Caso</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Título da discussão..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conteúdo
                  </label>
                  <textarea
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Descreva sua questão ou compartilhe seus insights..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="jung, arquétipos, sombra..."
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewPostForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Publicar Discussão
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscussionForum;