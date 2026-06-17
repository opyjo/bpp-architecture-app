// Types
export type { ServiceDeepDive, ServiceStatus, MerchantGroupData, MerchantApiInfo, LambdaOverviewData, LambdaCategory } from "./types";

// Core Subscription
export { resellerService, subscriptionsAggregatorApi, subscriberManagerApi, subscriptionConfiguratorApi, subscriptionConsumer, coreSubscriptionServices } from "./core-subscription";

// Subscription Manager (Legacy)
export { subscriptionManagerApi } from "./subscription-manager-legacy";

// Merchants
export { merchantGroupData } from "./merchants";

// Catalog & Products
export { catalogApi, catalogManager, productCatalogApi, catalogProductsServices } from "./catalog-products";

// Auth & Session
export { authApi, sessionApi, tokenApi, disneyAuthApi, authSessionServices } from "./auth-session";

// Promotions
export { promocodesApi, promoredeemConsumer, promostreamConsumer, promoMigrationConsumer, promotionsServices } from "./promotions";

// Events & Messaging
export { eventHub, eventPublisher, notificationConsumer, eventsMessagingServices } from "./events-messaging";

// Orders & Billing
export { orderApi, coreProcessorApi, auditApi, ordersBillingServices } from "./orders-billing";

// Flow & Orchestration
export { flowRunnerApi, householdApi, accountRecoveryApi, flowOrchestrationServices } from "./flow-orchestration";

// Infrastructure
export { httpProxyApi, emailApi, policyRuleConfigurator, infrastructureServices } from "./infrastructure";

// Lambda Overview
export { lambdaOverviewData } from "./lambda-overview";

// ─── Backward-compatible aggregates ─────────────────────────────────────────

import { resellerService } from "./core-subscription";
import { subscriptionManagerApi } from "./subscription-manager-legacy";
import { orderApi } from "./orders-billing";
import { tokenApi } from "./auth-session";
import type { ServiceDeepDive } from "./types";

// All individual ServiceDeepDive objects (every Go service with a deep dive)
import { subscriptionsAggregatorApi, subscriberManagerApi, subscriptionConfiguratorApi, subscriptionConsumer } from "./core-subscription";
import { catalogApi, catalogManager, productCatalogApi } from "./catalog-products";
import { authApi, sessionApi, disneyAuthApi } from "./auth-session";
import { promocodesApi, promoredeemConsumer, promostreamConsumer, promoMigrationConsumer } from "./promotions";
import { eventHub, eventPublisher, notificationConsumer } from "./events-messaging";
import { coreProcessorApi, auditApi } from "./orders-billing";
import { flowRunnerApi, householdApi, accountRecoveryApi } from "./flow-orchestration";
import { httpProxyApi, emailApi, policyRuleConfigurator } from "./infrastructure";

/** Original 4 services — backward compatible */
export const serviceDeepDives: ServiceDeepDive[] = [
  resellerService,
  subscriptionManagerApi,
  orderApi,
  tokenApi,
];

/** All services with deep dives */
export const allServiceDeepDives: ServiceDeepDive[] = [
  // Core Subscription
  resellerService,
  subscriptionsAggregatorApi,
  subscriberManagerApi,
  subscriptionConfiguratorApi,
  subscriptionConsumer,
  // Subscription Manager (Legacy)
  subscriptionManagerApi,
  // Catalog & Products
  catalogApi,
  catalogManager,
  productCatalogApi,
  // Auth & Session
  authApi,
  sessionApi,
  tokenApi,
  disneyAuthApi,
  // Orders & Billing
  orderApi,
  coreProcessorApi,
  auditApi,
  // Promotions
  promocodesApi,
  promoredeemConsumer,
  promostreamConsumer,
  promoMigrationConsumer,
  // Events & Messaging
  eventHub,
  eventPublisher,
  notificationConsumer,
  // Flow & Orchestration
  flowRunnerApi,
  householdApi,
  accountRecoveryApi,
  // Infrastructure
  httpProxyApi,
  emailApi,
  policyRuleConfigurator,
];

export function getServiceById(id: string): ServiceDeepDive | undefined {
  return allServiceDeepDives.find((s) => s.id === id);
}
