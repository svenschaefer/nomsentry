export const DEFAULT_KIND = "default";

export function defaultPolicy() {
  return {
    id: "default-policy",
    appliesTo: [DEFAULT_KIND],
    decisionMatrix: {
      reservedTechnical: "reject",
      impersonation: "reject",
      protectedBrand: "review",
      profanity: "reject",
      generalProfanity: "reject",
      insult: "reject",
      slur: "reject",
      sexual: "reject",
      shock: "reject",
      scriptRisk: "review",
      compositeRisk: "reject",
    },
  };
}
