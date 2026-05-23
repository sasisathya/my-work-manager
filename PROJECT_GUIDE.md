# My Work Manager - Complete Project Guide

## Overview
Full-stack productivity dashboard integrating Jira, GitHub, Confluence with AI-powered features.

**Stack:** Next.js 14 + TypeScript + Tailwind + Docker
**Port:** 2999
**Storage:** Local filesystem (AES-256 encrypted)
**AI:** OpenAI GPT-4 / Claude 3.5 Sonnet

---

## Quick Start
```bash
docker-compose up              # Docker (recommended)
npm install && npm run dev     # Local development
./start.sh                     # Auto-detect method
```

Access: http://localhost:2999

---

## Directory Structure
```
src/
├── app/
│   ├── dashboard/           # UI Pages
│   │   ├── page.tsx           # Main dashboard (Jira issues)
│   │   ├── tasks/             # Task management
│   │   ├── comments/          # AI comment enhancement
│   │   ├── pr-review/         # GitHub PR analysis
│   │   ├── md-editor/         # Markdown editor + AI
│   │   ├── analytics/         # Metrics & stats
│   │   └── settings/          # Configuration UI
│   └── api/                 # API Routes
│       ├── config/            # GET/POST config
│       ├── jira/              # Issues, update, test
│       ├── github/            # PR review, comments, test
│       ├── confluence/        # Fetch/update pages, test
│       ├── ai/                # Enhance, format, test
│       └── md-editor/         # Read, save, AI edit
├── components/
│   ├── IssueCard.tsx          # Jira issue display
│   ├── Layout/                # Sidebar, TopBar
│   └── ui/                    # shadcn components
├── lib/
│   ├── config.ts              # Config management
│   ├── jira.ts                # Jira API client
│   ├── ai.ts                  # AI service (OpenAI/Claude)
│   ├── encryption.ts          # AES-256 utilities
│   └── storage.ts             # Encrypted file storage
└── types/
    └── jira.ts                # TypeScript interfaces

data/                          # Local storage (gitignored)
├── secrets/                   # Encrypted credentials
├── attachments/               # Temp files
└── cache/                     # Cached data

config.json                    # Runtime config (auto-generated)
```

---

## Core Features

### Jira Integration
- Display assigned issues with status, priority, assignee
- Add comments, upload files
- Transition issue status
- Real-time stats (total, to-do, in-progress)

### AI Features
- Text enhancement (grammar, clarity)
- Text formatting (structured bullets)
- PR code review analysis
- Markdown editing assistance

### GitHub Integration
- PR review with AI analysis
- Code flaw detection
- Security & performance checks
- Add comments to PRs

### Confluence Integration
- Fetch and display pages
- Update page content
- Markdown conversion

### Markdown Editor
- Full editor with live preview
- AI-powered editing
- File save/load
- Syntax highlighting

---

## Configuration (config.json)
```json
{
  "app": { "name": "My Work Manager", "port": 2999 },
  "jira": {
    "baseUrl": "https://domain.atlassian.net",
    "email": "user@company.com",
    "apiToken": "encrypted",
    "defaultProject": "PS"
  },
  "github": { "token": "ghp_xxxxx" },
  "ai": {
    "provider": "claude",
    "apiKey": "sk-ant-xxxxx",
    "model": "claude-3-5-sonnet-20241022",
    "enabled": true
  },
  "confluence": {
    "baseUrl": "https://confluence.atlassian.net",
    "email": "user@company.com",
    "token": "encrypted"
  },
  "storage": {
    "encryptionKey": "auto-generated",
    "dataPath": "./data"
  },
  "features": {
    "aiTextEnhancement": true,
    "imageUpload": true,
    "autoTransitionToInProgress": true,
    "maxAttachmentSizeMB": 10
  }
}
```

---

## API Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/config/check` | GET | Check configuration status |
| `/api/config/get` | GET | Get current config |
| `/api/config/save` | POST | Save/update config |
| `/api/jira/issues` | GET | Fetch assigned issues |
| `/api/jira/update` | POST | Update issue (comments/files) |
| `/api/jira/test` | POST | Test connection |
| `/api/github/add-comment` | POST | Add PR comment |
| `/api/github/review-pr` | POST | AI PR analysis |
| `/api/github/test` | POST | Test connection |
| `/api/confluence/fetch-page` | POST | Get page content |
| `/api/confluence/update-page` | POST | Update page |
| `/api/confluence/test` | POST | Test connection |
| `/api/ai/enhance` | POST | Enhance text with AI |
| `/api/ai/format` | POST | Format text with AI |
| `/api/ai/test` | POST | Test AI provider |
| `/api/md-editor/read` | POST | Read markdown file |
| `/api/md-editor/save` | POST | Save markdown file |
| `/api/md-editor/ai-edit` | POST | AI markdown editing |

---

## Key Dependencies
```json
{
  "next": "14.2.0",
  "react": "18.3.0",
  "typescript": "5.4.0",
  "tailwindcss": "3.4.0",
  "axios": "1.6.8",
  "crypto-js": "4.2.0",
  "zustand": "4.5.2"
}
```

---

## Scripts (package.json)
```bash
npm run dev          # Dev server (port 2999)
npm run build        # Production build
npm start            # Start production
npm run lint         # ESLint
docker:build         # Build Docker image
docker:run           # Run container
```

---

## Docker Setup

### Dockerfile
- Base: node:20-slim (multi-stage)
- User: nextjs:1001 (non-root)
- Port: 2999
- Health checks: enabled

### docker-compose.yml
```yaml
services:
  work-manager:
    build: .
    ports: ["2999:2999"]
    volumes:
      - ./config.json:/app/config.json
      - ./data:/app/data
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

---

## Security

**Encryption:**
- AES-256 for all credentials
- Auto-generated keys on first run

**Storage:**
- Local filesystem only
- Secrets in `./data/secrets/`
- No external database

**Authentication:**
- Jira: Bearer token (API token)
- GitHub: Personal access token
- Confluence: API token
- AI: Provider API keys

**Docker:**
- Non-root execution (1001:1001)
- Minimal base image
- Health monitoring

---

## Data Flow
```
User Browser
    ↓
Next.js Frontend (React/TypeScript)
    ↓
API Routes (/api/*)
    ├─→ Jira API (REST v2/v3)
    ├─→ GitHub API (REST)
    ├─→ Confluence API (REST)
    ├─→ AI Service (OpenAI/Claude)
    └─→ Config Manager
    ↓
Local Filesystem
    ├─→ config.json
    ├─→ data/secrets/ (encrypted)
    ├─→ data/attachments/
    └─→ data/cache/
```

---

## Development

### TypeScript Config
- Target: ES2020
- Strict mode: enabled
- Path aliases: `@/*` → `./src/*`

### Tailwind Config
- Custom colors, animations
- PostCSS integration

### Next.js Config
- React strict mode: enabled
- Custom port: 2999
- Environment variables support

---

## Common Tasks

### Setup First Time
1. `npm install` or `docker-compose up`
2. Visit http://localhost:2999/dashboard/settings
3. Configure Jira, GitHub, Confluence, AI credentials
4. Test connections
5. Save config

### Add Jira Comment
1. Dashboard → Issue card
2. Click "Add Comment"
3. Write/enhance with AI
4. Submit

### Review GitHub PR
1. PR Review page
2. Enter PR URL
3. AI analyzes code
4. Review suggestions
5. Add comments to GitHub

### Edit Markdown
1. MD Editor page
2. Load file
3. Edit with AI assistance
4. Save changes

---

## File Locations

**Config:** `./config.json` (root)
**Secrets:** `./data/secrets/` (encrypted)
**Attachments:** `./data/attachments/`
**Logs:** Console output only
**Source:** `./src/`
**Build:** `./.next/` (generated)

---

## Troubleshooting

**Port already in use:**
```bash
lsof -ti:2999 | xargs kill -9
```

**Reset config:**
```bash
rm config.json data/secrets/*
# Restart app, reconfigure
```

**Docker rebuild:**
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up
```

**Clear cache:**
```bash
rm -rf .next node_modules
npm install
npm run dev
```

---

## Environment Variables
```bash
NODE_ENV=production
PORT=2999
NEXT_TELEMETRY_DISABLED=1
```

---

## Production Deployment

### Using Docker
```bash
docker-compose up -d
```

### Using npm
```bash
npm run build
npm start
```

### Health Check
```bash
curl http://localhost:2999/api/health
```

---

## Project Metrics
- **Lines of Code:** ~15,000+
- **Source Size:** 416 KB
- **Total Size:** 495 MB (with node_modules)
- **Files:** 60+ TypeScript/TSX
- **API Routes:** 30+
- **UI Pages:** 8+

---

## Architecture Pattern
- **Frontend:** React components with TypeScript
- **Backend:** Next.js API routes
- **State:** Zustand (lightweight)
- **Styling:** Tailwind CSS + shadcn/ui
- **Data:** File-based storage
- **Security:** Encryption layer
- **Deployment:** Containerized

---

## Use Cases
1. **Developers:** Manage Jira issues, review PRs
2. **Project Managers:** Track team progress
3. **Technical Writers:** Edit documentation with AI
4. **Code Reviewers:** AI-assisted PR analysis
5. **Team Leads:** Analytics dashboard

---

## Extension Points

### Add New Integration
1. Create `/api/[service]/` routes
2. Add client in `/lib/[service].ts`
3. Create UI page in `/app/dashboard/[feature]/`
4. Update config schema in `/lib/config.ts`

### Add AI Feature
1. Create route in `/api/ai/[feature]/`
2. Update AI service in `/lib/ai.ts`
3. Add UI component
4. Toggle in settings

### Add UI Component
1. Create in `/components/`
2. Style with Tailwind
3. Use shadcn/ui primitives
4. Export and import

---

## License & Credits
- Framework: Next.js (Vercel)
- UI: shadcn/ui (MIT)
- Icons: Lucide React
- AI: OpenAI, Anthropic

---

**Last Updated:** 2026-05-20
**Version:** 1.0.0
**Status:** Production Ready
