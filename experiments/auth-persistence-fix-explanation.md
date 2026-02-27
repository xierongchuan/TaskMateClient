# Authentication Persistence Fix - Issue #46

## Problem Description

After page reload, authentication was not persisting. Cookie showed:
```
Name: auth-storage
Value: {"state":{"token":null,"user":null},"version":0}
```

Users were automatically redirected to `/login` page even after successful login.

## Root Cause Analysis

### 1. Dual Storage System Conflict
The code was using TWO separate storage mechanisms:
- `localStorage.setItem('auth_token', token)` - Direct localStorage access
- Zustand persist with key `'auth-storage'` - Persisting store state

This created a synchronization issue where:
- Token was saved to `localStorage['auth_token']` during login
- Zustand persist tried to save `state.token` to `localStorage['auth-storage']`
- But `state.token` was set AFTER the localStorage save, causing race condition
- Result: `auth-storage` contained `null` values

### 2. Timing/Race Condition
In `authStore.ts` login function (lines 31-38):
```typescript
localStorage.setItem('auth_token', response.token); // Line 31 - saves to separate key
set({
  user: response.user,
  token: response.token,  // Line 35 - updates state AFTER
  isAuthenticated: true,
  isLoading: false,
});
```

The persist middleware might save before the state update completes, capturing null values.

### 3. Inconsistent Token Retrieval
- `authStore.refreshUser()` read from `localStorage.getItem('auth_token')`
- `apiClient` interceptor read from `localStorage.getItem('auth_token')`
- `App.tsx` checked `localStorage.getItem('auth_token')`
- But Zustand persist loaded from `localStorage['auth-storage']` which had null

### 4. State Cleanup Issues
- On 401 error, `apiClient` only cleared localStorage items
- Zustand store state was not updated, causing inconsistency

## Solution Implemented

### Single Source of Truth: Zustand Persist
Use Zustand persist as the ONLY storage mechanism for authentication state.

### Changes Made

#### 1. `src/stores/authStore.ts`
- **Removed** `localStorage.setItem('auth_token', ...)` from login (line 31)
- **Removed** `localStorage.removeItem('auth_token')` from logout (line 54)
- **Changed** `refreshUser()` to read token from Zustand state instead of localStorage
- **Added** auth helper registration to provide token getter/setter to apiClient

#### 2. `src/api/client.ts`
- **Added** `setAuthHelpers()` function to receive token getter and auth clearer
- **Changed** request interceptor to get token via helper function (from Zustand)
- **Changed** 401 response interceptor to clear auth via helper function (updates Zustand)
- **Removed** direct `localStorage.getItem('auth_token')` and `localStorage.removeItem()`

#### 3. `src/App.tsx`
- **Changed** from checking `localStorage.getItem('auth_token')` to using `token` from Zustand store
- **Added** `token` to useAuthStore hook destructuring
- Now properly waits for Zustand persist to hydrate before checking authentication

## How It Works Now

### Login Flow
1. User submits credentials
2. API returns `{token, user}`
3. Zustand state is updated: `set({ token, user, isAuthenticated: true })`
4. Zustand persist middleware automatically saves to `localStorage['auth-storage']`
5. Result: `auth-storage` contains `{"state":{"token":"abc123","user":{...},"isAuthenticated":true},"version":0}`

### Page Reload Flow
1. Zustand persist hydrates from `localStorage['auth-storage']`
2. Store state is restored with token, user, and isAuthenticated
3. `App.tsx` checks if `token && isAuthenticated`
4. If true, calls `refreshUser()` to get latest user data from API
5. `apiClient` request interceptor gets token from Zustand state
6. User stays authenticated

### Logout Flow
1. User clicks logout
2. `logout()` function clears Zustand state: `set({ token: null, user: null, isAuthenticated: false })`
3. Zustand persist automatically updates `localStorage['auth-storage']`
4. Result: Storage is cleaned and user is redirected to login

### 401 Error Flow
1. API returns 401 (invalid/expired token)
2. `apiClient` response interceptor catches error
3. Calls `clearAuth()` helper which updates Zustand state to null values
4. Redirects to `/login`
5. Zustand persist automatically cleans storage

## Benefits

1. **Single Source of Truth**: All auth state flows through Zustand
2. **No Race Conditions**: State updates and persistence happen together
3. **Type Safety**: Token is typed as `string | null` in store
4. **Automatic Cleanup**: Zustand persist handles all storage operations
5. **Consistent State**: Store and localStorage always in sync

## Testing Verification

To verify the fix:
1. Login to the application
2. Check `localStorage['auth-storage']` - should contain token and user
3. Reload the page
4. User should remain authenticated
5. Navigate to different routes - should work without redirect to login
