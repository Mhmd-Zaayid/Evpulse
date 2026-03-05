import { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Star, 
  TrendingUp, 
  Filter,
  ThumbsUp,
  CheckCircle,
  Clock,
  MapPin,
  Zap,
  User,
  Calendar,
  BarChart3,
  Download,
  Building2,
  Eye,
  Shield
} from 'lucide-react';
import { Button, LoadingSpinner, Modal } from '../../components/ui';
import { adminFeedbackAPI } from '../../services';
import { formatDate } from '../../utils';

const Feedback = () => {
  const [feedbackData, setFeedbackData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const data = await adminFeedbackAPI.getAll();
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

  const getDisplayDate = (review) => {
    return formatDate(review?.date || review?.createdAt || review?.timestamp || null);
  };

  const getChargingBadgeClass = (chargerType) => {
    const isFast = String(chargerType || '').toLowerCase().includes('fast') || String(chargerType || '').toLowerCase().includes('dc');
    return isFast
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  const getChargingLabel = (chargerType) => {
    const isFast = String(chargerType || '').toLowerCase().includes('fast') || String(chargerType || '').toLowerCase().includes('dc');
    return isFast ? 'Fast Charging' : 'Normal Charging';
  };

  const filteredReviews = feedbackData?.reviews?.filter(review => {
    const matchesRating = filter === 'all' || 
      (filter === 'positive' && review.rating >= 4) ||
      (filter === 'negative' && review.rating <= 2) ||
      (filter === 'neutral' && review.rating === 3);

    return matchesRating;
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
          <h1 className="text-2xl font-bold text-gray-900 ml-4">Feedback Management</h1>
          <p className="text-gray-600 mt-1 ml-4">Review and moderate customer feedback across all stations</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Platform Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl p-6 shadow-lg shadow-green-500/10 hover:shadow-xl hover:shadow-green-500/20 border border-green-500/20 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-100/80 drop-shadow-sm">Platform Rating</p>
              <p className="text-2xl font-bold text-white mt-1 drop-shadow-md">
                {feedbackData?.stats?.platformRating || 0}
              </p>
            </div>
            <div className="p-3 rounded-full bg-gradient-to-br from-emerald-400 to-green-300 shadow-lg shadow-emerald-500/30">
              <Star className="h-6 w-6 text-green-900" />
            </div>
          </div>
          <div className="flex items-center mt-2 gap-1">
            {renderStars(Math.round(feedbackData?.stats?.platformRating || 0))}
            <span className="text-xs text-emerald-100/70 ml-1 drop-shadow-sm">avg</span>
          </div>
        </div>

        <div className="rounded-xl p-6 shadow-lg shadow-green-500/10 hover:shadow-xl hover:shadow-green-500/20 border border-green-500/20 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-100/80 drop-shadow-sm">Total Reviews</p>
              <p className="text-2xl font-bold text-white mt-1 drop-shadow-md">
                {feedbackData?.stats?.totalReviews?.toLocaleString() || 0}
              </p>
            </div>
            <div className="p-3 rounded-full bg-gradient-to-br from-emerald-400 to-green-300 shadow-lg shadow-emerald-500/30">
              <MessageSquare className="h-6 w-6 text-green-900" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className="h-4 w-4 text-emerald-200" />
            <span className="text-sm text-emerald-200 drop-shadow-sm">+{feedbackData?.stats?.thisWeekReviews || 0} this week</span>
          </div>
        </div>

        <div className="rounded-xl p-6 shadow-lg shadow-green-500/10 hover:shadow-xl hover:shadow-green-500/20 border border-green-500/20 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-100/80 drop-shadow-sm">Low Ratings</p>
              <p className="text-2xl font-bold text-white mt-1 drop-shadow-md">
                {feedbackData?.stats?.flaggedReviews || 0}
              </p>
            </div>
            <div className="p-3 rounded-full bg-gradient-to-br from-yellow-400 to-amber-300 shadow-lg shadow-yellow-500/30">
              <Clock className="h-6 w-6 text-yellow-900" />
            </div>
          </div>
          <p className="text-sm text-yellow-200 mt-2 drop-shadow-sm">Ratings ≤ 2 stars</p>
        </div>

        <div className="rounded-xl p-6 shadow-lg shadow-green-500/10 hover:shadow-xl hover:shadow-green-500/20 border border-green-500/20 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-100/80 drop-shadow-sm">Satisfaction Rate</p>
              <p className="text-2xl font-bold text-white mt-1 drop-shadow-md">
                {feedbackData?.stats?.satisfactionRate || 0}%
              </p>
            </div>
            <div className="p-3 rounded-full bg-gradient-to-br from-emerald-400 to-green-300 shadow-lg shadow-emerald-500/30">
              <ThumbsUp className="h-6 w-6 text-green-900" />
            </div>
          </div>
          <p className="text-sm text-emerald-200 mt-2 drop-shadow-sm">4+ star reviews</p>
        </div>
      </div>

      {/* Top Rated Stations */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Top Rated Stations
          </h3>
          <div className="space-y-3">
            {feedbackData?.topStations?.map((station, index) => (
              <div key={station.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-gray-200 text-gray-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{station.name}</p>
                    <p className="text-xs text-gray-500">{station.operatorName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-semibold">{station.rating}</span>
                  <span className="text-xs text-gray-400">({station.reviewCount})</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Ratings</option>
              <option value="positive">Positive (4-5 ⭐)</option>
              <option value="neutral">Neutral (3 ⭐)</option>
              <option value="negative">Negative (1-2 ⭐)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">All Reviews ({filteredReviews.length})</h3>
        
        {filteredReviews.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No reviews found matching your criteria</p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row gap-4">
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
                          <span className="text-gray-300">•</span>
                          <Building2 className="h-3.5 w-3.5" />
                          <span>{review.operatorName}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mt-3">{review.comment}</p>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{getDisplayDate(review)}</span>
                      </div>
                      {review.chargerType && (
                        <div className="flex items-center gap-1">
                          <Zap className="h-4 w-4" />
                          <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${getChargingBadgeClass(review.chargerType)}`}>
                            {getChargingLabel(review.chargerType)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedReview(review);
                          setShowDetailModal(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Review Details"
      >
        {selectedReview && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{selectedReview.userName}</h4>
                <p className="text-sm text-gray-500">{selectedReview.userEmail}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-gray-500">Station</p>
                <p className="font-medium">{selectedReview.stationName}</p>
              </div>
              <div>
                <p className="text-gray-500">Operator</p>
                <p className="font-medium">{selectedReview.operatorName}</p>
              </div>
              <div>
                <p className="text-gray-500">Date</p>
                <p className="font-medium">{getDisplayDate(selectedReview)}</p>
              </div>
              <div>
                <p className="text-gray-500">Review</p>
                <p className="font-medium">Submitted</p>
              </div>
              <div>
                <p className="text-gray-500">Charging Type</p>
                <p className={`inline-flex mt-1 px-2 py-0.5 rounded-full border text-xs font-medium ${getChargingBadgeClass(selectedReview.chargerType)}`}>
                  {getChargingLabel(selectedReview.chargerType)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Rating:</span>
              {renderStars(selectedReview.rating)}
              <span className="font-medium">({selectedReview.rating}/5)</span>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Review Comment</p>
              <p className="text-gray-700">{selectedReview.comment}</p>
            </div>
            
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => setShowDetailModal(false)}
            >
              Close
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Feedback;
