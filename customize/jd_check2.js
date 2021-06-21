const path = require('path');
const fs = require('fs');
const { execSync, exec } = require('child_process');
const got = require('got');
var t = 0;
// 根目录
const rootPath = path.resolve(__dirname, '/jd/');
// config.sh 文件所在目录
const confFile = path.join(rootPath, 'config/config.sh');
// 消息通知目录
const sendNotifyPath = path.join(rootPath, 'scripts/sendNotify');

function getFileContentByName(fileName) {
  if (fs.existsSync(fileName)) {
    return fs.readFileSync(fileName, 'utf8');
  }
  return '';
}

async function main() {
  const configContent = getFileContentByName(confFile);
  const lines = configContent.split('\n');
  let lastIndex;
  const cookies = [];
  for (var i = 0; i < lines.length; i++) {
    const line = lines[i];
    lastIndex = i;
    if (line.length > 90) {
      if (line.match(/pt_key=xxx/)) continue;
      if (line.match(/pt_key=.+?;pt_pin=.+?;/)) {
        const cookie = line.match(/pt_key=.+?;pt_pin=.+?;/)[0];
        if (cookie.length > 90) {
          cookies.push(cookie);
        }
      }
    }
  }
  console.log(`Cookies数量：${cookies.length}`);
  let checkResult = '';
  for await (cookie of cookies) {
    //console.log(cookie);
    const pt_pin = cookie.match(/pt_pin=.+?;/)[0];
    const jdName = decodeURIComponent(pt_pin.split('=')[1].replace(';', ''));
    const fetchJDInfoUrl = `https://me-api.jd.com/user_new/info/GetJDUserInfoUnion?orgFlag=JD_PinGou_New&callSource=mainorder&channel=4&isHomewhite=0&sceneval=2&_=${+Date.now()}&sceneval=2&g_login_type=1&g_ty=ls`;
    const response = await got.get(fetchJDInfoUrl, {
      method: 'get',
      responseType: 'json',
      headers: {
        Accept: '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'zh-cn',
        Connection: 'keep-alive',
        Cookie: cookie,
        Referer: 'https://home.m.jd.com/myJd/newhome.action',
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1',
        Host: 'me-api.jd.com',
      },
    });
    //console.log(JSON.stringify(response.body));
	//console.log(response.body);
	//var username = JSON.parse(JSON.stringify(response.body));
	//console.log(response.body.data.userInfo.baseInfo.nickname);
    if (
      response.body &&
      response.body.retcode === '0' &&
      response.body.data.userInfo
    ) {
      console.log(`CK${t++}✅:pin:${jdName} nick:${response.body.data.userInfo.baseInfo.nickname}`);
      checkResult = checkResult + '\n' + `CK${t}✅:pin:${jdName} nick:${response.body.data.userInfo.baseInfo.nickname}`;
    } else {
      console.log(`CK${t++}🚫:${jdName}`);
      checkResult = checkResult + '\n' + `CK${t}🚫:${jdName}`;
    }
  }
  !(async () => {
    await require(sendNotifyPath).sendNotify('Cookie检测提醒', checkResult);
  })();
}
main();
