export function tenantName() {
  return {
    id: "tenant-name-policy",
    appliesTo: ["tenantName"],
    decisionMatrix: {
      reservedTechnical: "reject",
      impersonation: "review",
      protectedBrand: "review",
      profanity: "reject",
      scriptRisk: "review",
      compositeRisk: "review"
    }
  };
}
