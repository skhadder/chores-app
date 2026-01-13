export const HOUSE_ID = process.env.NEXT_PUBLIC_HOUSE_ID || "house_alpha_phi_test";

// Optional: Add a label to show which environment
export const ENVIRONMENT = process.env.NEXT_PUBLIC_ENVIRONMENT || "demo";
export const IS_PRODUCTION = ENVIRONMENT === "production";