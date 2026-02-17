/**
 * AI Charging Optimization Service
 *
 * Calls the backend AI endpoint and returns the raw text response.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BACKEND_AI_ENDPOINT = `${API_BASE_URL}/ai/optimize`;

/**
 * Call the backend AI endpoint for a charging optimization report.
 * Returns { success: true, text: '...' } or { success: false, error: '...' }
 */
export const getAiChargingOptimization = async (params) => {
  try {
    const resp = await fetch(BACKEND_AI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      // Check for Google AI specific errors
      let errorMessage = err?.error || `Backend returned ${resp.status}`;
      if (typeof errorMessage === 'string' && errorMessage.includes('429')) {
         errorMessage = "AI Service Quota Exceeded. Please try again later.";
      }
      return { success: false, error: errorMessage };
    }

    const data = await resp.json();
    // Backend returns { success: true, data: { text: '...' } }
    if (data.success && data.data?.text) {
      return { success: true, text: data.data.text };
    }

    return { success: false, error: data.error || 'Unknown backend error' };
  } catch (error) {
    console.error('AI service error:', error);
    return { success: false, error: error.message || 'Failed to call AI backend' };
  }
};

export const isAiConfigured = () => {
  // Frontend defers configuration to the backend; assume available
  return true;
};

export default {
  getAiChargingOptimization,
  isAiConfigured,
};
