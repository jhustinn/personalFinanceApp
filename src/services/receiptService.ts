import { generativeModel } from '../lib/gemini';

export interface ExtractedData {
  amount: number | null;
  description: string | null;
  date: string | null; // YYYY-MM-DD
  type: 'income' | 'expense' | null;
}

// Helper function to convert file to base64
function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string } }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // The result includes the data URL prefix, e.g., "data:image/jpeg;base64,"
        // We need to extract just the base64 part.
        const base64Data = reader.result.split(',')[1];
        resolve({
          inlineData: {
            data: base64Data,
            mimeType: file.type,
          },
        });
      } else {
        reject(new Error("Failed to read file as base64 string."));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

export const receiptService = {
  async analyzeReceipt(imageFile: File): Promise<ExtractedData> {
    try {
      const imagePart = await fileToGenerativePart(imageFile);

      const prompt = `
        You are an expert financial assistant specializing in receipt analysis.
        Analyze the provided receipt image and extract the following information.
        Return the data ONLY as a valid JSON object with the specified keys.
        
        1.  **amount**: The final total amount of the transaction. It should be a number without any currency symbols or commas.
        2.  **description**: Identify all the individual items purchased from the receipt. Format them as a single, comma-separated string (e.g., "Item 1, Item 2, Item 3"). If you cannot identify specific items, use the merchant's name as the description.
        3.  **date**: The date of the transaction in "YYYY-MM-DD" format. If the year is not present, assume the current year.
        4.  **type**: The type of transaction. Default to "expense". If the receipt clearly indicates a refund, return, or deposit, set it to "income".

        Example JSON output for a receipt with items:
        {
          "amount": 75000,
          "description": "Kopi Americano, Croissant Coklat, Air Mineral",
          "date": "2025-07-01",
          "type": "expense"
        }

        Example JSON output if items are not clear:
        {
          "amount": 125000,
          "description": "Supermarket Sejahtera",
          "date": "2025-07-02",
          "type": "expense"
        }

        If you cannot find a specific piece of information, set its value to null.
        Do not add any explanatory text or markdown formatting around the JSON object.
      `;

      const result = await generativeModel.generateContent([prompt, imagePart]);
      const responseText = result.response.text();
      
      // Clean the response to get only the JSON part
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("AI did not return a valid JSON object.");
      }

      const parsedJson = JSON.parse(jsonMatch[0]);
      
      // Validate and format the date
      if (parsedJson.date && !/^\d{4}-\d{2}-\d{2}$/.test(parsedJson.date)) {
          // Attempt to fix common date formats or default to today
          try {
              parsedJson.date = new Date(parsedJson.date).toISOString().split('T')[0];
          } catch (e) {
              parsedJson.date = new Date().toISOString().split('T')[0];
          }
      }

      return {
        amount: parsedJson.amount ? Number(parsedJson.amount) : null,
        description: parsedJson.description || null,
        date: parsedJson.date || new Date().toISOString().split('T')[0],
        type: parsedJson.type === 'income' ? 'income' : 'expense',
      };

    } catch (error) {
      console.error("Error analyzing receipt with Gemini:", error);
      throw new Error("AI analysis failed. Please try again or enter manually.");
    }
  },
};
