const axios = require('axios');

const headers = {
  validmark:
    'aKVEnBbJF9Nip2Wjf4de/fSvA8W3X3iB4L6vT0Y5cxvZbEfEm17udZKUD2qy37dLRY3bzzHLDv+up/Yn3OTo5Q==',
};

const deviceId = '874C427C-7C24-4980-A835-66FD40B67605';
const version = '6.5.5';
const baseData = {
  product: 'EFund',
  deviceid: deviceId,
  MobileKey: deviceId,
  plat: 'Iphone',
  PhoneType: 'IOS15.1.0',
  OSVersion: '15.5',
  version,
  ServerVersion: version,
  Version: version,
  appVersion: version,
};
// 发送请求
const request = async (url, params) => {
  const res = await axios(url, {
    headers,
    params: {
      ...baseData,
      ...params,
    },
  });
  return res.data;
};

// 获取基金详情
// request('https://fundmobapi.eastmoney.com/FundMNewApi/FundMNStopWatch', {
//   FCODE: '100055',
// }).then((res) => {
//   console.log(res);
// });

// 获取基金涨幅
request('https://fundmobapi.eastmoney.com/FundMNewApi/FundMNPeriodIncrease', {
  FCODE: '100055',
}).then((res) => {
  console.log(res);
});

// 基金净值
// request('https://fundcomapi.tiantianfunds.com/mm/newCore/FundVPageDiagram', {
//   FCODE: '017437',
// }).then((res) => {
//   console.log(res);
// });

// 基金累计收益
// request('https://fundcomapi.tiantianfunds.com/mm/newCore/FundVPageAcc', {
//   FCODE: '100055',
// }).then((res) => {
//   console.log(res);
// });

// 基金详情
// request('https://fundmobapi.eastmoney.com/FundMNewApi/FundMNDetailInformation', {
//   FCODE: '100055',
// }).then((res) => {
//   console.log(res);
// });

// 基金持仓
// request('https://fundmobapi.eastmoney.com/FundMNewApi/FundMNInverstPosition', {
//   FCODE: '004243',
// }).then((res) => {
//   console.log(res.Datas.fundStocks);
//   console.log(
//     res.Datas.fundStocks.reduce((sum, item) => sum + Number(item.JZBL), 0),
//   );
// });

// request('https://fundmobapi.eastmoney.com/FundMNewApi/FundMNIVInfoMultiple', {
//   FCODE: '004243',
// }).then((res) => {
//   console.log(res);
// });
