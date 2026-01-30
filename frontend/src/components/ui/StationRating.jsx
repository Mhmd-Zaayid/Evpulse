import { useState } from 'react';
import { Star, X, Send } from 'lucide-react';
import { Button, Modal } from './index';

/**
 * StationRating Component
 * Allows users to rate and provide feedback for charging stations
 */
const StationRating = ({ 
  isOpen, 
  onClose, 
  stationName, 
  sessionId,
  onSubmit 
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    
    setSubmitting(true);
    try {
      await onSubmit({
        rating,
        comment,
        sessionId,
        timestamp: new Date().toISOString(),
      });
      onClose();
    } catch (error) {
      console.error('Failed to submit rating:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setHoveredRating(0);
    setComment('');
    onClose();
  };

  const ratingLabels = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Rate Your Experience"
      size="sm"
    >
      <div className="space-y-6">
        {/* Station Name */}
        <div className="text-center">
          <p className="text-secondary-500">How was your charging experience at</p>
          <p className="font-semibold text-secondary-900 text-lg">{stationName}?</p>
        </div>

        {/* Star Rating */}
        <div className="text-center">
          <div className="flex justify-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-10 h-10 transition-colors ${
                    star <= (hoveredRating || rating)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-gray-300 hover:text-amber-200'
                  }`}
                />
              </button>
            ))}
          </div>
          {(hoveredRating || rating) > 0 && (
            <p className="text-secondary-600 font-medium">
              {ratingLabels[hoveredRating || rating]}
            </p>
          )}
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Share your feedback (optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us about your experience..."
            rows={3}
            className="w-full px-4 py-3 border border-secondary-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none resize-none transition-all"
          />
        </div>

        {/* Quick Feedback Tags */}
        <div>
          <p className="text-sm text-secondary-500 mb-2">Quick tags:</p>
          <div className="flex flex-wrap gap-2">
            {['Fast charging', 'Clean facility', 'Easy to use', 'Good location', 'Friendly staff'].map((tag) => (
              <button
                key={tag}
                onClick={() => setComment(prev => prev ? `${prev}, ${tag}` : tag)}
                className="px-3 py-1.5 text-sm bg-secondary-100 text-secondary-600 rounded-full hover:bg-secondary-200 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" fullWidth onClick={handleClose}>
            Skip
          </Button>
          <Button 
            fullWidth 
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            icon={Send}
          >
            {submitting ? 'Submitting...' : 'Submit Rating'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

/**
 * Inline Rating Display Component
 * Shows rating with stars for display purposes
 */
export const RatingDisplay = ({ rating, totalReviews, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating
                ? 'text-amber-400 fill-amber-400'
                : star - 0.5 <= rating
                ? 'text-amber-400 fill-amber-200'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
      <span className={`text-secondary-600 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
        {rating.toFixed(1)}
      </span>
      {totalReviews !== undefined && (
        <span className={`text-secondary-400 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          ({totalReviews})
        </span>
      )}
    </div>
  );
};

/**
 * Rating Summary Component
 * Shows rating breakdown for stations
 */
export const RatingSummary = ({ averageRating, totalReviews, breakdown }) => {
  const maxCount = Math.max(...Object.values(breakdown));

  return (
    <div className="space-y-4">
      {/* Average Rating */}
      <div className="flex items-center gap-4">
        <div className="text-center">
          <p className="text-4xl font-bold text-secondary-900">{averageRating.toFixed(1)}</p>
          <div className="flex justify-center mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= averageRating
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-secondary-500 mt-1">{totalReviews} reviews</p>
        </div>

        {/* Breakdown */}
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center gap-2">
              <span className="text-sm text-secondary-500 w-3">{star}</span>
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <div className="flex-1 h-2 bg-secondary-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all"
                  style={{ width: `${(breakdown[star] / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-sm text-secondary-500 w-8">{breakdown[star]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StationRating;
