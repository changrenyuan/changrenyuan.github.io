// script.js - Cloudflare Worker 弹幕留言板注入脚本 (最终完整版)

// 🚨 配置区域：请替换为您部署后的实际 Worker URL
const WORKER_URL = "https://api2.yikii.cn";

// --- 弹幕配置 ---
const BARRAGE_TRACKS = 1; // 强制单轨道排队
const BARRAGE_DURATION_MIN = 10; // 滚动最短时间 (秒)
const BARRAGE_DURATION_MAX = 18; // 滚动最长时间 (秒)
const trackHeight = 25; // 单轨道的垂直位置
let lastFetchTimestamp = 0; 

// 全局队列和状态 (用于单轨道排队)
let barrageQueue = [];
let isTrackOccupied = false;

// --- 名字配置 ---
const NAMES_POOL = [
    "热心网友", "吃瓜群众", "匿名用户", "划水怪", "摸鱼达人",
    "路过的小透明", "程序猿", "设计狮", "产品狗", "前端搬砖工",
    "代码战士", "键盘侠", "深夜冲浪者", "咖啡续命人"
];

function getRandomName() {
    return NAMES_POOL[Math.floor(Math.random() * NAMES_POOL.length)];
}


/**
 * =========================================================
 * 1. 核心辅助函数：Post ID 获取 & API 通信
 * =========================================================
 */

/**
 * 检查当前设备是否为移动端 (屏幕宽度 <= 768px)
 * @returns {boolean}
 */
function isMobileDevice() {
    return window.innerWidth <= 768; 
}

/**
 * 尝试从当前页面的 URL 中推断出唯一的文章 ID (Slug)。
 */
function getPostIdFromUrl() {
    const path = window.location.pathname.replace(/(\?|#).*$/, '');
    const segments = path.split('/').filter(segment => segment.length > 0);
    
    if (segments.length === 0) {
        return 'homepage'; // 根目录使用默认 ID
    }
    
    // 取路径的最后一段作为文章 ID
    return segments[segments.length - 1];
}

function getApiBase(postId) {
    // 关键：API 路由包含 postId
    return `${WORKER_URL}/api/post/${postId}/message`;
}

async function apiFetch(endpoint, options = {}) {
    try {
        const response = await fetch(endpoint, options);
        const data = await response.json();

        if (response.ok) {
            return { success: true, data };
        } else {
            console.error(`API Error (${response.status}):`, data);
            return { success: false, error: data.error || 'Worker 返回错误' };
        }
    } catch (error) {
        console.error("网络请求失败:", error.message);
        return { success: false, error: '网络请求或解析失败' };
    }
}

// 修正：新增 postId 参数
async function postMessage(name, content, postId) {
    const endpoint = getApiBase(postId);
    return apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, content }),
    });
}

// 修正：新增 postId 参数
async function getMessages(postId, sortBy = 'latest', timestamp = 0) {
    const endpoint = getApiBase(postId);
    const url = `${endpoint}?sort=${sortBy}${timestamp ? `&since=${timestamp}` : ''}`;
    return apiFetch(url);
}

// 修正：新增 postId 参数
async function handleLike(messageId, postId) {
    const endpoint = getApiBase(postId);
    const url = `${endpoint}/${messageId}/like`;
    return apiFetch(url, { method: 'POST' });
}


/**
 * =========================================================
 * 2. 弹幕逻辑 (Barrage - 单轨道队列)
 * =========================================================
 */

/**
 * 处理弹幕队列，确保只有一个弹幕在屏幕上滚动。
 */
function processBarrageQueue(container) {
    if (isTrackOccupied || barrageQueue.length === 0) {
        return; 
    }

    const message = barrageQueue.shift(); 
    isTrackOccupied = true; 

    // 滚动速度确保足够慢
    const duration = BARRAGE_DURATION_MAX; 

    const barrageItem = document.createElement('div');
    barrageItem.className = 'barrage-item';
    // 弹幕内容：名字 + 内容 + 点赞数
    barrageItem.textContent = `${message.name}: ${message.content} (${message.likes || 0}❤️)`;
    
    // 定位到唯一的轨道 (top: 0 基础上增加 trackHeight 偏移)
    barrageItem.style.top = `${trackHeight}px`; 
    
    // 动态动画
    barrageItem.style.animationName = 'moveLeft';
    barrageItem.style.animationDuration = `${duration}s`;
    barrageItem.style.animationTimingFunction = 'linear';
    barrageItem.style.animationFillMode = 'forwards';
    
    // 随机颜色
    const hue = Math.floor(Math.random() * 360);
    barrageItem.style.backgroundColor = `hsla(${hue}, 70%, 50%, 0.8)`;
    
    container.appendChild(barrageItem);

    // 动画结束后移除元素并释放轨道
    barrageItem.addEventListener('animationend', () => {
        barrageItem.remove();
        isTrackOccupied = false; 
        // 动画完成后立即尝试显示下一个弹幕
        processBarrageQueue(container); 
    });
}

/**
 * 定时获取新弹幕并加入队列
 */
async function fetchAndSpawnNewBarrages(container, postId) {
    const response = await getMessages(postId, 'latest', lastFetchTimestamp);
    
    if (response.success && response.data.length > 0) {
        response.data.forEach(msg => {
            barrageQueue.push(msg); // 1. 将新弹幕添加到队列
        });
        
        // 2. 尝试处理队列
        processBarrageQueue(container); 
        
        // 更新时间戳
        lastFetchTimestamp = Date.now(); 
    }
}


/**
 * =========================================================
 * 3. 列表和表单逻辑 (List & Form)
 * =========================================================
 */

/**
 * 渲染单个留言元素（用于列表）
 */
function renderListItem(message, container, postId) {
    const div = document.createElement('div');
    div.className = 'message-list-item';
    
    // 格式化时间 (北京时间 UTC+8)
    const utcDate = new Date(message.created_at);
    const date = utcDate.toLocaleString('zh-CN', { 
        year: 'numeric', month: 'numeric', day: 'numeric', 
        hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Shanghai' 
    });

    div.innerHTML = `
        <p class="message-content">
            <strong>${message.name}</strong>: ${message.content}
        </p>
        <div class="message-meta">
            <span class="message-date">
                ${date}
                · 
                ${message.location ? `来自 ${message.location}` : '地理位置未知'} 
                </span>
            <div class="like-container" data-id="${message.id}" style="cursor: pointer;"> 
                <span class="likes-count">${message.likes || 0}</span>
                <span class="like-icon" data-id="${message.id}">❤️</span>
            </div>
        </div>
    `;

    // 绑定点赞事件到心形容器
    div.querySelector('.like-container').addEventListener('click', async (e) => {
        const messageId = message.id;
        const likesCountElement = div.querySelector('.likes-count');
        const likeContainer = e.currentTarget;

        likeContainer.style.pointerEvents = 'none'; // 禁用点击防止重复提交

        const response = await handleLike(messageId, postId); // 传入 postId

        if (response.success) {
            likesCountElement.textContent = response.data.likes;
            // 添加动画效果
            likeContainer.classList.add('liked-animation');
            setTimeout(() => {
                 likeContainer.classList.remove('liked-animation');
            }, 500);
        } else {
            alert(`点赞失败: ${response.error || '请稍后再试'}`);
        }
        
        likeContainer.style.pointerEvents = 'auto'; // 重新启用点击
    });

    container.appendChild(div);
}

/**
 * 核心功能：获取并显示所有留言（用于列表）
 */
async function fetchAndDisplayMessagesList(listContainer, postId) {
    listContainer.innerHTML = '<p>正在加载留言...</p>';
    const response = await getMessages(postId, 'latest'); // 传入 postId
    
    if (!response.success) {
        listContainer.innerHTML = `<p style="color: red;">加载失败: ${response.error}</p>`;
        return;
    }

    const messages = response.data;
    listContainer.innerHTML = ''; 
    
    if (messages.length === 0) {
        listContainer.innerHTML = '<p>暂无留言。</p>';
        return;
    }

    messages.forEach(message => {
        renderListItem(message, listContainer, postId); // 传入 postId
    });
}

/**
 * 事件处理：表单提交
 */
function handleFormSubmit(event, contentInput, nameInput, submitButton, barrageContainer, listContainer, postId) {
    event.preventDefault(); 
    
    const name = nameInput.value.trim();
    const content = contentInput.value.trim();
    
    if (!name || !content) {
        alert("名字和内容不能为空。");
        return;
    }

    submitButton.disabled = true;

    postMessage(name, content, postId) // 传入 postId
        .then(response => {
            if (response.success) {
                // 1. 本地即时显示为弹幕 (入队)
                barrageQueue.push(response.data);
                processBarrageQueue(barrageContainer); 
                
                // 2. 刷新列表 (传入 postId)
                fetchAndDisplayMessagesList(listContainer, postId);
                
                // 3. 清空输入框
                contentInput.value = '';
                // 4. 重新设置随机名字
                nameInput.value = getRandomName();
            } else {
                alert(`提交失败: ${response.error}`);
            }
        })
        .finally(() => {
            submitButton.disabled = false;
        });
}


/**
 * =========================================================
 * 4. 注入和初始化 (Injection & Initialization)
 * =========================================================
 */

/**
 * 动态创建表单和列表结构并注入
 */
function injectCommentsSection(targetElement, barrageContainer, postId) {
    
    const formHTML = `
        <div class="comment-input-area">
            <h3>发表留言</h3>
            <form id="message-form-injected">
                <input type="text" id="name-injected" placeholder="您的名字" required maxlength="10">
                <textarea id="content-injected" placeholder="输入您的留言内容，支持多行" required maxlength="100" rows="4"></textarea> 
                <button type="submit" id="submit-button-injected">发送</button>
            </form>
        </div>
        <h3 class="list-heading">全部留言</h3>
        <div id="messages-list-injected" class="message-list"></div>
    `;
    targetElement.innerHTML = formHTML;

    const form = document.getElementById('message-form-injected');
    const nameInput = document.getElementById('name-injected');
    const contentInput = document.getElementById('content-injected');
    const submitButton = document.getElementById('submit-button-injected');
    const listContainer = document.getElementById('messages-list-injected');

    // 关键修正：随机给名字输入框预填一个名字
    nameInput.value = getRandomName(); 

    // 绑定事件 (传入 postId)
    form.addEventListener('submit', (e) => 
        handleFormSubmit(e, contentInput, nameInput, submitButton, barrageContainer, listContainer, postId)
    );

    // 初始化列表 (传入 postId)
    fetchAndDisplayMessagesList(listContainer, postId);
}

/**
 * 动态创建并注入弹幕容器的样式和结构
 */
function injectBarrageSection(targetElement) {
    // 注入 CSS 动画的关键帧和基础样式
    const style = document.createElement('style');
    style.textContent = `
        .blog-post-barrage-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 90vh; 
            overflow: hidden;
            pointer-events: none; 
            z-index: 10; 
        }
        .barrage-item {
            position: absolute;
            right: -100%; 
            white-space: nowrap;
            padding: 7px 15px;
            border-radius: 20px;
            color: #333;
            font-size: 14px; 
            font-weight: 600;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        @keyframes moveLeft {
            to {
                transform: translateX(-100vw);
            }
        }
        /* 点赞动画 */
        .like-container { display: inline-flex; align-items: center; user-select: none; cursor: pointer; }
        @keyframes heartPulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.3); color: red; } 
            100% { transform: scale(1); }
        }
        .liked-animation { animation: heartPulse 0.5s ease-in-out; }

        /* 列表和表单基础样式 */
        #message-form-injected { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
        
        #message-form-injected input[type="text"], 
        #message-form-injected textarea {
            width: 100%; 
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 5px;
            box-sizing: border-box; 
            font-size: 1em;
        }

        #message-form-injected textarea {
            resize: vertical; /* 允许用户只垂直拖动大小 */
            min-height: 80px; /* 设置最小高度 */
        }
        
        .message-list-item { padding: 8px 0; border-bottom: 1px dashed #eee; display: flex; justify-content: space-between; align-items: center; }
        .message-content { flex-grow: 1; }
        .message-meta { font-size: 0.9em; color: #666; display: flex; align-items: center; gap: 10px; }
    `;
    document.head.appendChild(style);

    // 创建弹幕容器
    const barrageContainer = document.createElement('div');
    barrageContainer.className = 'blog-post-barrage-container';
    targetElement.appendChild(barrageContainer);

    return barrageContainer;
}

/**
 * 主入口点：在 DOM 加载完成后运行
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. 动态获取当前文章 ID
    const postId = getPostIdFromUrl();
    console.log(`[Barrage/Comments] Current Post ID determined as: ${postId}`);

    const barrageAnchor = document.getElementById('barrage-anchor');
    const commentsAnchor = document.getElementById('comments-section');

    if (!barrageAnchor || !commentsAnchor) {
        console.error("无法找到必须的注入锚点。请确保 HTML 中存在 ID 为 'barrage-anchor' 和 'comments-section' 的元素。");
        return;
    }

    // --- 核心逻辑：移动端禁用弹幕 ---
    if (isMobileDevice()) {
        console.log("[Barrage] Mobile device detected (<= 768px). Disabling barrage feature.");
        
        // 隐藏弹幕锚点
        if (barrageAnchor) {
            barrageAnchor.style.display = 'none';
        }

        // 注入表单和列表，使用一个虚拟的容器 (dummyBarrageContainer)
        const dummyBarrageContainer = document.createElement('div');
        injectCommentsSection(commentsAnchor, dummyBarrageContainer, postId);
        
        return; // 结束，不运行弹幕定时器
    }
    // --- 桌面端逻辑 ---

    // 2. 注入弹幕样式和容器
    const barrageContainer = injectBarrageSection(barrageAnchor);

    // 3. 注入表单和列表结构，并绑定事件 (传入 postId)
    injectCommentsSection(commentsAnchor, barrageContainer, postId);

    // 4. 启动弹幕定时器 (传入 postId)
    setInterval(() => fetchAndSpawnNewBarrages(barrageContainer, postId), 60000);
});