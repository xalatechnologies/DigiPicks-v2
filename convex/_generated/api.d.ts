/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as ai from "../ai.js";
import type * as applications from "../applications.js";
import type * as audit from "../audit.js";
import type * as auth from "../auth.js";
import type * as categories from "../categories.js";
import type * as channels from "../channels.js";
import type * as creators from "../creators.js";
import type * as crons from "../crons.js";
import type * as discord from "../discord.js";
import type * as discordSettings from "../discordSettings.js";
import type * as disputes from "../disputes.js";
import type * as dmThreads from "../dmThreads.js";
import type * as events from "../events.js";
import type * as feed from "../feed.js";
import type * as files from "../files.js";
import type * as followedCreators from "../followedCreators.js";
import type * as gdpr from "../gdpr.js";
import type * as http from "../http.js";
import type * as listings from "../listings.js";
import type * as liveScores from "../liveScores.js";
import type * as messages from "../messages.js";
import type * as mfa from "../mfa.js";
import type * as migrations from "../migrations.js";
import type * as notifications from "../notifications.js";
import type * as notify from "../notify.js";
import type * as odds from "../odds.js";
import type * as oddsApi from "../oddsApi.js";
import type * as payouts from "../payouts.js";
import type * as picks from "../picks.js";
import type * as pricingTiers from "../pricingTiers.js";
import type * as push from "../push.js";
import type * as pushSubscriptions from "../pushSubscriptions.js";
import type * as referrals from "../referrals.js";
import type * as savedPicks from "../savedPicks.js";
import type * as search from "../search.js";
import type * as seed from "../seed.js";
import type * as shared_aiParse from "../shared/aiParse.js";
import type * as shared_permissions from "../shared/permissions.js";
import type * as shared_rateLimit from "../shared/rateLimit.js";
import type * as shared_retry from "../shared/retry.js";
import type * as shared_validators from "../shared/validators.js";
import type * as sources_cricketWriter from "../sources/cricketWriter.js";
import type * as sources_espncricinfo from "../sources/espncricinfo.js";
import type * as streams from "../streams.js";
import type * as stripe from "../stripe.js";
import type * as subscriberStats from "../subscriberStats.js";
import type * as subscriptions from "../subscriptions.js";
import type * as teamLogos from "../teamLogos.js";
import type * as telegram from "../telegram.js";
import type * as trending from "../trending.js";
import type * as trust from "../trust.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  ai: typeof ai;
  applications: typeof applications;
  audit: typeof audit;
  auth: typeof auth;
  categories: typeof categories;
  channels: typeof channels;
  creators: typeof creators;
  crons: typeof crons;
  discord: typeof discord;
  discordSettings: typeof discordSettings;
  disputes: typeof disputes;
  dmThreads: typeof dmThreads;
  events: typeof events;
  feed: typeof feed;
  files: typeof files;
  followedCreators: typeof followedCreators;
  gdpr: typeof gdpr;
  http: typeof http;
  listings: typeof listings;
  liveScores: typeof liveScores;
  messages: typeof messages;
  mfa: typeof mfa;
  migrations: typeof migrations;
  notifications: typeof notifications;
  notify: typeof notify;
  odds: typeof odds;
  oddsApi: typeof oddsApi;
  payouts: typeof payouts;
  picks: typeof picks;
  pricingTiers: typeof pricingTiers;
  push: typeof push;
  pushSubscriptions: typeof pushSubscriptions;
  referrals: typeof referrals;
  savedPicks: typeof savedPicks;
  search: typeof search;
  seed: typeof seed;
  "shared/aiParse": typeof shared_aiParse;
  "shared/permissions": typeof shared_permissions;
  "shared/rateLimit": typeof shared_rateLimit;
  "shared/retry": typeof shared_retry;
  "shared/validators": typeof shared_validators;
  "sources/cricketWriter": typeof sources_cricketWriter;
  "sources/espncricinfo": typeof sources_espncricinfo;
  streams: typeof streams;
  stripe: typeof stripe;
  subscriberStats: typeof subscriberStats;
  subscriptions: typeof subscriptions;
  teamLogos: typeof teamLogos;
  telegram: typeof telegram;
  trending: typeof trending;
  trust: typeof trust;
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

export declare const components: {
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
