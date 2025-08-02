# Admin System Documentation

This document explains how the admin login and module management system works in the Jung Educational App.

## Overview

The app features a dual authentication system:
- **Regular users**: Authenticate through Supabase Auth
- **Admin users**: Use a separate admin login system with enhanced privileges

## Admin Login

### Access Point
Navigate to: `http://localhost:3000/admin/login`

### Default Credentials
- **Username**: `admin`
- **Password**: `jungadmin123`

> ⚠️ **Security Note**: These are demo credentials. In production, use environment variables and secure password policies.

### Login Process
1. Navigate to `/admin/login`
2. Enter credentials in the login form
3. System validates credentials using:
   - Password hashing with SHA-256 and salt
   - Session token creation (JWT)
   - Token stored in localStorage
4. Successful login redirects directly to `/admin/modules` for immediate module management

### Security Features
- Password hashing using SHA-256 with salt
- JWT session tokens with 24-hour expiry
- Session validation on page refresh
- Role-based access control (requires `UserRole.ADMIN`)
- Maximum login attempts before lockout (configurable)

## Admin Dashboard

Once logged in, admins have access to:

### 1. Module Management (`/admin/modules`)
- Create, edit, and delete educational modules
- AI-powered content generation
- Automatic quiz generation
- Module preview and validation

### 2. Resource Management (`/admin/resources`)
- Manage bibliography and references
- Upload and organize media content
- Configure external resources

### 3. Mind Map Editor (`/admin/mindmap`)
- Visual module relationship editor
- Interactive node and edge configuration
- Export/import mind map data

## Module Management Features

### Creating a New Module

#### Manual Creation
1. Click **"Adicionar Módulo"** button
2. Fill in the module details:
   - Title and description
   - Icon selection
   - Difficulty level (beginner/intermediate/advanced)
   - Estimated completion time
   - Prerequisites
3. Add content sections:
   - Section titles and content
   - Key terms and definitions
   - Interactive elements
4. Configure quiz (optional):
   - Multiple choice questions
   - Explanations for answers
   - Passing score threshold
5. Save the module

#### AI-Powered Generation
1. Click **"Gerar com IA"** button
2. Configure generation parameters:
   - Topic and subtopics
   - Target difficulty
   - Include videos/quiz/bibliography
   - Language preference
3. Review AI-generated content
4. Edit and refine as needed
5. Save to module library

### Editing Existing Modules
1. Find the module in the list
2. Click the edit icon (✏️)
3. Modify any aspect:
   - Content sections
   - Quiz questions
   - Media resources
   - Metadata
4. Save changes

### Automatic Quiz Generation
1. Click the sparkle icon (✨) on any module
2. Configure quiz parameters:
   - Number of questions
   - Question types
   - Difficulty distribution
3. Review generated questions
4. Edit/refine as needed
5. Save to module

### Deleting Modules
1. Click the trash icon (🗑️)
2. Confirm deletion in the dialog
3. Module is removed from the system

## Data Storage

### Development Mode
- **localStorage**: Modules, mind maps, and settings
- Data persists between sessions
- Easy to reset for testing

### Production Mode
- **Supabase Database**: All content and user data
- Row Level Security (RLS) for data protection
- Real-time synchronization
- Backup and recovery options

## Protected Routes

Admin areas are protected using the `ProtectedRoute` component:

```typescript
<ProtectedRoute requiredRole={UserRole.ADMIN}>
  <AdminModules />
</ProtectedRoute>
```

This ensures only authenticated admin users can access sensitive areas.

## Troubleshooting

### Locked Out of Admin Account
If you're locked out, run this in the browser console:

```javascript
// Clear session data
localStorage.removeItem('jungAppSessionToken');
localStorage.removeItem('jungAdminSession');

// Then restart the development server
```

### Session Expired
- Sessions expire after 24 hours
- Simply log in again with admin credentials
- Previous work is auto-saved

### AI Features Not Working
Ensure you have:
1. Valid OpenAI API key in `.env` file:
   ```
   REACT_APP_OPENAI_API_KEY=your-api-key-here
   ```
2. Sufficient API credits
3. Stable internet connection

## Configuration

### Environment Variables
```bash
# Admin credentials (production)
REACT_APP_ADMIN_USERNAME=admin
REACT_APP_ADMIN_PASSWORD_HASH=hashed-password
REACT_APP_ADMIN_SALT=random-salt

# Session configuration
REACT_APP_SESSION_EXPIRY=86400000  # 24 hours in ms

# AI Integration
REACT_APP_OPENAI_API_KEY=your-openai-key
```

### Security Best Practices
1. Never commit credentials to version control
2. Use strong, unique passwords in production
3. Implement rate limiting for login attempts
4. Enable two-factor authentication (2FA) when available
5. Regular security audits and updates

## Integration with Main App

The admin system integrates with:
- **AuthContext**: For user authentication state
- **AdminContext**: For admin-specific functionality
- **Supabase**: For data persistence (when configured)
- **LLM Services**: For AI-powered features

## Future Enhancements

Planned improvements:
- Multi-admin support with different permission levels
- Audit logs for all admin actions
- Bulk import/export functionality
- Advanced analytics dashboard
- Collaborative editing features