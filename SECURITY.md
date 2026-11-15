# Security policy

## Report vulnerabilities privately

Use **Report a vulnerability** in this repository's [GitHub Security tab](https://github.com/geobattles/geobattles-frontend/security). A GitHub account is required. Do not open a public issue or pull request containing exploits, credentials or private player data.

Include the affected commit/image version, impact and the smallest safe reproduction. Remove keys, JWTs, cookies, passwords, player data and credential-bearing URLs. Do not test production or spend provider quota without authorization. Coordinate disclosure privately; no response-time or bounty promise is made.

If a credential may have leaked, notify maintainers and revoke/rotate it through its provider. Removing it from the latest source does not invalidate it or erase Git history.

## Supported scope

Security fixes target the maintained default branch and reviewed releases. Older snapshots and container tags have no separate support commitment. See [dependency security](docs/dependency-security.md) for residual advisories and assessment limits; a build, audit or secret scan is not security certification.

## Maintainer safeguards

- Keep secret scanning and push protection enabled; validate findings privately rather than bypassing them blindly.
- Review changes and required checks before release. Validation must not publish or use production credentials.
- Image publication is manual, master-only and separately approved. Deployment and provider spending require their own scope.
- Never attach raw browser/build logs, environment files, resolved private configuration or internal work records to public reports.
- Browser Maps keys are public configuration. Restrict APIs/referrers and keep backend credentials separate.
