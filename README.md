# Rentlify Solutions Platform

This pnpm monorepo contains the public/administrative web application and backend API for Rentlify Solutions.

## Applications

- `rentlify_solutions_web`: Vite, React Compiler, TypeScript, Tailwind CSS, and shadcn/ui.
- `rentlify_solutions_server`: Express, TypeScript, Zod, and Pino. It listens on port `8000` by default.

## Commands

```bash
pnpm install
pnpm dev
pnpm validate
```

The current milestone intentionally contains only the marketing landing page and a minimal server health boundary.
