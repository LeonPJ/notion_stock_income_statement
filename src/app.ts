import * as fs from 'fs';
import * as csv from 'fast-csv';
import { Client } from "@notionhq/client";
import dotenv from 'dotenv';

dotenv.config();

interface Statement {
    name: string, // 股票名稱
    date: string, // 交易日期
    tradeVolume: number, // 成交股數
    tradePrice: number, // 交易金額
    sharePrice: number, // 一股金額
    commission: number, // 手續費
    SST: number, //證卷交易稅
    tax: number
}

const statementObj: Statement = {
    name: '',
    date: '',
    tradeVolume: 0,
    tradePrice: 0,
    sharePrice: 0,
    commission: 0,
    SST: 0,
    tax: 0
};

// Initialize a new Notion client
const notion = new Client({
    auth: process.env.NOTION_TOKEN, // Replace with your Notion integration token
});



async function createStatement(statement: Statement) {
    const { name, date, tradeVolume, tradePrice, sharePrice, commission, SST } = statement;

    try {
        const response = await notion.pages.create({
            parent: {
                database_id: process.env.NOTION_DATABASE_ID!,
            },
            properties: {
                "股票名稱": {
                    title: [
                        {
                            text: {
                                content: name,
                            },
                        },
                    ],
                },
                "交易日期": {
                    // type: "date",
                    date: {
                        start: date
                    }
                },
                "成交股數": {
                    // type: "number",
                    number: tradeVolume,
                },
                "交易金額": {
                    // type: "number",
                    number: tradePrice,
                },
                "成交單價": {
                    // type: "number",
                    number: sharePrice,
                },
                "手續費": {
                    // type: "number",
                    number: commission,
                },
                "交易稅": {
                    // type: "number",
                    number: SST,
                },
                "買/賣/股利/除息": {
                    // type: 'select',
                    select: {
                        // name: '買'
                        name: tradePrice > 0 ? '賣' : '買'
                    }
                }
            },
        });

        console.log('New page created successfully:', response);
    } catch (error) {
        //     // console.error('Error:', error.body);
    }

}


fs.createReadStream('income_statement.csv')
    .pipe(csv.parse({ headers: true }))
    .on('error', error => console.error(error))
    .on('data', row => {
        // console.log(row['股名']);
        // console.log(row['日期'].replace(/\//g, "-"));
        // console.log(row['成交股數'].replace(/,/g, ""));
        // console.log(row['淨收付'].replace(/,/g, ""));
        // console.log(row['成交單價'].replace(/,/g, ""));
        // console.log(row['手續費'].replace(/,/g, ""));
        // console.log(row['交易稅'].replace(/,/g, ""));
        // console.log('--------');

        statementObj.name = row['股名'];
        statementObj.date = row['日期'].replace(/\//g, "-");
        statementObj.tradeVolume = Number(row['成交股數'].replace(/,/g, ""));
        statementObj.tradePrice = Number(row['淨收付'].replace(/,/g, ""));
        statementObj.sharePrice = Number(row['成交單價'].replace(/,/g, ""));
        statementObj.commission = Number(row['手續費'].replace(/,/g, ""));
        statementObj.SST = Number(row['交易稅'].replace(/,/g, ""));
        // statementObj.tax = row['稅款'].replace(/,/g, "");

        createStatement(statementObj);

        // console.log(row['委託書號']);
        // console.log(row);

    })
    // .on('end', (rowCount: number) => console.log(`Parsed ${rowCount} rows`));
    .on('end', () => console.log(''));
