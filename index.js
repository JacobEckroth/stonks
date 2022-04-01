const axios = require('axios')

const baseURL = 'https://yfapi.net';

var apikey = require(__dirname + '/apikey.json');
const { writeToPath } = require('@fast-csv/format');

const csv = require('fast-csv');
const csvStream = csv.format({ headers: true });
const fs = require('fs');
const path = require('path');
const { acceptsLanguages } = require('express/lib/request');





function getStockInfo(ticker) {
    axios
        .get(`${baseURL}/v6/finance/quote`, {
            params: {
                region: "US",
                lang: "en",
                symbols: `${ticker}`
            },
            headers: {
                'x-api-key': `${apikey.key}`
            }
        })
        .then(res => {

            if (res.status === 429) {
                console.error("Out of requests!");
                return;
            } else if (res.status === 200) {
                storeStocks(res.data.quoteResponse.result);
            }
        })
        .catch(error => {
            console.error(error)
        })

}



var totalStocks = [];
var expectedStocks = 0;

function storeStocks(listOfStocks) {
    for (var i = 0; i < listOfStocks.length; i++) {
        totalStocks.push(Object.values(listOfStocks[i]));
    }
    if (totalStocks.length === expectedStocks) {
        console.log("got enough");
        for (var i = 0; i < listOfStocks.length; i++) {

            csv.writeToStream(fs.createWriteStream(path.resolve(__dirname, storeFile), { flags: 'a' }), totalStocks, { headers: false })
                .on('error', err => console.error(err))
                .on('finish', () => console.log('Done writing.'));
        }
    }



}


let storeFile = "store.csv"
let apiHeaders = [
    [
        "acceptsLanguages",
        "region",
        "quoteType",
        "typeDisp",
        "quoteSourceName",
        "triggerable",
        "customPriceAlertConfidence",
        "currency",
        "askSize",
        "fullExchangeName",
        "financialCurrency",
        "regularMarketOpen",
        "averageDailyVolume3Mont",
        "averageDailyVolume10Day",
        "fiftyTwoWeekLowChange",
        "fiftyTwoWeekLowChangePercent",
        "fiftyTwoWeekRange",
        "fiftyTwoWeekHighChange",
        "fiftyTwoWeekHighChangePercent",
        "fiftyTwoWeekLow",
        "fiftyTwoWeekHigh",
        "dividendDate",
        "earningsTimestamp",
        "earningsTimestampStart",
        "earningsTimestampEnd",
        "trailingAnnualDividendRate",
        "trailingPE",
        "trailingAnnualDividendYield",
        "epsTrailingTwelveMonths",
        "epsForward",
        "epsCurrentYear",
        "priceEpsCurrentYear",
        "sharesOutstanding",
        "bookValue",
        "fiftyDayAverage",
        "fiftyDayAverageChange",
        "fiftyDayAverageChangePercent",
        "twoHundredDayAverage",
        "twoHundredDayAverageChange",
        "twoHundredDayAverageChangePercent",
        "marketCap",
        "forwardPE",
        "priceToBook",
        "sourceInterval",
        "exchangeDataDelayedBy",
        "pageViewGrowthWeekly",
        "averageAnalystRating",
        "tradeable",
        "exchange",
        "shortName",
        "longName",
        "messageBoardId",
        "exchangeTimezoneName",
        "exchangeTimezoneShortName",
        "gmtOffSetMilliseconds",
        "market",
        "esgPopulated",
        "firstTradeDateMilliseconds",
        "priceHint",
        "postMarketChangePercent",
        "postMarketTime",
        "postMarketPrice",
        "postMarketChange",
        "regularMarketChange",
        "regularMarketChangePercent",
        "regularMarketTime",
        "regularMarketPrice",
        "regularMarketDayHigh",
        "regularMarketDayRange",
        "regularMarketDayLow",
        "regularMarketVolume",
        "regularMarketPreviousClose",
        "bid",
        "ask",
        "bidSize",
        "marketState",
        "symbol"
    ]
]

function readInStocks(fileName) {
    //first we delete the previous csv file
    try {
        fs.unlinkSync(path.resolve(__dirname, storeFile))
    } catch (err) {
        console.error(err);
    }





    writeToPath(path.resolve(__dirname, storeFile), apiHeaders)
        .on('error', err => console.error(err))
        .on('finish', () => console.log('Done writing.'));

    rows = [];
    fs.createReadStream(path.resolve(__dirname, fileName))
        .pipe(csv.parse({ headers: true }))
        .on('error', error => console.error(error))
        .on('data', row => rows.push(row))
        .on('end', rowCount => {
            console.log(`Parsed ${rowCount} rows`)
            expectedStocks = rowCount;
            getStockInfoForManyStocks(rows);
        });
}

function getStockInfoForManyStocks(tickers) {
    let stockRequest = "";
    let stockCount = 0;
    for (const ticker of tickers) {
        var tickerString = ticker.Ticker
        stockRequest += tickerString
        stockCount += 1
        if (stockCount == 10) {
            console.log(stockRequest);
            getStockInfo(stockRequest);
            stockRequest = "";
            stockCount = 0;
        } else {
            stockRequest += ","
        }
    }
}

readInStocks('dividends.csv')