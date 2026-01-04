# SPA Architecture Documentation

## Overview

This application implements a **Single Page Application (SPA)** architecture where navigation **NEVER** causes a full page reload. Only the main content area updates, while Header, Sidebar, and Footer remain mounted at all times.

## Architecture Principles

### 1. Persistent Layout Components
- **Header**: Always mounted, never unmounts
- **Sidebar**: Always mounted, never unmounts
- **Main Content**: Only this area updates on navigation

### 2. Client-Side Navigation
- Uses Next.js App Router (client-side routing by default)
- No `window.location.reload()` calls
- No full page refreshes
- History API (`pushState`) handled by Next.js

### 3. Smooth Transitions
- CSS transitions via Framer Motion
- Fade and slide animations
- No layout shifts during navigation

## Component Hierarchy

```
RootLayout (app/layout.tsx)
└── AccountProvider
    └── ThemeProvider
        └── DashboardLayout (app/(dashboard)/layout.tsx)
            ├── ProtectedRoute
            │   └── <div className="flex min-h-screen flex-col">
            │       ├── Header (ALWAYS MOUNTED)
            │       └── <div className="flex flex-1">
            │           ├── Sidebar (ALWAYS MOUNTED)
            │           └── <main id="app-content">
            │               └── AnimatePresence
            │                   └── motion.div (ONLY THIS UPDATES)
            │                       └── {children} (Page Content)
```

## State Flow

### Navigation Flow

1. **User clicks menu/submenu link**
   ```tsx
   <Link href="/account/groups">Groups</Link>
   ```

2. **Next.js intercepts navigation**
   - Next.js `Link` component prevents default browser navigation
   - Uses `router.push()` internally (client-side)

3. **App Router updates route**
   - Next.js App Router updates the route context
   - `usePathname()` hook detects change
   - `children` prop in layout updates

4. **Only Main Content Re-renders**
   - Header component: **NO RE-RENDER** (memoized)
   - Sidebar component: **NO RE-RENDER** (memoized)
   - Main content: **RE-RENDERS** with new page component

5. **Framer Motion Animates**
   - Old content fades out (exit animation)
   - New content fades in (enter animation)
   - Smooth transition (200ms)

### Why No Full Reload?

1. **Next.js App Router**: Built-in client-side navigation
2. **Component Structure**: Header/Sidebar outside content area
3. **Memoization**: Header/Sidebar memoized to prevent re-renders
4. **React Reconciliation**: Only changed parts update

## Implementation Details

### Layout Component (`app/(dashboard)/layout.tsx`)

```tsx
export default function DashboardLayout({ children }) {
    const pathname = usePathname()
    
    // Memoize to prevent re-renders
    const header = useMemo(() => <Header />, [])
    const sidebar = useMemo(() => <Sidebar />, [])
    
    return (
        <div className="flex min-h-screen flex-col">
            {header}  {/* Always mounted */}
            <div className="flex flex-1">
                {sidebar}  {/* Always mounted */}
                <main id="app-content">
                    <AnimatePresence mode="wait">
                        <motion.div key={pathname}>
                            {children}  {/* Only this updates */}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    )
}
```

### Navigation Links

All navigation uses Next.js `Link` component:

```tsx
import Link from "next/link"

<Link href="/account/groups">
    Groups
</Link>
```

**Why this works:**
- Next.js `Link` uses client-side navigation
- Prevents default browser navigation
- Uses `router.push()` internally
- No full page reload

### Transitions

Framer Motion handles smooth transitions:

```tsx
<AnimatePresence mode="wait">
    <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
    >
        {children}
    </motion.div>
</AnimatePresence>
```

**Animation Details:**
- **Initial**: Content starts invisible, slightly below
- **Animate**: Fades in and slides up
- **Exit**: Fades out and slides up
- **Duration**: 200ms (fast, smooth)

## State Preservation

### Scroll Position

Scroll position is preserved per route:

```tsx
// Store scroll position before navigation
sessionStorage.setItem(`scroll-${pathname}`, scrollTop)

// Restore after navigation
const savedScroll = sessionStorage.getItem(`scroll-${newPathname}`)
if (savedScroll) {
    contentRef.current.scrollTop = Number(savedScroll)
}
```

### Component State

- **Header state**: Preserved (component never unmounts)
- **Sidebar state**: Preserved (component never unmounts)
- **Page state**: Managed by React state (preserved during navigation)

## Performance Optimizations

### 1. Memoization
```tsx
const header = useMemo(() => <Header />, [])
const sidebar = useMemo(() => <Sidebar />, [])
```
Prevents unnecessary re-renders of Header/Sidebar.

### 2. Code Splitting
Next.js automatically code-splits pages:
- Each route is a separate bundle
- Only loads code for current route
- Faster initial load

### 3. Prefetching
```tsx
<Link href="/account/groups" prefetch={true}>
    Groups
</Link>
```
Next.js prefetches linked pages on hover.

## Testing SPA Behavior

### Verify No Full Reload

1. Open browser DevTools → Network tab
2. Navigate between pages
3. **Expected**: No full page reload (no new document request)
4. **Expected**: Only API calls and assets load

### Verify Component Persistence

1. Open React DevTools
2. Navigate between pages
3. **Expected**: Header/Sidebar components remain mounted
4. **Expected**: Only page content components change

### Verify Smooth Transitions

1. Navigate between pages
2. **Expected**: Smooth fade/slide animation
3. **Expected**: No layout shifts
4. **Expected**: Fast transition (~200ms)

## Common Pitfalls to Avoid

### ❌ DON'T: Use `window.location.href`
```tsx
// BAD - Causes full page reload
window.location.href = "/account/groups"
```

### ❌ DON'T: Use `window.location.reload()`
```tsx
// BAD - Causes full page reload
window.location.reload()
```

### ❌ DON'T: Use `<a>` tags for internal navigation
```tsx
// BAD - Causes full page reload
<a href="/account/groups">Groups</a>
```

### ✅ DO: Use Next.js `Link`
```tsx
// GOOD - Client-side navigation
<Link href="/account/groups">Groups</Link>
```

### ✅ DO: Use `router.push()` for programmatic navigation
```tsx
// GOOD - Client-side navigation
const router = useRouter()
router.push("/account/groups")
```

## Browser Compatibility

- **Modern browsers**: Full support (Chrome, Firefox, Safari, Edge)
- **History API**: Required (all modern browsers support)
- **CSS Transitions**: Required (all modern browsers support)

## Summary

This SPA architecture ensures:
- ✅ No full page reloads
- ✅ Header/Sidebar always mounted
- ✅ Smooth transitions
- ✅ State preservation
- ✅ Fast navigation
- ✅ Better UX

The implementation leverages:
- Next.js App Router (client-side routing)
- React component structure (persistent layout)
- Framer Motion (smooth animations)
- Memoization (performance optimization)

