"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = generateId;
exports.getCurrentTimestamp = getCurrentTimestamp;
exports.isValidPosition = isValidPosition;
exports.calculateDistance = calculateDistance;
exports.deepClone = deepClone;
exports.debounce = debounce;
exports.throttle = throttle;
__exportStar(require("./logger"), exports);
__exportStar(require("./trpc"), exports);
__exportStar(require("../config"), exports);
function generateId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
function getCurrentTimestamp() {
    return Date.now();
}
function isValidPosition(x, y, maxX, maxY) {
    return x >= 0 && x < maxX && y >= 0 && y < maxY;
}
function calculateDistance(pos1, pos2) {
    return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
}
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
function throttle(func, limit) {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}
//# sourceMappingURL=index.js.map