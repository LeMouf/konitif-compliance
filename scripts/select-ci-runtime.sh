#!/usr/bin/env bash
set -euo pipefail
: "${RUNNER_TOOL_CACHE:?Runner cache required}"
: "${GITHUB_PATH:?GitHub path required}"
compliance_node_bin=''
while IFS= read -r candidate; do
  if test -x "${candidate}/node" && test -x "${candidate}/npm" \
    && [[ "$("${candidate}/node" --version)" == v24.* ]]; then
    compliance_node_bin="${candidate}"
    break
  fi
done < <(printf '%s\n' "${RUNNER_TOOL_CACHE}"/node/24.*/x64/bin | sort -Vr)

if test -z "${compliance_node_bin}"; then
  printf '%s\n' 'No usable Node 24 runtime with npm was found in the runner cache.' >&2
  printf '%s\n' 'Available cached Node versions:' >&2
  ls "${RUNNER_TOOL_CACHE}/node" >&2 || true
  exit 1
fi
export PATH="${compliance_node_bin}:${PATH}"
[[ "$("${compliance_node_bin}/node" --version)" == v24.* ]]
printf '%s\n' "${compliance_node_bin}" >> "${GITHUB_PATH}"
printf 'Selected Node %s with npm %s\n' "$("${compliance_node_bin}/node" --version)" "$("${compliance_node_bin}/npm" --version)"
