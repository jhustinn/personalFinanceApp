import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Clock,
  User,
  Star,
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  Target,
  Shield,
  Lightbulb,
  Calendar
} from 'lucide-react';
import { Layout } from '../components/Layout';

// Define the Article interface outside the component for better readability and reusability
interface Article {
  url: string | undefined;
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: 'budgeting' | 'investing' | 'saving' | 'insurance' | 'planning' | 'basics';
  readTime: number;
  author: string;
  publishDate: string;
  rating: number;
  isBookmarked: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

export const EducationalArticles: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // State to handle fetch errors

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch(
          'https://newsapi.org/v2/everything?q=financial+education&from=2025-05-30&sortBy=publishedAt&apiKey=e285796ac3fb47ff9e47abdf34c68844'
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Ensure data.articles exists and is an array before mapping
        if (!data.articles || !Array.isArray(data.articles)) {
          throw new Error('Invalid data format: articles array not found.');
        }

        const mappedArticles: Article[] = data.articles.map((item: any, index: number) => ({
          url: item.url, 
          id: item.url || index.toString(), // Use URL as ID if available, fallback to index
          title: item.title || 'Untitled',
          excerpt: item.description || 'No description available.',
          content: item.content || 'Full content not available from API. Please visit the source.',
          category: 'basics', // default because not available in API
          readTime: Math.floor(Math.random() * 10 + 5), // dummy readTime 5–15 mins
          author: item.author || item.source?.name || 'Unknown',
          publishDate: item.publishedAt || new Date().toISOString(),
          rating: parseFloat((4 + Math.random()).toFixed(1)), // dummy rating 4.0–5.0, formatted to one decimal
          isBookmarked: false,
          difficulty: 'beginner', // default
          tags: ['financial', 'education'] // default tags
        }));

        setArticles(mappedArticles);
      } catch (error: any) {
        console.error('Failed to fetch articles:', error);
        setError(error.message); // Set error message
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []); // Empty dependency array means this effect runs once on mount

  const categories = [
    { id: 'budgeting', name: 'Budgeting', icon: DollarSign, color: 'text-green-600' },
    { id: 'investing', name: 'Investing', icon: TrendingUp, color: 'text-blue-600' },
    { id: 'saving', name: 'Saving', icon: Target, color: 'text-purple-600' },
    { id: 'insurance', name: 'Insurance', icon: Shield, color: 'text-orange-600' },
    { id: 'planning', name: 'Planning', icon: Calendar, color: 'text-red-600' },
    { id: 'basics', name: 'Basics', icon: Lightbulb, color: 'text-yellow-600' }
  ];

  const toggleBookmark = (articleId: string) => {
    setArticles(prev =>
      prev.map(article =>
        article.id === articleId
          ? { ...article, isBookmarked: !article.isBookmarked }
          : article
      )
    );
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || article.category === categoryFilter;
    const matchesDifficulty = difficultyFilter === 'all' || article.difficulty === difficultyFilter;

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      console.error("Invalid date string:", dateString);
      return "Unknown Date";
    }
  };

  const actionButtons = (
    <div className="flex items-center space-x-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search articles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors w-64"
        />
      </div>

      <select
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      >
        <option value="all">All Categories</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>

      <select
        value={difficultyFilter}
        onChange={(e) => setDifficultyFilter(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      >
        <option value="all">All Levels</option>
        <option value="beginner">Beginner</option>
        <option value="intermediate">Intermediate</option>
        <option value="advanced">Advanced</option>
      </select>
    </div>
  );

  if (loading) {
    return (
      <Layout title="Educational Articles">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-600">Loading articles...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Educational Articles">
        <div className="flex flex-col justify-center items-center h-64 text-red-600">
          <p className="font-semibold mb-2">Failed to load articles.</p>
          <p className="text-sm">{error}</p>
          <p className="text-sm mt-2">Please check your API key or try again later.</p>
        </div>
      </Layout>
    );
  }

  if (selectedArticle) {
    return (
      <Layout title="Educational Articles">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Article Header */}
            <div className="p-8 border-b border-gray-200">
              <button
                onClick={() => setSelectedArticle(null)}
                className="text-blue-600 hover:text-blue-700 mb-4 flex items-center space-x-2"
              >
                <span>← Back to Articles</span>
              </button>

              <div className="flex items-center space-x-3 mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(selectedArticle.difficulty)}`}>
                  {selectedArticle.difficulty}
                </span>
                <span className="text-gray-500">•</span>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{selectedArticle.readTime} min read</span>
                </div>
                <span className="text-gray-500">•</span>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm text-gray-600">{selectedArticle.rating}</span>
                </div>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">{selectedArticle.title}</h1>
              <p className="text-lg text-gray-600 mb-6">{selectedArticle.excerpt}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedArticle.author}</p>
                    <p className="text-sm text-gray-500">{formatDate(selectedArticle.publishDate)}</p>
                  </div>
                </div>

                <button
                  onClick={() => toggleBookmark(selectedArticle.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    selectedArticle.isBookmarked
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <BookOpen className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Article Content */}
            <div className="p-8">
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  {selectedArticle.content}
                </p>
                {/* In a real app, this would be the full article content */}
                <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 italic">
                    This is a preview of the article content. The NewsAPI `content` field
                    often provides a truncated version. For the full article,
                    you would typically navigate to the original source URL.
                  </p>
                  {selectedArticle.url && (
                    <a
                      href={selectedArticle.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline mt-2 inline-block"
                    >
                      Read full article at source
                    </a>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedArticle.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Educational Articles" action={actionButtons}>
      <div className="space-y-6">
        {/* Categories */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => {
            const categoryCount = articles.filter(a => a.category === category.id).length;
            return (
              <button
                key={category.id}
                onClick={() => setCategoryFilter(category.id)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  categoryFilter === category.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className={`w-8 h-8 mx-auto mb-2 ${category.color}`}>
                  <category.icon className="w-full h-full" />
                </div>
                <h3 className="font-medium text-gray-900 text-sm">{category.name}</h3>
                <p className="text-xs text-gray-500">{categoryCount} articles</p>
              </button>
            );
          })}
        </div>

        {/* Featured Article */}
        {filteredArticles.length > 0 && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
            <div className="max-w-3xl">
              <div className="flex items-center space-x-2 mb-4">
                <Star className="w-5 h-5 text-yellow-300 fill-current" />
                <span className="text-blue-100">Featured Article</span>
              </div>
              <h2 className="text-2xl font-bold mb-4">{filteredArticles[0].title}</h2>
              <p className="text-blue-100 mb-6">{filteredArticles[0].excerpt}</p>
              <div className="flex items-center space-x-6 mb-6">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-200" />
                  <span className="text-blue-100">{filteredArticles[0].readTime} min read</span>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-blue-200" />
                  <span className="text-blue-100">{filteredArticles[0].author}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedArticle(filteredArticles[0])}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Read Article
              </button>
            </div>
          </div>
        )}

        {/* Articles Grid */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">
              All Articles ({filteredArticles.length})
            </h3>
          </div>

          <div className="p-6">
            {filteredArticles.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
                <p className="text-gray-500">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.map((article) => (
                  <div
                    key={article.id}
                    className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedArticle(article)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(article.difficulty)}`}>
                        {article.difficulty}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(article.id);
                        }}
                        className={`p-1 rounded transition-colors ${
                          article.isBookmarked
                            ? 'text-blue-600'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        <BookOpen className="w-4 h-4" />
                      </button>
                    </div>

                    <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">{article.title}</h4>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">{article.excerpt}</p>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{article.readTime} min</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          <span>{article.rating}</span>
                        </div>
                      </div>
                      <span>{formatDate(article.publishDate)}</span>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-3">
                      {article.tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600"
                        >
                          {tag}
                        </span>
                      ))}
                      {article.tags.length > 2 && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                          +{article.tags.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Learning Path Suggestion */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border border-green-200">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Suggested Learning Path</h4>
              <p className="text-sm text-gray-600 mb-4">
                Based on your reading history, we recommend starting with budgeting basics,
                then moving to emergency funds, and finally exploring investment fundamentals.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                  1. Budgeting Basics
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                  2. Emergency Funds
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                  3. Investment Fundamentals
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
