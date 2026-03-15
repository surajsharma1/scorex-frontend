# Fix Dashboard Navigation After Login - TODO

## Plan Steps:
- [x] Step 1: Update Login.tsx - Change navigate('/') → navigate('/dashboard')
- [x] Step 2: Update Sidebar.tsx - Fix Dashboard NavLink path '/' → '/dashboard'  
- [ ] Step 3: Test password login flow
- [ ] Step 4: Test Google OAuth (verify unchanged)
- [ ] Step 5: Verify Dashboard data loads (API calls)
- [ ] Step 6: Complete task

**Current Progress: Steps 1-2 complete. Test the changes:**  
`cd scorex-frontend/scorex-frontend && npm run dev`  
Then try password login.
