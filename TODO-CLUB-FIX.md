# Club Functionality Fix - TODO

## Overview
Fix created club not appearing in list immediately after creation and ensure delete option visible.

## Steps (v [0/5])

- [x] 1. Update CreateClubForm.tsx: Navigate with refresh timestamp query param after create success

- [x] 2. Update ClubList.tsx: 
  - Add `useSearchParams` + useEffect to refetch on URL param changes (tab, refresh, search, page)
  - Add refresh button in header

- [ ] 3. Verify delete buttons visible:
  - ClubList 'my' tab (owner): ✓ Already exists
  - ClubManagement danger zone: ✓ Already exists
- [ ] 4. Test creation:
  - Create public/private club → verify instant appear in ClubList 'my' tab (top)
  - Check public tab if public type
- [ ] 5. Test delete: Owner delete from list/management → disappears from queries (isActive=false)

## Commands to test
```bash
cd scorex-frontend/scorex-frontend
npm run dev
```
Navigate /clubs/create → create → check /clubs?tab=my refreshes automatically.

**Progress: Starting edits...**
