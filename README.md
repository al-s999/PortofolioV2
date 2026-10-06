# Portfolio - Dynamic Portfolio with Expo & Supabase

A modern, full-stack portfolio application built with Expo (React Native + Web), TypeScript, NativeWind (Tailwind CSS), and Supabase. Features a public portfolio website and a protected admin panel for dynamic content management.

## ✨ Features

### Public Portfolio
- **Home** - Hero section, projects, skills showcase
- **About** - Bio, skills by category, experience timeline, education
- **Projects** - Filterable project grid with search and tech stack filtering
- **Contact** - Contact form, social links, copy-to-clipboard
- **Responsive** - Works on mobile, tablet, and desktop

### Admin Panel (Protected)
- **Dashboard** - Stats overview, quick actions, recent projects
- **About Me Editor** - Rich bio editing, skills management with drag-and-drop
- **Projects CRUD** - Full project management with image upload
- **Contacts CRUD** - Manage contact methods with active/inactive toggle
- **Authentication** - Email/password login with Supabase Auth

### Technical Stack
- **Framework**: Expo SDK 51+ with TypeScript
- **Routing**: Expo Router (file-based, works on web + mobile)
- **Styling**: NativeWind v4 (Tailwind CSS for React Native)
- **UI Components**: Custom components with Radix-inspired patterns
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **State Management**: TanStack Query (server state), React Context (auth)
- **Forms**: React Hook Form + Zod validation
- **Animations**: Reanimated 3, Moti

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Supabase account: [supabase.com](https://supabase.com)

### Installation

```bash
# Clone and install dependencies
cd portfolio
npm install

# Copy environment template
cp .env.example .env

# Add your Supabase credentials to .env
# EXPO_PUBLIC_SUPABASE_URL=your-url
# EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase Setup

1. Create a new Supabase project
2. Go to SQL Editor and run the schema from `supabase/schema.sql`
3. Enable Email/Password auth in Authentication settings
4. Create an admin user and update their role in the `profiles` table:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE id = 'your-user-id';
   ```
5. Copy your project URL and anon key to `.env`

### Development

```bash
# Start development server
npm run dev

# Run on specific platform
npm run android  # Android emulator
npm run ios      # iOS simulator (macOS only)
npm run web      # Web browser
```

## 📁 Project Structure

```
portfolio/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Public portfolio tabs
│   │   ├── index.tsx      # Home
│   │   ├── about.tsx      # About Me
│   │   ├── projects.tsx   # Projects list
│   │   └── contact.tsx    # Contact
│   ├── (auth)/            # Authentication pages
│   │   └── login.tsx      # Admin login
│   ├── admin/             # Admin panel (protected)
│   │   ├── _layout.tsx    # Admin layout with sidebar
│   │   ├── dashboard.tsx  # Admin dashboard
│   │   ├── about.tsx      # About Me editor
│   │   ├── projects/      # Projects CRUD
│   │   └── contacts.tsx   # Contacts CRUD
│   ├── projects/[id].tsx  # Public project detail
│   ├── _layout.tsx        # Root layout
│   └── +not-found.tsx     # 404 page
├── components/
│   ├── ui/                # Base UI components
│   ├── portfolio/         # Portfolio-specific components
│   └── admin/             # Admin-specific components
├── lib/
│   ├── supabase/          # Supabase client
│   ├── auth/              # Auth context & hooks
│   ├── utils/             # Utility functions (cn, formatters)
│   └── queries/           # TanStack Query hooks
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
├── constants/             # App constants
├── assets/                # Fonts, images
├── supabase/
│   └── schema.sql         # Database schema
├── global.css             # Global styles + Tailwind imports
├── tailwind.config.js     # Tailwind/NativeWind config
├── nativewind.d.ts        # TypeScript declarations
├── babel.config.js        # Babel config with NativeWind & Reanimated
├── tsconfig.json          # TypeScript config
└── app.json               # Expo config
```

## 🎨 Customization

### Theming
Edit `tailwind.config.js` to customize:
- Color palette (primary, dark mode colors)
- Font families
- Animations
- Spacing, breakpoints

### UI Components
Base components in `components/ui/` can be extended:
- `Button`, `Input`, `Textarea`, `Card`
- `Badge`, `Avatar`, `Modal`, `Select`
- `Toast`, `Label`, `Separator`

### Portfolio Content
All content is managed via Supabase:
- **About Me**: Bio text + skills array
- **Projects**: Title, description, images, tech stack, links
- **Contacts**: Type, label, value, icon, display order

## 📦 Deployment

### Web (Vercel/Netlify)
```bash
# Build for web
npm run build:web

# Deploy the `dist/` folder to Vercel/Netlify
```

### Mobile (EAS Build)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login and configure
eas login
eas build:configure

# Build for stores
npm run build:android  # APK/AAB for Play Store
npm run build:ios      # IPA for App Store
```

### Environment Variables for Production
Set these in your hosting platform:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Expo dev server |
| `npm run android` | Run on Android |
| `npm run ios` | Run on iOS |
| `npm run web` | Run on web |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript check |
| `npm run build:web` | Export static web build |
| `npm run build:android` | Build Android with EAS |
| `npm run build:ios` | Build iOS with EAS |

## 🔐 Authentication Flow

1. Admin visits `/admin/login`
2. Enters email/password (Supabase Auth)
3. On success, checks `profiles` table for `role = 'admin'`
4. Redirects to `/admin/dashboard`
5. Protected routes check auth state on each navigation

## 📊 Database Schema

Key tables:
- `profiles` - Extends `auth.users` with role
- `about_me` - Single row with bio + skills JSON
- `projects` - Portfolio projects with ordering
- `contacts` - Contact methods with active toggle

See `supabase/schema.sql` for full schema with RLS policies.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run lint && npm run typecheck`
5. Submit a PR

## 📄 License

MIT License - feel free to use for your own portfolio!

## 🙏 Acknowledgments

- [Expo](https://expo.dev/) - Amazing React Native framework
- [NativeWind](https://www.nativewind.dev/) - Tailwind for React Native
- [Supabase](https://supabase.com/) - Backend as a Service
- [Radix UI](https://www.radix-ui.com/) - Headless UI primitives
- [Lucide](https://lucide.dev/) - Beautiful icons