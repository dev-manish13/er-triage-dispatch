# Jeevan Milan: Smart ER Triage & Dynamic Resource Allocation System

TU BCA final year project. Monorepo with a Node.js/Express API and a React (Vite + Tailwind) client.

## Structure

- `server/` — Express REST API (`express`, `mysql2`, `cors`, `dotenv`)
- `client/` — React app (Vite + Tailwind CSS, `lucide-react`, `axios`)

## Database setup

1. Start MySQL locally.
2. Copy `server/.env.example` to `server/.env` and adjust credentials if needed.
3. Load the schema and seed data:
   ```bash
   mysql -u root -p < server/schema.sql
   mysql -u root -p < server/seed.sql
   ```

## Running

```bash
# server (http://localhost:5000)
cd server
npm run dev

# client (http://localhost:5173)
cd client
npm run dev
```
