export function impersonation() {
  return {
    id: "builtin-impersonation",
    rules: [
      {
        id: "impersonation/support",
        term: "support",
        category: "impersonation",
        scopes: ["username", "tenantSlug", "tenantName"],
        match: "token",
        normalizationField: "confusableSkeleton"
      },
      {
        id: "impersonation/security",
        term: "security",
        category: "impersonation",
        scopes: ["username", "tenantSlug", "tenantName"],
        match: "token",
        normalizationField: "confusableSkeleton"
      }
    ],
    compositeRules: [
      {
        id: "composite/security-support",
        term: "security+support",
        category: "compositeRisk",
        scopes: ["username", "tenantSlug", "tenantName"],
        allOf: ["security", "support"]
      }
    ]
  };
}
