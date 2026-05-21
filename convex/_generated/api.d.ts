/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as access from '../access.js';
import type * as admin from '../admin.js';
import type * as ai from '../ai.js';
import type * as aiCopilot_mutations from '../aiCopilot/mutations.js';
import type * as aiCopilot_prompt from '../aiCopilot/prompt.js';
import type * as aiCopilot_queries from '../aiCopilot/queries.js';
import type * as aiCopilot_respond from '../aiCopilot/respond.js';
import type * as aiCopilot_scrub from '../aiCopilot/scrub.js';
import type * as aiCopilot_tools from '../aiCopilot/tools.js';
import type * as applications from '../applications.js';
import type * as audit from '../audit.js';
import type * as auth from '../auth.js';
import type * as autoGrader from '../autoGrader.js';
import type * as billingCases from '../billingCases.js';
import type * as categories from '../categories.js';
import type * as channels from '../channels.js';
import type * as connect from '../connect.js';
import type * as coupons from '../coupons.js';
import type * as creators from '../creators.js';
import type * as crons from '../crons.js';
import type * as devProvision from '../devProvision.js';
import type * as devProvisionActions from '../devProvisionActions.js';
import type * as devProvisionTypes from '../devProvisionTypes.js';
import type * as discord_channels from '../discord/channels.js';
import type * as discord_delivery from '../discord/delivery.js';
import type * as discord_events from '../discord/events.js';
import type * as discord_gdpr from '../discord/gdpr.js';
import type * as discord_inbound from '../discord/inbound.js';
import type * as discord_integrations from '../discord/integrations.js';
import type * as discord_integrationsDb from '../discord/integrationsDb.js';
import type * as discord_oauth from '../discord/oauth.js';
import type * as discord_retry from '../discord/retry.js';
import type * as discord_sentiment from '../discord/sentiment.js';
import type * as discord_threads from '../discord/threads.js';
import type * as discordSettings from '../discordSettings.js';
import type * as disputes from '../disputes.js';
import type * as dmThreads from '../dmThreads.js';
import type * as email from '../email.js';
import type * as emailVerification from '../emailVerification.js';
import type * as entitlements from '../entitlements.js';
import type * as events from '../events.js';
import type * as feed from '../feed.js';
import type * as files from '../files.js';
import type * as followedCreators from '../followedCreators.js';
import type * as gdpr from '../gdpr.js';
import type * as http from '../http.js';
import type * as lineMovement from '../lineMovement.js';
import type * as listings from '../listings.js';
import type * as liveScores from '../liveScores.js';
import type * as messages from '../messages.js';
import type * as mfa from '../mfa.js';
import type * as migrations from '../migrations.js';
import type * as notifications from '../notifications.js';
import type * as notify from '../notify.js';
import type * as odds from '../odds.js';
import type * as oddsApi from '../oddsApi.js';
import type * as payouts from '../payouts.js';
import type * as picks from '../picks.js';
import type * as pricingTiers from '../pricingTiers.js';
import type * as push from '../push.js';
import type * as pushSubscriptions from '../pushSubscriptions.js';
import type * as referrals from '../referrals.js';
import type * as savedPicks from '../savedPicks.js';
import type * as search from '../search.js';
import type * as seed from '../seed.js';
import type * as shared_aiParse from '../shared/aiParse.js';
import type * as shared_circuit from '../shared/circuit.js';
import type * as shared_devAdminDefaults from '../shared/devAdminDefaults.js';
import type * as shared_permissions from '../shared/permissions.js';
import type * as shared_platformFees from '../shared/platformFees.js';
import type * as shared_rateLimit from '../shared/rateLimit.js';
import type * as shared_retry from '../shared/retry.js';
import type * as shared_sentryNode from '../shared/sentryNode.js';
import type * as shared_sportKeyMap from '../shared/sportKeyMap.js';
import type * as shared_validators from '../shared/validators.js';
import type * as sources_cricketWriter from '../sources/cricketWriter.js';
import type * as sources_espncricinfo from '../sources/espncricinfo.js';
import type * as streams from '../streams.js';
import type * as stripe from '../stripe.js';
import type * as stripeIdempotency from '../stripeIdempotency.js';
import type * as subscriberStats from '../subscriberStats.js';
import type * as subscriptions from '../subscriptions.js';
import type * as teamLogos from '../teamLogos.js';
import type * as telegram from '../telegram.js';
import type * as trending from '../trending.js';
import type * as trust from '../trust.js';
import type * as users from '../users.js';
import type * as watchlists from '../watchlists.js';

import type { ApiFromModules, FilterApi, FunctionReference } from 'convex/server';

declare const fullApi: ApiFromModules<{
  access: typeof access;
  admin: typeof admin;
  ai: typeof ai;
  'aiCopilot/mutations': typeof aiCopilot_mutations;
  'aiCopilot/prompt': typeof aiCopilot_prompt;
  'aiCopilot/queries': typeof aiCopilot_queries;
  'aiCopilot/respond': typeof aiCopilot_respond;
  'aiCopilot/scrub': typeof aiCopilot_scrub;
  'aiCopilot/tools': typeof aiCopilot_tools;
  applications: typeof applications;
  audit: typeof audit;
  auth: typeof auth;
  autoGrader: typeof autoGrader;
  billingCases: typeof billingCases;
  categories: typeof categories;
  channels: typeof channels;
  connect: typeof connect;
  coupons: typeof coupons;
  creators: typeof creators;
  crons: typeof crons;
  devProvision: typeof devProvision;
  devProvisionActions: typeof devProvisionActions;
  devProvisionTypes: typeof devProvisionTypes;
  'discord/channels': typeof discord_channels;
  'discord/delivery': typeof discord_delivery;
  'discord/events': typeof discord_events;
  'discord/gdpr': typeof discord_gdpr;
  'discord/inbound': typeof discord_inbound;
  'discord/integrations': typeof discord_integrations;
  'discord/integrationsDb': typeof discord_integrationsDb;
  'discord/oauth': typeof discord_oauth;
  'discord/retry': typeof discord_retry;
  'discord/sentiment': typeof discord_sentiment;
  'discord/threads': typeof discord_threads;
  discordSettings: typeof discordSettings;
  disputes: typeof disputes;
  dmThreads: typeof dmThreads;
  email: typeof email;
  emailVerification: typeof emailVerification;
  entitlements: typeof entitlements;
  events: typeof events;
  feed: typeof feed;
  files: typeof files;
  followedCreators: typeof followedCreators;
  gdpr: typeof gdpr;
  http: typeof http;
  lineMovement: typeof lineMovement;
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
  'shared/aiParse': typeof shared_aiParse;
  'shared/circuit': typeof shared_circuit;
  'shared/devAdminDefaults': typeof shared_devAdminDefaults;
  'shared/permissions': typeof shared_permissions;
  'shared/platformFees': typeof shared_platformFees;
  'shared/rateLimit': typeof shared_rateLimit;
  'shared/retry': typeof shared_retry;
  'shared/sentryNode': typeof shared_sentryNode;
  'shared/sportKeyMap': typeof shared_sportKeyMap;
  'shared/validators': typeof shared_validators;
  'sources/cricketWriter': typeof sources_cricketWriter;
  'sources/espncricinfo': typeof sources_espncricinfo;
  streams: typeof streams;
  stripe: typeof stripe;
  stripeIdempotency: typeof stripeIdempotency;
  subscriberStats: typeof subscriberStats;
  subscriptions: typeof subscriptions;
  teamLogos: typeof teamLogos;
  telegram: typeof telegram;
  trending: typeof trending;
  trust: typeof trust;
  users: typeof users;
  watchlists: typeof watchlists;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<typeof fullApi, FunctionReference<any, 'public'>>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<typeof fullApi, FunctionReference<any, 'internal'>>;

export declare const components: {
  rateLimiter: import('@convex-dev/rate-limiter/_generated/component.js').ComponentApi<'rateLimiter'>;
};
