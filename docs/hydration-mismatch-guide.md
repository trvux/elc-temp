# Next.js Hydration Mismatch and Whitescreen Prevention Guide

This document explains the root cause of the HierarchyRequestError whitescreen issue in Next.js applications using the "use cache" directive, and outlines the correct patterns to prevent and fix these issues.

## Problem Statement

When using Next.js with the experimental "use cache" directive, pages intermittently or consistently render as a blank whitescreen. In the browser console, the following error is thrown:

Uncaught HierarchyRequestError: Failed to execute 'insertBefore' on 'Node': The new child element contains the parent.

This error is often accompanied by React hydration mismatches, where the UI works on some reloads but fails on others, or crashes when users navigate between dynamic routes.

## Root Cause Analysis

Next.js component-level caching via the "use cache" directive caches the rendered React Server Component (RSC) tree with its own local segment ID sequence (starting from S:0, S:1, etc.).

When "use cache" is placed at the page or component level, the entire layout or sub-component structure is compiled with static element IDs. When combined with dynamic elements, async layouts, or Suspense boundaries:
1. The dynamic layout/parent component generates its own sequence of React segment IDs during execution.
2. The cached page or component outputs the pre-compiled, static segment IDs from the cache.
3. React segment ID sequences collide (e.g., both the dynamic layout and the cached page try to register under ID "S:3").
4. During client-side hydration, React attempts to insert the layout/parent element inside its own child node due to the duplicate IDs, causing the browser DOM engine to crash with a HierarchyRequestError and display a whitescreen.

## Best Practice Rules

To prevent hydration mismatches and segment ID clashes, adhere to these rules:

1. Do not use component-level caching. Never place the "use cache" directive inside a Page Component, Layout Component, or UI Component.
2. Use data-level caching. Place the "use cache" directive only inside dedicated, standalone data-fetching helper functions.
3. Ensure serializability. Helper functions using "use cache" must only return serializable data (objects, arrays, strings, numbers, booleans) to the UI components. Do not return components or functions.
4. Avoid dynamic evaluations in static renders. Avoid calling dynamic functions like new Date() directly inside the render cycle of a page or component if component-level cache was removed. If static page rendering relies on dynamic calculations (like current copyright year), extract that evaluation to a cached helper function to prevent prerendering compilation errors.

## Code Patterns

### Bad Pattern (Component-level Caching)

In this pattern, the "use cache" directive is inside the page component. This caches the RSC tree structure and causes ID collisions.

```tsx
// app/dich-vu/page.tsx
import { getServices } from "@/modules/service/application";

export default async function ServicesHub() {
  "use cache"; // BAD: Component-level caching
  
  const allServices = await getServices({ isPublished: true });

  return (
    <main>
      <h1>Dịch vụ</h1>
      <ul>
        {allServices.map(service => (
          <li key={service.id}>{service.title}</li>
        ))}
      </ul>
      <footer>
        &copy; {new Date().getFullYear()} ELC Holdings.
      </footer>
    </main>
  );
}
```

### Good Pattern (Data-level Caching)

In this pattern, the page component is a standard, uncached Server Component. The "use cache" directive is encapsulated inside a separate helper function that returns only the raw data and the pre-computed copyright year.

```tsx
// app/dich-vu/page.tsx
import { getServices } from "@/modules/service/application";
import { cacheLife } from "next/cache";

async function getCachedServicesData() {
  "use cache"; // GOOD: Data-level caching
  cacheLife("hours");

  const allServices = await getServices({ isPublished: true });
  const currentYear = new Date().getFullYear();

  return {
    allServices: allServices ?? [],
    currentYear,
  };
}

export default async function ServicesHub() {
  // Page component is dynamic and receives cached data
  const { allServices, currentYear } = await getCachedServicesData();

  return (
    <main>
      <h1>Dịch vụ</h1>
      <ul>
        {allServices.map(service => (
          <li key={service.id}>{service.title}</li>
        ))}
      </ul>
      <footer>
        &copy; {currentYear} ELC Holdings.
      </footer>
    </main>
  );
}
```

## How to Debug Whitescreen Issues

If a page starts showing a whitescreen or throwing HierarchyRequestErrors, follow these steps to debug and resolve:

1. Search the workspace for "use cache" statements. Find files where "use cache" is declared directly inside components.
2. Refactor components by moving "use cache" to helper functions (as shown in the Good Pattern above).
3. Check for dynamic values (such as dates) that might cause static prerender errors when caching is removed. Wrap these in a cached helper function.
4. Verify by running a local production compilation:
   ```bash
   pnpm build
   ```
5. Deploy to the server, purge all caches on the CDN (such as Cloudflare Purge Everything), and test the page with hard reloads (Command + Shift + R) and dynamic routes navigation.
