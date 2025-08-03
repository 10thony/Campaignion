import { ConvexHttpClient } from 'convex/browser';
declare let convexClient: ConvexHttpClient | null;
export declare function createConvexClient(): ConvexHttpClient;
export declare function getConvexClient(): ConvexHttpClient;
export declare function checkConvexConnection(): Promise<boolean>;
export declare function closeConvexClient(): void;
export { convexClient };
//# sourceMappingURL=convex.d.ts.map