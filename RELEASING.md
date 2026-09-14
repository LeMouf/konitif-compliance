# Release preparation

Publication is disabled by default. The workflow is restricted to this repository,
an exact version tag on main history, and requires
COMPLIANCE_NPM_PUBLISH_ENABLED=true. A manual dispatch must run from `main` and
name that exact tag.
Do not enable that repository variable until the following controls are reviewed:

- Protect main with the required validate check and pull requests.
- Apply separate v* tag rules for immutable updates/deletions and admin creation.
- Create npm-release with LeMouf as required reviewer, self-review allowed,
  administrator bypass disabled, and only v* tags allowed to deploy.
- Configure npm trusted publishing for LeMouf/konitif-compliance,
  workflow publish.yml, environment npm-release, allowing npm publish.

The first npm package creation may require a separate approved bootstrap step.
No bootstrap, tag or npm publication is authorized by this document. Direct
source publication remains guarded: publish only the verified archive with
scripts disabled.

The release job builds and tests, validates package/tag identity, verifies an
archive through an external TypeScript/ESM consumer, and publishes those exact
bytes using OIDC. It never upgrades tools automatically. The environment must
actually be configured on GitHub: naming it in YAML does not enforce reviewers.

Current preparation targets version 0.284.2 and retains the existing licence. It neither
changes commercial rights nor creates an official ecosystem release. The original
BASELINE describes the initial commit, not subsequent release activation.
