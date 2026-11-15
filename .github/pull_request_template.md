## Purpose and scope

<!-- Explain the change and what is deliberately excluded. -->

## Verification

- Toolchain: Node / npm versions
- Commands and actual results
- Warnings, existing failures and unverified behavior

## Review checklist

- [ ] Behavior, API and dependency changes are explicit and scoped.
- [ ] Manifest and lockfile are consistent; no unintended upgrades.
- [ ] No new application unit-test framework without agreement; optional socket/browser checks respected local-runtime and paid-call gates.
- [ ] No secrets, environment files, private logs or internal session records are included.
- [ ] Documentation links, licensing and asset attribution are preserved.
- [ ] No production, provider spending, registry writes or deployment without explicit approval.

## Risks and rollback

<!-- A build pass does not prove gameplay correctness. -->

Image publication is manual and master-only. A pull request is not release authorization.
