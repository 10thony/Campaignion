# Deployment Guide

## Netlify Deployment

### Required Environment Variables

Before deploying, you need to set these environment variables in Netlify:

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** > **Environment variables**
3. Add the following variables:

| Variable Name | Description | Example |
|--------------|-------------|---------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Your Clerk publishable key for authentication | `pk_test_...` |
| `VITE_CONVEX_URL` | Your Convex deployment URL | `https://your-project.convex.cloud` |

### Getting Your Convex URL

1. Run `bunx convex dev` locally or deploy with `bunx convex deploy`
2. The Convex URL will be displayed in the terminal
3. It should look like: `https://your-project.convex.cloud`

### Getting Your Clerk Publishable Key

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Select your application
3. Navigate to **API Keys**
4. Copy the **Publishable Key**

### Build Configuration

The project is configured to:
- Use Node.js 20 LTS
- Run TypeScript type checking before building
- Build with Vite

If you encounter build errors:
1. Check the full build logs in Netlify
2. Ensure all environment variables are set
3. Verify the Convex deployment is active
4. Run `bun run build` locally to test

### Manual Build (if needed)

If type checking fails and you need to deploy urgently:
```bash
bun run build:skip-check
```

Then update the build command in Netlify to use `bun run build:skip-check` instead.

### Post-Deployment

After successful deployment:
1. Test authentication with Clerk
2. Verify Convex data syncing
3. Check browser console for any runtime errors

