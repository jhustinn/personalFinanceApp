/*
  # Create Assets Table

  1. New Tables
    - `assets` - User assets tracking (property, vehicles, electronics, jewelry, investments, etc.)

  2. Security
    - Enable RLS on assets table
    - Add policies for authenticated users to manage their own assets

  3. Features
    - Track different types of assets
    - Monitor value changes over time
    - Calculate gains/losses
    - Support for monthly contributions and interest rates
*/

-- Create assets table
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text CHECK (category IN ('property', 'vehicle', 'electronics', 'jewelry', 'investment', 'other')) NOT NULL,
  current_value decimal(15,2) NOT NULL DEFAULT 0,
  purchase_value decimal(15,2) NOT NULL DEFAULT 0,
  purchase_date date NOT NULL,
  monthly_contribution decimal(15,2) DEFAULT 0,
  interest_rate decimal(5,2) DEFAULT 0, -- Annual interest rate percentage
  status text CHECK (status IN ('active', 'sold', 'depreciated')) DEFAULT 'active',
  condition text CHECK (condition IN ('excellent', 'good', 'fair', 'poor')) DEFAULT 'good',
  description text,
  location text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Create policies for assets
CREATE POLICY "Users can view own assets"
  ON assets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assets"
  ON assets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assets"
  ON assets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own assets"
  ON assets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_purchase_date ON assets(purchase_date);

-- Create trigger for updated_at
CREATE TRIGGER update_assets_updated_at 
  BEFORE UPDATE ON assets 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
