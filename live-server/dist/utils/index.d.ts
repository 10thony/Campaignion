export * from './logger';
export * from './trpc';
export * from '../config';
export declare function generateId(): string;
export declare function getCurrentTimestamp(): number;
export declare function isValidPosition(x: number, y: number, maxX: number, maxY: number): boolean;
export declare function calculateDistance(pos1: {
    x: number;
    y: number;
}, pos2: {
    x: number;
    y: number;
}): number;
export declare function deepClone<T>(obj: T): T;
export declare function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;
export declare function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void;
//# sourceMappingURL=index.d.ts.map