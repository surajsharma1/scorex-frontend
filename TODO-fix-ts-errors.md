# TypeScript Build Errors Fix Plan

## Summary
There are **55 TypeScript errors** across **9 files** that need to be fixed.

---

## File: src/controllers/friendController.ts (16 errors)

### Problem: Friend Model has different fields than what controller expects
- **Model IFriend**: `user`, `friend`, `status`
- **Controller expects**: `requester`, `recipient`, `status`

### Fix: Update Friend Model to use `requester` and `recipient` fields

```typescript
// src/models/Friend.ts - Update interface
export interface IFriend extends Document {
  requester: mongoose.Types.ObjectId;  // Change from 'user'
  recipient: mongoose.Types.ObjectId;  // Change from 'friend'
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
}

// Also need to add 'rejected' to status enum
status: 'pending' | 'accepted' | 'blocked' | 'rejected';
```

---

## File: src/controllers/leaderboardController.ts (9 errors)

### Problem 1: Match has no `scorecard` property
- Match model uses `innings` array, not `scorecard`

### Fix: Replace `match.scorecard` with `match.innings`

```typescript
// Line 144: if (match.scorecard) -> if (match.innings && match.innings.length > 0)
// Line 145: match.scorecard.batting -> match.innings[0]?.batsmen
// Line 163: match.scorecard.bowling -> match.innings[0]?.bowlers
// etc.
```

### Problem 2: Player.photo doesn't exist
- Add `photo?: string` to IPlayer interface

---

## File: src/controllers/clubController.ts (2 errors)

### Problem: String passed instead of ObjectId
- Line 311: `club.members.push(userId)` - userId is string
- Line 355: `club.viceLeaders.push(userId)` - userId is string

### Fix: Convert string to ObjectId
```typescript
club.members.push(new mongoose.Types.ObjectId(userId));
club.viceLeaders.push(new mongoose.Types.ObjectId(userId));
```

---

## File: src/controllers/matchController.ts (3 errors)

### Problem 1: BallData outType is string, not OutType
- Line 297: `outType?: string` should be `outType?: OutType`

### Fix:
```typescript
interface BallData {
  runs: number;
  isWide?: boolean;
  isNoBall?: boolean;
  isWicket?: boolean;
  outType?: OutType;  // Change from string
  byes?: number;
  legByes?: number;
}
```

### Problem 2: Static methods not on Model type
- `Match.getLiveMatches()` - method exists but not typed
- `Match.getUpcoming()` - method exists but not typed

### Fix: Add static method signatures to IMatch interface
```typescript
// In src/models/Match.ts
static getLiveMatches(): Promise<IMatch[]>;
static getUpcoming(limit?: number): Promise<IMatch[]>;
```

---

## File: src/controllers/overlayController.ts (11 errors)

### Problem: IOverlay missing properties used in controller
- `template`, `publicId`, `config`, `match`, `membershipAtCreation`, `urlExpiresAt`

### Fix: Update IOverlay interface
```typescript
export interface IOverlay extends Document {
  name: string;
  description?: string;
  thumbnail?: string;
  html: string;
  css?: string;
  level: 1 | 2;
  category: string;
  isPremium: boolean;
  createdBy?: mongoose.Types.ObjectId;
  isActive: boolean;
  
  // Add missing fields used in controller
  template?: string;
  publicId?: string;
  config?: {
    backgroundColor?: string;
    [key: string]: any;
  };
  match?: mongoose.Types.ObjectId;
  membershipAtCreation?: number;
  urlExpiresAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}
```

---

## File: src/controllers/teamController.ts (3 errors)

### Problem: Static methods not on Model type
- `Team.getByOwner()` - exists but not typed
- `Team.search()` - exists but not typed
- `removePlayer(playerId)` - playerId is string

### Fix: 
1. Add static method signatures to ITeam
2. Convert playerId to ObjectId

---

## File: src/controllers/tournamentController.ts (6 errors)

### Problem: Static methods not on Model type
- `Tournament.getUpcoming()` - exists but not typed
- `Tournament.getOngoing()` - exists but not typed
- `Tournament.getFeatured()` - exists but not typed
- `Tournament.getByOrganizer()` - exists but not typed
- `Tournament.search()` - exists but not typed
- `removeTeam(teamId)` - teamId is string

### Fix:
1. Add static method signatures to ITournament
2. Convert teamId to ObjectId

---

## File: src/routes/users.ts (4 errors)

### Problem: `req.user?.id` doesn't exist on User type

### Fix: Update express.d.ts or use correct property
```typescript
// The auth middleware sets req.user with id property
// Need to ensure the type definition includes this
interface AuthenticatedUser {
  id: string;
  _id: string;
  username: string;
  email: string;
  role?: string;
}

// In routes/users.ts, cast user appropriately or update the type
```

---

## File: src/utils/cache.ts (1 error)

### Problem: Return type `string | {}` not assignable to `string`
- Line 62: `return await this.client!.get(key);`

### Fix:
```typescript
async get(key: string): Promise<string | null> {
  if (!this.client) return null;
  const result = await this.client!.get(key);
  return result ?? null;
}
```

---

## Implementation Order

1. **Fix Friend Model** - Update IFriend interface
2. **Fix Match Model** - Add static methods to IMatch
3. **Fix Team Model** - Add static methods to ITeam  
4. **Fix Tournament Model** - Add static methods to ITournament
5. **Fix Overlay Model** - Add missing properties to IOverlay
6. **Fix cache.ts** - Fix return type
7. **Fix controllers** - Use correct field names and types
8. **Fix routes/users.ts** - Fix user type

---

## Commands to Verify

```bash
cd scorex-backend/scorex-backend
npm run build
```

Expected result: 0 errors after all fixes applied.

