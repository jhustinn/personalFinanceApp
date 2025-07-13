import { supabase } from '../lib/supabase';
import { generativeModel } from '../lib/gemini';
import { v4 as uuidv4 } from 'uuid';

// Helper function to get authenticated user ID
async function getAuthenticatedUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('User not authenticated');
  }
  return user.id;
}

// 1. Function to gather financial context from Supabase
async function getFinancialContext(userId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

  const [
    transactions,
    wallets,
    budgets,
    goals
  ] = await Promise.all([
    // Recent transactions
    supabase
      .from('transactions')
      .select('amount, type, description, date, category:categories(name)')
      .eq('user_id', userId)
      .gte('date', thirtyDaysAgoISO)
      .order('date', { ascending: false })
      .limit(50),
    // Wallet summary
    supabase
      .from('wallets')
      .select('name, balance, type')
      .eq('user_id', userId)
      .eq('is_active', true),
    // Current month's budgets
    supabase
      .from('budgets')
      .select('amount, month, category:categories(name)')
      .eq('user_id', userId)
      .limit(10),
    // Active financial goals
    supabase
      .from('financial_goals')
      .select('title, target_amount, current_amount, target_date, priority')
      .eq('user_id', userId)
      .eq('status', 'active')
  ]);

  if (transactions.error || wallets.error || budgets.error || goals.error) {
    console.error('Error fetching financial context:', {
      transactionsError: transactions.error,
      walletsError: wallets.error,
      budgetsError: budgets.error,
      goalsError: goals.error,
    });
    throw new Error('Failed to fetch complete financial context.');
  }

  return {
    transactions: transactions.data,
    wallets: wallets.data,
    budgets: budgets.data,
    goals: goals.data,
  };
}

// 2. Function to build the AI prompt
function buildPrompt(financialContext: object): string {
  const contextString = JSON.stringify(financialContext, null, 2);

  return `
    You are "Finara", an expert AI financial advisor for a personal finance app in Indonesia. 
    Your tone is encouraging, insightful, and professional.
    Your currency is Indonesian Rupiah (IDR).

    Analyze the user's financial data from the last 30 days provided below in JSON format:
    ${contextString}

    Based on this data, generate 5 personalized and actionable financial recommendations. 
    Focus on practical steps the user can take to improve their financial health, such as optimizing spending, increasing savings, smart investing, and achieving their goals.

    Your response MUST be a valid JSON array of objects, with no other text, explanation, or markdown formatting before or after it.
    Each object in the array must conform to this TypeScript interface:
    
    interface Recommendation {
      id: string; // Use uuidv4 for this, e.g., "a1b2c3d4-..."
      type: 'saving' | 'investment' | 'budget' | 'goal' | 'warning';
      title: string; // A short, catchy title for the recommendation.
      description: string; // A 1-2 sentence explanation of the 'why'.
      impact: 'high' | 'medium' | 'low'; // The potential impact on financial health.
      priority: number; // A number from 1 (highest) to 5 (lowest).
      potentialSaving?: number; // Estimated monthly savings in IDR. Omit if not applicable.
      timeframe: string; // e.g., "Immediate", "1 month", "6 months"
      actionItems: string[]; // A list of 2-3 concrete, simple steps the user can take.
      isImplemented: boolean; // Always set to false.
    }

    Constraints:
    - Ensure priorities are unique from 1 to 5.
    - Descriptions and action items must be concise and easy to understand.
    - If the data is sparse, provide general but relevant financial best-practice recommendations.
    - All text should be suitable for a user in Indonesia.
  `;
}

// 3. Main service function to generate recommendations
export const recommendationService = {
  async generateRecommendations() {
    try {
      const userId = await getAuthenticatedUserId();
      const financialContext = await getFinancialContext(userId);

      // Handle case where there's not enough data
      if (!financialContext.transactions || financialContext.transactions.length < 3) {
        // Return a default message or generic recommendations if not enough data
        return [
          {
            id: uuidv4(),
            type: 'goal',
            title: 'Start Tracking Your Finances',
            description: 'Consistent tracking is the first step to financial clarity. Add your daily transactions to get personalized insights.',
            impact: 'high',
            priority: 1,
            timeframe: 'Immediate',
            actionItems: ['Add at least 10 transactions this week.', 'Set up your primary wallet.', 'Create your first budget for a key category like Food.'],
            isImplemented: false,
          }
        ];
      }

      const prompt = buildPrompt(financialContext);
      
      const result = await generativeModel.generateContent(prompt);
      const responseText = result.response.text();
      
      // Clean the response to ensure it's valid JSON
      const cleanedJsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const recommendations = JSON.parse(cleanedJsonString);

      // Add unique IDs if the AI didn't
      return recommendations.map((rec: any) => ({ ...rec, id: rec.id || uuidv4() }));

    } catch (error) {
      console.error("Error generating AI recommendations:", error);
      throw new Error("Sorry, I couldn't generate recommendations at this time. Please try again later.");
    }
  }
};
