/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions from "../actions.js";
import type * as battleMaps from "../battleMaps.js";
import type * as battleTokens from "../battleTokens.js";
import type * as campaigns from "../campaigns.js";
import type * as characters from "../characters.js";
import type * as clerkService from "../clerkService.js";
import type * as equipment from "../equipment.js";
import type * as factions from "../factions.js";
import type * as gameConstants from "../gameConstants.js";
import type * as gptGeneration from "../gptGeneration.js";
import type * as importParsedCharacter from "../importParsedCharacter.js";
import type * as interactions from "../interactions.js";
import type * as items from "../items.js";
import type * as liveChatSystem from "../liveChatSystem.js";
import type * as liveEventSystem from "../liveEventSystem.js";
import type * as liveMapSystem from "../liveMapSystem.js";
import type * as liveRoomManager from "../liveRoomManager.js";
import type * as liveSystem from "../liveSystem.js";
import type * as liveSystemAPI from "../liveSystemAPI.js";
import type * as liveSystemHelpers from "../liveSystemHelpers.js";
import type * as liveTurnManager from "../liveTurnManager.js";
import type * as locations from "../locations.js";
import type * as mapMigration from "../mapMigration.js";
import type * as maps from "../maps.js";
import type * as monsters from "../monsters.js";
import type * as parseLogs from "../parseLogs.js";
import type * as questTasks from "../questTasks.js";
import type * as quests from "../quests.js";
import type * as sampleData from "../sampleData.js";
import type * as testLiveSystem from "../testLiveSystem.js";
import type * as timeline from "../timeline.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  actions: typeof actions;
  battleMaps: typeof battleMaps;
  battleTokens: typeof battleTokens;
  campaigns: typeof campaigns;
  characters: typeof characters;
  clerkService: typeof clerkService;
  equipment: typeof equipment;
  factions: typeof factions;
  gameConstants: typeof gameConstants;
  gptGeneration: typeof gptGeneration;
  importParsedCharacter: typeof importParsedCharacter;
  interactions: typeof interactions;
  items: typeof items;
  liveChatSystem: typeof liveChatSystem;
  liveEventSystem: typeof liveEventSystem;
  liveMapSystem: typeof liveMapSystem;
  liveRoomManager: typeof liveRoomManager;
  liveSystem: typeof liveSystem;
  liveSystemAPI: typeof liveSystemAPI;
  liveSystemHelpers: typeof liveSystemHelpers;
  liveTurnManager: typeof liveTurnManager;
  locations: typeof locations;
  mapMigration: typeof mapMigration;
  maps: typeof maps;
  monsters: typeof monsters;
  parseLogs: typeof parseLogs;
  questTasks: typeof questTasks;
  quests: typeof quests;
  sampleData: typeof sampleData;
  testLiveSystem: typeof testLiveSystem;
  timeline: typeof timeline;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
