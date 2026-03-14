# Fix Admin Panel - No Users/Profile Data

## Analysis
AdminPanel calls `/api/v1/users/all` but shows empty. Backend route exists, auth protected.

Possible causes: No users DB, auth fail (not admin), API 403/500.

## Steps

### 1. Debug Frontend (AdminPanel.tsx)
- [x] Create this TODO
- [x] Add console.error details (status, response)
- [x] Add error toast/refresh button
- [ ] Check network tab: status of /users/all ?

### 2. Verify Backend/DB
- [x] Check if users exist: mongo or backend logs
- [ ] Run `add-admin.ts` or seed.ts for test data
- [ ] Test endpoint manually (curl/Postman with token)

### 3. Backend Fixes (src/routes/users.ts)
- [x] Add console.log('Admin request:', req.user?.id, req.user?.role)
- [x] Filter `{ deleted: { $ne: true } }`
- [x] Ensure response { users: [...] }

### 4. Auth Verification
- [ ] Check localStorage 'user' has role: 'admin'
- [ ] Verify token payload has role

### 5. Profile Data
- [ ] Check Profile.tsx fetches /users/profile
- [ ] Ensure backend populates fullName, bio etc.

### 6. Test
- [ ] Backend running? Frontend dev server?
- [ ] Login/register as admin, visit /admin

**Next: Edit AdminPanel.tsx for better debugging**

