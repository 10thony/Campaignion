/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as campaigns from "../campaigns.js";
import type * as characters from "../characters.js";
import type * as clerkService from "../clerkService.js";
import type * as items from "../items.js";
import type * as monsters from "../monsters.js";
import type * as quests from "../quests.js";
import type * as sampleData from "../sampleData.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  campaigns: typeof campaigns;
  characters: typeof characters;
  clerkService: typeof clerkService;
  items: typeof items;
  monsters: typeof monsters;
  quests: typeof quests;
  sampleData: typeof sampleData;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
