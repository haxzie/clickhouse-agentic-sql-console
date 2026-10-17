#!/usr/bin/env bash
# Re-downloads the Northwind seed CSVs committed under docker/seed.
#
# They are committed so `docker compose up` works offline; this script exists to
# document where they came from and to refresh them.
set -euo pipefail

BASE="https://raw.githubusercontent.com/graphql-compose/graphql-compose-examples/master/examples/northwind/data/csv"
DEST="$(dirname "$0")/../docker/seed"

mkdir -p "$DEST"

for table in categories customers employees order_details orders products shippers suppliers; do
  echo "fetching $table.csv"
  curl -sfL --max-time 30 "$BASE/$table.csv" -o "$DEST/$table.csv"
done

echo "done; $(du -sh "$DEST" | cut -f1) in $DEST"
