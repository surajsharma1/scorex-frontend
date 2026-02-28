# Task Fixes Implementation

## 1. Fix FriendList.tsx - Replace with actual friend list content
- Create proper friend list UI with friend requests, accepted friends
- Add functionality to add friends, accept/decline requests

## 2. Remove brackets - Fix player display formatting
- Remove brackets from player names in scoreboard
- Fix formatting in TournamentDetail scoreboard

## 3. Fix players not showing names correctly
- Update TournamentDetail to use actual team player names instead of generic "Batsman 1"
- Fix Match model to properly store striker/non-striker/bowler names

## 4. Fix overlays not getting match details
- Update engine.js to properly receive and display match data
- Fix OverlayEditor data format to match engine.js expectations

## 5. Fix matches not having match details in tournament
- Ensure TournamentDetail displays match details correctly
- Fix data fetching for matches in tournament view

## 6. Fix live match button not showing live matches
- Update LiveMatches component to show all matches with filter options
- Add status filter (ongoing, upcoming, completed)

## 7. Add URL section to match creation
- Add videoLink field to match creation form in TournamentDetail
- Support multiple URLs for match streaming

## 8. Add option for multiple URLs
- Update Match model to support array of video links
- Add UI for adding/removing multiple URLs

## Implementation Files:
- scorex-frontend/scorex-frontend/src/components/FriendList.tsx
- scorex-frontend/scorex-frontend/src/components/TournamentDetail.tsx
- scorex-frontend/scorex-frontend/src/components/LiveMatches.tsx
- scorex-frontend/scorex-frontend/public/overlays/engine.js
- scorex-backend/scorex-backend/src/models/Match.ts
- scorex-frontend/scorex-frontend/src/components/types.ts
