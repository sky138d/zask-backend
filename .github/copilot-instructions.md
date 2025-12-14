# V25 Backend AI Agent Instructions

## Project Overview

**zask-backend**: "컴투스프로야구V25" 모바일 게임 공략 AI 챗봇의 백엔드. Next.js 기반 API 서버로 OpenAI를 통한 게임 가이드 제공 및 사용자 팀 정보 관리.

### Architecture

```
Frontend (v25chat): React + Vite + React Router
         ↓
Backend (v25back): Next.js 14 API routes
         ├─ /api/auth: NextAuth (Google OAuth)
         ├─ /api/chat: OpenAI routing engine + gameData modules
         └─ /api/email: 이메일 발송
         ↓
Database: PostgreSQL (Neon) + Prisma ORM
```

## Core Components & Data Flow

### 1. **Authentication Flow** (`/api/auth/[...nextauth]/route.js`)
- **Provider**: Google OAuth
- **Database**: Prisma + NextAuth Adapter
- **Key Pattern**: Session callback injects `user.id` into session object for frontend
- **Files**: `lib/prisma.js` exports singleton PrismaClient (with dev hot-reload protection)

### 2. **Chat/AI Routing System** (`/api/chat/route.js`)
- **Problem Solved**: Prevents AI hallucination by explicitly labeling user queries as "[컴투스프로야구V25 모바일 게임 관련 질문입니다]"
- **Workflow**:
  1. User message enhanced with game-specific context tag
  2. AI classifies query using `ROUTING_GUIDE` into one of 10 categories
  3. Relevant game knowledge loaded from `/gameData/*` modules
  4. OpenAI responds with injected context

### 3. **Game Data Modules** (`/api/chat/gameData/`)
Modular knowledge base split by game feature:
- `index.js`: Exports `DATA_MAP` (category → knowledge) and `ROUTING_GUIDE` (classification rules)
- `skill.js`, `redistribute.js`, `cardRecommend.js`: Game strategy guides
- `statCalc.js`, `teamLineup.js`: Team building formulas
- `goldenGlove.js`, `starFarm.js`, `event.js`, `workshop.js`: Feature-specific guides

**Convention**: Each module exports `[NAME]_DATA` as simple string containing game rules/formulas.

### 4. **Data Models** (`prisma/schema.prisma`)
- **User**: NextAuth integration (email, Google account)
- **MyTeam**: Team-level aggregates (totalOvr, totalSetDeckScore)
- **Player**: Individual roster entry with position, stats, skills, potentials
- **Account/Session**: NextAuth required tables

**Pattern**: User → MyTeam (1:1) → Player[] (1:N). Cascading deletes on User deletion.

## Development Workflow

### Setup
```powershell
# Backend
cd v25back
npm install
npx prisma generate
npx prisma db push  # Sync schema with Neon PostgreSQL

# Frontend
cd ../v25chat
npm install
```

### Running
```powershell
# Backend (dev server on :3000)
npm run dev

# Frontend (dev server on :5173)
npm run dev
```

### Database
- **Connection**: `.env` contains multiple URL formats (POSTGRES_PRISMA_URL for Prisma, POSTGRES_URL for others)
- **Provider**: Neon (serverless PostgreSQL)
- **Migrations**: Use `npx prisma migrate dev` (not currently committed)

## Critical Patterns & Conventions

### API Response Headers
Always include CORS headers (already set in `/api/chat/route.js` OPTIONS handler):
```javascript
'Access-Control-Allow-Origin': '*'
'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
```

### Message Enhancement Pattern
Before sending to OpenAI, prepend context to prevent hallucination:
```javascript
const enhancedContent = `[컴투스프로야구V25 모바일 게임 관련 질문입니다]\n${originalContent}`;
```

### Prisma Client Singleton
- **Production**: New instance per request
- **Development**: Reuse global instance to prevent connection pool exhaustion (see `lib/prisma.js`)

### Frontend-Backend Integration
1. Frontend sends `/api/chat` POST with `{ messages: [] }` array
2. Backend returns OpenAI streamed response (confirm stream handling in route.js if needed)
3. Frontend stores chat in session state, persists to localStorage for history

## File Organization Best Practices

- **Backend routes**: One file per endpoint, export `GET`/`POST`/`OPTIONS` functions
- **Game logic**: Modular in `/gameData`, no external dependencies (pure data strings)
- **Database**: Centralize Prisma imports via `lib/prisma.js`
- **Configuration**: All env vars documented in `.env.example` (not present—create if needed)

## External Dependencies

- **OpenAI SDK**: `openai@^4.28.0` — streaming responses
- **NextAuth**: OAuth session management via `@next-auth/prisma-adapter`
- **Prisma**: ORM with PostgreSQL driver
- **Nodemailer**: Email sending (imported in `/api/email` but confirm usage)

## When Adding Features

1. **New game feature AI response**: Add module to `/gameData`, export `[NAME]_DATA`, update `DATA_MAP` and `ROUTING_GUIDE` in `index.js`
2. **New user data to track**: Add field to Prisma schema (`prisma/schema.prisma`), run `npx prisma migrate dev`, update API endpoint
3. **New API route**: Create in `app/api/[feature]/route.js`, export `POST`/`GET`/`OPTIONS`
4. **Frontend chat feature**: Modify `v25chat/src/App.jsx`, likely involving message state and backend integration
