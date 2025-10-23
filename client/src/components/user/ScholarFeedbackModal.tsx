import React, { useState } from 'react';
import { X, Star, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { scholarFeedbackService, ScholarFeedbackData } from '../../services/scholarFeedbackService';

interface ScholarFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  scholarId: string;
  scholarName: string;
}

const ScholarFeedbackModal: React.FC<ScholarFeedbackModalProps> = ({ isOpen, onClose, scholarId, scholarName }) => {
  const [feedback, setFeedback] = useState<ScholarFeedbackData>({
    scholarId,
    rating: 0,
    category: '',
    subject: '',
    message: '',
    contactEmail: '',
    priority: 'medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  if (!isOpen) return null;

  const categories = [
    { value: 'teaching_quality', label: 'Teaching Quality', icon: '🎓' },
    { value: 'communication', label: 'Communication', icon: '💬' },
    { value: 'knowledge', label: 'Knowledge & Expertise', icon: '📚' },
    { value: 'availability', label: 'Availability', icon: '⏰' },
    { value: 'patience', label: 'Patience & Understanding', icon: '🤲' },
    { value: 'general', label: 'General Feedback', icon: '💭' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'critical', label: 'Critical', color: 'text-red-600' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.category || !feedback.subject || !feedback.message) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const feedbackData: ScholarFeedbackData = {
        scholarId: feedback.scholarId,
        rating: feedback.rating,
        category: feedback.category,
        subject: feedback.subject,
        message: feedback.message,
        contactEmail: feedback.contactEmail || undefined,
        priority: feedback.priority
      };

      await scholarFeedbackService.submitScholarFeedback(feedbackData);

      setSubmitStatus('success');
      setTimeout(() => {
        onClose();
        setFeedback({
          scholarId,
          rating: 0,
          category: '',
          subject: '',
          message: '',
          contactEmail: '',
          priority: 'medium'
        });
        setSubmitStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Error submitting scholar feedback:', error);
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingClick = (rating: number) => {
    setFeedback(prev => ({ ...prev, rating }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-4 m-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            Feedback for {scholarName}
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Share your experience
          </p>
        </div>

        {submitStatus === 'success' && (
          <div className="flex items-center p-2 mb-3 bg-green-100 dark:bg-green-900/20 rounded-lg text-green-800 dark:text-green-200 text-sm">
            <CheckCircle className="w-4 h-4 mr-2" />
            <span>Success!</span>
          </div>
        )}
        {submitStatus === 'error' && (
          <div className="flex items-center p-2 mb-3 bg-red-100 dark:bg-red-900/20 rounded-lg text-red-800 dark:text-red-200 text-sm">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span>Failed to submit</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rating
            </label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 cursor-pointer transition-colors hover:scale-110 ${
                    feedback.rating >= star ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                  }`}
                  onClick={() => handleRatingClick(star)}
                  fill={feedback.rating >= star ? 'currentColor' : 'none'}
                />
              ))}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
            <label htmlFor="category" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              value={feedback.category}
              onChange={(e) => setFeedback(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs"
              required
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
            <label htmlFor="priority" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priority
            </label>
            <select
              id="priority"
              value={feedback.priority}
              onChange={(e) => setFeedback(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs"
            >
              {priorities.map(p => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
            <label htmlFor="subject" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="subject"
              value={feedback.subject}
              onChange={(e) => setFeedback(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs"
              placeholder="Brief summary"
              maxLength={200}
              required
            />
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
            <label htmlFor="message" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              id="message"
              value={feedback.message}
              onChange={(e) => setFeedback(prev => ({ ...prev, message: e.target.value }))}
              rows={2}
              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs"
              placeholder="Share your experience..."
              maxLength={2000}
              required
            ></textarea>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
            <label htmlFor="contactEmail" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email (Optional)
            </label>
            <input
              type="email"
              id="contactEmail"
              value={feedback.contactEmail}
              onChange={(e) => setFeedback(prev => ({ ...prev, contactEmail: e.target.value }))}
              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs"
              placeholder="your.email@example.com"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center space-x-1 px-3 py-2 border border-transparent rounded shadow-sm text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Submit Feedback</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScholarFeedbackModal;
