# Supabase Migration Guide

This project has been migrated from MySQL and Redis to Supabase.

## Environment Variables Required

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration (Local)
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# Supabase Database Connection (Local Postgres)
SUPABASE_DB_HOST=127.0.0.1
SUPABASE_DB_PORT=54322
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=postgres
SUPABASE_DB_NAME=postgres

# Application
NODE_ENV=local
```

## Local Supabase Setup

If you're running Supabase locally:

1. Install Supabase CLI: `npm install -g supabase`
2. Initialize Supabase: `supabase init`
3. Start Supabase: `supabase start`
4. The default local configuration is:
   - Host: `127.0.0.1`
   - Port: `54322` (database), `54321` (API)
   - User: `postgres`
   - Password: `postgres`
   - Database: `postgres`

For cloud Supabase:

1. Go to [Supabase](https://supabase.com) and create a new project
2. In your project settings, go to "Database" tab
3. Find the connection string under "Connection string" section
4. Extract the following:
   - Host: `db.your-project.supabase.co`
   - Port: `5432`
   - Database: `postgres`
   - User: `postgres`
   - Password: Your database password

5. In your project settings, go to "API" tab
6. Copy the following:
   - Project URL: This is your `SUPABASE_URL`
   - Anon/Public Key: This is your `SUPABASE_ANON_KEY`

## Changes Made

### Database Migration
- **From**: MySQL with TypeORM
- **To**: Supabase Postgres with TypeORM
- All entity files have been updated to use Postgres-compatible column types
- `datetime` → `timestamp`
- `int` → `integer`
- Removed MySQL-specific `type: 'varchar'` declarations

### Caching Migration
- **From**: Redis
- **To**: In-memory cache (MemoryCache)
- Created `src/common/memoryCache.ts` with Redis-compatible interface
- Updated `src/common/methodCache.ts` to use memory cache
- Removed Redis dependencies from all services

### Package Changes
- **Removed**: `mysql2`, `ioredis`, `@nestjs-modules/ioredis`
- **Added**: `@supabase/supabase-js`, `pg`

## Features

The memory cache provides the same functionality as Redis for method result caching:
- TTL-based expiration
- Hash-based storage
- Compatible with existing `@Cacheable` decorator

## Notes

- Cache is stored in memory and will be cleared on server restart
- For production with multiple instances, consider using Supabase Realtime or a shared cache solution
- Database schema will be automatically synchronized via TypeORM's `synchronize: true` option

