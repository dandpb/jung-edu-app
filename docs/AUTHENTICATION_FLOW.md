# Authentication Flow Documentation

This document details the authentication system implementation in the Jung Educational App.

## Overview

The application implements a **dual authentication system**:

1. **Regular User Authentication** - Via Supabase Auth
2. **Admin Authentication** - Custom implementation with enhanced security

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   User Login    │────▶│   AuthContext    │────▶│ Supabase Auth   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │
                                ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Admin Login    │────▶│  AdminContext    │────▶│ Local Storage   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## Regular User Authentication

### Login Flow

1. **User navigates to `/login`**
   - `LoginPage` component renders
   - Form collects email/username and password

2. **Authentication Request**
   ```typescript
   const { data, error } = await supabase.auth.signInWithPassword({
     email: credentials.email,
     password: credentials.password
   });
   ```

3. **Session Management**
   - JWT tokens stored in Supabase session
   - Auto-refresh handled by Supabase client
   - Session persists across browser refreshes

4. **Success Redirect**
   - User redirected to `/dashboard`
   - AuthContext updates with user data

### Registration Flow

1. **User navigates to `/register`**
   - `RegisterPage` component renders
   - Form collects user details

2. **Account Creation**
   ```typescript
   const { data, error } = await supabase.auth.signUp({
     email: userData.email,
     password: userData.password,
     options: {
       data: {
         username: userData.username,
         full_name: userData.fullName
       }
     }
   });
   ```

3. **Email Verification**
   - Confirmation email sent automatically
   - User must verify email before full access

### Password Reset

1. **Request Reset**
   - User provides email at `/forgot-password`
   - Reset link sent via email

2. **Reset Password**
   - User clicks link and sets new password
   - Automatic login after reset

## Admin Authentication

### Login Flow

1. **Admin navigates to `/admin/login`**
   - `AdminLogin` component renders
   - Form collects username and password

2. **Credential Validation**
   ```typescript
   // In AdminContext
   const passwordHash = hashPassword(password, ADMIN_CONFIG.defaultAdmin.salt);
   if (username === ADMIN_CONFIG.defaultAdmin.username && 
       passwordHash === ADMIN_CONFIG.defaultAdmin.passwordHash) {
     // Authentication successful
   }
   ```

3. **Session Creation**
   - JWT token generated with 24-hour expiry
   - Token stored in localStorage
   - Admin user object created (without password)

4. **Success Redirect**
   - Admin redirected to `/admin` dashboard
   - AdminContext updates with admin status

### Security Implementation

#### Password Hashing
```typescript
// Using SHA-256 with salt
export function hashPassword(password: string, salt: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  // SHA-256 hashing implementation
  return hashedPassword;
}
```

#### Session Token Structure
```typescript
interface SessionToken {
  userId: string;
  role: UserRole;
  expires: number;
  signature: string;
}
```

## Protected Routes

### Implementation
```typescript
<ProtectedRoute requiredRole={UserRole.ADMIN}>
  <AdminDashboard />
</ProtectedRoute>
```

### Route Protection Logic
1. Check if user is authenticated
2. Verify user has required role
3. Check specific permissions if needed
4. Redirect to appropriate page if unauthorized

### Protection Levels

#### Public Routes
- `/login`, `/register`, `/forgot-password`
- No authentication required
- Redirect to dashboard if already authenticated

#### Authenticated Routes
- `/dashboard`, `/module/*`, `/notes`, etc.
- Require valid user session
- Redirect to `/login` if not authenticated

#### Admin Routes
- `/admin/*` routes
- Require admin role
- Redirect to `/unauthorized` if insufficient privileges

## Context Providers

### AuthContext
Manages regular user authentication state:
```typescript
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginData) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  register: (data: RegistrationData) => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (resource: ResourceType, action: Action) => boolean;
}
```

### AdminContext
Manages admin-specific functionality:
```typescript
interface AdminContextType {
  isAdmin: boolean;
  currentAdmin: AdminUser | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  modules: Module[];
  updateModules: (modules: Module[]) => void;
}
```

## Session Management

### User Sessions
- Managed by Supabase Auth
- Automatic token refresh
- Secure HTTP-only cookies (in production)
- Cross-tab synchronization

### Admin Sessions
- Custom JWT implementation
- 24-hour expiry by default
- Manual refresh required
- Single-tab session

## Security Best Practices

1. **Password Requirements**
   - Minimum 8 characters
   - Mix of letters, numbers, symbols
   - No common patterns

2. **Session Security**
   - Short-lived tokens
   - Secure token storage
   - HTTPS required in production
   - CSRF protection

3. **Rate Limiting**
   - Max 5 login attempts
   - 30-minute lockout period
   - IP-based tracking

4. **Data Protection**
   - Passwords never stored in plain text
   - Sensitive data encrypted
   - Minimal data in tokens

## Error Handling

### Authentication Errors
```typescript
enum AuthErrorType {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  NETWORK_ERROR = 'NETWORK_ERROR'
}
```

### Error Recovery
- Clear error messages for users
- Automatic retry for network errors
- Session refresh on expiry
- Account recovery options

## Testing Authentication

### Manual Testing
1. Regular user login/logout
2. Admin login/logout
3. Protected route access
4. Session expiry handling
5. Error scenarios

### Automated Tests
```bash
# Run authentication tests
npm test src/services/auth
npm test src/contexts/AuthContext.test.tsx
npm test src/components/auth
```

## Troubleshooting

### Common Issues

1. **"Invalid credentials" error**
   - Check username/password
   - Verify account exists
   - Check for account lockout

2. **Session expired**
   - Log in again
   - Check token expiry settings
   - Verify system time

3. **Cannot access admin panel**
   - Verify admin credentials
   - Check role assignment
   - Clear browser cache

### Debug Commands
```javascript
// Check current auth state
console.log(localStorage.getItem('jungAppSessionToken'));

// Clear auth data
localStorage.clear();

// Check Supabase session
const session = await supabase.auth.getSession();
console.log(session);
```