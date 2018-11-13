const
express = require('express'),
UAParser = require('ua-parser-js'),
moment = require('moment-timezone'),
uuid = require('uuid'),
fs = require('fs'),
router = express.Router();
moment.tz.setDefault("Asia/Tokyo");

router.get('/', function(req, res) {    
    //ユーザエージェント（詳細含む）
    let
    uaData = {},
    ua = req.headers['user-agent'],
    parser = new UAParser(),
    parseData = parser.setUA(ua).getResult();
    Object.keys(parseData).forEach(uaKey => {
        if(typeof parseData[uaKey] !== 'object'){
            uaData[uaKey] = {value: parseData[uaKey], "type": "STRING", "mode": "NULLABLE"};
        } else {
            Object.keys(parseData[uaKey]).forEach(uaDetailKey => {
                let key = `${uaKey}_${uaDetailKey}`;
                uaData[key] = {value: parseData[uaKey][uaDetailKey], type: uaKey === "browser" && uaDetailKey === "major" ? "INT64" : "STRING", mode: "NULLABLE"};
            });
        };
    });

    //IPアドレス含むその他サーバデータ、payload、client側取得データをまとめた上で出力スクリプト生成およびエンドポイント生成
    let
    remoteAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    splittedAddress = remoteAddress.split(', '),
    ipAddress = splittedAddress[splittedAddress.length - 1],
    serverData = {
        timestamp: {value: moment().format('YYYY-MM-DD HH:mm:ss'), type: "DATETIME", mode: "REQUIRED"},
        remoteip: {value: ipAddress, "type": "STRING", "mode": "NULLABLE"},
        event: {value: '"pageLoad"', "type": "STRING", "mode": "NULLABLE"},
        payload: {value: '{}', type: "STRUCT", mode: "REPEATED"}
    },
    clientData = JSON.parse(fs.readFileSync('./lib/data.json', 'utf8')),
    data = Object.assign(clientData, uaData, serverData),
    endpoint = `https://${process.env.FUNCTION_REGION}-${process.env.GCP_PROJECT}.cloudfunctions.net/${process.env.FUNCTION_NAME}`,
    renderObj = {
        uuid: uuid.v4(),
        endpoint: endpoint,
        data: data
    };

    //レンダリング
    res.set('Content-Type','text/javascript');
    res.render('collect', renderObj);
});

module.exports = router;
