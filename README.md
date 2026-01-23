# ExamAI Pro - AI-Powered Exam Evaluation System

An intelligent exam evaluation platform that uses AI to grade student answer sheets against model answers and rubrics.

## Requirements

### System Requirements
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (comes with Node.js)
- **Git**: For version control

### Browser Support
- Chrome (recommended)
- Firefox
- Safari
- Edge

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **State Management**: TanStack React Query
- **Routing**: React Router v6
- **Backend**: Lovable Cloud (Supabase)
- **AI**: Gemini AI for OCR and evaluation

## Local Development Setup

### Step 1: Clone the Repository
```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Environment Variables
Create a `.env` file in the root directory (if not already present):
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

> **Note**: If you cloned from Lovable, these are pre-configured.

### Step 4: Start Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:8080`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Project Structure

```
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── ui/         # shadcn/ui components
│   │   └── layout/     # Layout components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities and API functions
│   ├── pages/          # Page components
│   │   ├── admin/      # Admin dashboard pages
│   │   ├── faculty/    # Faculty pages
│   │   └── student/    # Student pages
│   └── integrations/   # Supabase client and types
├── supabase/
│   ├── functions/      # Edge functions (OCR, evaluation)
│   └── migrations/     # Database migrations
└── public/             # Static assets
```

## Features

- **Role-based Authentication**: Admin, Faculty, and Student roles
- **AI-Powered OCR**: Extract text from handwritten answer sheets
- **Automated Grading**: AI evaluates answers against rubrics
- **Detailed Feedback**: Per-question breakdown with strengths/weaknesses
- **Faculty Dashboard**: Upload exams, view evaluations, manage results
- **Admin Dashboard**: User management, evaluation history

## Troubleshooting

### Common Issues

1. **Port 8080 in use**: 
   ```bash
   # Kill process on port 8080
   npx kill-port 8080
   ```

2. **Node version mismatch**:
   ```bash
   # Using nvm
   nvm use 18
   ```

3. **Dependencies not installing**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

## Deployment

Deploy via Lovable: Open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) → Share → Publish

## Custom Domain

Navigate to Project > Settings > Domains and click Connect Domain.

Read more: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
