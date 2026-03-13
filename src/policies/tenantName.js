export function tenantName() {
  return {
    id: "tenant-name-policy",
    appliesTo: ["tenantName"],
    decisionMatrix: {
      reservedTechnical: "reject",
      impersonation: "review",
      protectedBrand: "reject",
      profanity: "review",
      scriptRisk: "review",
      compositeRisk: "review"
    }
  };
}
