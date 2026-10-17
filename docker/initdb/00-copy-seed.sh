#!/bin/sh
# Copies the seed CSVs into ClickHouse's user_files directory so `file()` can
# read them.
#
# They cannot be mounted there directly: the image entrypoint chowns
# user_files_path on boot and dies if that mount is read-only. Mounting the
# repo copy read-only elsewhere and copying in keeps the repo untouched.
set -e

mkdir -p /var/lib/clickhouse/user_files
cp /seed-src/*.csv /var/lib/clickhouse/user_files/
echo "seed: copied $(ls -1 /seed-src/*.csv | wc -l) CSV files into user_files"
