const crypto = require('crypto');

// 微信配置 - 确认与服务器一致的Token
const token = 'wechattoken123456';
const timestamp = '1234567890';
const nonce = 'randomnonce123';
const echostr = 'test_echo_string';

// 按照微信文档生成签名
function generateWechatSignature(token, timestamp, nonce) {
  // 1. 将token、timestamp、nonce三个参数进行字典序排序
  const tmpArr = [token, timestamp, nonce].sort();
  console.log('Sorted array:', tmpArr);
  
  // 2. 将三个参数字符串拼接成一个字符串
  const tmpStr = tmpArr.join('');
  console.log('Joined string:', tmpStr);
  
  // 3. 进行sha1加密
  const signature = crypto.createHash('sha1').update(tmpStr).digest('hex');
  console.log('Generated signature:', signature);
  
  return signature;
}

// 生成签名
const signature = generateWechatSignature(token, timestamp, nonce);

// 构造测试URL
const testUrl = `https://my-nest-supabase-prisma.onrender.com/api/wechat/webhook?signature=${signature}&timestamp=${timestamp}&nonce=${nonce}&echostr=${echostr}`;

console.log('\n=== WeChat Signature Test ===');
console.log('Token:', token);
console.log('Timestamp:', timestamp);
console.log('Nonce:', nonce);
console.log('Echostr:', echostr);
console.log('Generated Signature:', signature);
console.log('\nTest URL:');
console.log(testUrl);
console.log('\nCurl command:');
console.log(`curl "${testUrl}"`);
