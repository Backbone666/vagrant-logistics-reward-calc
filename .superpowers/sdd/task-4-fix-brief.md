# Task 4 Fix Brief: Exclude Binary Files in .gitattributes and Restore Corrupted WebP Image

The task reviewer reported that the blanket wildcard `* text` in `.gitattributes` forced Git to treat all files as text, which mutated/corrupted the binary asset `LW9R6.webp` during the renormalization step.

Follow these steps to resolve:

1. **Exempt WebP Images**: Update `.gitattributes` to explicitly mark `.webp` files as binary to protect them:
   ```
   * text eol=lf
   *.webp binary
   ```
2. **Restore Corrupted WebP File**: Revert/checkout the clean version of `LW9R6.webp` from git history:
   ```bash
   git checkout HEAD -- LW9R6.webp
   ```
3. **Renormalize and Format**: Run the renormalization command again and format source files to ensure no CRLF formatting warnings remain:
   ```bash
   git add --renormalize .
   npm run format
   ```

**Verify**:
* Run `git status` to verify `LW9R6.webp` is no longer modified or dirty in an invalid way.
* Run `npm run lint` and verify it exits with 0.
