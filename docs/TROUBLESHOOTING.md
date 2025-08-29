# 🔧 jaqEdu Troubleshooting Guide

This guide helps you resolve common issues with the jaqEdu educational platform.

## 🚦 Quick Diagnostics

### System Health Check

Run this command to check system status:
```bash
npm run health-check
```

This verifies:
- ✅ Node.js version compatibility
- ✅ Required dependencies installed
- ✅ Environment variables configured
- ✅ Database connectivity (if configured)
- ✅ API keys validity

## 🔐 Authentication Issues

### Cannot Login

#### Symptoms
- Login button doesn't respond
- "Invalid credentials" error
- Page refreshes without logging in

#### Solutions

1. **Verify Credentials**
   - Default admin: `admin` / `jungadmin123`
   - Check caps lock is off
   - Ensure no extra spaces

2. **Clear Browser Data**
   ```javascript
   // In browser console
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

3. **Check Password Hash**
   ```bash
   # Regenerate admin credentials
   npm run generate-admin-credentials
   # Update .env.local with new hash and salt
   ```

4. **Database Connection** (if using Supabase)
   - Verify `REACT_APP_SUPABASE_URL` is correct
   - Check `REACT_APP_SUPABASE_ANON_KEY` is valid
   - Test connection in Supabase dashboard

### Session Expired

#### Symptoms
- Suddenly logged out
- "Session expired" message
- Need to login frequently

#### Solutions

1. **Extend Session Duration**
   ```typescript
   // In src/config/auth.ts
   export const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
   ```

2. **Enable Remember Me**
   - Check "Remember Me" when logging in
   - Extends session to 7 days

3. **Check Clock Sync**
   - Ensure system time is correct
   - JWT tokens are time-sensitive

### Password Reset Not Working

#### Symptoms
- Reset email not received
- Reset link expired
- New password not accepted

#### Solutions

1. **Check Email Configuration**
   - Verify SMTP settings if configured
   - Check spam folder
   - Ensure email service is running

2. **Manual Password Reset**
   ```bash
   # Generate new password hash
   npm run generate-password-hash -- --password "NewPassword123!"
   # Update user in database manually
   ```

## 📚 Module Access Problems

### Module Won't Load

#### Symptoms
- Clicking module does nothing
- Loading spinner stuck
- Content area blank

#### Solutions

1. **Check Module Status**
   - Ensure module is published
   - Verify user has access rights
   - Check prerequisites are met

2. **Clear Module Cache**
   ```javascript
   // In browser console
   localStorage.removeItem('modules_cache');
   location.reload();
   ```

3. **Verify Data Format**
   - Check module JSON structure
   - Validate content field
   - Ensure all required fields present

### Videos Not Playing

#### Symptoms
- Video player blank
- "Video unavailable" error
- Playback errors

#### Solutions

1. **Check YouTube API Key**
   ```bash
   # Test API key
   curl "https://www.googleapis.com/youtube/v3/videos?id=VIDEO_ID&key=YOUR_API_KEY&part=snippet"
   ```

2. **Verify Video URLs**
   - Ensure videos are not private
   - Check regional restrictions
   - Update removed video links

3. **Browser Compatibility**
   - Update to latest browser version
   - Enable JavaScript
   - Allow third-party cookies for YouTube

### Quiz Not Working

#### Symptoms
- Questions not displaying
- Cannot submit answers
- Score not calculating

#### Solutions

1. **Validate Quiz Data**
   ```typescript
   // Check quiz structure
   console.log(JSON.stringify(quiz, null, 2));
   // Should have questions array with correct format
   ```

2. **Reset Quiz Progress**
   ```javascript
   // In browser console
   const moduleId = 'current-module-id';
   localStorage.removeItem(`quiz_progress_${moduleId}`);
   ```

3. **Check Quiz Configuration**
   - Verify passing score is 0-100
   - Ensure questions have correct answers
   - Validate question types


## 🤖 AI Features Problems

### Content Generation Fails

#### Symptoms
- "Generation failed" error
- Timeout errors
- Empty responses

#### Solutions

1. **Verify API Key**
   ```bash
   # Test OpenAI API
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```

2. **Check Rate Limits**
   - Monitor API usage
   - Implement backoff strategy
   - Upgrade API plan if needed

3. **Reduce Request Size**
   ```typescript
   // Adjust generation parameters
   const config = {
     maxTokens: 1000, // Reduce from 2000
     temperature: 0.7,
     model: 'gpt-3.5-turbo' // Use faster model
   };
   ```

### Poor AI Output Quality

#### Symptoms
- Irrelevant content
- Incomplete responses
- Formatting issues

#### Solutions

1. **Improve Prompts**
   - Be more specific
   - Provide examples
   - Set clear constraints

2. **Adjust Parameters**
   ```typescript
   // Fine-tune generation
   const config = {
     temperature: 0.5, // Lower for consistency
     topP: 0.9,
     frequencyPenalty: 0.3,
     presencePenalty: 0.3
   };
   ```

## 🚀 Performance Issues

### Slow Loading Times

#### Symptoms
- Long initial load
- Sluggish navigation
- Delayed responses

#### Solutions

1. **Enable Production Mode**
   ```bash
   # Build for production
   npm run build
   serve -s build
   ```

2. **Optimize Bundle Size**
   ```bash
   # Analyze bundle
   npm run build
   npm run analyze
   ```

3. **Enable Caching**
   - Configure service worker
   - Set cache headers
   - Use CDN for assets

### High Memory Usage

#### Symptoms
- Browser tab crashes
- Slow performance over time
- Memory warnings

#### Solutions

1. **Clear Memory Leaks**
   ```javascript
   // Clean up in components
   useEffect(() => {
     return () => {
       // Cleanup subscriptions
       // Clear timers
       // Remove event listeners
     };
   }, []);
   ```

2. **Limit Data Storage**
   - Implement data pagination
   - Clear old localStorage data
   - Reduce state size

## 💾 Database Issues

### Connection Errors

#### Symptoms
- "Database unavailable"
- Cannot save progress
- Data not persisting

#### Solutions

1. **Verify Supabase Configuration**
   ```bash
   # Test connection
   npx supabase status
   ```

2. **Check Network**
   - Verify internet connection
   - Check firewall settings
   - Test Supabase URL accessibility

3. **Fallback to LocalStorage**
   ```javascript
   // Enable offline mode
   localStorage.setItem('offline_mode', 'true');
   ```

### Data Sync Problems

#### Symptoms
- Progress not saving
- Conflicting data
- Missing updates

#### Solutions

1. **Force Sync**
   ```javascript
   // In browser console
   window.syncManager?.forceSync();
   ```

2. **Clear Conflict**
   - Export local data
   - Clear local storage
   - Re-import data

## 🌐 Browser-Specific Issues

### Chrome

#### Issue: Extensions Blocking
- Disable ad blockers
- Allow third-party cookies
- Check console for errors

### Firefox

#### Issue: CORS Errors
- Check security settings
- Enable mixed content
- Clear site data

### Safari

#### Issue: LocalStorage Disabled
- Enable cookies
- Check private browsing
- Allow website data

## 🛠️ Development Issues

### Build Failures

#### Common Errors

1. **TypeScript Errors**
   ```bash
   # Check types
   npm run typecheck
   
   # Fix common issues
   npm run lint --fix
   ```

2. **Missing Dependencies**
   ```bash
   # Clean install
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Environment Variables**
   - Ensure all required vars set
   - Check for typos
   - Restart after changes

### Test Failures

#### Solutions

1. **Update Snapshots**
   ```bash
   npm test -- -u
   ```

2. **Clear Test Cache**
   ```bash
   npm test -- --clearCache
   ```

3. **Run Single Test**
   ```bash
   npm test -- --testNamePattern="specific test"
   ```

## 📱 Mobile Issues

### Responsive Problems

#### Symptoms
- Layout broken on mobile
- Elements overlapping
- Touch not working

#### Solutions

1. **Force Mobile View**
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
   ```

2. **Test Responsive Mode**
   - Use browser dev tools
   - Test different screen sizes
   - Check orientation changes

## 🔍 Debugging Tools

### Browser Console Commands

```javascript
// Debug mode
localStorage.setItem('debug', 'true');

// Show all stored data
console.table(Object.entries(localStorage));

// Check React components
console.log(window.__REACT_DEVTOOLS_GLOBAL_HOOK__);

// Force update
window.forceAppUpdate?.();
```

### Network Debugging

```javascript
// Log all API calls
window.fetch = new Proxy(window.fetch, {
  apply(target, thisArg, argumentsList) {
    console.log('Fetch:', argumentsList[0]);
    return target.apply(thisArg, argumentsList);
  }
});
```

## 🆘 Still Having Issues?

### Collect Debug Information

1. **System Info**
   ```bash
   npm run debug-info
   ```

2. **Browser Console**
   - Copy all error messages
   - Note error timestamps
   - Check network tab

3. **Steps to Reproduce**
   - List exact steps
   - Note when issue occurs
   - Identify patterns

### Contact Support

When reporting issues, include:
- Debug information output
- Browser and OS versions
- Screenshots/recordings
- Error messages
- Steps to reproduce

### Community Resources

- GitHub Issues: Report bugs
- Discord: Real-time help
- Stack Overflow: Tag with `jaquedu`
- Documentation: Check updates

---

*For development-specific issues, see the [Development Guide](./DEVELOPMENT_GUIDE.md).*