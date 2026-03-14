export function username() {
  return {
    id: "username-policy",
    appliesTo: ["username"],
    decisionMatrix: {
      reservedTechnical: "reject",
      impersonation: "reject",
      protectedBrand: "review",
      profanity: "reject",
      insult: "reject",
      slur: "reject",
      sexual: "reject",
      scriptRisk: "review",
      compositeRisk: "review",
    },
  };
}
