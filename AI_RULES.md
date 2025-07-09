# AI_RULES.md

This document outlines the technology stack, architectural decisions, and development best practices for the Xpress Diesel Repair Command Center application. Adhering to these rules ensures consistency, maintainability, and scalability.

## 1. Core Technology Stack

- **Framework:** React with TypeScript for building a type-safe, component-based user interface.
- **Build Tool:** Vite for fast development and optimized production builds.
- **Routing:** React Router for all client-side navigation and URL management.
- **Styling:** Tailwind CSS for all styling needs. We use its utility-first classes exclusively.
- **UI Components:** shadcn/ui is our designated component library, providing a set of accessible and composable components for buttons, cards, dialogs, etc.
- **Icons:** Lucide React for a consistent and clean set of icons across the application.
- **Data Visualization:** Recharts for creating interactive charts and graphs in the analytics sections.
- **Forms:** React Hook Form, paired with Zod for schema validation, is the standard for managing all forms.
- **Data Fetching & State:** TanStack Query (React Query) is used for managing server state, including fetching, caching, and updating data.

## 2. Development Rules & Best Practices

### UI and Components
- **Always** use components from the `shadcn/ui` library (`@/components/ui/*`) for common UI elements.
- **Never** modify the files in `src/components/ui/` directly. If a `shadcn/ui` component requires custom functionality, create a new component in `src/components/` that wraps it.
- All new reusable components must be placed in the `src/components/` directory. Each component should be in its own file.
- Pages or top-level views should be placed in `src/pages/`.

### Styling
- **Always** use Tailwind CSS utility classes for styling.
- **Avoid** writing custom CSS in `.css` files. The existing `src/index.css` is for global theme configuration (CSS variables) and base styles only.

### State Management
- For local, component-specific state (e.g., toggling a modal's visibility, input values), use React's built-in `useState` and `useReducer` hooks.
- For managing data that comes from a server (e.g., job lists, reports, technician data), **always** use TanStack Query (`@tanstack/react-query`). This handles caching, refetching, and loading/error states automatically.

### Forms
- All forms **must** be built using `react-hook-form`.
- All form validation **must** be handled using `zod` schemas.

### File Structure
- **`src/pages/`**: Contains top-level views that correspond to routes. The main dashboard and entry point of the application is `src/pages/Index.tsx`.
- **`src/components/`**: Contains all reusable components.
  - **`src/components/ui/`**: Contains the unmodified `shadcn/ui` components. Do not edit these.
- **`src/hooks/`**: Contains custom React hooks.
- **`src/lib/`**: Contains utility functions.
- **`src/App.tsx`**: Defines the application's routes using React Router. Keep all route definitions here.