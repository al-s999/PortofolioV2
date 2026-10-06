export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'user';
  created_at: string;
}

export interface Education {
  degree: string;
  institution: string;
  year: string;
  description?: string;
}

export interface Experience {
  role: string;
  company: string;
  year: string;
  description: string;
  technologies: string[];
}

export interface AboutMe {
  id: string;
  nickname?: string;
  full_name?: string;
  profession?: string;
  years_of_experience?: string;
  avatar_url?: string;
  cv_url?: string;
  content: string;
  skills: Skill[];
  education?: Education[];
  experience?: Experience[];
  certificates?: Certificate[];
  updated_at: string;
}

export interface Certificate {
  id: string;
  file_url: string;
}

export interface Skill {
  name: string;
  level: number; // 1-5
  category: 'frontend' | 'backend' | 'devops' | 'design' | 'other' | 'data';
  show_on_home?: boolean;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  short_description: string;
  image_url: string | null;
  tech_stack: string[];
  github_url: string | null;
  demo_url: string | null;
  featured: boolean;
  order_index: number;
  content_blocks?: ContentBlock[];
  created_at: string;
  updated_at: string;
}

export interface ContentBlock {
  id: string;
  type: 'image' | 'text';
  content?: string; // Text content
  image_url?: string; // Image URL
  caption?: string; // Image caption
}

export interface Contact {
  id: string;
  type: 'email' | 'phone' | 'linkedin' | 'github' | 'twitter' | 'instagram' | 'website' | 'custom';
  label: string;
  value: string;
  icon: string | null | undefined;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export type ContactType = Contact['type'];

export const CONTACT_TYPES: { value: ContactType; label: string; defaultIcon: string }[] = [
  { value: 'email', label: 'Email', defaultIcon: 'mail' },
  { value: 'phone', label: 'Phone', defaultIcon: 'phone' },
  { value: 'linkedin', label: 'LinkedIn', defaultIcon: 'linkedin' },
  { value: 'github', label: 'GitHub', defaultIcon: 'github' },
  { value: 'twitter', label: 'Twitter/X', defaultIcon: 'twitter' },
  { value: 'instagram', label: 'Instagram', defaultIcon: 'instagram' },
  { value: 'website', label: 'Website', defaultIcon: 'globe' },
  { value: 'custom', label: 'Custom', defaultIcon: 'link' },
];

export interface PortfolioData {
  aboutMe: AboutMe | null;
  projects: Project[];
  contacts: Contact[];
}

export interface AdminStats {
  totalProjects: number;
  totalContacts: number;
  featuredProjects: number;
  lastUpdated: string | null;
}