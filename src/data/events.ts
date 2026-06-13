export const kafkaConsumers = [
  { title: "subscription-consumer", body: "Reacts to lifecycle events (Dapr/Kafka). Keeps downstream read models and CPM in sync." },
  { title: "promoredeem-consumer", body: "Processes promo code redemption events. Applies promotional pricing once order is confirmed." },
  { title: "promostream-consumer", body: "Processes promo code modification events (SQS). Updates DynamoDB promo codes table on changes." },
  { title: "audit-api", body: "Also consumes from Kafka — ensures no action is missed even if the direct call fails." },
  { title: "notification-consumer", body: "Sends confirmation emails, SMS, and push notifications to the customer after order and activation events (SQS)." },
  { title: "product-order-events-consumer", body: "Consumes DetailedProductOrderClosedEvent from the NM1 ordering system. Reconciles order state in HTS." },
  { title: "membership-event-consumer", body: "Consumes NM1 billing-account state-change and attribute-change events. Updates membership and Aeroplan partner links." },
  { title: "non-pay-billing-account-consumer", body: "Processes NM1 billing account events for non-pay accounts. Keeps billing state in sync." },
  { title: "customer-contract-agreements-consumer", body: "Consumes contract and agreement events. Tracks customer agreement lifecycle." },
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
  {
    id: "ev-promo-mod",
    title: "PromoModified",
    topic: "promocodes-modification (SQS)",
    payload: `{
  "eventType":  "PromoModified",
  "eventId":    "uuid-v4",
  "timestamp": "2024-01-15T11:00:00Z",
  "payload": {
    "promoCode":           "string",
    "action":              "CREATED | UPDATED | EXPIRED | REVOKED",
    "subscriptionId":      "string",
    "billingAccountNumber": "string",
    "discountType":        "PERCENTAGE | FIXED",
    "discountValue":       0.0,
    "validFrom":           "2024-01-15",
    "validUntil":          "2024-04-15"
  }
}`,
  },
  {
    id: "ev-fulfillment",
    title: "SubscriptionFulfillment",
    topic: "bsk-cm-bm-com-bmf-sb-request-subscription-fulfillment-hts-fit1",
    payload: `{
  "eventType":  "SubscriptionFulfillment",
  "eventId":    "uuid-v4",
  "timestamp": "2024-01-15T10:32:00Z",
  "payload": {
    "orderId":              "string",
    "sessionId":            "string",
    "subscriptionId":       "string",
    "billingAccountNumber": "string",
    "subscriberId":         "string",
    "productId":            "string",
    "action":               "ADD | CANCEL | CHANGE",
    "status":               "PENDING | PROCESSING | COMPLETED | FAILED"
  }
}`,
  },
  {
    id: "ev-billing",
    title: "SubscriptionBilling",
    topic: "bsk-cm-bm-com-bmf-sb-request-subscription-billing-hts-fit1",
    payload: `{
  "eventType":  "SubscriptionBilling",
  "eventId":    "uuid-v4",
  "timestamp": "2024-01-15T10:33:00Z",
  "payload": {
    "subscriptionId":       "string",
    "subscriberId":         "string",
    "billingAccountNumber": "string",
    "billingCycle":         "MONTHLY | QUARTERLY | ANNUAL",
    "amount":               9.99,
    "currency":             "CAD",
    "billingDate":          "2024-02-15",
    "status":               "INVOICED | PAID | OVERDUE"
  }
}`,
  },
  {
    id: "ev-product-order",
    title: "ProductOrderClosed",
    topic: "npe01-dr-pub-cm-product_order_event_tmf_notification-sft4",
    payload: `{
  "eventType":  "DetailedProductOrderClosedEvent",
  "eventId":    "uuid-v4",
  "timestamp": "2024-01-15T10:40:00Z",
  "payload": {
    "externalId":           "string  // HOI identifier",
    "customerId":           "string  // Golden key from CPM",
    "subEventType":         "string",
    "detailedProductOrder": {
      "id":                "string",
      "href":              "string",
      "state":             "COMPLETED | CANCELLED | FAILED",
      "orderDate":         "2024-01-15",
      "completionDate":    "2024-01-15",
      "productOrderItem":  [
        {
          "id":     "string",
          "action": "add | modify | delete",
          "state":  "completed",
          "product": { "name": "string", "value": "string" }
        }
      ]
    }
  }
}`,
  },
  {
    id: "ev-ba-state",
    title: "BillingAccountStateChanged",
    topic: "membership-nm1-events",
    payload: `{
  "eventType":  "BillingAccountStateChangeEvent",
  "eventId":    "uuid-v4",
  "eventTime":  "2024-01-15T10:45:00Z",
  "title":      "BillingAccountStateChangeEvent",
  "event": {
    "billingAccount": {
      "id":                "string",
      "accountNumber":     "string",
      "state":             "Active | Suspended | Closed",
      "previousState":     "Active",
      "stateChangeReason": "string",
      "accountType":       "individual | business",
      "customerId":        "string",
      "subscriberNumber":  "string",
      "effectiveDate":     "2024-01-15",
      "engagedParty":      []
    }
  }
}`,
  },
  {
    id: "ev-ba-attr",
    title: "BillingAccountAttributeChanged",
    topic: "membership-nm1-events",
    payload: `{
  "eventType":  "BillingAccountAttributeValueChangeEvent",
  "eventId":    "uuid-v4",
  "eventTime":  "2024-01-15T10:46:00Z",
  "title":      "BillingAccountAttributeValueChangeEvent",
  "event": {
    "billingAccount": {
      "id":               "string",
      "accountNumber":    "string",
      "state":            "Active",
      "characteristics":  [
        { "name": "string", "value": "string" }
      ],
      "customerId":       "string",
      "effectiveDate":    "2024-01-15"
    }
  }
}`,
  },
  {
    id: "ev-nonpay-ba",
    title: "NonPayBillingAccount",
    topic: "npe01-pub-cm-nm1-tmf_csm_events-uat2",
    payload: `{
  "eventType":  "BillingAccountStateChangeEvent",
  "eventId":    "uuid-v4",
  "eventTime":  "2024-01-15T10:47:00Z",
  "title":      "NonPayBillingAccountEvent",
  "event": {
    "billingAccount": {
      "id":                "string",
      "accountNumber":     "string",
      "state":             "Active | Suspended | Closed",
      "status":            "string",
      "accountType":       "string",
      "customerId":        "string",
      "businessId":        "string",
      "accountBalance":    0.0,
      "paymentMethod":     "string",
      "stateChangeReason": "string"
    }
  }
}`,
  },
  {
    id: "ev-contract",
    title: "CustomerContractAgreement",
    topic: "customer-contract-agreements",
    payload: `{
  "eventType":  "CustomerContractAgreementEvent",
  "eventId":    "uuid-v4",
  "eventTime":  "2024-01-15T10:50:00Z",
  "title":      "CustomerContractAgreement",
  "event": {
    "agreement": {
      "agreementType":   "string",
      "documentNumber":  "string",
      "name":            "string",
      "initialDate":     "2024-01-15",
      "completionDate":  "2025-01-15",
      "agreementItem":   [],
      "characteristic":  [
        { "name": "string", "value": "string" }
      ],
      "engagedParty":    []
    }
  }
}`,
  },
  {
    id: "ev-notification",
    title: "NotificationDispatched",
    topic: "notifications-queue (SQS)",
    payload: `{
  "eventType":  "NotificationDispatched",
  "eventId":    "uuid-v4",
  "timestamp": "2024-01-15T10:37:00Z",
  "payload": {
    "title":    "string",
    "message":  "string",
    "type":     "email | sms | push",
    "from":     "string",
    "to":       ["string"],
    "source":   "string",
    "template": {
      "file":      "string",
      "variables": { "key": "value" }
    }
  }
}`,
  },
  {
    id: "ev-subscriber",
    title: "SubscriberChanged",
    topic: "Subscriber",
    payload: `{
  "eventType":  "SubscriberChanged",
  "eventId":    "uuid-v4",
  "timestamp": "2024-01-15T10:48:00Z",
  "payload": {
    "subscriberId":         "string",
    "billingAccountNumber": "string",
    "action":               "CREATED | UPDATED | DELETED",
    "membershipStatus":     "ACTIVE | INACTIVE | SUSPENDED",
    "partnerLinks":         [
      { "partnerId": "string", "status": "string" }
    ]
  }
}`,
  },
];
