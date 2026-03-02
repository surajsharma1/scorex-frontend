# Overlay URL Expiry Implementation

## Changes Made:

### Backend:
1. **Overlay Model** - Added `urlExpiresAt` field
2. **Overlay Controller** - Updated to set 24-hour expiration on create/regenerate
3. **Routes** - Added regenerate endpoint

### Frontend:
1. **API** - Added `regenerateOverlay` method
2. **Types** - Added `urlExpiresAt` and `publicUrl` to CreatedOverlay
3. **OverlayEditor.tsx** - Enhanced with:
   - Preview modal with iframe
   - URL bar with copy & regenerate buttons
   - Edit overlay functionality
   - Status indicators for URL expiration

## TODO:
- [ ] Test the implementation
- [ ] Verify URL regeneration works
- [ ] Verify 24-hour expiration works
