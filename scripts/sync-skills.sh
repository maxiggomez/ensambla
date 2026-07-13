#!/usr/bin/env bash
#
# sync-skills.sh — propaga las skills de proyecto desde la fuente única
# canónica (.agents/skills) hacia los directorios que leen los runtimes.
#
#   Fuente canónica : .agents/skills/<skill>/
#   Destinos        : .claude/skills/    (Claude Code)
#                     .opencode/skills/  (OpenCode)
#                     .codex/skills/     (Codex)
#   Qwen Code no soporta skills: sus comandos (.qwen/commands/*.toml) apuntan
#   directo al canónico.
#
# Uso:
#   scripts/sync-skills.sh          # copia canónico -> destinos
#   scripts/sync-skills.sh --check  # NO copia; exit≠0 si hay drift (CI/hook)
#
# Solo gestiona las skills mg-* listadas abajo. Las skills openspec-* las
# genera `openspec init` POR RUNTIME (difieren a propósito en las referencias
# a comandos) y NO se tocan acá.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CANON="$REPO_ROOT/.agents/skills"
TARGETS=(
  "$REPO_ROOT/.claude/skills"
  "$REPO_ROOT/.opencode/skills"
  "$REPO_ROOT/.codex/skills"
)

PROJECT_SKILLS=(
  mg-eng-loop
  mg-pr-review
)

CHECK=0
[[ "${1:-}" == "--check" ]] && CHECK=1

fail=0

for skill in "${PROJECT_SKILLS[@]}"; do
  src="$CANON/$skill"
  if [[ ! -d "$src" ]]; then
    echo "ERROR: skill canónica ausente: $src" >&2
    fail=1
    continue
  fi
  for target_root in "${TARGETS[@]}"; do
    dst="$target_root/$skill"
    if [[ "$CHECK" == "1" ]]; then
      if ! diff -rq "$src" "$dst" >/dev/null 2>&1; then
        echo "DRIFT: $dst difiere de $src (corré scripts/sync-skills.sh)" >&2
        fail=1
      fi
    else
      mkdir -p "$target_root"
      rm -rf "$dst"
      cp -R "$src" "$dst"
      echo "synced: $skill -> ${dst#"$REPO_ROOT"/}"
    fi
  done
done

exit "$fail"
