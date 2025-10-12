export default {
  providers: [
    {
      // The domain should be the JWT issuer URL from your Clerk JWT template
      // This is typically in the format: https://your-app.clerk.accounts.dev
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      // For Clerk, the applicationID should be "convex" as per Convex docs
      applicationID: "convex",
    },
  ],
};