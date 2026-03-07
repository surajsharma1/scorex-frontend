# TODO: Overlay Match Selection Changes

## Task: Make overlay creation use match selection instead of tournament selection

### Changes Required:

1. **OverlayEditor.tsx**:
   - [x] Add state for all matches (not just live)
   - [x] Modify Create Overlay modal: Replace required tournament dropdown with match dropdown
   - [x] Auto-derive tournament from selected match
   - [x] Make match selection required

2. **OverlayForm.tsx**:
   - [x] Change flow: select match first, then auto-populate tournament
   - [x] Make match selection required

### Implementation Status:
- ✅ Completed successfully


