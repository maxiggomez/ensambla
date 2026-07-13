#!/usr/bin/env bash
# Habilita los git hooks del repo (correr una vez por clon).
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
git config core.hooksPath .githooks
chmod +x .githooks/*
echo "hooks habilitados: core.hooksPath -> .githooks"
