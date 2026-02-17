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
  BarChart3,
  Download,
  Building2,
  Flag,
  Eye,
  Ban,
  Shield
} from 'lucide-react';
import { Button, Badge, LoadingSpinner, Modal } from '../../components/ui';
import { adminFeedbackAPI } from '../../services';

const Feedback = () => {
  const [feedbackData, setFeedbackData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending Review</Badge>;
      case 'flagged':
        return <Badge variant="error">Flagged</Badge>;
      case 'hidden':
        return <Badge variant="secondary">Hidden</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredReviews = feedbackData?.reviews?.filter(review => {
    const matchesRating = filter === 'all' || 
      (filter === 'positive' && review.rating >= 4) ||
      (filter === 'negative' && review.rating <= 2) ||
      (filter === 'neutral' && review.rating === 3);
    
    const matchesStatus = statusFilter === 'all' || review.status === statusFilter;
    
    const matchesSearch = 
      review.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.stationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.operatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesRating && matchesStatus && matchesSearch;
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
              <p className="text-sm font-semibold text-emerald-100/80 drop-shadow-sm">Pending Review</p>
              <p className="text-2xl font-bold text-white mt-1 drop-shadow-md">
                {feedbackData?.stats?.pendingReviews || 0}
              </p>
            </div>
            <div className="p-3 rounded-full bg-gradient-to-br from-yellow-400 to-amber-300 shadow-lg shadow-yellow-500/30">
              <Clock className="h-6 w-6 text-yellow-900" />
            </div>
          </div>
          <p className="text-sm text-yellow-200 mt-2 drop-shadow-sm">Requires moderation</p>
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

      {/* Top Rated & Lowest Rated Stations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Lowest Rated Stations */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-500" />
            Stations Needing Improvement
          </h3>
          <div className="space-y-3">
            {feedbackData?.lowRatedStations?.map((station, index) => (
              <div key={station.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{station.name}</p>
                    <p className="text-xs text-gray-500">{station.operatorName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-semibold text-red-600">{station.rating}</span>
                  <span className="text-xs text-gray-400">({station.reviewCount})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Common Issues Platform-Wide */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Common Issues Reported</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {feedbackData?.commonIssues?.map((issue, index) => (
            <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div className={`p-2 rounded-full ${
                issue.severity === 'high' ? 'bg-red-100 text-red-600' :
                issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                'bg-green-100 text-green-600'
              }`}>
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{issue.issue}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500">{issue.count} reports</span>
                  {issue.trend === 'up' && <TrendingUp className="h-3 w-3 text-red-500" />}
                  {issue.trend === 'down' && <TrendingDown className="h-3 w-3 text-green-500" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user, station, or operator..."
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
              <option value="all">All Ratings</option>
              <option value="positive">Positive (4-5 ⭐)</option>
              <option value="neutral">Neutral (3 ⭐)</option>
              <option value="negative">Negative (1-2 ⭐)</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="flagged">Flagged</option>
              <option value="hidden">Hidden</option>
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
                      {getStatusBadge(review.status)}
                      {renderStars(review.rating)}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mt-3">{review.comment}</p>
                  
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
                      {review.isVerified && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span>Verified</span>
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
                      {review.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 hover:bg-green-50"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Flag className="h-4 w-4 mr-1" />
                            Flag
                          </Button>
                        </>
                      )}
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
                <p className="font-medium">{new Date(selectedReview.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                {getStatusBadge(selectedReview.status)}
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
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Charger Type</p>
                <p className="font-medium">{selectedReview.chargerType}</p>
              </div>
              <div>
                <p className="text-gray-500">Energy Used</p>
                <p className="font-medium">{selectedReview.energyConsumed || 'N/A'} kWh</p>
              </div>
              <div>
                <p className="text-gray-500">Verified</p>
                <p className="font-medium">{selectedReview.isVerified ? 'Yes' : 'No'}</p>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-3">Admin Actions</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 text-green-600 hover:bg-green-50"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-yellow-600 hover:bg-yellow-50"
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Flag
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-red-600 hover:bg-red-50"
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Hide
                </Button>
              </div>
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
