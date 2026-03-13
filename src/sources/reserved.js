export function reserved() {
  return {
    id: "builtin-reserved",
    rules: [
      {
        id: "reserved/admin",
        term: "admin",
        category: "reservedTechnical",
        scopes: ["username", "tenantSlug"],
        match: "token",
        normalizationField: "confusableSkeleton"
      },
      {
        id: "reserved/root",
        term: "root",
        category: "reservedTechnical",
        scopes: ["username", "tenantSlug"],
        match: "token",
        normalizationField: "separatorFolded"
      }
    ]
  };
}
