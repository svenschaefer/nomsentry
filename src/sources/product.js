export function product() {
  return {
    id: "builtin-product",
    rules: [
      {
        id: "product/openai",
        term: "openai",
        category: "protectedBrand",
        scopes: ["username", "tenantSlug", "tenantName"],
        match: "token",
        normalizationField: "confusableSkeleton"
      },
      {
        id: "product/secos",
        term: "secos",
        category: "protectedBrand",
        scopes: ["username", "tenantSlug", "tenantName"],
        match: "token",
        normalizationField: "confusableSkeleton"
      }
    ]
  };
}
