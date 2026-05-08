/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as applications from "../applications.js";
import type * as audit from "../audit.js";
import type * as auth from "../auth.js";
import type * as categories from "../categories.js";
import type * as creators from "../creators.js";
import type * as crons from "../crons.js";
import type * as events from "../events.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as listings from "../listings.js";
import type * as liveScores from "../liveScores.js";
import type * as messages from "../messages.js";
import type * as migrations from "../migrations.js";
import type * as notifications from "../notifications.js";
import type * as picks from "../picks.js";
import type * as search from "../search.js";
import type * as seed from "../seed.js";
import type * as shared_permissions from "../shared/permissions.js";
import type * as shared_validators from "../shared/validators.js";
import type * as subscriptions from "../subscriptions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  applications: typeof applications;
  audit: typeof audit;
  auth: typeof auth;
  categories: typeof categories;
  creators: typeof creators;
  crons: typeof crons;
  events: typeof events;
  files: typeof files;
  http: typeof http;
  listings: typeof listings;
  liveScores: typeof liveScores;
  messages: typeof messages;
  migrations: typeof migrations;
  notifications: typeof notifications;
  picks: typeof picks;
  search: typeof search;
  seed: typeof seed;
  "shared/permissions": typeof shared_permissions;
  "shared/validators": typeof shared_validators;
  subscriptions: typeof subscriptions;
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
