# Overlay & Scoreboard Live Update Fix

## Issues to Fix:
1. Overlays not receiving scoreboard input in real-time
2. Scoreboard only saves when clicking "SAVE NOW" button - needs live updates
3. URL regeneration issue for overlays

## Tasks:
- [x] Analyze current system architecture
- [ ] Fix ScoreboardUpdate.tsx - save scores immediately on every change
- [ ] Fix engine.js - add BroadcastChannel listener for real-time updates
- [ ] Fix overlay data format to match engine.js expectations
- [ ] Test the live update flow
