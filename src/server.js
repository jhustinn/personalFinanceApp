// server.js (di dalam folder backend Anda, misalnya: project/backend/server.js)

import dotenv from 'dotenv';
dotenv.config({ path: '../.env' }); // Pastikan path ini benar jika .env di project/

import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const app = express();
const port = process.env.PORT || 3001; // Gunakan process.env.PORT atau fallback ke 3001

// --- Supabase Configuration ---
// PASTIKAN MENGGUNAKAN NAMA VARIABEL LINGKUNGAN YANG BENAR DARI .env ANDA
const supabaseUrl = process.env.SUPABASE_URL; // Tanpa VITE_
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Gunakan SERVICE_ROLE_KEY untuk backend

if (!supabaseUrl || !supabaseKey) {
    console.error('ERROR: Supabase URL or Key is NOT correctly loaded from environment variables.');
    console.error('Please check your .env file at E:/App/myPersonalFinanceApps/project/.env');
    console.error(`Loaded URL: ${supabaseUrl}, Loaded Key: ${supabaseKey ? '***' : 'undefined'}`);
    process.exit(1); // Hentikan server jika kunci database tidak ada
}

const supabase = createClient(supabaseUrl, supabaseKey); // Hapus || '' karena kita sudah memastikan tidak undefined

// Middleware
app.use(cors({
    origin: 'http://localhost:5173' // Sesuaikan dengan URL React app Anda
}));
app.use(express.json());

// --- Gemini API Configuration ---
// AMBIL API KEY DARI .env, JANGAN DI-HARDCODE
const geminiApiKey = process.env.GEMINI_API_KEY; 

if (!geminiApiKey) {
    console.error('ERROR: GEMINI_API_KEY is NOT set in environment variables. Please check your .env file.');
    process.exit(1); // Hentikan server jika API key Gemini tidak ada
}

const genAI = new GoogleGenerativeAI(geminiApiKey || '');
// PERBAIKAN: Kembali ke gemini-pro untuk menghindari masalah kuota flash yang cepat habis saat debugging
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); 

// --- FUNCTIONS/TOOLS UNTUK GEMINI ---
const availableFunctions = {
    getTransactions: async ({ userId, transactionType, categoryName, startDate, endDate }) => {
        console.log(`[getTransactions] Fetching for userId: ${userId}, type: ${transactionType}, category: ${categoryName}, start: ${startDate}, end: ${endDate}`);
        let query = supabase.from('transactions').select('*').eq('user_id', userId);

        if (transactionType) query = query.eq('type', transactionType);
        if (categoryName) {
            const { data: categoryData, error: categoryError } = await supabase.from('categories').select('id, name').eq('name', categoryName).single(); // Ambil juga name untuk debugging
            if (categoryError || !categoryData) {
                console.warn(`[getTransactions] Category "${categoryName}" not found.`);
                return { error: `Category "${categoryName}" not found.` };
            }
            query = query.eq('category_id', categoryData.id);
        }

        if (startDate) query = query.gte('date', startDate);
        if (endDate) query = query.lte('date', endDate);

        const { data, error } = await query;
        if (error) {
            console.error('[getTransactions] Error fetching from Supabase:', error);
            return { error: 'Failed to fetch transactions from database' };
        }
        console.log(`[getTransactions] Found ${data.length} transactions.`);
        return data;
    },

    getTotalAmount: async ({ userId, transactionType, categoryName, startDate, endDate }) => {
        console.log(`[getTotalAmount] Calculating for userId: ${userId}, type: ${transactionType}, category: ${categoryName}, start: ${startDate}, end: ${endDate}`);
        let query = supabase.from('transactions')
                            .select('amount, category_id')
                            .eq('user_id', userId)
                            .eq('type', transactionType);

        if (categoryName) {
            const { data: categoryData, error: categoryError } = await supabase.from('categories').select('id, name').eq('name', categoryName).single(); // Ambil juga name
            if (categoryError || !categoryData) {
                console.warn(`[getTotalAmount] Category "${categoryName}" not found.`);
                return { error: `Category "${categoryName}" not found.` };
            }
            query = query.eq('category_id', categoryData.id);
        }

        if (startDate) query = query.gte('date', startDate);
        if (endDate) query = query.lte('date', endDate);

        const { data, error } = await query;
        if (error) {
            console.error(`[getTotalAmount] Error fetching from Supabase for type ${transactionType}:`, error);
            return { error: `Failed to fetch total ${transactionType} from database` };
        }

        const total = data.reduce((sum, item) => sum + item.amount, 0);
        console.log(`[getTotalAmount] Calculated total: ${total}`);
        return { totalAmount: total, currency: 'IDR' };
    },

    getBudgets: async ({ userId, categoryName, month }) => {
        console.log(`[getBudgets] Fetching for userId: ${userId}, category: ${categoryName}, month: ${month}`);
        let query = supabase.from('budgets').select('*').eq('user_id', userId);

        if (categoryName) {
            const { data: categoryData, error: categoryError } = await supabase.from('categories').select('id, name').eq('name', categoryName).single();
            if (categoryError || !categoryData) {
                console.warn(`[getBudgets] Category "${categoryName}" not found.`);
                return { error: `Category "${categoryName}" not found.` };
            }
            query = query.eq('category_id', categoryData.id);
        }

        if (month) query = query.eq('month', month);

        const { data, error } = await query;
        if (error) {
            console.error('[getBudgets] Error fetching from Supabase:', error);
            return { error: 'Failed to fetch budgets from database' };
        }
        console.log(`[getBudgets] Found ${data.length} budgets.`);
        return data;
    },

    getFinancialGoals: async ({ userId, goalStatus }) => {
        console.log(`[getFinancialGoals] Fetching for userId: ${userId}, status: ${goalStatus}`);
        let query = supabase.from('financial_goals').select('*').eq('user_id', userId);

        if (goalStatus) query = query.eq('status', goalStatus);

        const { data, error } = await query;
        if (error) {
            console.error('[getFinancialGoals] Error fetching from Supabase:', error);
            return { error: 'Failed to fetch financial goals from database' };
        }
        console.log(`[getFinancialGoals] Found ${data.length} goals.`);
        return data;
    },

    getWalletBalance: async ({ userId, walletName }) => {
        console.log(`[getWalletBalance] Fetching for userId: ${userId}, wallet: ${walletName}`);
        let query = supabase.from('wallets').select('*').eq('user_id', userId);

        if (walletName) query = query.eq('name', walletName);

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching wallet balance:', error);
            return { error: 'Failed to fetch wallet balance from database' };
        }
        console.log(`[getWalletBalance] Found ${data.length} wallets.`);
        return data;
    },

    getCategories: async () => {
        console.log('[getCategories] Fetching all categories.');
        const { data, error } = await supabase.from('categories').select('name, id');
        if (error) {
            console.error('[getCategories] Error fetching from Supabase:', error);
            return { error: 'Failed to fetch categories from database' };
        }
        console.log(`[getCategories] Found ${data.length} categories.`);
        return data;
    }
};

// Definisikan Tools/Functions untuk Gemini API
// Tidak ada perubahan di sini kecuali Anda ingin menambah/mengubah tools
const tools = [
    {
        functionDeclarations: [
            {
                name: "getTransactions",
                description: "Mengambil daftar transaksi keuangan pengguna. Sangat berguna untuk menganalisis pola pengeluaran atau pendapatan. Dapat difilter berdasarkan tipe (pendapatan/pengeluaran), nama kategori, dan rentang tanggal spesifik atau periode relatif (misal: 'bulan lalu', 'tiga bulan terakhir'). Nama kategori harus sesuai dengan yang ada di database. **Jika pengguna ingin analisis, panggil fungsi ini tanpa filter tanggal atau kategori untuk mengambil semua data relevan, kemudian rangkum dan analisis data JSON yang dikembalikan.**",
                parameters: {
                    type: "object",
                    properties: {
                        userId: { type: "string", description: "ID pengguna yang sedang login." },
                        transactionType: { type: "string", enum: ["income", "expense"], description: "Tipe transaksi (misal: 'income' atau 'expense')." },
                        categoryName: { type: "string", description: "Nama kategori transaksi (misal: 'Food', 'Transportation', 'Salary')." },
                        startDate: { type: "string", format: "date-time", description: "Tanggal mulai transaksi dalam format ISO 8601 (misal: '2024-01-01T00:00:00Z')." },
                        endDate: { type: "string", format: "date-time", description: "Tanggal akhir transaksi dalam format ISO 8601 (misal: '2024-12-31T23:59:59Z')." },
                        period: { type: "string", enum: ["last three months", "this month", "last month", "this year", "last year", "today", "yesterday"], description: "Periode waktu relatif (misal: 'last three months', 'this month')." },
                    },
                    required: ["userId"],
                },
            },
            {
                name: "getTotalAmount",
                description: "Menghitung total jumlah (pengeluaran atau pendapatan) untuk pengguna, sangat cocok untuk ringkasan cepat. Dapat difilter berdasarkan tipe transaksi, nama kategori, dan rentang tanggal spesifik atau periode relatif (misal: 'bulan lalu', 'tiga bulan terakhir'). Nama kategori harus sesuai dengan yang ada di database. **Jika pengguna ingin analisis, panggil fungsi ini tanpa filter tanggal atau kategori untuk mengambil semua data relevan, kemudian rangkum dan analisis data JSON yang dikembalikan.**",
                parameters: {
                    type: "object",
                    properties: {
                        userId: { type: "string", description: "ID pengguna yang sedang login." },
                        transactionType: { type: "string", enum: ["income", "expense"], description: "Tipe jumlah yang ingin dihitung ('income' atau 'expense')." },
                        categoryName: { type: "string", description: "Nama kategori transaksi (misal: 'Food', 'Transportation', 'Rent')." },
                        startDate: { type: "string", format: "date-time", description: "Tanggal mulai transaksi dalam format ISO 8601." },
                        endDate: { type: "string", format: "date-time", description: "Tanggal akhir transaksi dalam format ISO 8601." },
                        period: { type: "string", enum: ["last three months", "this month", "last month", "this year", "last year", "today", "yesterday"], description: "Periode waktu relatif (misal: 'last three months', 'this month')." },
                    },
                    required: ["userId", "transactionType"],
                },
            },
            {
                name: "getBudgets",
                description: "Mengambil informasi anggaran yang telah ditetapkan pengguna, dapat difilter berdasarkan nama kategori dan bulan. Nama kategori harus sesuai dengan yang ada di database.",
                parameters: {
                    type: "object",
                    properties: {
                        userId: { type: "string", description: "ID pengguna yang sedang login." },
                        categoryName: { type: "string", description: "Nama kategori anggaran (misal: 'Food', 'Rent', 'Utilities')." },
                        month: { type: "string", pattern: "^\\d{4}-\\d{2}$", description: "Bulan dan tahun anggaran dalam format YYYY-MM (misal: '2025-06')." },
                    },
                    required: ["userId"],
                },
            },
            {
                name: "getFinancialGoals",
                description: "Mengambil daftar tujuan keuangan yang telah ditetapkan pengguna, dapat difilter berdasarkan status tujuan.",
                parameters: {
                    type: "object",
                    properties: {
                        userId: { type: "string", description: "ID pengguna yang sedang login." },
                        goalStatus: { type: "string", enum: ["in_progress", "completed", "on_hold", "cancelled"], description: "Status tujuan keuangan (misal: 'in_progress', 'completed')." },
                    },
                    required: ["userId"],
                },
            },
            {
                name: "getWalletBalance",
                description: "Mengambil saldo dari wallet pengguna, dapat difilter berdasarkan nama wallet.",
                parameters: {
                    type: "object",
                    properties: {
                        userId: { type: "string", description: "ID pengguna yang sedang login." },
                        walletName: { type: "string", description: "Nama wallet (misal: 'Cash', 'Bank Account', 'E-Wallet')." },
                    },
                    required: ["userId"],
                },
            },
            {
                name: "getCategories",
                description: "Mengambil daftar semua kategori transaksi dan anggaran yang tersedia dalam sistem.",
                parameters: {
                    type: "object",
                    properties: {},
                    required: [],
                },
            }
        ],
    },
];

const chat = model.startChat({ tools }); // Gunakan tools di sini

// API endpoint to interact with Gemini AI with Function Calling
app.post('/ask-ai', async (req, res) => {
    const userPrompt = req.body.prompt;
    const userId = 'f9616731-3b35-43d4-b78b-98569c646868'; // Hardcoded userId for demo purposes

    if (!userPrompt) {
        return res.status(400).json({ error: 'Prompt is required.' });
    }

    try {
        const result = await chat.sendMessage(userPrompt); 
        
        const functionCall = result.response.functionCall;
        const textResponse = result.response.text();
    
        let aiResponseText = '';
    
        if (functionCall && functionCall.name) {
            const functionName = functionCall.name;
            const functionArgs = functionCall.args;
    
            console.log(`Gemini requested to call function: ${functionName} with args:`, functionArgs);
    
            if (availableFunctions[functionName]) {
                const argsToCall = { ...functionArgs, userId };
                Object.keys(argsToCall).forEach(key => argsToCall[key] === undefined && delete argsToCall[key]);

                // --- Date/Period Conversion Logic ---
                // PERBAIKAN: Konversi tanggal yang lebih pintar
                const now = new Date();
                let finalStartDate = argsToCall.startDate;
                let finalEndDate = argsToCall.endDate;

                if (argsToCall.period) {
                    let calculatedStartDate = null;
                    let calculatedEndDate = null;
                    switch (argsToCall.period) {
                        case 'today':
                            calculatedStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                            calculatedEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                            break;
                        case 'yesterday':
                            const yesterday = new Date(now);
                            yesterday.setDate(now.getDate() - 1);
                            calculatedStartDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
                            calculatedEndDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
                            break;
                        case 'this month':
                            calculatedStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
                            calculatedEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                            break;
                        case 'last month':
                            calculatedStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                            calculatedEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
                            break;
                        case 'last three months':
                            calculatedEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                            calculatedStartDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                            break;
                        case 'this year':
                            calculatedStartDate = new Date(now.getFullYear(), 0, 1);
                            calculatedEndDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
                            break;
                        case 'last year':
                            calculatedStartDate = new Date(now.getFullYear() - 1, 0, 1);
                            calculatedEndDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
                            break;
                    }
                    if (calculatedStartDate && calculatedEndDate) {
                        finalStartDate = calculatedStartDate.toISOString().split('T')[0];
                        finalEndDate = calculatedEndDate.toISOString().split('T')[0];
                    }
                    delete argsToCall.period; // Hapus properti period
                } else {
                    // Penanganan untuk startDate/endDate yang spesifik (jika diberikan AI sebagai string/Date)
                    if (argsToCall.startDate instanceof Date) {
                        finalStartDate = argsToCall.startDate.toISOString().split('T')[0];
                    } else if (typeof argsToCall.startDate === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(argsToCall.startDate)) {
                        const parsedDate = new Date(argsToCall.startDate);
                        if (!isNaN(parsedDate.getTime())) {
                            finalStartDate = parsedDate.toISOString().split('T')[0];
                        }
                    }

                    if (argsToCall.endDate instanceof Date) {
                        finalEndDate = argsToCall.endDate.toISOString().split('T')[0];
                    } else if (typeof argsToCall.endDate === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(argsToCall.endDate)) {
                        const parsedDate = new Date(argsToCall.endDate);
                        if (!isNaN(parsedDate.getTime())) {
                            finalEndDate = parsedDate.toISOString().split('T')[0];
                        }
                    }
                }
                
                // Set final startDate/endDate to argsToCall
                argsToCall.startDate = finalStartDate;
                argsToCall.endDate = finalEndDate;
                console.log(`[Date Conversion] Final startDate: ${argsToCall.startDate}, endDate: ${argsToCall.endDate}`);
                // --- End Date/Period Conversion Logic ---


                const functionResponse = await availableFunctions[functionName](argsToCall);
                console.log('Function execution result:', functionResponse);

                if (functionResponse && functionResponse.error) {
                    aiResponseText = `I encountered an issue retrieving data: ${functionResponse.error}. Please check your Supabase setup or try again.`;
                } else if (Array.isArray(functionResponse) && functionResponse.length === 0) {
                    aiResponseText = `I couldn't find any data for your request for userId ${userId} in the specified period.`;
                } else {
                    // STRATEGI RAG: Kirim data kembali ke Gemini untuk analisis
                    const dataSummaryPrompt = `Here is the financial data in JSON format: \n\n\`\`\`json\n${JSON.stringify(functionResponse, null, 2)}\n\`\`\`\n\nBased on this data, please answer the user's original question: "${userPrompt}". Provide insights and summaries based on the data. For transaction lists, just list them clearly. For totals, state the total. If it's a list of budgets or goals, summarize them.`;

                    const toolResponse = await chat.sendMessage([
                        {
                            functionResponse: {
                                name: functionName,
                                response: functionResponse,
                            },
                        },
                        {
                            // Tambahkan ini untuk mengumpankan data JSON kembali ke AI dalam prompt baru
                            text: dataSummaryPrompt 
                        }
                    ]);
                    aiResponseText = toolResponse.response.text();
                }
            } else {
                aiResponseText = `AI tried to call an unknown function: ${functionName}. Please inform the developer.`;
                console.error(aiResponseText);
                return res.status(500).json({ error: aiResponseText });
            }
        } else if (textResponse) {
            aiResponseText = textResponse;
        } else {
            aiResponseText = 'Sorry, I could not generate a response at this time. Please try rephrasing your question.';
        }

        return res.json({ response: aiResponseText });

    } catch (error) {
        console.error('Error in AI processing chain:', error);
        let errorMessage = 'An unexpected error occurred with the AI. Please try again.';

        if (error.response) {
            if (error.response.status === 429) {
                errorMessage = 'Too Many Requests to AI. Please try again later.';
            } else if (error.response.status === 404 && error.message.includes('model')) {
                errorMessage = 'AI model not found or unsupported. Please check model configuration.';
            } else {
                errorMessage = `AI API error: ${error.message}.`;
            }
        } else {
            errorMessage = `Backend processing error: ${error.message}.`;
        }

        return res.status(500).json({ error: errorMessage, details: error.message });
    }
});

app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
    console.log(`Your React frontend should fetch from http://localhost:${port}/ask-ai`);
});
