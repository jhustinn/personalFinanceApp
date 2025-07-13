/*
  # Create Financial Goals Table

  1. New Tables
    - `financial_goals` - User financial goals and targets
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `title` (text, goal name)
      - `category` (text, goal category)
      - `target_amount` (decimal, target amount to achieve)
      - `current_amount` (decimal, current saved amount)
      - `target_date` (date, deadline for the goal)
      - `priority` (text, goal priority level)
      - `status` (text, goal status)
      - `description` (text, goal description)
      - `monthly_target` (decimal, monthly saving target)
      - `auto_contribution` (boolean, automatic contribution enabled)
      - `contribution_source` (text, source wallet for contributions)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `financial_goals` table
    - Add policies for authenticated users to manage their own goals

  3. Features
    - Support for different goal categories
    - Progress tracking and calculations
    - Priority and status management
    - Automatic contribution tracking
*/

-- Create financial_goals table
CREATE TABLE IF NOT EXISTS financial_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text CHECK (category IN ('retirement', 'education', 'travel', 'house', 'emergency', 'investment', 'vehicle', 'wedding', 'business', 'other')) NOT NULL,
  target_amount decimal(15,2) NOT NULL,
  current_amount decimal(15,2) DEFAULT 0,
  target_date date NOT NULL,
  priority text CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  status text CHECK (status IN ('active', 'completed', 'paused', 'cancelled')) DEFAULT 'active',
  description text,
  monthly_target decimal(15,2) DEFAULT 0,
  auto_contribution boolean DEFAULT false,
  contribution_source uuid REFERENCES wallets(id) ON DELETE SET NULL,
  reminder_enabled boolean DEFAULT true,
  reminder_frequency text CHECK (reminder_frequency IN ('weekly', 'monthly', 'quarterly')) DEFAULT 'monthly',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create goal_contributions table for tracking contributions
CREATE TABLE IF NOT EXISTS goal_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id uuid REFERENCES financial_goals(id) ON DELETE CASCADE,
  amount decimal(15,2) NOT NULL,
  contribution_date date DEFAULT CURRENT_DATE,
  source_wallet_id uuid REFERENCES wallets(id) ON DELETE SET NULL,
  notes text,
  is_automatic boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;

-- Create policies for financial_goals
CREATE POLICY "Users can view own financial goals"
  ON financial_goals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own financial goals"
  ON financial_goals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own financial goals"
  ON financial_goals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own financial goals"
  ON financial_goals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for goal_contributions
CREATE POLICY "Users can view own goal contributions"
  ON goal_contributions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goal contributions"
  ON goal_contributions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goal contributions"
  ON goal_contributions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goal contributions"
  ON goal_contributions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_financial_goals_user_id ON financial_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_goals_status ON financial_goals(status);
CREATE INDEX IF NOT EXISTS idx_financial_goals_category ON financial_goals(category);
CREATE INDEX IF NOT EXISTS idx_financial_goals_target_date ON financial_goals(target_date);
CREATE INDEX IF NOT EXISTS idx_goal_contributions_user_id ON goal_contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_contributions_goal_id ON goal_contributions(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_contributions_date ON goal_contributions(contribution_date);

-- Create triggers for updated_at
CREATE TRIGGER update_financial_goals_updated_at 
  BEFORE UPDATE ON financial_goals 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
