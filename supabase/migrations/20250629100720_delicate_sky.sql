/*
  # Goals & Loans Schema

  1. New Tables
    - `goals_loans` - Unified table for both savings goals and loan tracking
    - `goal_loan_transactions` - Track payments/contributions to goals and loans
    - `goal_loan_milestones` - Track progress milestones

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data

  3. Features
    - Support for both savings goals and loan tracking
    - Payment/contribution tracking
    - Milestone and progress tracking
    - Interest calculations for loans
    - Automated payment scheduling
*/

-- Create goals_loans table (unified for both goals and loans)
CREATE TABLE IF NOT EXISTS goals_loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text CHECK (type IN ('goal', 'loan')) NOT NULL,
  category text CHECK (category IN ('emergency', 'retirement', 'education', 'travel', 'house', 'vehicle', 'wedding', 'business', 'personal_loan', 'mortgage', 'car_loan', 'credit_card', 'student_loan', 'other')) NOT NULL,
  target_amount decimal(15,2) NOT NULL,
  current_amount decimal(15,2) DEFAULT 0,
  target_date date NOT NULL,
  interest_rate decimal(5,2) DEFAULT 0, -- Annual interest rate percentage
  monthly_payment decimal(15,2) DEFAULT 0,
  priority text CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  status text CHECK (status IN ('active', 'completed', 'paused', 'cancelled')) DEFAULT 'active',
  description text,
  auto_payment boolean DEFAULT false,
  payment_source uuid REFERENCES wallets(id) ON DELETE SET NULL,
  reminder_enabled boolean DEFAULT true,
  reminder_frequency text CHECK (reminder_frequency IN ('weekly', 'monthly', 'quarterly')) DEFAULT 'monthly',
  start_date date DEFAULT CURRENT_DATE,
  lender_name text, -- For loans
  account_number text, -- For loans
  minimum_payment decimal(15,2) DEFAULT 0, -- For loans
  payment_due_date integer DEFAULT 1, -- Day of month for loan payments
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create goal_loan_transactions table for tracking payments/contributions
CREATE TABLE IF NOT EXISTS goal_loan_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_loan_id uuid REFERENCES goals_loans(id) ON DELETE CASCADE,
  amount decimal(15,2) NOT NULL,
  transaction_type text CHECK (transaction_type IN ('contribution', 'payment', 'interest', 'fee', 'adjustment')) NOT NULL,
  transaction_date date DEFAULT CURRENT_DATE,
  source_wallet_id uuid REFERENCES wallets(id) ON DELETE SET NULL,
  notes text,
  is_automatic boolean DEFAULT false,
  interest_portion decimal(15,2) DEFAULT 0, -- For loan payments
  principal_portion decimal(15,2) DEFAULT 0, -- For loan payments
  remaining_balance decimal(15,2), -- Balance after this transaction
  created_at timestamptz DEFAULT now()
);

-- Create goal_loan_milestones table for tracking progress milestones
CREATE TABLE IF NOT EXISTS goal_loan_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_loan_id uuid REFERENCES goals_loans(id) ON DELETE CASCADE,
  milestone_type text CHECK (milestone_type IN ('percentage', 'amount', 'date')) NOT NULL,
  milestone_value decimal(15,2) NOT NULL,
  milestone_description text,
  achieved boolean DEFAULT false,
  achieved_date date,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE goals_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_loan_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_loan_milestones ENABLE ROW LEVEL SECURITY;

-- Create policies for goals_loans
CREATE POLICY "Users can view own goals and loans"
  ON goals_loans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals and loans"
  ON goals_loans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals and loans"
  ON goals_loans FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals and loans"
  ON goals_loans FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for goal_loan_transactions
CREATE POLICY "Users can view own goal/loan transactions"
  ON goal_loan_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goal/loan transactions"
  ON goal_loan_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goal/loan transactions"
  ON goal_loan_transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goal/loan transactions"
  ON goal_loan_transactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for goal_loan_milestones
CREATE POLICY "Users can view own goal/loan milestones"
  ON goal_loan_milestones FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goal/loan milestones"
  ON goal_loan_milestones FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goal/loan milestones"
  ON goal_loan_milestones FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goal/loan milestones"
  ON goal_loan_milestones FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_goals_loans_user_id ON goals_loans(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_loans_type ON goals_loans(type);
CREATE INDEX IF NOT EXISTS idx_goals_loans_status ON goals_loans(status);
CREATE INDEX IF NOT EXISTS idx_goals_loans_target_date ON goals_loans(target_date);
CREATE INDEX IF NOT EXISTS idx_goal_loan_transactions_user_id ON goal_loan_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_loan_transactions_goal_loan_id ON goal_loan_transactions(goal_loan_id);
CREATE INDEX IF NOT EXISTS idx_goal_loan_transactions_date ON goal_loan_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_goal_loan_milestones_user_id ON goal_loan_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_loan_milestones_goal_loan_id ON goal_loan_milestones(goal_loan_id);

-- Create triggers for updated_at
CREATE TRIGGER update_goals_loans_updated_at 
  BEFORE UPDATE ON goals_loans 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
