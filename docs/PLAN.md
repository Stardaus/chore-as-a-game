<!--
# Implementation Plan

<!-- 
Use this file to plan changes. 
1. Write the plan.
2. Discuss.
3. Execute.
4. Comment out completed plans (wrap in <!-- -->).
-->

<!--
## Recreate and Relocate Bulk Assign Button

### Objective
Improve the visibility and utility of the "Bulk Assign" feature by relocating it and giving it a more prominent, functional design.

### Analysis
The "Bulk Assign" button is currently hidden in the header of the "Add New Chore" card. Since bulk assignment is a high-value tool for setting up routines, it deserves its own space. I will also take this opportunity to expose the "Seed Defaults" feature which is currently in the store but missing from the UI.

### Proposed Changes

#### 1. Update `ChoreBank.tsx`
- **Relocation**: Move the "Bulk Assign" button out of the "Add New Chore" header.
- **New Section**: Create a "Quest Setup Hub" at the top of the Chores tab with two prominent cards:
    - **Bulk Assign**: A high-contrast card to trigger the bulk assignment modal.
    - **Quick Seed**: A card to trigger `seedDefaultChores` (e.g., adding daily prayers).
- **Design**: Use gradients and larger icons to make these "Quick Actions" feel more like game tools.

#### 2. Visual Improvements
- Use `Zap` (for Bulk Assign) and `Sparkles` (for Seed Defaults) icons from Lucide.
- Add descriptive text to explain what each tool does.

### Detailed Steps

1.  **Modify [`src/features/chores/components/ChoreBank.tsx`](file:///Users/nina/development/projects/chore-as-a-game/src/features/chores/components/ChoreBank.tsx)**:
    - Remove the old button from the header.
    - Add `seedDefaultChores` to the store destructuring.
    - Implement the "Setup Hub" grid at the top of the `return` statement.
    - Update icons and styles.

### Verification
- **Manual Test**:
    1. Go to Parent Dashboard -> Chores.
    2. Verify the new "Setup Hub" is visible at the top.
    3. Test "Bulk Assign" button -> Modal should open.
    4. Test "Seed Defaults" button -> Default chores should appear in the list.
-->
-->
