// next.config.js
const { ElasticsearchClient } = require('@elastic/elasticsearch');
const client = new ElasticsearchClient({ node: 'http://localhost:9200' }); // 替换为你的Elasticsearch地址
 
/**
 * 发送日志到Elasticsearch
 * @param {string} level 日志级别
 * @param {string} message 日志消息
 */
async function logToElasticsearch(level, message) {
  try {
    const logEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
    };
    await client.index({
      index: 'logs', // 指定Elasticsearch索引名
      body: logEntry,
    });
  } catch (error) {
    // 处理错误，例如记录到另一个地方
    console.error('Failed to log to Elasticsearch:', error);
  }
}
 
module.exports = {
  // 其他配置...
  logToElasticsearch,
};

// ES 日志收集器 ==============================

// pages/index.js
export default function HomePage() {
  const { logToElasticsearch } = require('../next.config').default;
 
  logToElasticsearch('info', 'User visited the home page');
 
  return (
    <div>
      <h1>Welcome to Next.js!</h1>
    </div>
  );
}