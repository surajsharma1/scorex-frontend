# OverlayManager.tsx TypeScript Fix TODO

## Plan Breakdown:
1. ✅ Create TODO.md with steps
2. ✅ Fix malformed template literal at line ~92 in loadCreatedOverlays() - Fixed publicUrl backticks and removed invalid previewOverlay reference
3. ✅ Extract long className template strings (lines 320, 324, 433) - Converted to ternary expressions to avoid multiline template literal parser issues
4. ✅ Verify all backticks are proper - All template literals now use correct syntax
5. [Pending] Test build
6. [Pending] Complete task

**Next Step:** Testing npm run build
