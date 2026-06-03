#!/bin/bash
# Pre-commit hook: if locales/en.json is staged, sync Spanish translations

if git diff --cached --name-only | grep -q 'locales/en\.json'; then
  echo "🌐 locales/en.json is staged — running translate-sync..."
  node "$(git rev-parse --show-toplevel)/scripts/translate-sync.js"
  EXIT_CODE=$?

  if [ $EXIT_CODE -eq 0 ]; then
    # Stage es.json if it was modified
    ES_PATH="$(git rev-parse --show-toplevel)/locales/es.json"
    if ! git diff --quiet "$ES_PATH" 2>/dev/null || ! git ls-files --error-unmatch "$ES_PATH" 2>/dev/null; then
      git add "$ES_PATH"
      echo "✓ locales/es.json staged."
    fi
  fi
fi

exit 0
