export function tenantName() {
  return {
    id: "tenant-name-policy",
    appliesTo: ["tenantName"],
    decisionMatrix: {
      reservedTechnical: "reject",
      impersonation: "review",
      protectedBrand: "review",
      profanity: "reject",
      generalProfanity: "reject",
      insult: "reject",
      slur: "reject",
      sexual: "reject",
      shock: "reject",
      scriptRisk: "review",
      compositeRisk: "review",
    },
  };
}
