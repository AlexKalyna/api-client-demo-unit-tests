export const securityConfig = {
  // Audit CI configuration
  auditCi: {
    low: true,
    moderate: true,
    high: true,
    critical: true,
    allowlist: [],
    skipDev: false,
    reportType: 'summary',
    outputFormat: 'text',
    passEnoaudit: true,
    retryCount: 3,
    retryDelay: 1000,
  },

  // Snyk configuration
  snyk: {
    severityThreshold: 'low',
    failOnUpgrades: false,
    devDependencies: true,
    org: process.env.SNYK_ORG || undefined,
    projectName: 'api-client-demo-unit-tests',
  },

  // Security thresholds
  thresholds: {
    maxVulnerabilities: 0,
    maxHighSeverity: 0,
    maxCriticalSeverity: 0,
  },

  // Environment-specific settings
  environments: {
    development: {
      strictMode: false,
      allowDevVulnerabilities: true,
    },
    ci: {
      strictMode: true,
      allowDevVulnerabilities: false,
    },
    production: {
      strictMode: true,
      allowDevVulnerabilities: false,
    },
  },
};
