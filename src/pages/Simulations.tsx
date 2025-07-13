import React, { useState } from 'react';
import {
  Calculator,
  TrendingUp,
  Target,
  DollarSign,
  Calendar,
  PieChart, // Assuming you might use this for a chart later
  BarChart3, // Assuming you might use this for a chart later
  Play,
  RotateCcw
} from 'lucide-react';
import { Layout } from '../components/Layout';

// --- Interfaces yang lebih spesifik ---
interface MonthlyBreakdown {
  month: number;
  balance: number;
  contributions: number;
  returns: number;
  // Untuk loan, mungkin juga ada principalPaid, interestPaid
  principalPaid?: number;
  interestPaid?: number;
}

interface SimulationResult {
  scenario: string;
  finalAmount: number;
  totalContributions: number; // Total uang yang dimasukkan oleh user
  totalReturns: number; // Total keuntungan/bunga yang didapat (atau total bunga yang dibayar untuk loan)
  monthlyData: MonthlyBreakdown[];
  // Tambahan untuk Loan:
  monthlyPayment?: number;
  totalInterestPaid?: number;
}

// --- Interface untuk State Input Simulasi ---
interface SimulationInputs {
  // Retirement
  currentAge: number;
  retirementAge: number;
  monthlyContribution: number;
  currentSavings: number;
  expectedReturn: number; // Annual %

  // Goal
  goalAmount: number;
  timeframe: number; // In months
  initialAmount: number;
  goalReturn: number; // Annual %

  // Investment (Lump Sum)
  investmentAmount: number;
  investmentPeriod: number; // In months
  investmentReturn: number; // Annual %

  // Loan
  loanAmount: number;
  loanTerm: number; // In months
  interestRate: number; // Annual %
}

// --- Helper Functions untuk Perhitungan ---
const calculateFutureValue = (
  principal: number,
  monthlyContribution: number,
  annualRate: number,
  numMonths: number
) => {
  const monthlyRate = annualRate / 100 / 12;
  let futureValue = principal;
  let totalContributions = principal; // Termasuk initial principal
  let totalReturns = 0;
  const monthlyData: MonthlyBreakdown[] = [];

  for (let month = 1; month <= numMonths; month++) {
    const returns = futureValue * monthlyRate;
    futureValue += returns + monthlyContribution;
    totalContributions += monthlyContribution;
    totalReturns += returns;

    monthlyData.push({
      month,
      balance: futureValue,
      contributions: totalContributions,
      returns: totalReturns, // Total returns hingga bulan ini
    });
  }
  return { futureValue, totalContributions, totalReturns, monthlyData };
};

const calculateLoanAmortization = (
  loanAmount: number,
  annualRate: number,
  loanTerm: number // in months
) => {
  const monthlyRate = annualRate / 100 / 12;

  // Formula untuk Payment Bulanan Amortisasi (PMT)
  const monthlyPayment =
    loanAmount *
    (monthlyRate * Math.pow(1 + monthlyRate, loanTerm)) /
    (Math.pow(1 + monthlyRate, loanTerm) - 1);

  let remainingBalance = loanAmount;
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;
  const monthlyData: MonthlyBreakdown[] = [];

  for (let month = 1; month <= loanTerm; month++) {
    const interestPayment = remainingBalance * monthlyRate;
    let principalPayment = monthlyPayment - interestPayment;

    // Pastikan pembayaran pokok tidak melebihi sisa saldo
    if (principalPayment > remainingBalance) {
      principalPayment = remainingBalance;
    }

    remainingBalance -= principalPayment;
    totalInterestPaid += interestPayment;
    totalPrincipalPaid += principalPayment;

    monthlyData.push({
      month,
      balance: Math.max(0, remainingBalance), // Saldo tidak boleh negatif
      contributions: monthlyPayment * month, // total pembayaran hingga bulan ini
      returns: interestPayment, // returns di sini mewakili bunga yang dibayar bulan ini
      principalPaid: principalPayment,
      interestPaid: interestPayment,
    });

    if (remainingBalance <= 0) break; // Jika pinjaman sudah lunas
  }
  return { monthlyPayment, totalInterestPaid, totalPrincipalPaid, monthlyData };
};

export const Simulations: React.FC = () => {
  const [activeSimulation, setActiveSimulation] = useState<'retirement' | 'goal' | 'investment' | 'loan'>('retirement');
  const [simulationInputs, setSimulationInputs] = useState<SimulationInputs>({
    // Default values yang masuk akal
    currentAge: 30,
    retirementAge: 60,
    monthlyContribution: 5_000_000, // Menggunakan underscore untuk readability
    currentSavings: 50_000_000,
    expectedReturn: 8,

    goalAmount: 200_000_000,
    timeframe: 36, // 3 tahun
    initialAmount: 20_000_000,
    goalReturn: 6,

    investmentAmount: 100_000_000,
    investmentPeriod: 120, // 10 tahun
    investmentReturn: 10,

    loanAmount: 500_000_000,
    loanTerm: 240, // 20 tahun
    interestRate: 8.5
  });

  const [results, setResults] = useState<SimulationResult | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setSimulationInputs(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value // Parse float for numbers, handle empty string as 0
    }));
  };

  // --- Fungsi Simulasi yang Direfaktor ---
  const simulateRetirement = (): SimulationResult => {
    const { currentAge, retirementAge, monthlyContribution, currentSavings, expectedReturn } = simulationInputs;

    const numMonths = (retirementAge - currentAge) * 12;
    if (numMonths <= 0) throw new Error("Retirement age must be greater than current age.");

    const { futureValue, totalContributions, totalReturns, monthlyData } =
      calculateFutureValue(currentSavings, monthlyContribution, expectedReturn, numMonths);

    return {
      scenario: 'Retirement Planning',
      finalAmount: futureValue,
      totalContributions: totalContributions, // Total kontribusi termasuk saldo awal + bulanan
      totalReturns: futureValue - currentSavings - (monthlyContribution * numMonths), // Total bunga/keuntungan bersih
      monthlyData
    };
  };

  const simulateGoal = (): SimulationResult => {
    const { goalAmount, timeframe, initialAmount, goalReturn } = simulationInputs;

    if (timeframe <= 0) throw new Error("Timeframe must be greater than 0.");

    const monthlyRate = goalReturn / 100 / 12;
    let requiredMonthlyContribution: number;

    // Perhitungan PMT (payment to reach goal) - sedikit tricky
    // FV = P(1+r)^n + PMT * [((1+r)^n - 1) / r]
    // PMT = (FV - P(1+r)^n) * r / ((1+r)^n - 1)
    if (monthlyRate === 0) { // Menangani kasus suku bunga 0%
      requiredMonthlyContribution = (goalAmount - initialAmount) / timeframe;
    } else {
      requiredMonthlyContribution = (goalAmount - initialAmount * Math.pow(1 + monthlyRate, timeframe)) * monthlyRate /
                                    (Math.pow(1 + monthlyRate, timeframe) - 1);
    }
    
    // Jika requiredMonthlyContribution negatif, artinya sudah bisa tercapai atau terlalu mudah
    if (requiredMonthlyContribution < 0) {
        requiredMonthlyContribution = 0; // Tidak perlu kontribusi bulanan tambahan
    }

    const { futureValue, totalContributions, totalReturns, monthlyData } =
      calculateFutureValue(initialAmount, requiredMonthlyContribution, goalReturn, timeframe);

    // Menyesuaikan totalContributions dan totalReturns untuk skenario Goal
    const actualTotalContributions = initialAmount + (requiredMonthlyContribution * timeframe);

    return {
      scenario: 'Financial Goal Achievement',
      finalAmount: futureValue,
      totalContributions: actualTotalContributions,
      totalReturns: futureValue - actualTotalContributions,
      monthlyData,
      monthlyPayment: requiredMonthlyContribution // Tambahkan ini agar bisa ditampilkan
    };
  };

  const simulateInvestment = (): SimulationResult => {
    const { investmentAmount, investmentPeriod, investmentReturn } = simulationInputs;

    if (investmentPeriod <= 0) throw new Error("Investment period must be greater than 0.");

    const { futureValue, totalContributions, totalReturns, monthlyData } =
      calculateFutureValue(investmentAmount, 0, investmentReturn, investmentPeriod); // Monthly contribution 0

    return {
      scenario: 'Investment Growth',
      finalAmount: futureValue,
      totalContributions: investmentAmount, // Untuk lump sum, kontribusi adalah jumlah awal
      totalReturns: futureValue - investmentAmount,
      monthlyData
    };
  };

  const simulateLoan = (): SimulationResult => {
    const { loanAmount, loanTerm, interestRate } = simulationInputs;

    if (loanTerm <= 0) throw new Error("Loan term must be greater than 0.");
    if (interestRate < 0) throw new Error("Interest rate cannot be negative.");

    const { monthlyPayment, totalInterestPaid, monthlyData } =
      calculateLoanAmortization(loanAmount, interestRate, loanTerm);

    return {
      scenario: 'Loan Repayment',
      finalAmount: 0, // Loan repaid to 0
      totalContributions: monthlyPayment * loanTerm, // Total pembayaran
      totalReturns: totalInterestPaid, // Untuk loan, returns adalah total bunga yang dibayar
      monthlyData,
      monthlyPayment: monthlyPayment, // Tambahkan ini agar bisa ditampilkan
      totalInterestPaid: totalInterestPaid // Tambahkan ini agar bisa ditampilkan
    };
  };

  const runSimulation = () => {
    try {
      let result: SimulationResult;

      switch (activeSimulation) {
        case 'retirement':
          result = simulateRetirement();
          break;
        case 'goal':
          result = simulateGoal();
          break;
        case 'investment':
          result = simulateInvestment();
          break;
        case 'loan':
          result = simulateLoan();
          break;
        default:
          throw new Error("Invalid simulation type selected.");
      }
      setResults(result);
    } catch (e: any) {
      alert(`Simulation Error: ${e.message}`); // Tampilkan error ke user
      setResults(null); // Reset hasil jika ada error
    }
  };

  const simulationTypes = [
    {
      id: 'retirement',
      title: 'Retirement Planning',
      description: 'Calculate how much you need to save for retirement',
      icon: Target,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      id: 'goal',
      title: 'Financial Goal',
      description: 'Plan how to reach a specific financial target',
      icon: TrendingUp,
      color: 'bg-green-100 text-green-600'
    },
    {
      id: 'investment',
      title: 'Investment Growth',
      description: 'See how your investments could grow over time',
      icon: BarChart3,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      id: 'loan',
      title: 'Loan Calculator',
      description: 'Calculate loan payments and total interest',
      icon: Calculator,
      color: 'bg-orange-100 text-orange-600'
    }
  ];

  const renderInputForm = () => {
    switch (activeSimulation) {
      case 'retirement':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="currentAge" className="block text-sm font-medium text-gray-700 mb-2">Current Age</label>
              <input
                id="currentAge"
                type="number"
                name="currentAge"
                value={simulationInputs.currentAge}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="retirementAge" className="block text-sm font-medium text-gray-700 mb-2">Retirement Age</label>
              <input
                id="retirementAge"
                type="number"
                name="retirementAge"
                value={simulationInputs.retirementAge}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="monthlyContribution" className="block text-sm font-medium text-gray-700 mb-2">Monthly Contribution (IDR)</label>
              <input
                id="monthlyContribution"
                type="number"
                name="monthlyContribution"
                value={simulationInputs.monthlyContribution}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="currentSavings" className="block text-sm font-medium text-gray-700 mb-2">Current Savings (IDR)</label>
              <input
                id="currentSavings"
                type="number"
                name="currentSavings"
                value={simulationInputs.currentSavings}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="expectedReturn" className="block text-sm font-medium text-gray-700 mb-2">Expected Annual Return (%)</label>
              <input
                id="expectedReturn"
                type="number"
                name="expectedReturn"
                step="0.1"
                value={simulationInputs.expectedReturn}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        );

      case 'goal':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="goalAmount" className="block text-sm font-medium text-gray-700 mb-2">Goal Amount (IDR)</label>
              <input
                id="goalAmount"
                type="number"
                name="goalAmount"
                value={simulationInputs.goalAmount}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="timeframe" className="block text-sm font-medium text-gray-700 mb-2">Timeframe (months)</label>
              <input
                id="timeframe"
                type="number"
                name="timeframe"
                value={simulationInputs.timeframe}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="initialAmount" className="block text-sm font-medium text-gray-700 mb-2">Initial Amount (IDR)</label>
              <input
                id="initialAmount"
                type="number"
                name="initialAmount"
                value={simulationInputs.initialAmount}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="goalReturn" className="block text-sm font-medium text-gray-700 mb-2">Expected Annual Return (%)</label>
              <input
                id="goalReturn"
                type="number"
                name="goalReturn"
                step="0.1"
                value={simulationInputs.goalReturn}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        );

      case 'investment':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="investmentAmount" className="block text-sm font-medium text-gray-700 mb-2">Investment Amount (IDR)</label>
              <input
                id="investmentAmount"
                type="number"
                name="investmentAmount"
                value={simulationInputs.investmentAmount}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="investmentPeriod" className="block text-sm font-medium text-gray-700 mb-2">Investment Period (months)</label>
              <input
                id="investmentPeriod"
                type="number"
                name="investmentPeriod"
                value={simulationInputs.investmentPeriod}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="investmentReturn" className="block text-sm font-medium text-gray-700 mb-2">Expected Annual Return (%)</label>
              <input
                id="investmentReturn"
                type="number"
                name="investmentReturn"
                step="0.1"
                value={simulationInputs.investmentReturn}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        );

      case 'loan':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="loanAmount" className="block text-sm font-medium text-gray-700 mb-2">Loan Amount (IDR)</label>
              <input
                id="loanAmount"
                type="number"
                name="loanAmount"
                value={simulationInputs.loanAmount}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="loanTerm" className="block text-sm font-medium text-gray-700 mb-2">Loan Term (months)</label>
              <input
                id="loanTerm"
                type="number"
                name="loanTerm"
                value={simulationInputs.loanTerm}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 mb-2">Interest Rate (% per year)</label>
              <input
                id="interestRate"
                type="number"
                name="interestRate"
                step="0.1"
                value={simulationInputs.interestRate}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const actionButtons = (
    <div className="flex items-center space-x-3">
      <button
        onClick={() => setResults(null)}
        className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Reset</span>
      </button>

      <button
        onClick={runSimulation}
        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Play className="w-4 h-4" />
        <span>Run Simulation</span>
      </button>
    </div>
  );

  return (
    <Layout title="Financial Simulations" action={actionButtons}>
      <div className="space-y-6">
        {/* Simulation Types */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {simulationTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setActiveSimulation(type.id as any)} // type assertion is fine here
              className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                activeSimulation === type.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${type.color}`}>
                <type.icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{type.title}</h3>
              <p className="text-sm text-gray-600">{type.description}</p>
            </button>
          ))}
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6">
            {simulationTypes.find(t => t.id === activeSimulation)?.title} Parameters
          </h3>
          {renderInputForm()}
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Final Amount</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(results.finalAmount)}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Contributions</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(results.totalContributions)}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {activeSimulation === 'loan' ? 'Total Interest' : 'Total Returns'}
                    </p>
                    <p className={`text-2xl font-bold ${
                      activeSimulation === 'loan' ? 'text-red-600' : 'text-purple-600'
                    }`}>
                      {formatCurrency(Math.abs(results.totalReturns))}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    activeSimulation === 'loan' ? 'bg-red-100' : 'bg-purple-100'
                  }`}>
                    <TrendingUp className={`w-6 h-6 ${
                      activeSimulation === 'loan' ? 'text-red-600' : 'text-purple-600'
                    }`} />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Loan Details */}
            {activeSimulation === 'loan' && results.monthlyPayment && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Loan Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <p><strong>Monthly Payment:</strong> {formatCurrency(results.monthlyPayment)}</p>
                  <p><strong>Total Interest Paid:</strong> {formatCurrency(results.totalInterestPaid || 0)}</p>
                </div>
              </div>
            )}

            {/* Chart Placeholder */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Growth Projection</h3>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Chart visualization would be displayed here</p>
                  <p className="text-sm text-gray-400">Showing {results.scenario} over time</p>
                </div>
              </div>
            </div>

            {/* Key Insights */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calculator className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Key Insights</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    {activeSimulation === 'retirement' && (
                      <>
                        <p>• You'll have {formatCurrency(results.finalAmount)} when you retire</p>
                        <p>• Your money will grow by {((results.finalAmount / results.totalContributions - 1) * 100).toFixed(1)}% over time</p>
                        <p>• Monthly contributions: {formatCurrency(simulationInputs.monthlyContribution)}</p>
                      </>
                    )}
                    {activeSimulation === 'goal' && (
                      <>
                        <p>• To reach your goal of {formatCurrency(simulationInputs.goalAmount)} in {simulationInputs.timeframe} months, you will need to save approximately {formatCurrency(results.monthlyPayment || 0)} per month.</p>
                        <p>• Your initial amount of {formatCurrency(simulationInputs.initialAmount)} will contribute significantly.</p>
                        <p>• Investment returns are projected to contribute {formatCurrency(results.totalReturns)} to your goal.</p>
                      </>
                    )}
                    {activeSimulation === 'investment' && (
                      <>
                        <p>• Your initial investment of {formatCurrency(simulationInputs.investmentAmount)} is projected to grow to {formatCurrency(results.finalAmount)} over {simulationInputs.investmentPeriod} months.</p>
                        <p>• Total returns generated: {formatCurrency(results.totalReturns)} ({((results.totalReturns / simulationInputs.investmentAmount) * 100).toFixed(1)}%)</p>
                        <p>• Average monthly growth: {formatCurrency(results.totalReturns / simulationInputs.investmentPeriod)}</p>
                      </>
                    )}
                    {activeSimulation === 'loan' && (
                      <>
                        <p>• With a loan amount of {formatCurrency(simulationInputs.loanAmount)} and {simulationInputs.loanTerm} months term at {simulationInputs.interestRate}% interest, your estimated monthly payment is {formatCurrency(results.monthlyPayment || 0)}.</p>
                        <p>• Over the loan term, you will pay a total interest of {formatCurrency(results.totalInterestPaid || 0)}.</p>
                        <p>• The total amount repaid will be {formatCurrency(results.totalContributions)}.</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
