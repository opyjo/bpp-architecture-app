export const kafkaConsumers = [
  { title: "subscription-consumer", body: "Reacts to lifecycle events (Dapr/Kafka). Keeps downstream read models and CPM in sync." },
  { title: "promoredeem-consumer", body: "Processes promo code redemption events. Applies promotional pricing once order is confirmed." },
  { title: "audit-api", body: "Also consumes from Kafka — ensures no action is missed even if the direct call fails." },
  { title: "notification-consumer", body: "Sends confirmation emails and push notifications to the customer after order and activation events." },
];

export const supportingInfra = [
  { service: "catalog-manager", role: "Keeps Redis catalog cache current by processing real-time product events" },
  { service: "flow-runner-api", role: "Executes multi-step business workflows (qualify → order → activate)" },
  { service: "event-hub", role: "Internal event bus — distributes domain events to all consumers" },
];

export interface KafkaEvent {
  id: string;
  title: string;
  topic: string;
  payload: string;
}

export const kafkaEvents: KafkaEvent[] = [
  {
    id: "ev-created",
    title: "OrderCreated",
    topic: "subscription.order.created",
    payload: `{
  "eventType":  "OrderCreated",
  "eventId":    "uuid-v4",
  "timestamp": "2024-01-15T10:30:00Z",
  "payload": {
    "orderId":             "string",
    "sessionId":           "string",
    "subscriptionId":      "string",
    "billingAccountNumber": "string",
    "tvAccountNumber":      "string",
    "productId":           "string",
    "providerId":          "string",
    "status":              "PENDING",
    "price":               9.99,
    "billingCycle":        "MONTHLY",
    "startDate":           "2024-01-15"
  }
}`,
  },
  {
    id: "ev-status",
    title: "StatusChanged",
    topic: "subscription.status.changed",
    payload: `{
  "eventType":  "StatusChanged",
  "eventId":    "uuid-v4",
  "timestamp": "2024-01-15T10:35:00Z",
  "payload": {
    "subscriptionId":      "string",
    "billingAccountNumber": "string",
    "previousStatus":      "PENDING",
    "newStatus":           "ACTIVE",
    "reason":              "string",
    "changedBy":           "customer | agent | system"
  }
}`,
  },
  {
    id: "ev-activation",
    title: "ActivationCompleted",
    topic: "subscription.activation.completed",
    payload: `{
  "eventType":  "ActivationCompleted",
  "eventId":    "uuid-v4",
  "timestamp": "2024-01-15T10:36:00Z",
  "payload": {
    "subscriptionId":      "string",
    "orderId":             "string",
    "billingAccountNumber": "string",
    "providerId":          "string",
    "activationUrl":       "string",
    "activatedAt":         "2024-01-15T10:36:00Z"
  }
}`,
  },
  {
    id: "ev-promo",
    title: "PromoRedeemed",
    topic: "subscription.promo.redeemed",
    payload: `{
  "eventType":  "PromoRedeemed",
  "eventId":    "uuid-v4",
  "timestamp": "2024-01-15T10:31:00Z",
  "payload": {
    "promoCode":           "string",
    "subscriptionId":      "string",
    "billingAccountNumber": "string",
    "discountType":        "PERCENTAGE | FIXED",
    "discountValue":       0.0,
    "validUntil":          "2024-04-15"
  }
}`,
  },
];
