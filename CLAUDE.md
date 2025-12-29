# CLAUDE.md - AI Assistant Guide for Dev_AI-News

This document provides essential context for AI assistants working with this codebase.

## Project Overview

**AI News Dashboard** - A full-stack web application that aggregates AI technology news, generates Korean summaries using DeepSeek AI, and formats content for social media platforms (Twitter, Threads, Instagram, LinkedIn).

- **Version**: 0.4.0
- **Main Directory**: `my-app/`
- **Language**: TypeScript (strict mode)

## Quick Reference

```bash
# Development
cd my-app && npm run dev       # Start dev server (localhost:3000)
npm run build                   # Production build
npm run lint                    # ESLint checking

# Testing
npm run test:e2e               # Run all E2E tests
npm run test:e2e:ui            # Interactive test UI
npm run test:e2e:chrome        # Chrome only
```

## Technology Stack

| Category | Technologies |
|----------|-------------|
| Framework | Next.js 16.1.1 (App Router), React 19.2.3 |
| Language | TypeScript 5.x (strict mode) |
| Styling | Tailwind CSS 4.x |
| State | Zustand 5.0.9 (client), TanStack Query 5.x (server) |
| Forms | react-hook-form 7.x + Zod 4.x |
| Backend | Firebase 12.7.0 (Auth + Firestore), DeepSeek API |
| Testing | Playwright 1.48.0 |

## Project Structure

```
my-app/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── openai/route.ts       # DeepSeek AI (5 modes)
│   │   ├── rss/route.ts          # RSS feed parsing
│   │   ├── scrape/route.ts       # Web scraping
│   │   └── scrape-source/route.ts
│   ├── login/page.tsx            # Auth pages
│   ├── signup/page.tsx
│   ├── settings/page.tsx
│   ├── sources/page.tsx          # Protected route
│   ├── page.tsx                  # Main dashboard (protected)
│   └── layout.tsx
│
├── components/                   # React components by domain
│   ├── auth/                     # AuthProvider, LoginForm, ProtectedRoute
│   ├── layout/                   # Header, Sidebar, MainLayout
│   ├── news/                     # NewsList, NewsCard, NewsDetail
│   ├── collect/                  # RssFetcher, UrlScraper
│   ├── social/                   # PlatformPreview, CopyButton, FeedbackButtons
│   ├── sources/                  # SourceForm, SourceList
│   ├── settings/                 # StyleEditor
│   ├── migration/                # MigrationDialog
│   └── ui/                       # Button, Card, Input, Modal, Badge, Spinner
│
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts                # Firebase auth state
│   ├── useNews.ts                # News CRUD with Firestore
│   ├── useSources.ts             # Sources management
│   ├── useOpenAI.ts              # AI content generation
│   ├── useStyleTemplates.ts      # Style template management
│   ├── useFirestoreSync.ts       # Real-time Firestore listeners
│   ├── useMigration.ts           # localStorage → Firestore migration
│   └── queries.ts                # TanStack Query mutations
│
├── lib/                          # Utilities and services
│   ├── api.ts                    # Typed API client
│   ├── constants.ts              # Default sources, platform configs
│   ├── validations.ts            # Zod schemas
│   ├── date.ts                   # date-fns utilities
│   ├── providers.tsx             # Root providers setup
│   └── firebase/                 # Firebase integration
│       ├── config.ts             # Firebase initialization
│       ├── auth.ts               # Auth functions
│       ├── firestore.ts          # Firestore CRUD + listeners
│       ├── converters.ts         # Data converters
│       └── index.ts
│
├── store/                        # Zustand stores
│   └── index.ts                  # News, Sources, Templates, UI stores
│
├── types/
│   └── news.ts                   # Core domain types
│
├── e2e/                          # Playwright E2E tests
│   ├── home.spec.ts
│   ├── api.spec.ts
│   ├── news-detail.spec.ts
│   ├── user-workflows.spec.ts
│   └── fixtures.ts
│
└── Configuration:
    ├── package.json
    ├── tsconfig.json
    ├── next.config.ts
    ├── playwright.config.ts
    ├── firestore.rules
    └── firestore.indexes.json
```

## Core Domain Types

```typescript
// types/news.ts - Key interfaces

interface Source {
  id: string;
  name: string;
  rssUrl?: string;
  websiteUrl: string;
  isActive: boolean;
  scrapeConfig?: ScrapeConfig;
}

interface NewsItem {
  id: string;
  sourceId: string;
  title: string;
  originalContent: string;
  url: string;
  publishedAt?: string;
  createdAt: string;
  quickSummary?: QuickSummary;
  isBookmarked?: boolean;
  translatedContent?: string;
}

interface QuickSummary {
  bullets: string[];           // 3 key points
  category: NewsCategory;      // product | update | research | announcement | other
}

interface StyleTemplate {
  id: string;
  platform: Platform;          // twitter | threads | instagram | linkedin
  name: string;
  examples: string[];
  tone?: string;
  characteristics?: string[];
  isDefault: boolean;
}

type Platform = 'twitter' | 'threads' | 'instagram' | 'linkedin';
```

## API Routes

### POST /api/openai
DeepSeek AI integration with 5 modes:
- `summarize` - Generate 3-bullet summary + category
- `generate` - Create platform-specific content
- `analyze-style` - Extract writing style from examples
- `regenerate` - Improve content based on feedback
- `translate` - Translate article to Korean

### POST /api/rss
Parse RSS feeds and return news items (up to 20).

### POST /api/scrape
Scrape single URL content with bot detection bypass.

### POST /api/scrape-source
Extract article list from non-RSS sources.

## State Management Pattern

```
┌─────────────────────────────────────────────────────────┐
│                    Zustand Stores                        │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────────┐   │
│  │ useNewsStore│ │useSourcesStore│ │useStyleTemplatesStore│ │
│  └──────┬──────┘ └──────┬──────┘ └────────┬─────────┘   │
│         │               │                  │             │
└─────────┼───────────────┼──────────────────┼─────────────┘
          │               │                  │
          ▼               ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│              Cloud Firestore (Real-time)                 │
│    users/{userId}/newsItems                              │
│    users/{userId}/sources                                │
│    users/{userId}/styleTemplates                         │
└─────────────────────────────────────────────────────────┘
```

- **Optimistic Updates**: UI updates immediately, rolls back on error
- **Real-time Sync**: Firestore `onSnapshot` listeners auto-update stores
- **User Isolation**: All data scoped to `users/{userId}/` collections

## Development Conventions

### Code Style
- **Path Alias**: Use `@/` for imports (maps to project root)
- **Components**: PascalCase, domain-organized folders
- **Hooks**: `use` prefix, camelCase
- **Types**: PascalCase interfaces in `types/`
- **Constants**: UPPER_SNAKE_CASE in `lib/constants.ts`

### Component Patterns
```typescript
// Barrel exports in each component folder
// components/news/index.ts
export { NewsList } from './NewsList';
export { NewsCard } from './NewsCard';
export { NewsDetail } from './NewsDetail';

// Usage
import { NewsCard, NewsList } from '@/components/news';
```

### Form Handling
```typescript
// Always use react-hook-form + Zod
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers';
import { sourceFormSchema } from '@/lib/validations';

const form = useForm({
  resolver: zodResolver(sourceFormSchema),
  defaultValues: { ... }
});
```

### API Calls
```typescript
// Use the typed API client from lib/api.ts
import { api } from '@/lib/api';

const result = await api.summarize({ title, content });
const rss = await api.fetchRss(url);
```

### Error Handling
- Use `sonner` for toast notifications
- Custom `ApiError` class with status codes
- Try-catch with user-friendly messages

## Environment Variables

Required in `my-app/.env.local`:
```env
# DeepSeek API (required)
DEEPSEEK_API_KEY=your_key

# Firebase (required)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Optional
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false
```

## Firebase Security Rules

Data is user-isolated with these rules (`firestore.rules`):
- Users can only read/write their own data
- Required field validation on create
- Platform enum validation for style templates

## Testing

### E2E Tests (Playwright)
```bash
npm run test:e2e           # All browsers
npm run test:e2e:ui        # Interactive mode
npm run test:e2e:chrome    # Chrome only
```

Tests cover:
- Dashboard functionality
- API endpoints
- News detail modal
- Full user workflows

### Test Configuration
- Auto-starts dev server
- Multi-browser: Chromium, Firefox, WebKit
- Mobile: Pixel 5, iPhone 12
- Retries enabled on CI

## Common Tasks for AI Assistants

### Adding a New Component
1. Create in appropriate `components/` subdirectory
2. Add barrel export to folder's `index.ts`
3. Use existing UI components from `components/ui/`
4. Follow TypeScript strict mode

### Adding a New API Route
1. Create in `app/api/{name}/route.ts`
2. Add typed function to `lib/api.ts`
3. Create TanStack Query mutation in `hooks/queries.ts`

### Adding a New Zustand Store Slice
1. Add to `store/index.ts`
2. Include Firestore integration if persistent
3. Set up real-time listener in `useFirestoreSync.ts`

### Modifying Firestore Schema
1. Update types in `types/news.ts`
2. Update converters in `lib/firebase/converters.ts`
3. Update security rules in `firestore.rules`

## Key Files to Understand

| File | Purpose |
|------|---------|
| `store/index.ts` | All Zustand stores with Firestore integration |
| `lib/api.ts` | Typed API client for all endpoints |
| `lib/firebase/firestore.ts` | Firestore CRUD operations |
| `hooks/useFirestoreSync.ts` | Real-time data synchronization |
| `components/auth/AuthProvider.tsx` | Firebase auth context |
| `app/api/openai/route.ts` | DeepSeek AI integration |
| `types/news.ts` | Core domain type definitions |

## Gotchas and Tips

1. **Firestore Timestamps**: Use converters to handle Timestamp ↔ ISO string conversion
2. **Protected Routes**: Dashboard and Sources pages require authentication
3. **Dark Mode**: Uses localStorage + system preference with FOUC prevention
4. **Web Scraping**: Has 8-second timeout, uses User-Agent rotation
5. **Batch Processing**: AI summaries processed in batches of 3 with delays
6. **Offline Support**: Firestore IndexedDB persistence enabled

## Build & Deploy

```bash
# Development
npm run dev

# Production build
npm run build
npm start

# Lint check
npm run lint
```

Deploy-ready for Vercel with Next.js App Router.
