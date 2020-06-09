#!/bin/bash -e

while getopts f:s opts; do
  case ${opts} in
    f) XLSX_FILE=${OPTARG} ;;
  esac
done

if [[ -z "${XLSX_FILE}" ]]; then
  echo "ERROR: You must specify the XLSX file with the -f flag"
  exit 1
fi

export XLSX_PATH=$(echo "$(cd "$(dirname "${XLSX_FILE}")" && pwd)/$(basename "${XLSX_FILE}")")

# compile:
echo "Compiling..."
npx tsc

# run:
echo "Running..."
(cd dist && node index.js)
