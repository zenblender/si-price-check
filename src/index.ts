import XLSX, { CellAddress } from 'xlsx'
import fetch from 'node-fetch'
import { chunk, range } from 'lodash'

interface PriceList {
  [symbol: string]: number
}

const MIN_SI_CRITERIA = 8

let sheet

function getCellObject(cellAddress: CellAddress): XLSX.CellObject {
  return sheet[XLSX.utils.encode_cell(cellAddress)]
}

function getColumnHeaderIndexWithValue(value: string, exactMatch: boolean = true): number {
  for (let i = 0; i < 100; i++) {
    const cellObject = getCellObject({ r: 0, c: i })
    if (cellObject && isString(cellObject.v)) {
      if ((exactMatch && cellObject.v === value) || cellObject.v.indexOf(value) !== -1) {
        return i
      }
    }
  }
  throw new Error(`cell value '${value}' not found in header`)
}

function getColumnHeaderIndexContainingValue(value: string): number {
  return getColumnHeaderIndexWithValue(value, false)
}

function isString(value: any): value is string {
  return typeof value === 'string'
}

function getReportUndervaluedPriceList(): PriceList {
  const priceList: PriceList = {}

  const symbolColIndex = getColumnHeaderIndexWithValue('Symbol')
  const priceColIndex = getColumnHeaderIndexWithValue('Share Price')
  const undervaluedColIndex = getColumnHeaderIndexContainingValue('undervalued')
  const criteriaColIndex = getColumnHeaderIndexContainingValue('SI Criteria')

  let rowIndex = 1
  while (getCellObject({ r: rowIndex, c: symbolColIndex })) {
    const symbolCellObject = getCellObject({ r: rowIndex, c: symbolColIndex })
    const priceCellObject = getCellObject({ r: rowIndex, c: priceColIndex })
    const undervaluedCellObject = getCellObject({
      r: rowIndex,
      c: undervaluedColIndex,
    })
    const criteriaCellObject = getCellObject({
      r: rowIndex,
      c: criteriaColIndex,
    })
    if (priceCellObject && undervaluedCellObject && criteriaCellObject) {
      if (isString(symbolCellObject.v) && undervaluedCellObject.v === 'U' && criteriaCellObject.v >= MIN_SI_CRITERIA) {
        priceList[symbolCellObject.v] = Number(priceCellObject.v)
      }
    }
    rowIndex++
  }
  return priceList
}

function fetchCurrentPrices(symbols: string[]): Promise<PriceList> {
  const url = `https://sandbox.iexapis.com/stable/stock/market/batch?types=quote&symbols=${symbols.join(',')}&token=${process.env.IEX_CLOUD_BATCH_API_KEY}`
  return fetch(url)
    .then((response) => response.json())
    .then((json) => {
      const priceList: PriceList = {}
      symbols.forEach((symbol) => {
        if (!json[symbol] || !json[symbol].quote) {
          console.log(`WARN: ${symbol} could not be fetched`)
          return
        }
        priceList[symbol] = json[symbol].quote.latestPrice
      })
      return priceList
    })
}

function fetchCurrentPricesInBatches(symbols: string[]): Promise<PriceList> {
  return Promise.all(chunk(symbols, 100).map((symbolsBatch) => fetchCurrentPrices(symbolsBatch))).then((priceLists: PriceList[]) => {
    return priceLists.reduce((accumulatedPriceList: PriceList, currentPriceList: PriceList): PriceList => {
      return {
        ...accumulatedPriceList,
        ...currentPriceList,
      }
    }, {})
  })
}

function logPriceDiffs(reportPriceList: PriceList, currentPriceList: PriceList) {
  const rows: string[][] = []
  console.log() // blank line
  console.log('High Quality Stock Price Deltas:')
  Object.keys(reportPriceList).forEach((symbol) => {
    const reportPrice = reportPriceList[symbol]
    const currentPrice = currentPriceList[symbol]
    const percDelta = currentPrice < reportPrice ? -((reportPrice - currentPrice) / reportPrice) * 100 : ((currentPrice - reportPrice) / reportPrice) * 100
    rows.push([
      symbol,
      `$${reportPrice.toFixed(2)}`,
      '->',
      `$${currentPrice.toFixed(2)}`,
      `(${percDelta >= 0 ? '+' : ''}${percDelta.toFixed(2)}%)`,
      `${currentPrice < reportPrice ? '**CHEAPER**' : ''}`,
    ])
  })

  const colWidths: number[] = []
  const numCols = rows[0].length
  for (let i = 0; i < numCols; i++) {
    colWidths.push(Math.max(...range(rows.length).map((rowIndex) => rows[rowIndex][i].length)))
  }

  for (let i = 0; i < rows.length; i++) {
    const parts: string[] = []
    for (let j = 0; j < numCols; j++) {
      parts.push(rows[i][j].padEnd(colWidths[j], ' '))
    }
    console.log(`  ${parts.join('  ')}`)
  }

  console.log() // blank line
}

function go() {
  const workbook = XLSX.readFile(process.env.XLSX_PATH)

  sheet = workbook.Sheets['USA Stocks']

  // console.log(JSON.stringify(sheet, null, 2))

  console.log(`High Quality Stocks Criteria: UNDERVALUED, ${MIN_SI_CRITERIA}+ SI CRITERIA`)

  console.log('Fetching Report Prices from XLSX File...')
  const reportPriceList = getReportUndervaluedPriceList()
  console.log('Fetching Current Prices...')
  fetchCurrentPricesInBatches(Object.keys(reportPriceList)).then((currentPriceList) => {
    logPriceDiffs(reportPriceList, currentPriceList)
  })
}

go()
