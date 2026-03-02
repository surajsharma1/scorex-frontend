# Overlay System Implementation Plan

## Backend Changes

### 1. Update Overlay Model
- Add `requiredMembershipLevel` field to store membership level at creation
- Add `creatorId` field for tracking

### 2. Update Overlay Controller
- Add membership check when creating overlays
- Add membership validation when serving overlays
- Store membership level at creation time
- Check membership expiration for existing overlays

### 3. Update Auth Controller
- Auto-grant admin users Premium LV2 permanently
- Ensure admin role gets level 2 membership

### 4. Update Overlay Routes
- Add membership validation to public overlay route

## Frontend Changes

### 1. Update OverlayEditor
- Integrate create overlay form in same page
- Show created overlays in a section below
- Add regenerate URL functionality
- Add membership check before allowing creation

### 2. Update App.tsx
- Remove or update the separate overlay create route

### 3. Update Membership
- Remove test status indicators

## Implementation Steps

1. [x] Fix TypeError in OverlayForm (completed earlier)
2. [ ] Update Overlay Model - Add membership tracking fields
3. [ ] Update Overlay Controller - Add membership validation
4. [ ] Update Auth Controller - Admin auto-membership
5. [ ] Update Overlay Routes - Add membership gate
6. [ ] Update OverlayEditor - Integrate create form, show created overlays
7. [ ] Update App.tsx - Update routing
8. [ ] Update Membership - Remove test status

## Membership Check Logic
- When creating overlay: Check current user membership
- Store membership level at creation time in overlay
- When accessing overlay URL: Check if user has valid membership
- If membership expired: Show error, require upgrade
- Admin users: Always have Premium LV2 access
