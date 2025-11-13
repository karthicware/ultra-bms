# Ultra BMS Frontend

Next.js 15 frontend for Ultra Building Maintenance System.

## Prerequisites

- Node.js 18+ or 20+
- npm or pnpm

## Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Code Quality

```bash
# Lint
npm run lint
npm run lint:fix

# Format
npm run format
npm run format:check
```

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## Project Structure

```
src/
├── app/                 # App router pages
│   ├── (auth)/         # Auth route group
│   └── (dashboard)/    # Dashboard route group
├── components/
│   ├── ui/             # shadcn components
│   ├── forms/          # Form components
│   └── layout/         # Layout components
├── lib/
│   ├── api.ts          # API client
│   ├── utils.ts        # Utilities
│   └── constants.ts    # Constants
├── hooks/              # Custom React hooks
└── types/              # TypeScript types
```

## Tech Stack

- Next.js 15 with App Router
- React 19
- TypeScript 5
- Tailwind CSS 4.0
- shadcn/ui
- React Hook Form
- Zod validation
- Recharts
- Axios
