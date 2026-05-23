#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="$(node -p "require('${ROOT_DIR}/package.json').version")"
ZIP_NAME="sidesage-v${VERSION}.zip"
ZIP_PATH="${ROOT_DIR}/releases/${ZIP_NAME}"

cd "${ROOT_DIR}"
npm run build

mkdir -p releases
rm -f "${ZIP_PATH}"

cd dist
zip -qr "${ZIP_PATH}" .

echo "Created ${ZIP_PATH}"
