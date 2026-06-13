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
  {
    id: "p-proxy",
    title: "proxyRouter",
    description: "Routes HTTP requests from API Gateway. Detects the incoming payload type (AppSync message, AppSync authorizer, or API Gateway proxy) and forwards to the appropriate service.",
    requestComment: "// POST /api/protected/graphql → AppSync → router Lambda",
    request: `{
  "mutation": "proxyRouter",
  "variables": {
    "input": {
      "httpMethod":             "string",
      "headers":                [{ "key": "string", "value": "string" }],
      "queryStringParameters":  [{ "key": "string", "value": "string" }],
      "pathParameters":         [{ "key": "string", "value": "string" }],
      "body":                   "string",
      "isBase64Encoded":        false
    }
  }
}`,
    response: `{
  "data": {
    "proxyRouter": {
      "StatusCode":      200,
      "Headers":         [{ "key": "string", "value": "string" }],
      "Body":            "string",
      "IsBase64Encoded": false
    }
  }
}`,
  },
  {
    id: "p-convert",
    title: "convertToOrder",
    description: "Converts a subscription session into an order. Calls the Configurator API's /cart/convertToOrder endpoint, then enriches the response with Product Catalog data (promotions, offerings).",
    requestComment: "// POST /api/protected/graphql → AppSync → subscriptionToOrder Lambda → Configurator API + Product Catalog API",
    request: `{
  "mutation": "convertToOrder",
  "variables": {
    "input": {
      "sessionId":     "string",
      "expiryWindow":  "string  // optional"
    }
  }
}`,
    response: `{
  "data": {
    "convertToOrder": {
      "id":                   "string",
      "status":               "string",
      "originatingDateTime":  "ISO-8601 timestamp",
      "originatingFrom":      { "type": "string", "systemName": "string" },
      "sessionItems":         [
        {
          "id":     "string",
          "type":   "string",
          "action": "string",
          "status": "string"
        }
      ],
      "subscribers": [],
      "sessionTotals": []
    }
  }
}`,
  },
  {
    id: "p-update",
    title: "updateSession",
    description: "Updates an existing session with customer information, context (product lines on order), sales rep info, and session items. Makes a PATCH request to the Session API.",
    requestComment: "// POST /api/protected/graphql → AppSync → updateSession Lambda → Session API",
    request: `{
  "mutation": "updateSession",
  "variables": {
    "input": {
      "id":           "string",
      "customerInfo": {
        "billingAccountNumber": "string",
        "province":             "string",
        "subscriberId":         "string",
        "language":             "string"
      },
      "contextInfo": {
        "productLinesOnOrder": [
          {
            "action":      "string",
            "productLine": "string"
          }
        ]
      },
      "salesRepInfo": {
        "capability":    "string",
        "channelId":     "string",
        "dealerCode":    "string"
      }
    }
  }
}`,
    response: `{
  "data": {
    "updateSession": {
      "id": "string"
    }
  }
}`,
  },
  {
    id: "p-update-v2",
    title: "updateSessionV2",
    description: "Enhanced version of updateSession. Adds channel and interaction parameters, and returns both session ID and subscriber ID. Session ID is required.",
    requestComment: "// POST /api/protected/graphql → AppSync → updateSession Lambda → Session API",
    request: `{
  "mutation": "updateSessionV2",
  "variables": {
    "input": {
      "id":          "string!",
      "channel":     "string",
      "interaction": "string",
      "customerInfo": {
        "billingAccountNumber": "string",
        "province":             "string",
        "subscriberId":         "string"
      },
      "contextInfo": {
        "productLinesOnOrder": [
          {
            "action":      "string",
            "productLine": "string",
            "productLineItems": [
              { "id": "string", "action": "string" }
            ]
          }
        ]
      },
      "salesRepInfo": {
        "capability": "string",
        "channelId":  "string"
      }
    }
  }
}`,
    response: `{
  "data": {
    "updateSessionV2": {
      "id":           "string",
      "subscriberId": "string"
    }
  }
}`,
  },
  {
    id: "p-sub-eh",
    title: "submitSubscriptionEH",
    description: "Submits a subscription for fulfillment via an AWS Step Function state machine. Polls the Step Function until completion and returns fulfillment results from the reseller service.",
    requestComment: "// POST /api/protected/graphql → AppSync → subscriptionSubmitEH Lambda → Step Function → reseller-service",
    request: `{
  "mutation": "submitSubscriptionEH",
  "variables": {
    "input": {
      "sessionId": "string!"
    }
  }
}`,
    response: `{
  "data": {
    "submitSubscriptionEH": {
      "subscriberId":  "string",
      "subscriptions": [
        {
          "subscriptionId": "string",
          "status":         "string",
          "productKey":     "string"
        }
      ]
    }
  }
}`,
  },
  {
    id: "p-recommend",
    title: "subscriptionRecommendation",
    description: "Generates personalized subscription recommendations based on customer province, existing product lines, and channel context. Can use data-driven logic (Configurator Pre-Qualification API) or phase-based hardcoded rules.",
    requestComment: "// POST /api/protected/graphql → AppSync → subscriptionRecommendation Lambda → Configurator API + Product Catalog API",
    request: `{
  "mutation": "subscriptionRecommendation",
  "variables": {
    "input": {
      "id":          "string!",
      "channel":     "string!",
      "interaction": "string",
      "brand":       "string",
      "customerInfo": {
        "billingAccountNumber": "string",
        "province":             "string!",
        "existingProductLines": [
          { "id": "string", "productLine": "string" }
        ]
      },
      "recommendationInfo": {
        "items": [
          { "id": "string", "action": "string", "itemType": "string" }
        ]
      }
    }
  }
}`,
    response: `{
  "data": {
    "subscriptionRecommendation": {
      "id":                   "string",
      "originatingDateTime":  "ISO-8601 timestamp",
      "recommendationItems": [
        {
          "id":     "string",
          "state":  "string",
          "type":   "string",
          "action": "string",
          "productOffering": {
            "id":    "string",
            "rank":  1,
            "prices": [{ "id": "string", "priceType": "string", "price": 9.99 }]
          },
          "promotionSpecification": {
            "id":    "string",
            "names": [{ "locale": "en", "string": "string" }]
          }
        }
      ]
    }
  }
}`,
  },
  {
    id: "p-prequal",
    title: "subscriptionPreQualification",
    description: "Determines which products and promotions a customer qualifies for. Calls the Configurator Pre-Qualification API, filters by channel (EShop returns all; OrderMax returns recommended only), and enriches from Product Catalog API.",
    requestComment: "// POST /api/protected/graphql → AppSync → subscriptionPreQualification Lambda → Configurator API + Product Catalog API",
    request: `{
  "mutation": "subscriptionPreQualification",
  "variables": {
    "input": {
      "id":          "string!",
      "channel":     "string!",
      "interaction": "string",
      "brand":       "string",
      "customerInfo": {
        "billingAccountNumber": "string",
        "province":             "string!",
        "existingProductLines": [
          { "id": "string", "productLine": "string" }
        ]
      },
      "preQualificationInfo": {
        "items": [
          { "id": "string", "action": "string", "itemType": "string" }
        ]
      },
      "salesRepInfo": {
        "capability": "string!"
      }
    }
  }
}`,
    response: `{
  "data": {
    "subscriptionPreQualification": {
      "id":                     "string",
      "originatingDateTime":    "ISO-8601 timestamp",
      "preQualificationItems": [
        {
          "id":     "string",
          "state":  "string",
          "type":   "string",
          "action": "string",
          "productOffering": {
            "id":       "string",
            "isBundle": false,
            "rank":     1,
            "prices":   [{ "id": "string", "priceType": "string", "price": 9.99 }]
          },
          "promotionSpecification": {
            "id":    "string",
            "names": [{ "locale": "en", "string": "string" }]
          }
        }
      ]
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
