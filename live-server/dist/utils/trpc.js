"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicProcedure = exports.middleware = exports.router = void 0;
const server_1 = require("@trpc/server");
const logger_1 = require("../utils/logger");
const t = server_1.initTRPC.context().create({
    errorFormatter: ({ shape, error }) => {
        logger_1.logger.error('tRPC Error', {
            code: error.code,
            message: error.message,
            cause: error.cause,
            stack: error.stack,
        });
        return {
            ...shape,
            data: {
                ...shape.data,
                zodError: error.code === 'BAD_REQUEST' && error.cause ? error.cause : null,
            },
        };
    },
});
exports.router = t.router;
exports.middleware = t.middleware;
exports.publicProcedure = t.procedure;
//# sourceMappingURL=trpc.js.map