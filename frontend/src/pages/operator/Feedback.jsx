import { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Star, 
  TrendingUp, 
  TrendingDown,
  Filter,
  Search,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  Zap,
  User,
  Calendar,
  BarChart3
} from 'lucide-react';
import { Button, Badge, LoadingSpinner, Modal } from '../../components/ui';
import { operatorAPI } from '../../services';

const Feedback = () => {
  const [feedbackData, setFeedbackData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const data = await operatorAPI.getFeedback();
      setFeedbackData(data);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'text-green-600 bg-green-100';
    if (rating >= 3.5) return 'text-blue-600 bg-blue-100';
    if (rating >= 2.5) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return <ThumbsUp className="h-4 w-4 text-green-500" />;
      case 'negative':
        return <ThumbsDown className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'resolved':
        return <Badge variant="success">Resolved</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'acknowledged':
        return <Badge variant="info">Acknowledged</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredReviews = feedbackData?.reviews?.filter(review => {
    const matchesFilter = filter === 'all' || 
      (filter === 'positive' && review.rating >= 4) ||
      (filter === 'negative' && review.rating <= 2) ||
      (filter === 'neutral' && review.rating === 3);
    
    const matchesSearch = review.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.stationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  }) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 ml-4">Station Feedback</h1>
          <p className="text-gray-600 mt-1">Monitor and manage customer reviews</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl p-6 shadow-lg shadow-green-500/10 hover:shadow-xl hover:shadow-green-500/20 border border-green-500/20 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-100/80 drop-shadow-sm">Average Rating</p>
              <p className="text-2xl font-bold text-white mt-1 drop-shadow-md">
                {feedbackData?.stats?.averageRating || 0}
              </p>
            </div>
            <div className="p-3 rounded-full bg-gradient-to-br from-emerald-400 to-green-300 shadow-lg shadow-emerald-500/30">
              <Star className="h-6 w-6 text-green-900" />
            </div>
          </div>
          <div className="flex items-center mt-2">
            {renderStars(Math.round(feedbackData?.stats?.averageRating || 0))}
          </div>
        </div>

        <div className="rounded-xl p-6 shadow-lg shadow-green-500/10 hover:shadow-xl hover:shadow-green-500/20 border border-green-500/20 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-100/80 drop-shadow-sm">Total Reviews</p>
              <p className="text-2xl font-bold text-white mt-1 drop-shadow-md">
                {feedbackData?.stats?.totalReviews || 0}
              </p>
            </div>
            <div className="p-3 rounded-full bg-gradient-to-br from-emerald-400 to-green-300 shadow-lg shadow-emerald-500/30">
              <MessageSquare className="h-6 w-6 text-green-900" />
            </div>
          </div>
          <p className="text-sm text-emerald-100/70 mt-2 drop-shadow-sm">
            +{feedbackData?.stats?.thisMonthReviews || 0} this month
          </p>
        </div>

        <div className="rounded-xl p-6 shadow-lg shadow-green-500/10 hover:shadow-xl hover:shadow-green-500/20 border border-green-500/20 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-100/80 drop-shadow-sm">Positive Reviews</p>
              <p className="text-2xl font-bold text-white mt-1 drop-shadow-md">
                {feedbackData?.stats?.positiveReviews || 0}%
              </p>
            </div>
            <div className="p-3 rounded-full bg-gradient-to-br from-emerald-400 to-green-300 shadow-lg shadow-emerald-500/30">
              <TrendingUp className="h-6 w-6 text-green-900" />
            </div>
          </div>
          <p className="text-sm text-emerald-200 mt-2 drop-shadow-sm">
            Satisfaction rate
          </p>
        </div>

        <div className="rounded-xl p-6 shadow-lg shadow-green-500/10 hover:shadow-xl hover:shadow-green-500/20 border border-green-500/20 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-100/80 drop-shadow-sm">Issues Resolved</p>
              <p className="text-2xl font-bold text-white mt-1 drop-shadow-md">
                {feedbackData?.stats?.resolvedIssues || 0}
              </p>
            </div>
            <div className="p-3 rounded-full bg-gradient-to-br from-emerald-400 to-green-300 shadow-lg shadow-emerald-500/30">
              <CheckCircle className="h-6 w-6 text-green-900" />
            </div>
          </div>
          <p className="text-sm text-emerald-100/70 mt-2 drop-shadow-sm">
            {feedbackData?.stats?.pendingIssues || 0} pending
          </p>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h3>
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = feedbackData?.stats?.ratingDistribution?.[rating] || 0;
            const total = feedbackData?.stats?.totalReviews || 1;
            const percentage = Math.round((count / total) * 100);
            
            return (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-12">
                  <span className="text-sm font-medium text-gray-700">{rating}</span>
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-yellow-400 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-500 w-12 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Reviews</option>
              <option value="positive">Positive (4-5 ⭐)</option>
              <option value="neutral">Neutral (3 ⭐)</option>
              <option value="negative">Negative (1-2 ⭐)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Reviews ({filteredReviews.length})</h3>
        
        {filteredReviews.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No reviews found matching your criteria</p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedFeedback(review);
                setShowDetailModal(true);
              }}
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{review.userName}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{review.stationName}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getSentimentIcon(review.sentiment)}
                      {renderStars(review.rating)}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mt-3 line-clamp-2">{review.comment}</p>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(review.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="h-4 w-4" />
                        <span>{review.chargerType}</span>
                      </div>
                    </div>
                    {getStatusBadge(review.status)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Common Issues Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Common Issues Reported</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {feedbackData?.commonIssues?.map((issue, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className={`p-2 rounded-full ${
                issue.severity === 'high' ? 'bg-red-100 text-red-600' :
                issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                'bg-green-100 text-green-600'
              }`}>
                <AlertCircle className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{issue.issue}</p>
                <p className="text-xs text-gray-500">{issue.count} reports</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Review Details"
      >
        {selectedFeedback && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{selectedFeedback.userName}</h4>
                <p className="text-sm text-gray-500">{selectedFeedback.stationName}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {renderStars(selectedFeedback.rating)}
              <span className="text-sm text-gray-500">
                {new Date(selectedFeedback.date).toLocaleDateString()}
              </span>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700">{selectedFeedback.comment}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Charger Type</p>
                <p className="font-medium">{selectedFeedback.chargerType}</p>
              </div>
              <div>
                <p className="text-gray-500">Session Duration</p>
                <p className="font-medium">{selectedFeedback.sessionDuration || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Energy Consumed</p>
                <p className="font-medium">{selectedFeedback.energyConsumed || 'N/A'} kWh</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                {getStatusBadge(selectedFeedback.status)}
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDetailModal(false)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                className="flex-1"
              >
                Mark as Resolved
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Feedback;
