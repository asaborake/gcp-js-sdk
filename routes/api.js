const
express = require('express'),
router = express.Router(),
BigQuery = require('@google-cloud/bigquery'),
bigquery = new BigQuery({projectId: process.env.GCP_PROJECT}),
dataset = bigquery.dataset(process.env.FUNCTION_NAME),
table = dataset.table('master');

router.post('/', function(req, res) {
  //Bigquery挿入データ生成
  let
  analyticsData = {},
  analyticsOptions = {autoCreate: true, ignoreUnknownValues: false, schema:{fields:[]}},
  reqData = req.body;
  Object.keys(reqData).forEach(reqKey => {
    if(reqKey === 'payload'){
      let reqPayloadValue = reqData[reqKey].value,
      structFields = [
        {"name": "key", "type": "STRING", "mode": "NULLABLE"},
        {"name": "value", "type": "STRING", "mode": "NULLABLE"}
      ];
      analyticsData[reqKey] = [];
      Object.keys(reqPayloadValue).forEach(structKey => {
        let struct = {};
        struct['key'] = structKey;
        struct['value'] = reqPayloadValue[structKey];
        analyticsData[reqKey].push(struct);
      });
      analyticsOptions.schema.fields.push({name:reqKey, type:reqData[reqKey].type, mode:reqData[reqKey].mode, fields:structFields});
    } else {
      analyticsData[reqKey] = reqData[reqKey].value;
      analyticsOptions.schema.fields.push({name:reqKey, type:reqData[reqKey].type, mode:reqData[reqKey].mode});
    }
  });

  //Bigqueryにデータ挿入し結果をjsonでレスポンスする
  let statusResponse = ((result, status) => {
    result === 'success' ? console.log(status) : console.error(status);
    res.json(status);
  });
  table.insert(analyticsData, analyticsOptions)
  .then(data => {statusResponse('success', JSON.stringify(data[0]));})
  .catch(err => {statusResponse('error', JSON.stringify(err.errors));})
});

module.exports = router;
