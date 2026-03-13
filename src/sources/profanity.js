export function profanity() {
  return {
    id: "builtin-profanity",
    rules: [
      {
        id: "profanity/example",
        term: "damn",
        category: "profanity",
        scopes: ["username", "tenantSlug", "tenantName"],
        match: "token",
        normalizationField: "confusableSkeleton"
      }
    ]
  };
}
