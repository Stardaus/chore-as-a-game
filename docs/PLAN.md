<!--
# Implementation Plan

<!-- 
Use this file to plan changes. 
1. Write the plan.
2. Discuss.
3. Execute.
4. Comment out completed plans (wrap in <!-- -->).
-->

## Performance Optimization (Lag Fix) — *Reviewed & Improved*

### Objective
Address the navigation lag reported on mobile devices (iPhone) when transitioning from the Profile Selection screen to the Child Dashboard.

### Analysis (Confirmed via Code Review)

| # | Root Cause | Severity | Files Affected |
|---|-----------|----------|----------------|
| 1 | **Expensive CSS compositing** — `backdrop-blur-sm` forces GPU compositing layers on every frame. Combined with `mix-blend-overlay` + `blur-3xl` on decorative blobs, the mobile GPU stalls during the initial paint of the `ChildDashboard` route. | **High** | `ChildHeader.tsx` (lines 29-30, 65, 75), `ChildDashboard.tsx` (line 63) |
| 2 | **Over-broad Zustand subscription** — `useStore()` with no selector (destructuring at top level) causes `ChildDashboard` to re-render on *any* store change (e.g. another child's data, chore bank edits). | **Medium** | `ChildDashboard.tsx` (line 26) |
| 3 | **No memoization on ChildHeader** — `ChildHeader` is a pure presentational component but re-renders whenever the parent does. | **Low** | `ChildHeader.tsx` |

> [!NOTE]
> The original plan's analysis was correct on points 1 and 2. The confetti logic (point 3 in original) is fine — it is gated by `useRef` + `useEffect` on `profile.level` and won't fire during navigation.

### Proposed Changes

#### 1. Optimize `ChildHeader.tsx` (CSS — High Impact)
-   **Remove `backdrop-blur-sm`** from both stats containers (lines 65, 75). Replace with `bg-white/15` for visual contrast.
-   **Remove `mix-blend-overlay` + `blur-3xl`** from the two decorative blobs (lines 29-30). Replace with simple `opacity-20` circles without blur — achieves similar aesthetic with zero compositing cost.
-   **Wrap in `React.memo`** — since it only receives `profile` as props, this prevents unnecessary re-renders.

#### 2. Optimize `ChildDashboard.tsx` (React — Medium Impact)
-   **Remove `backdrop-blur-sm`** from the back button (line 63). Replace with `bg-black/20`.
-   **Use `useShallow` selector** — Zustand v5.0.10 is installed, which exports `useShallow` from `zustand/react/shallow`. Derive only `profile` and `myAssignments`:
    ```typescript
    import { useShallow } from 'zustand/react/shallow';

    const { profile, myAssignments } = useStore(useShallow((state) => ({
        profile: state.profiles.find((p) => p.id === childId),
        myAssignments: state.assignments.filter((a) => a.childId === childId),
    })));
    ```
-   **Wrap navigation in `startTransition`** *(optional enhancement)* — in `ProfileSelection.tsx`, wrapping `navigate()` in `React.startTransition` allows React to keep the current screen responsive while preparing the next route. This is a low-risk, high-payoff change for perceived performance.

#### 3. No changes to `ProfileSelection.tsx` (Confirmed Clean)
-   The `navigate` call is synchronous with no blocking computation. No changes needed beyond the optional `startTransition` above.

### Detailed Steps

1.  **Modify [`ChildHeader.tsx`](file:///Users/nina/development/projects/chore-as-a-game/src/features/profiles/components/ChildHeader.tsx)**:
    -   Wrap the component export with `React.memo`.
    -   Lines 29-30: Replace `bg-white rounded-full mix-blend-overlay blur-3xl` → `bg-white/20 rounded-full` (remove blur + blend mode).
    -   Lines 65, 75: Replace `bg-white/10 backdrop-blur-sm` → `bg-white/15` (drop the blur).

2.  **Modify [`ChildDashboard.tsx`](file:///Users/nina/development/projects/chore-as-a-game/src/pages/ChildDashboard.tsx)**:
    -   Add import: `import { useShallow } from 'zustand/react/shallow';`
    -   Line 26: Replace `const { profiles, assignments } = useStore();` with the `useShallow` selector shown above.
    -   Lines 29-30: Remove the now-redundant `profiles.find` / `assignments.filter` (moved into selector).
    -   Line 63: Replace `bg-black/10 backdrop-blur-sm` → `bg-black/20` on the back button.

3.  **(Optional) Modify [`ProfileSelection.tsx`](file:///Users/nina/development/projects/chore-as-a-game/src/pages/ProfileSelection.tsx)**:
    -   Wrap `navigate()` calls in `startTransition` for smoother route transitions.

### Verification
-   No automated tests exist in this project currently.
-   **Manual test**: User to deploy and test on iPhone — navigate from Profile Selection → Child Dashboard and observe for lag/jank.
-   **Dev tools check**: Use Chrome DevTools → Performance tab → CPU throttle 4x to simulate mobile. The "Rendering" paint flashing overlay should show fewer compositing layers after the fix.
-->