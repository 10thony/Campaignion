"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRouter = void 0;
const trpc_1 = require("../utils/trpc");
const interaction_1 = require("./interaction");
const testMode_1 = require("./testMode");
exports.appRouter = (0, trpc_1.router)({
    interaction: interaction_1.interactionRouter,
    testMode: testMode_1.testModeRouter,
});
//# sourceMappingURL=index.js.map