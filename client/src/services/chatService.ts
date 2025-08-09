import axios from 'axios';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Define API base URL - this should be your backend API endpoint
const API_URL = 'https://api.islamicscholar.com/v1';

export const chatService = {
  async sendMessage(content: string, previousMessages: Message[]): Promise<string> {
    try {
      // Prepare the request payload
      const payload = {
        message: content,
        conversation: previousMessages,
      };

      // Make the API call using Axios
      const response = await axios.post(`${API_URL}/chat`, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Return the AI response
      return response.data.response;
    } catch (error) {
      // If there's an API error, fall back to the mock implementation for now
      console.error('Error calling chat API:', error);
      return this.getMockResponse(content);
    }
  },

  // Mock implementation as fallback
  getMockResponse(content: string): string {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('pillars') || lowerContent.includes('pillar of islam')) {
      return "The Five Pillars of Islam are the foundation of Muslim life. They are:\n\n1. Shahada (Faith): The declaration of faith - 'There is no God but Allah, and Muhammad is the Messenger of Allah.'\n\n2. Salat (Prayer): Performing ritual prayers five times each day.\n\n3. Zakat (Charity): Giving a portion of one's wealth to charity.\n\n4. Sawm (Fasting): Fasting during the month of Ramadan.\n\n5. Hajj (Pilgrimage): Making a pilgrimage to Mecca once in a lifetime if physically and financially able.";
    }
    
    if (lowerContent.includes('wudu') || lowerContent.includes('ablution')) {
      return "Wudu (ablution) is the Islamic procedure for cleansing parts of the body before prayer. Here's how to perform it correctly:\n\n1. Make intention (niyyah) in your heart\n2. Say 'Bismillah' (In the name of Allah)\n3. Wash both hands up to the wrists three times\n4. Rinse your mouth three times\n5. Clean your nose by sniffing water and blowing it out three times\n6. Wash your face three times\n7. Wash your arms up to the elbows three times (right arm first)\n8. Wipe your head with wet hands from front to back once\n9. Clean your ears with wet fingers once\n10. Wash your feet up to the ankles three times (right foot first)\n\nThe Prophet Muhammad (peace be upon him) said: 'Whoever performs wudu like this then prays two rak'ahs with full attention, his past sins will be forgiven.'";
    }
    
    if (lowerContent.includes('ramadan')) {
      return "Ramadan is the ninth month of the Islamic calendar and is observed by Muslims worldwide as a month of fasting, prayer, reflection, and community. It commemorates the first revelation of the Quran to Prophet Muhammad (peace be upon him).\n\nDuring Ramadan, Muslims fast from dawn until sunset, abstaining from food, drink, and other physical needs. The fast is broken with iftar in the evening, often starting with dates as was the tradition of the Prophet.\n\nRamadan is also a time for increased devotion, with many Muslims reciting the entire Quran and performing additional prayers (Taraweeh) during this month. It culminates in the celebration of Eid al-Fitr, marking the end of the fasting period.";
    }
    
    if (lowerContent.includes('zakat')) {
      return "Zakat is one of the Five Pillars of Islam and refers to the obligation of giving a portion of one's wealth to those in need. It's not merely charity but a religious duty for all Muslims who meet the necessary criteria of wealth (nisab).\n\nThe standard rate for Zakat is 2.5% of one's wealth that has been held for a full lunar year. This includes money, gold, silver, and business merchandise. Different rates apply to agricultural produce and livestock.\n\nZakat serves multiple purposes in Islam: it purifies wealth, fosters compassion, reduces inequality, and strengthens community bonds. The Quran specifies eight categories of people eligible to receive Zakat, including the poor, the needy, those in debt, and travelers in need.";
    }
    
    if (lowerContent.includes('prayer') || lowerContent.includes('salah') || lowerContent.includes('salat')) {
      return "Prayer (Salah) is the second pillar of Islam and is performed five times daily at prescribed times: Fajr (dawn), Dhuhr (noon), Asr (afternoon), Maghrib (sunset), and Isha (night).\n\nBefore prayer, one must perform wudu (ablution) to be in a state of physical purity. Each prayer consists of units called rak'ahs, which include standing, bowing, prostrating, and sitting.\n\nThe Prophet Muhammad (peace be upon him) said: 'Prayer is the key to Paradise.' It serves as a direct connection between the worshipper and Allah, providing spiritual nourishment and a reminder of one's purpose in life.";
    }
    
    if (lowerContent.includes('quran') || lowerContent.includes('koran')) {
      return "The Quran is the holy book of Islam and is considered by Muslims to be the literal word of Allah (God) as revealed to Prophet Muhammad (peace be upon him) through the angel Gabriel over a period of 23 years.\n\nIt consists of 114 chapters (surahs) arranged roughly from longest to shortest, with the exception of the opening chapter, Al-Fatiha. The Quran covers various topics including belief, worship, ethics, stories of previous prophets, descriptions of the afterlife, and guidance for personal and societal conduct.\n\nMuslims believe the Quran to be perfectly preserved in its original Arabic form since its revelation, and it serves as the primary source of Islamic law and guidance. Millions of Muslims worldwide have memorized the entire Quran, and its recitation is considered a form of worship.";
    }
    
    // Default response if no specific match
    return "Thank you for your question about Islam. As an AI Islamic scholar assistant, I strive to provide accurate information based on authentic sources including the Quran and Hadith. For more detailed information on this topic, I would recommend consulting with a qualified Islamic scholar or referring to reliable Islamic texts. May Allah guide us all to the right path.";
  }
};