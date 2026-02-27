# Code Style & Conventions

## General
- TypeScript with strict types
- Inline styles (NOT Tailwind utility classes despite being installed)
- CSS variables for design tokens: --accent, --positive, --warning, --negative, --text-primary, etc.
- French UI text (labels, months, statuses)
- Currency: CAD formatted with formatCAD()

## Components
- Server Components: `app/*/page.tsx` (no 'use client', async, fetch data)
- Client Components: `components/*.tsx` (marked 'use client', interactive)
- Pattern: Server page fetches data → passes as props to Client component

## Server Actions
- Located in `lib/actions/*.ts`
- Marked 'use server'
- Use `revalidatePath()` for cache invalidation
- Use `sql` tagged template from `@/lib/db`

## Naming
- Files: PascalCase for components, kebab-case for lib files
- Functions: camelCase
- Types: PascalCase
- DB columns: snake_case
