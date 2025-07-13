import React, { useState, useEffect } from 'react';
import { 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Star,
  Target,
  DollarSign,
  PieChart,
  Calendar,
  Zap,
  Loader,
  ServerCrash
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { recommendationService } from '../services/recommendationService';

interface Recommendation {
  id: string;
  type: 'saving' | 'investment' | 'budget' | 'goal' | 'warning';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  priority: number;
  potentialSaving?: number;
  timeframe: string;
  actionItems: string[];
  isImplemented: boolean;
}

export const AIRecommendations: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'saving' | 'investment' | 'budget' | 'goal' | 'warning'>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'impact' | 'saving'>('priority');

  const fetchRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const newRecommendations = await recommendationService.generateRecommendations();
      setRecommendations(newRecommendations);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'saving': return <DollarSign className="w-5 h-5" />;
      case 'investment': return <TrendingUp className="w-5 h-5" />;
      case 'budget': return <PieChart className="w-5 h-5" />;
      case 'goal': return <Target className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      default: return <Lightbulb className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'saving': return 'bg-green-100 text-green-600';
      case 'investment': return 'bg-blue-100 text-blue-600';
      case 'budget': return 'bg-purple-100 text-purple-600';
      case 'goal': return 'bg-orange-100 text-orange-600';
      case 'warning': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleImplement = (id: string) => {
    setRecommendations(prev => 
      prev.map(rec => 
        rec.id === id ? { ...rec, isImplemented: true } : rec
      )
    );
  };

  const filteredRecommendations = recommendations
    .filter(rec => filter === 'all' || rec.type === filter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority': return a.priority - b.priority;
        case 'impact':
          const impactOrder = { high: 3, medium: 2, low: 1 };
          return impactOrder[b.impact] - impactOrder[a.impact];
        case 'saving': return (b.potentialSaving || 0) - (a.potentialSaving || 0);
        default: return 0;
      }
    });

  const totalPotentialSaving = recommendations
    .filter(rec => !rec.isImplemented)
    .reduce((sum, rec) => sum + (rec.potentialSaving || 0), 0);

  const implementedCount = recommendations.filter(rec => rec.isImplemented).length;
  const highPriorityCount = recommendations.filter(rec => rec.priority <= 3 && !rec.isImplemented).length;

  const actionButtons = (
    <div className="flex items-center space-x-3">
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value as any)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        disabled={isLoading}
      >
        <option value="all">All Types</option>
        <option value="saving">Saving</option>
        <option value="investment">Investment</option>
        <option value="budget">Budget</option>
        <option value="goal">Goal</option>
        <option value="warning">Warning</option>
      </select>

      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value as any)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        disabled={isLoading}
      >
        <option value="priority">Sort by Priority</option>
        <option value="impact">Sort by Impact</option>
        <option value="saving">Sort by Potential Saving</option>
      </select>

      <button 
        onClick={fetchRecommendations}
        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
        disabled={isLoading}
      >
        {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
        <span>{isLoading ? 'Analyzing...' : 'Refresh AI Analysis'}</span>
      </button>
    </div>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-6 animate-pulse">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-lg bg-gray-200"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12 bg-red-50 rounded-2xl">
          <ServerCrash className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-900 mb-2">Analysis Failed</h3>
          <p className="text-red-700">{error}</p>
        </div>
      );
    }

    if (filteredRecommendations.length === 0) {
      return (
        <div className="text-center py-12">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">All recommendations implemented!</h3>
          <p className="text-gray-500">Great job! Check back later for new AI-generated recommendations.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {filteredRecommendations.map((recommendation) => (
          <div 
            key={recommendation.id} 
            className={`border rounded-xl p-6 transition-all duration-200 ${
              recommendation.isImplemented 
                ? 'border-green-200 bg-green-50 opacity-75' 
                : 'border-gray-200 hover:shadow-md'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getTypeColor(recommendation.type)}`}>
                  {getTypeIcon(recommendation.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-semibold text-gray-900">{recommendation.title}</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getImpactColor(recommendation.impact)}`}>
                        {recommendation.impact} impact
                      </span>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3 h-3 ${
                              i < (6 - recommendation.priority) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3">{recommendation.description}</p>
                  
                  <div className="flex items-center space-x-6 text-sm mb-4">
                    {recommendation.potentialSaving && recommendation.potentialSaving > 0 && (
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-green-600 font-semibold">
                          Save {formatCurrency(recommendation.potentialSaving)}/month
                        </span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">{recommendation.timeframe}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-medium text-gray-900">Action Items:</h5>
                    <ul className="space-y-1">
                      {recommendation.actionItems.map((item, index) => (
                        <li key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Priority #{recommendation.priority}</span>
                <span>•</span>
                <span className="capitalize">{recommendation.type} recommendation</span>
              </div>
              
              {!recommendation.isImplemented ? (
                <div className="flex space-x-2">
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                    Remind Later
                  </button>
                  <button 
                    onClick={() => handleImplement(recommendation.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Mark as Implemented
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Implemented</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Layout title="AI Recommendations" action={actionButtons}>
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Recommendations</p>
                <p className="text-2xl font-bold text-gray-800">{recommendations.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Lightbulb className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Potential Savings</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPotentialSaving)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-red-600">{highPriorityCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Implemented</p>
                <p className="text-2xl font-bold text-purple-600">{implementedCount}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">AI Financial Health Score: 78/100</h4>
              <p className="text-sm text-gray-600 mb-3">
                Your financial health is good, but there are opportunities for improvement. 
                Implementing the top 3 recommendations could increase your score to 85/100 and save you Rp 3,350,000 monthly.
              </p>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">Strengths: Emergency fund, Low debt</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-600">Areas to improve: Retirement savings, Expense optimization</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">
              Personalized Recommendations ({filteredRecommendations.length})
            </h3>
          </div>
          <div className="p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </Layout>
  );
};
