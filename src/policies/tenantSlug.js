export function tenantSlug() {
  return {
    id: "tenant-slug-policy",
    appliesTo: ["tenantSlug"],
    decisionMatrix: {
      reservedTechnical: "reject",
      impersonation: "reject",
      protectedBrand: "review",
      profanity: "reject",
      insult: "reject",
      slur: "reject",
      sexual: "reject",
      shock: "reject",
      scriptRisk: "review",
      compositeRisk: "reject",
    },
  };
}
