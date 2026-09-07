# Compliance preparation baseline

This local preparation preserves @konitif/compliance 0.284.1 from the KONITIF
workspace on 2026-09-08. It contains generic evidence, report, collector and
snapshot contracts, not product collectors or company source.

The monorepo remains the editing authority until an explicit handover. This
checkout is not yet a published repository, ecosystem inclusion or release.
The version and PolyForm Noncommercial 1.0.0 notice are unchanged.

The development toolchain is locked to TypeScript 5.9.3, @types/node 25.9.3 and
its transitive dependency undici-types 7.24.6, authorized on 2026-09-08.
There are no runtime dependencies. Validation builds, tests and checks archive
consumption using only this locked toolchain. GitHub validation requires Node
24.20.0 in the runner cache and fails rather than downloading a missing runtime.
Publication is disabled. A prepared workflow does not establish a successful
remote CI run or branch protection.
