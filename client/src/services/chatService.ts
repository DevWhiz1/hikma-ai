import axios from 'axios';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Define API base URL - loaded from environment variable (see .env file)
const API_URL = import.meta.env.VITE_API_URL;

export const chatService = {
  async sendMessage(content: string, previousMessages: Message[]): Promise<string> {
    try {
      // Prepare the request payload
      const payload = {
        message: content,
        conversation: previousMessages,
      };

      // Make the API call using Axios
      const response = await axios.post(API_URL, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Return the AI response (adjust field name if needed)
      return response.data.generated_text;
    } catch (error) {
      console.error('Error calling chat API:', error);
      throw new Error('Failed to get response from the Islamic Scholar AI API.');
    }
  },
};