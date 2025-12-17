// script.js

// 🚨 替换为您部署后的实际 Worker URL
const WORKER_URL = "https://blog-worker.changrenyuan.workers.dev";
const API_BASE = `${WORKER_URL}/api/message`;


/**
 * 1. POST: 发布一条新的留言
 * @param {string} name 
 * @param {string} content 
 * @returns {Promise<Object|null>} 返回新创建的消息对象，失败返回 null
 */
async function postMessage(name, content) {
    console.log(`\n--- 1. 尝试 POST 留言：${name} ---`);
    try {
        const response = await fetch(API_BASE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, content }),
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log(`✅ POST 成功 (Status: ${response.status})`);
            console.log("新留言:", data);
            return data;
        } else {
            console.error(`❌ POST 失败 (Status: ${response.status})`);
            console.error("错误详情:", data);
            return null;
        }

    } catch (error) {
        // 这通常是网络连接或 CORS 错误
        console.error("网络请求或解析错误:", error.message);
        return null;
    }
}

/**
 * 2. GET: 获取留言列表
 * @param {string} sortBy - 'latest' 或 'likes'
 * @returns {Promise<Array|null>} 返回留言数组，失败返回 null
 */
async function getMessages(sortBy = 'likes') {
    console.log(`\n--- 2. 尝试 GET 留言 (排序: ${sortBy}) ---`);
    const url = `${API_BASE}?sort=${sortBy}`;
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (response.ok) {
            console.log(`✅ GET 成功 (Status: ${response.status})`);
            console.log(`共获取 ${data.length} 条留言。`);
            if (data.length > 0) {
                console.log("第一条留言:", data[0]);
            }
            return data;
        } else {
            console.error(`❌ GET 失败 (Status: ${response.status})`);
            console.error("错误详情:", data);
            return null;
        }

    } catch (error) {
        console.error("网络请求或解析错误:", error.message);
        return null;
    }
}

/**
 * 3. POST: 给特定留言点赞
 * @param {number} messageId 
 */
async function likeMessage(messageId) {
    console.log(`\n--- 3. 尝试 POST 点赞 (ID: ${messageId}) ---`);
    if (!messageId) {
        console.warn("点赞失败: 未提供消息 ID");
        return;
    }
    const url = `${API_BASE}/${messageId}/like`;
    try {
        const response = await fetch(url, { method: 'POST' });
        const data = await response.json();

        if (response.ok) {
            console.log(`✅ LIKE 成功 (Status: ${response.status})`);
            console.log(`新点赞数: ${data.likes}`);
        } else {
            console.error(`❌ LIKE 失败 (Status: ${response.status})`);
            console.error("错误详情:", data);
        }

    } catch (error) {
        console.error("网络请求或解析错误:", error.message);
    }
}


/**
 * 运行 API 验证序列的主函数
 */
async function runVerification() {
    // 禁用按钮以防重复提交
    const button = document.getElementById('run-button');
    if (button) button.disabled = true;
    
    console.clear();
    console.log("--- 开始 Cloudflare Worker API 验证序列 ---");
    
    // 1. 发布第一条留言
    const msg1 = await postMessage("Client Test", "API 验证测试第一条。");

    // 2. 发布第二条留言
    await postMessage("Client Test", "API 验证测试第二条。");

    let likedMsg = null;
    if (msg1 && msg1.id) {
        // 3. 点赞第一条留言
        await likeMessage(msg1.id);
        likedMsg = msg1;
    }

    // 4. 再次点赞（确认点赞数增加）
    if (likedMsg) {
         await likeMessage(likedMsg.id);
    }
    
    // 5. 获取列表，按点赞数排序（验证排序功能）
    await getMessages('likes');
    
    // 6. 获取列表，按时间排序
    await getMessages('latest');

    if (button) button.disabled = false;
    console.log("\n--- API 验证序列完成 ---");
}

// -------------------------------------------------------------
// 暴露函数以便在 HTML 中调用
// -------------------------------------------------------------

// 您可以在 HTML 文件中直接调用 runVerification()
// 也可以将 postMessage, getMessages, likeMessage 暴露给前端逻辑使用

// 为了验证方便，我们创建一个立即执行的函数来模拟按钮点击
document.addEventListener('DOMContentLoaded', () => {
    // 自动创建并插入一个按钮，方便测试
    const button = document.createElement('button');
    button.id = 'run-button';
    button.textContent = '点击运行 API 验证脚本 (查看控制台)';
    button.onclick = runVerification;
    document.body.prepend(button);

    const title = document.createElement('h1');
    title.textContent = "Cloudflare Worker API 验证";
    document.body.prepend(title);
    
    const p = document.createElement('p');
    p.textContent = "请打开浏览器控制台 (F12) 查看 API 调用结果。";
    document.body.append(p);
});