# Frontend Overlay Fixes - TODO List

## Task Summary
Fix the following issues in the frontend:
1. Dashboard button leads to frontpage instead of dashboard
2. Overlay page has tabs instead of dropdown
3. Overlay should be shown in same page with split view

## Implementation Plan

### Step 1: Fix Dashboard Navigation (Sidebar.tsx)
- [x] Change Dashboard menu item path from '/' to '/dashboard'

### Step 2: OverlayEditor.tsx Changes
- [x] Replace tabs with dropdown for overlay category selection
- [x] Add match selection dropdown in data source panel  
- [x] Display overlay in iframe within same page (split view: controls left, preview right)
- [x] Remove "Launch Overlay" button that opens new window
- [x] Add fullscreen toggle for overlay preview
