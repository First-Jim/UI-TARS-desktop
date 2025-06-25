#!/usr/bin/env node

/**
 * 日志系统测试脚本
 * 用于测试各种API端点的日志记录功能
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testLogging() {
  console.log('🧪 开始测试日志系统...\n');

  try {
    // 测试1: 健康检查（应该有请求日志）
    console.log('1. 测试健康检查端点...');
    await axios.get(`${BASE_URL}/users`).catch(() => {}); // 忽略错误，只关注日志

    // 测试2: 登录尝试（应该有业务日志）
    console.log('2. 测试登录端点...');
    await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'testpassword123'
    }).catch(() => {}); // 忽略错误，只关注日志

    // 测试3: 注册尝试（应该有业务日志）
    console.log('3. 测试注册端点...');
    await axios.post(`${BASE_URL}/auth/signup`, {
      email: 'newuser@example.com',
      password: 'newpassword123',
      name: 'Test User'
    }).catch(() => {}); // 忽略错误，只关注日志

    // 测试4: 微信相关端点
    console.log('4. 测试微信端点...');
    await axios.get(`${BASE_URL}/wechat/auth-url?scope=snsapi_userinfo&state=test`).catch(() => {});

    // 测试5: 创建二维码
    console.log('5. 测试创建二维码端点...');
    await axios.post(`${BASE_URL}/wechat/qr-code/temp`, {
      sceneValue: 'test_scene_123',
      expireSeconds: 3600
    }).catch(() => {});

    console.log('\n✅ 日志测试完成！请检查控制台输出的日志信息。');
    console.log('\n📋 应该看到以下类型的日志：');
    console.log('   - HTTP Request 日志（包含请求详情）');
    console.log('   - HTTP Response 日志（包含响应时间）');
    console.log('   - Business Action 日志（登录/注册尝试）');
    console.log('   - 敏感信息脱敏（密码显示为 ***REDACTED***）');
    console.log('   - 请求追踪ID（每个请求的唯一标识）');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

// 运行测试
testLogging();
