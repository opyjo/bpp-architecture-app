export interface PayloadSection {
  id: string;
  title: string;
  description: string;
  request?: string;
  response?: string;
  requestComment?: string;
}

export const mutations: PayloadSection[] = [
  {
    id: "p-gen",
    title: "generateSession",
    description: 'Called when a customer clicks "Add" or "Change Plan". Creates a session in DynamoDB and validates the account via CPM (household-api).',
    requestComment: "// POST /api/protected/graphql → AppSync → session-api + household-api",
    request: `{
  "mutation": "generateSession",
  "variables": {
    "customerInfo": {
      "householdAccountNumber": "string",
      "billingAccountNumber":  "string",
      "tvAccountNumber":       "string"
    },
    "billingAccountNumber": "string"
  }
}`,
    response: `{
  "data": {
    "generateSession": {
      "sessionId":  "string",
      "status":    "CREATED",
      "expiresAt": "ISO-8601 timestamp"
    }
  }
}`,
  },
  {
    id: "p-qual",
    title: "subscriptionQualification",
    description: "Called on every plan selection. The operationType field determines the type of action being qualified.",
    request: `{
  "mutation": "subscriptionQualification",
  "variables": {
    "sessionId":      "string",
    "operationType": "APPLY_TO_ORDER | DELETE | REVERSE_DELETE | REVERSE_DOWNGRADE",
    "accountNumber": "string",
    "subscriptionId": "string  // optional — for change / cancel"
  }
}`,
    response: `{
  "data": {
    "subscriptionQualification": {
      "eligible": true,
      "plans": [
        {
          "productId":    "string",
          "name":         "string",
          "price":        9.99,
          "billingCycle": "MONTHLY",
          "promotions":   []
        }
      ],
      "sessionId": "string"
    }
  }
}`,
  },
  {
    id: "p-sub",
    title: "submitSubscription",
    description: "Places the order. reseller-service writes to PostgreSQL, calls merchant-api-*, publishes to Kafka, and logs to audit-api. Also used for Cancel and Change Plan flows.",
    request: `{
  "mutation": "submitSubscription",
  "variables": {
    "sessionId": "string",
    "selectedPlan": {
      "productId":    "string",
      "billingCycle": "MONTHLY"
    }
  }
}`,
    response: `{
  "data": {
    "submitSubscription": {
      "orderId":        "string",
      "subscriptionId": "string",
      "status":         "PENDING",
      "createdAt":      "ISO-8601 timestamp"
    }
  }
}`,
  },
  {
    id: "p-act",
    title: "activateSubscription",
    description: "Triggered on the confirm screen. Provisions with the provider and returns a redirect URL for the customer.",
    request: `{
  "mutation": "activateSubscription",
  "variables": {
    "subscriptionId": "string"
  }
}`,
    response: `{
  "data": {
    "activateSubscription": {
      "subscriptionId": "string",
      "status":         "ACTIVE",
      "activationUrl":  "string  // redirect URL to provider",
      "activatedAt":    "ISO-8601 timestamp"
    }
  }
}`,
  },
  {
    id: "p-clone",
    title: "cloneSession",
    description: "Agent flow only. Clones the customer's existing session and links the agent's actions to the original order number in the audit trail.",
    request: `{
  "mutation": "cloneSession",
  "variables": {
    "orderNumber": "string"
  }
}`,
    response: `{
  "data": {
    "cloneSession": {
      "sessionId":              "string",
      "clonedFromOrderNumber": "string",
      "status":                 "CLONED",
      "expiresAt":             "ISO-8601 timestamp"
    }
  }
}`,
  },
  {
    id: "p-rec",
    title: "accountRecovery",
    description: "Triggers an account recovery flow. Returns a URL the customer uses to complete recovery.",
    request: `{
  "mutation": "accountRecovery",
  "variables": {
    "billingAccountNumber": "string",
    "recoveryType":        "string"
  }
}`,
    response: `{
  "data": {
    "accountRecovery": {
      "recoveryUrl": "string",
      "status":      "INITIATED",
      "expiresAt":  "ISO-8601 timestamp"
    }
  }
}`,
  },
];

export const restCalls = [
  { endpoint: "GET /subscriptions?tvAccountNumber=...", bffRoute: "/api/protected/subscriptions", service: "subscriptions-aggregator-api", returns: "List of active/past subscriptions (PostgreSQL + CPM)" },
  { endpoint: "POST /ciam/retrieve/bans", bffRoute: "/api/auth/*", service: "Auth / CIAM service", returns: "Billing Account Numbers for the logged-in user" },
];

export const accountIdentifiers = [
  { field: "householdAccountNumber", description: "Primary Bell household identifier — used as URL query param" },
  { field: "billingAccountNumber (BAN)", description: "Billing-specific identifier — passed to generateSession" },
  { field: "tvAccountNumber", description: "Bell Fibe TV account — used in GET /subscriptions" },
  { field: "mobilityAccountNumber", description: "Bell Mobility account identifier" },
];

export const subscriptionFields = [
  { field: "subscriptionID", type: "string", description: "Unique identifier" },
  { field: "status", type: "enum", description: "ACTIVE · SUSPENDED · CANCELLED · PENDING" },
  { field: "billingCycle", type: "enum", description: "MONTHLY · QUARTERLY · ANNUAL" },
  { field: "price", type: "decimal", description: "Amount charged per cycle" },
  { field: "startDate", type: "date", description: "Service start" },
  { field: "endDate", type: "date", description: "Service end / renewal date" },
];

export const sessionFields = [
  { field: "sessionID", type: "string", description: "Unique token stored in DynamoDB with TTL" },
  { field: "customerInfo", type: "object", description: "Account number, contact details" },
  { field: "cart", type: "object", description: "Items, totals, categories in-progress" },
];
