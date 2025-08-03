"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convexClient = void 0;
exports.createConvexClient = createConvexClient;
exports.getConvexClient = getConvexClient;
exports.checkConvexConnection = checkConvexConnection;
exports.closeConvexClient = closeConvexClient;
const browser_1 = require("convex/browser");
const index_1 = require("./index");
const logger_1 = require("../utils/logger");
let convexClient = null;
exports.convexClient = convexClient;
function createConvexClient() {
    if (convexClient) {
        return convexClient;
    }
    const convexConfig = (0, index_1.getConvexConfig)();
    try {
        exports.convexClient = convexClient = new browser_1.ConvexHttpClient(convexConfig.url);
        logger_1.logger.info('Convex client initialized successfully', {
            url: convexConfig.url,
            hasDeployKey: !!convexConfig.deployKey,
        });
        return convexClient;
    }
    catch (error) {
        logger_1.logger.error('Failed to initialize Convex client', {
            error: error instanceof Error ? error.message : String(error),
            url: convexConfig.url,
        });
        throw new Error(`Failed to initialize Convex client: ${error instanceof Error ? error.message : String(error)}`);
    }
}
function getConvexClient() {
    if (!convexClient) {
        return createConvexClient();
    }
    return convexClient;
}
async function checkConvexConnection() {
    try {
        const client = getConvexClient();
        await client.query('_system/listTables');
        logger_1.logger.debug('Convex connection health check passed');
        return true;
    }
    catch (error) {
        logger_1.logger.error('Convex connection health check failed', {
            error: error instanceof Error ? error.message : String(error),
        });
        return false;
    }
}
function closeConvexClient() {
    if (convexClient) {
        try {
            exports.convexClient = convexClient = null;
            logger_1.logger.info('Convex client connection closed');
        }
        catch (error) {
            logger_1.logger.error('Error closing Convex client', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
}
//# sourceMappingURL=convex.js.map