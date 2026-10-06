-- Portfolio Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- About Me table (single row expected)
CREATE TABLE IF NOT EXISTS about_me (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nickname TEXT,
  full_name TEXT,
  profession TEXT,
  years_of_experience TEXT,
  avatar_url TEXT,
  content TEXT,
  skills JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  image_url TEXT,
  tech_stack TEXT[] DEFAULT '{}',
  github_url TEXT,
  demo_url TEXT,
  featured BOOLEAN DEFAULT FALSE,
  order_index INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('email', 'phone', 'linkedin', 'github', 'twitter', 'instagram', 'website', 'custom')),
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  icon TEXT,
  order_index INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(featured);
CREATE INDEX IF NOT EXISTS idx_projects_order ON projects(order_index);
CREATE INDEX IF NOT EXISTS idx_contacts_active ON contacts(is_active);
CREATE INDEX IF NOT EXISTS idx_contacts_order ON contacts(order_index);
CREATE INDEX IF NOT EXISTS idx_about_me_updated ON about_me(updated_at DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_me ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Public read access for portfolio data
CREATE POLICY "Public read access for about_me" ON about_me
  FOR SELECT USING (true);

CREATE POLICY "Public read access for projects" ON projects
  FOR SELECT USING (true);

CREATE POLICY "Public read access for contacts" ON contacts
  FOR SELECT USING (is_active = true);

-- Admin write access (requires authenticated user with admin role)
CREATE POLICY "Admin write access for profiles" ON profiles
  FOR ALL USING (
    auth.uid() = id AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin write access for about_me" ON about_me
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin write access for projects" ON projects
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin write access for contacts" ON contacts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Storage bucket for portfolio images
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-images', 'portfolio-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for portfolio-images bucket
CREATE POLICY "Public read access for portfolio images" ON storage.objects
  FOR SELECT USING (bucket_id = 'portfolio-images');

CREATE POLICY "Admin upload access for portfolio images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'portfolio-images' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin update access for portfolio images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'portfolio-images' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin delete access for portfolio images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'portfolio-images' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_about_me_updated_at BEFORE UPDATE ON about_me
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (run after creating auth user)
-- INSERT INTO profiles (id, full_name, role) VALUES ('your-user-id', 'Admin', 'admin');

-- Insert sample about_me data
INSERT INTO about_me (content, skills) VALUES (
  'I am a passionate Full Stack Developer with 3+ years of experience building web and mobile applications. I specialize in React, TypeScript, Node.js, and cloud technologies. I love creating beautiful, accessible, and performant digital experiences.',
  '[
    {"name": "React", "level": 5, "category": "frontend"},
    {"name": "TypeScript", "level": 5, "category": "frontend"},
    {"name": "Next.js", "level": 4, "category": "frontend"},
    {"name": "Node.js", "level": 4, "category": "backend"},
    {"name": "PostgreSQL", "level": 4, "category": "backend"},
    {"name": "Tailwind CSS", "level": 5, "category": "frontend"},
    {"name": "Docker", "level": 3, "category": "devops"},
    {"name": "AWS", "level": 3, "category": "devops"}
  ]'::jsonb
) ON CONFLICT DO NOTHING;

-- Insert sample contacts
INSERT INTO contacts (type, label, value, icon, order_index, is_active) VALUES
  ('email', 'Email', 'hello@example.com', 'mail', 1, true),
  ('github', 'GitHub', 'yourusername', 'github', 2, true),
  ('linkedin', 'LinkedIn', 'yourusername', 'linkedin', 3, true),
  ('twitter', 'Twitter', '@yourhandle', 'twitter', 4, true)
ON CONFLICT DO NOTHING;