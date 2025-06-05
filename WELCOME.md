# Kantor Onboarding - Dev Guide

## Commands
- `npm run dev` - Start dev server with turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Code Style Guidelines
- TypeScript with strict typing enabled
- Use path aliases: `@/*` maps to `./src/*`
- Component structure:
  - React function components with explicit return types
  - Use React.forwardRef for components that need refs
  - Props interfaces with descriptive names (e.g., `ButtonProps`)
- Naming: PascalCase for components, camelCase for functions/variables
- Imports:
  - Group React imports first
  - Then third-party dependencies
  - Then internal imports using path aliases
- Styling: TailwindCSS with class-variance-authority for variants
- Error handling: Prefer typed error handling with explicit return types

## Architecture
- Next.js 15 app router
- React 19
- API routes in src/app/api
- UI components in src/components/ui
- Utility functions in src/lib