/** @type {import('convex/config').Config} */
export default {
  providers: [
    {
      name: "clerk",
      // This domain must match your Clerk instance
      domain: process.env.CLERK_DOMAIN || "clerk.your.domain",
      // This is the default application ID if you're using a single Clerk instance
      applicationID: process.env.CLERK_APPLICATION_ID || "clerk_app_id",
    },
  ],
}; 