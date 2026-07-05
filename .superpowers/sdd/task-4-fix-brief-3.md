# Task 4 Fix Brief 3: Wrap Animation Resets in prefers-reduced-motion Media Query

The global reset in `style.css` currently disables all transitions and animations globally on the `*` selector (lines 46–47, 52–53). This breaks all micro-animations and hover transitions across the application. 

Additionally, we need to wrap these rules in a `@media (prefers-reduced-motion: reduce)` query and ignore the `noImportantStyles` linter rule for this block.

Follow these steps to resolve:

1. **Modify style.css**:
   Change lines 42–54 in `style.css` to:
   ```css
   * {
   	box-sizing: border-box;
   	margin: 0;
   	padding: 0;
   }

   /* biome-ignore lint/complexity/noImportantStyles: standard accessibility reset for reduced motion */
   @media (prefers-reduced-motion: reduce) {
   	* {
   		transition: none !important;
   		animation: none !important;
   	}

   	*::before,
   	*::after {
   		transition: none !important;
   		animation: none !important;
   	}
   }
   ```
2. **Renormalize and Stage**:
   Stage the changes and commit:
   ```bash
   git add style.css
   git commit --amend --no-edit
   ```

**Verify**:
* Run `npm run lint` and verify it exits with 0 and reports no warnings/errors.
