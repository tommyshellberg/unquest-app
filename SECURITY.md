# Security Policy

## Reporting Security Vulnerabilities

We take the security of UnQuest seriously. If you discover a security vulnerability, please follow these steps:

### Do NOT

- Do not create a public GitHub issue for security vulnerabilities
- Do not disclose the vulnerability publicly until it has been addressed

### DO

1. **Email the maintainers directly** with details of the vulnerability
2. **Include the following information:**
   - Description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact
   - Suggested fix (if available)
   - Your contact information

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
- **Assessment**: We will investigate and validate the reported vulnerability
- **Resolution**: We will work on a fix and coordinate the release
- **Credit**: We will credit you for the discovery (unless you prefer to remain anonymous)

## Security Best Practices

When contributing to UnQuest, please follow these security best practices:

### Environment Variables

- Never commit `.env` files or any file containing secrets
- Always use environment variables for sensitive configuration
- Check that new environment variables are documented in `.env.example`

### API Keys and Secrets

- Never hardcode API keys, tokens, or secrets in the source code
- Use environment variables for all sensitive configuration
- Rotate keys and secrets regularly

### Dependencies

- Keep dependencies up to date
- Review security advisories for dependencies
- Use `pnpm audit` to check for known vulnerabilities
- Only install dependencies from trusted sources

### Code Practices

- Validate and sanitize all user inputs
- Use parameterized queries for database operations
- Implement proper authentication and authorization checks
- Follow the principle of least privilege
- Use secure communication protocols (HTTPS)
- Implement rate limiting for API endpoints

### Data Protection

- Encrypt sensitive data at rest and in transit
- Follow data minimization principles
- Implement proper session management
- Use secure storage mechanisms for sensitive data
- Regular security audits and penetration testing

## Security Features

UnQuest implements several security features:

- **JWT Authentication**: Secure token-based authentication
- **Secure Storage**: Sensitive data encrypted using platform-specific secure storage
- **HTTPS Only**: All API communications use HTTPS
- **Input Validation**: All user inputs are validated and sanitized
- **Rate Limiting**: API endpoints are rate-limited to prevent abuse

## Regular Security Audits

We conduct regular security audits:

- Dependency vulnerability scanning with each build
- Code security analysis in CI/CD pipeline
- Periodic penetration testing
- Regular review of security best practices

## Disclosure Policy

When we receive a security report:

1. We will work with you to understand and validate the issue
2. We will prepare a fix and release plan
3. We will credit you in the security advisory (if desired)
4. We will release the fix as soon as possible

## Contact

For security concerns, please contact the maintainers directly through private channels rather than public issue trackers.

Thank you for helping keep UnQuest and its users safe!