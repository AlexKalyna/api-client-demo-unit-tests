# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **DO NOT** create a public GitHub issue
2. Email security concerns to: [security@example.com](mailto:security@example.com)
3. Include detailed information about the vulnerability
4. Allow reasonable time for response before public disclosure

## Security Measures

This project implements several security measures:

- **Dependency Scanning**: Automated vulnerability scanning with Snyk
- **Audit CI**: Security checks in CI/CD pipeline
- **Regular Updates**: Dependencies are regularly updated
- **Code Quality**: ESLint security rules and TypeScript strict mode

## Security Tools

- `npm run audit` - Run npm security audit
- `npm run security:scan` - Run Snyk vulnerability scan
- `npm run security:monitor` - Setup Snyk monitoring
- `npm run audit:ci` - Run audit-ci for CI environments

## Response Time

- **Critical vulnerabilities**: 24 hours
- **High severity**: 72 hours
- **Medium/Low severity**: 1 week

## Security Best Practices

1. Keep dependencies updated
2. Use `npm audit fix` for known vulnerabilities
3. Review security reports regularly
4. Follow secure coding practices
5. Use HTTPS for all communications
