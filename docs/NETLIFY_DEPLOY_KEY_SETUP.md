# Netlify Deploy Key Setup

## What is a Deploy Key?

A deploy key is an SSH key that grants Netlify's build system permission to access your private GitHub repository and any private submodules it may contain.

## Deploy Key Information

The public deploy key has been saved to: `netlify-deploy-key.pub`

## How to Add the Deploy Key to GitHub

1. **Go to your GitHub repository settings**
   - Navigate to: https://github.com/dandpb/jung-edu-app
   - Click on "Settings" tab

2. **Add the Deploy Key**
   - In the left sidebar, click on "Deploy keys"
   - Click "Add deploy key" button
   - Title: "Netlify Deploy Key"
   - Key: Paste the contents of `netlify-deploy-key.pub`
   - Check "Allow write access" if Netlify needs to push changes
   - Click "Add key"

## If You Have Private Submodules

If your repository uses private git submodules:

1. Add this same deploy key to each submodule repository
2. Follow the same steps as above for each submodule repo
3. This allows Netlify to clone all necessary code during builds

## Alternative: Using Netlify UI

You can also add deploy keys directly through Netlify:

1. Go to your Netlify site dashboard
2. Navigate to Site settings → Build & deploy → Continuous deployment
3. Under "Deploy key", you'll see the public key
4. Copy this key and add it to your GitHub repository as described above

## Security Notes

- **Never share the private key** - Only the public key should be added to GitHub
- Deploy keys are repository-specific for security
- They provide read-only access by default (unless write access is explicitly granted)
- Revoke keys immediately if compromised

## Troubleshooting

If builds fail with authentication errors:

1. Verify the deploy key is added to GitHub correctly
2. Check that all submodules (if any) have the key added
3. Ensure the key has the necessary permissions
4. Try regenerating the deploy key in Netlify if issues persist

## Current Configuration

- Repository: jung-edu-app
- Build directory: jung-edu-app
- Publish directory: jung-edu-app/build
- Node version: 18.17.0

The deploy key ensures Netlify can successfully clone and build your repository.