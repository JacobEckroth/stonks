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
        totalStocks.push(listOfStocks[i]);
    }
    console.log(totalStocks.length);
    if (totalStocks.length === expectedStocks) {
        //now we want to create new objects with only the ones we need.

        var fixedStocks = [apiHeaders];
        for (const stock of totalStocks) {

            fixedStocks.push([
                stock.fiftyDayAverage,
                stock.fiftyDayAverageChange,
                stock.fiftyDayAverageChangePercent,
                stock.longName,
                stock.postMarketPrice,
                stock.regularMarketPrice,
                stock.regularMarketDayHigh,
                stock.regularMarketDayRange,
                stock.regularMarketDayLow,
                stock.regularMarketVolume,
                stock.regularMarketPreviousClose,
                stock.shortName,
                stock.symbol,
                stock.twoHundredDayAverage,
                stock.twoHundredDayAverageChange,
                stock.twoHundredDayAverageChangePercent

            ])

        }

        csv.writeToStream(fs.createWriteStream(path.resolve(__dirname, storeFile), { flags: 'a' }), fixedStocks, { headers: false })
            .on('error', err => console.error(err))
            .on('finish', () => console.log('Done writing.'));

    }



}


let storeFile = "store.csv"
let apiHeaders = [
    "fiftyDayAverage",
    "fiftyDayAverageChange",
    "fiftyDayAverageChangePercent",
    "longName",
    "postMarketPrice",
    "regularMarketPrice",
    "regularMarketDayHigh",
    "regularMarketDayRange",
    "regularMarketDayLow",
    "regularMarketVolume",
    "regularMarketPreviousClose",
    "shortName",
    "symbol",
    "twoHundredDayAverage",
    "twoHundredDayAverageChange",
    "twoHundredDayAverageChangePercent"

]


function readInStocks(fileName) {
    //first we delete the previous csv file
    try {
        fs.unlinkSync(path.resolve(__dirname, storeFile))
    } catch (err) {
        console.error(err);
    }






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
    if (stockCount != 0) {
        getStockInfo(stockRequest);
    }

}

readInStocks('dividends.csv')