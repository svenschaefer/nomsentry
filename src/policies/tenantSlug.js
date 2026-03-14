export function tenantSlug() {
  return {
    id: "tenant-slug-policy",
    appliesTo: ["tenantSlug"],
    decisionMatrix: {
      reservedTechnical: "reject",
      impersonation: "reject",
      protectedBrand: "review",
      profanity: "reject",
      scriptRisk: "review",
      compositeRisk: "reject",
    },
  };
}
