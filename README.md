# LexSimple Backend

Express + SQLite + Claude AI backend for the LexSimple legal document analyser.

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
```
Then edit `.env`:
```
PORT=3000
JWT_SECRET=pick_any_long_random_string
ANTHROPIC_API_KEY=sk-ant-...your key from console.anthropic.com...
```

### 3. Start the server
```bash
npm start
# or for auto-reload during development:
npm run dev
```

Server runs at **http://localhost:3000**

---

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/auth/signup` | No | Create account |
| POST | `/auth/login` | No | Login, returns JWT |
| GET | `/auth/me` | Yes | Get current user |
| POST | `/analyze` | Yes | Upload & analyse document |
| GET | `/documents` | Yes | List user's documents |
| GET | `/documents/:id` | Yes | Single document |
| DELETE | `/documents/:id` | Yes | Delete document |
| POST | `/contact` | No | Contact form |
| GET | `/health` | No | Health check |

### Auth header
```
Authorization: Bearer <token>
```

### POST /auth/signup
```json
{ "name": "Ananya Kapoor", "email": "a@example.com", "password": "secret123" }
```

### POST /analyze
`multipart/form-data` with:
- `document` — PDF or TXT file (max 10 MB)
- `options` — JSON array of selected analysis options (optional)

Returns:
```json
{
  "summary": "Plain English overview...",
  "docType": "Employment Agreement",
  "parties": ["Acme Corp", "Jane Doe"],
  "risks": [{ "label": "Auto-renewal", "detail": "...", "level": "high" }],
  "dates": [{ "label": "Start date", "date": "1 Aug 2025" }],
  "clauses": [{ "title": "Termination", "plain": "...", "tag": "termination" }]
}
```

---

## Connecting the Frontend

In `legalai-connected.html`, change this line at the top of the script:
```js
const API = 'http://localhost:3000'; // ← change to your deployed URL
```

---

## Database

SQLite file is saved to `lexsimple.db` in the project root automatically.  
No setup needed — tables are created on first run.

---

## Deploying

For production, consider:
- **Railway / Render / Fly.io** — easy Node.js hosting
- Set `CORS origin` in `index.js` to your frontend domain
- Use a persistent disk or switch to PostgreSQL for the DB
