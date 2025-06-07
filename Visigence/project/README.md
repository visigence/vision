# Visigence

[![Netlify Status](https://api.netlify.com/api/v1/badges/6391cd0d-10c1-453e-aaa8-77f7ba745ae4/deploy-status)](https://app.netlify.com/projects/endearing-tanuki-377edf/deploys)

Modern portfolio website showcasing 3D models, web design, and AI solutions with a comprehensive backend system.

## Features

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Framer Motion animations
- Responsive design
- Interactive 3D elements with Three.js
- Modern UI/UX with custom cursor
- Performance optimized

### Backend
- Supabase with PostgreSQL database
- Row Level Security (RLS) policies
- Real-time subscriptions
- Comprehensive audit logging
- Secure authentication system
- File upload management
- Contact form with validation

### Security
- Input sanitization and validation
- CSRF protection
- Rate limiting
- Secure headers
- Password strength validation
- Session management
- Audit trail for all operations

## Live Demo

Visit the live site: [Visigence](https://endearing-tanuki-377edf.netlify.app)

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd visigence-portfolio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Copy your project URL and anon key
   - Run the database migrations in order:
     ```sql
     -- Run these in your Supabase SQL editor
     -- 1. supabase/migrations/create_initial_schema.sql
     -- 2. supabase/migrations/create_rls_policies.sql
     -- 3. supabase/migrations/create_functions.sql
     -- 4. supabase/migrations/insert_sample_data.sql
     ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Build for production**
   ```bash
   npm run build
   ```

## Database Schema

### Core Tables
- **users** - User accounts with enhanced security
- **user_profiles** - Extended user profile information
- **messages** - Content/blog posts with moderation
- **categories** - Content categorization
- **tags** - Content tagging system
- **contact_submissions** - Contact form submissions
- **file_uploads** - File management system
- **audit_logs** - Comprehensive audit trail
- **refresh_tokens** - Secure token management
- **user_sessions** - Session tracking

### Security Features
- Row Level Security (RLS) on all tables
- Comprehensive audit logging
- Rate limiting functions
- Password validation
- Session management
- Token cleanup utilities

## API Usage

### Authentication
```typescript
import { useAuth } from './hooks/useAuth';

const { user, signIn, signUp, signOut } = useAuth();

// Sign up
await signUp('email@example.com', 'password', { 
  first_name: 'John', 
  last_name: 'Doe' 
});

// Sign in
await signIn('email@example.com', 'password');
```

### Database Operations
```typescript
import { db } from './lib/supabase';

// Get messages with pagination
const { data, error } = await db.getMessages(1, 10, { 
  status: 'published' 
});

// Create contact submission
await db.createContactSubmission({
  name: 'John Doe',
  email: 'john@example.com',
  message: 'Hello!'
});
```

### Real-time Subscriptions
```typescript
import { realtime } from './lib/supabase';

// Subscribe to new messages
const subscription = realtime.subscribeToMessages((payload) => {
  console.log('New message:', payload);
});

// Cleanup
subscription.unsubscribe();
```

## Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type safety and better DX
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Three.js** - 3D graphics
- **Lucide React** - Icon library

### Backend
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Relational database
- **Row Level Security** - Database-level security
- **Edge Functions** - Serverless functions
- **Real-time** - WebSocket connections

### Development
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking
- **Vite** - Build tool

## Services

### 1. Web Design & Development
- Custom website/UI design
- Landing pages
- Brand identity websites (portfolios, agencies, creators)
- UX/UI audits and redesigns

### 2. 3D Model Assets
- Custom avatars for VTuber/streamer asset packs
- Game-ready props, weapons, vehicles, game characters
- Asset packs for Unity/Unreal
- Model optimization & retopology

### 3. Branding & Graphic Design
- Logo & visual identity
- Brand guidelines & style guides
- Social media kits (banners, thumbnails, templates)

### 4. Digital Illustration & Concept Art
- Game/film concept art (characters, creatures, furniture)
- Book/album covers, posters, storyboards
- UI illustrations and mascots

### 5. Prompt Engineering Design
- Custom structure prompts for your needs
- Combining creativity, technical know-how, and strategy
- Unique solutions for brand and product

## Performance Optimizations

- **Code Splitting** - Lazy loading of components
- **Image Optimization** - Responsive images with multiple formats
- **Caching** - Browser and CDN caching strategies
- **Bundle Analysis** - Optimized bundle sizes
- **Performance Monitoring** - Real-time performance tracking

## Security Features

- **Input Validation** - Server and client-side validation
- **SQL Injection Prevention** - Parameterized queries
- **XSS Protection** - Content sanitization
- **CSRF Protection** - Token-based protection
- **Rate Limiting** - API endpoint protection
- **Audit Logging** - Comprehensive activity tracking
- **Session Management** - Secure session handling

## Deployment

### Netlify (Frontend)
1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard

### Supabase (Backend)
1. Database migrations are applied automatically
2. Edge functions can be deployed via Supabase CLI
3. Configure RLS policies for production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Contact

For inquiries about our services, please visit our website and use the contact form.

---

**Built with ❤️ by Omry Damari**