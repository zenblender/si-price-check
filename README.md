# DEPRECATED: Simply Investing now has a Report and Analysis Platform, and no longer publishes XLSX reports that this project used.

# Simply Investing Price Check

This project analyzes the current SimplyInvesting.com XLSX Report, and lists its dividend stocks that:

- are USA stocks
- are undervalued
- satisfy a number of SI criteria (8+ by default)
- are currently priced _lower_ than the prices in the report

Primarily, you'd use this to determine if any of the undervalued stocks listed in a report might be a smarter buy because their prices have decreased, and next month's report hasn't been released yet.

## Setup

1. Subscribe to the report at https://www.simplyinvesting.com/.
2. Sign up for free API access at https://iexcloud.io/.
3. Download the current XLSX report file from your Simply Investing subscription.
4. Install dependencies by running `yarn`. If you need yarn, see https://yarnpkg.com/.

## Running

Run the command:

`IEX_CLOUD_BATCH_API_KEY=[IEX_CLOUD_BATCH_API_KEY] ./si-price-check.sh -f [PATH_TO_XLSX_FILE]`

Where:

- `[IEX_CLOUD_BATCH_API_KEY]` is your batch API key from iexcloud.io.
- `[PATH_TO_XLSX_FILE]` is a relative or absolute path to the Simply Investing report file in XLSX format
