// Script to unlock the admin account
// Run this in the browser console at http://localhost:3000

// Clear any stored session data that might be blocking login
localStorage.removeItem('jungAppSessionToken');
localStorage.removeItem('jungAdminSession');

// If you have access to the auth service instance, you could clear login attempts
// but since it's in React component state, we'll need to wait or restart the server

console.log('Admin session data cleared.');
console.log('To fully unlock the account, you need to:');
console.log('1. Stop the dev server (Ctrl+C in terminal)');
console.log('2. Run "npm start" again');
console.log('3. Try logging in with username: admin, password: jungadmin123');