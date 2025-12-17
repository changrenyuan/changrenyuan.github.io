(function() {
    // 模拟后端数据存储
    let messagesDB = [
        { id: 'm1', name: '访客A', content: '欢迎来到我的网站！这是第一条留言。', likes: 12, created_at: new Date(Date.now() - 86400000 * 2).toISOString(), ip: '192.168.1.100', location: '广东 深圳' }, 
        { id: 'm2', name: '李明', content: '这个功能太棒了，支持！', likes: 25, created_at: new Date(Date.now() - 86400000).toISOString(), ip: '101.98.24.5', location: '北京' }, 
        { id: 'm3', name: '匿名', content: '我有一个小小的建议...', likes: 5, created_at: new Date().toISOString(), ip: '223.167.9.87', location: '上海' } 
    ];
    let nextId = 4;

    // --- 辅助函数：模拟 IP 和地理位置 ---
    const mockIP = () => {
        return Math.floor(Math.random() * 255) + 1 + "." + Math.floor(Math.random() * 255) + "." + Math.floor(Math.random() * 255) + "." + Math.floor(Math.random() * 255);
    };

    const mockLocation = () => {
        const locations = ['浙江 杭州', '江苏 南京', '四川 成都', '湖北 武汉', '福建 厦门', '未知'];
        return locations[Math.floor(Math.random() * locations.length)];
    };


    // --- 模拟 API 端点 ---

    // 模拟 GET /api/message
    async function mockApiFetch() {
        await new Promise(resolve => setTimeout(resolve, 300)); 
        return messagesDB;
    }

    // 模拟 POST /api/message (增加 IP 和 Location 字段)
    async function mockApiPost(name, content) {
        await new Promise(resolve => setTimeout(resolve, 300));
        const newMsg = {
            id: 'm' + nextId++,
            name: name,
            content: content,
            likes: 0,
            created_at: new Date().toISOString(),
            ip: mockIP(),           // <--- 新增: 模拟 IP
            location: mockLocation() // <--- 新增: 模拟位置
        };
        messagesDB.push(newMsg);
        return newMsg;
    }

    // 模拟 POST /api/message/{id}/like
    async function mockApiLike(messageId) {
        await new Promise(resolve => setTimeout(resolve, 300));
        const msg = messagesDB.find(m => m.id === messageId);
        if (msg) {
            msg.likes = (msg.likes || 0) + 1;
            return msg;
        }
        throw new Error("留言未找到");
    }

    // --- 前端逻辑开始 ---
    
    // 状态管理
    let currentSort = 'latest'; 
    let messagesCache = []; 

    // --- 1. 构建最简 HTML 结构 ---
    const container = document.createElement("div");
    container.id = "gb-container";
    container.innerHTML = `
        <div id="gb-header">
            <h3>留言板 (模拟数据)</h3>
            <div id="gb-sort-controls">
                排序:
                <a href="#" id="sort-latest" data-sort="latest" style="font-weight: bold;">最新</a>
                |
                <a href="#" id="sort-likes" data-sort="likes">热门</a>
            </div>
        </div>
        <div id="gb-form">
            <div>
                <input type="text" id="gb-name" placeholder="你的昵称" maxlength="20" />
            </div>
            <div>
                <textarea id="gb-content" placeholder="写下你的想法..." maxlength="500"></textarea>
            </div>
            <button id="gb-submit">发布留言</button>
        </div>
        <div id="gb-list">
            <div>加载中...</div>
        </div>
    `;
    
    const target = document.getElementById('comments-section') || document.body;
    target.appendChild(container);

    // --- 2. 获取 DOM 元素 ---
    const listEl = container.querySelector("#gb-list");
    const submitBtn = container.querySelector("#gb-submit");
    const nameInput = container.querySelector("#gb-name");
    const contentInput = container.querySelector("#gb-content");
    const sortLatestBtn = container.querySelector("#sort-latest");
    const sortLikesBtn = container.querySelector("#sort-likes");

    // 辅助：格式化时间
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleString('zh-CN');
    };

    // 渲染单条留言 (增加 IP 和位置显示)
    const createMessageCard = (msg) => {
        const div = document.createElement("div");
        div.id = `msg-${msg.id}`;
        div.style.borderBottom = '1px solid #ccc';
        div.style.padding = '10px 0';
        div.innerHTML = `
            <p>
                <strong>${msg.name || '匿名用户'}</strong> 
                <span style="float: right;">${formatDate(msg.created_at)}</span>
            </p>
            <p>${msg.content}</p>
            <div style="font-size: 12px; margin-top: 5px; color: gray;">
                <span>IP: ${msg.ip}</span> | 
                <span>位置: ${msg.location || '未知'}</span> 
                
                <span style="float: right;">
                    <span id="likes-count-${msg.id}">❤️ ${msg.likes || 0}</span> 
                    <button class="like-btn" data-id="${msg.id}" style="margin-left: 10px; cursor: pointer;">赞同</button>
                </span>
            </div>
        `;

        const likeButton = div.querySelector(`.like-btn[data-id="${msg.id}"]`);
        if (likeButton) {
            likeButton.addEventListener('click', handleLikeClick);
        }

        return div;
    };

    // 辅助函数：使用缓存数据渲染列表
    function renderFromCache(sortBy) {
        if (sortBy === 'latest') {
            messagesCache.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } else if (sortBy === 'likes') {
            messagesCache.sort((a, b) => (b.likes || 0) - (a.likes || 0)); 
        }

        listEl.innerHTML = '';
        messagesCache.forEach(msg => {
            listEl.appendChild(createMessageCard(msg));
        });
    }

    // --- 3. 核心功能：获取并渲染留言 ---
    async function fetchMessages() {
        try {
            const data = await mockApiFetch();
            messagesCache = data;
            
            if (messagesCache.length > 0) {
                renderFromCache(currentSort);
            } else {
                listEl.innerHTML = '<div>还没有留言，抢个沙发吧！</div>';
            }
        } catch (e) {
            listEl.innerHTML = '<div>加载失败</div>';
            console.error("获取留言失败:", e);
        }
    }
    
    // --- 4. 核心功能：赞同处理 ---
    async function handleLikeClick(event) {
        const messageId = event.target.dataset.id;
        const likeButton = event.target;
        
        if (!messageId) return;

        likeButton.disabled = true;
        likeButton.textContent = "操作中..."; 

        try {
            const updatedMsg = await mockApiLike(messageId); 
            
            const likesCountEl = document.getElementById(`likes-count-${messageId}`);
            if (likesCountEl) {
                likesCountEl.textContent = `❤️ ${updatedMsg.likes || 0}`;
            }

            const index = messagesCache.findIndex(m => m.id === messageId);
            if (index !== -1) {
                messagesCache[index].likes = updatedMsg.likes;
            }
            
            if (currentSort === 'likes') {
                renderFromCache('likes');
            }

        } catch (e) {
            alert("赞同操作失败: " + e.message);
        } finally {
            likeButton.disabled = false;
            likeButton.textContent = "赞同"; 
        }
    }

    // --- 5. 核心功能：排序切换 ---
    function handleSortClick(event) {
        event.preventDefault();
        const newSort = event.target.dataset.sort;

        if (newSort === currentSort) return;

        currentSort = newSort;

        sortLatestBtn.style.fontWeight = newSort === 'latest' ? 'bold' : 'normal';
        sortLikesBtn.style.fontWeight = newSort === 'likes' ? 'bold' : 'normal';

        listEl.innerHTML = '<div>加载中...</div>';
        
        if (messagesCache.length > 0) {
            renderFromCache(currentSort); 
        } else {
            fetchMessages(); 
        }
    }

    sortLatestBtn.addEventListener('click', handleSortClick);
    sortLikesBtn.addEventListener('click', handleSortClick);

    // --- 6. 核心功能：提交留言 ---
    submitBtn.addEventListener("click", async () => {
        const name = nameInput.value.trim();
        const content = contentInput.value.trim();

        if (!name || !content) {
            alert("请填写昵称和内容");
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "提交中...";

        try {
            // 使用模拟 API (它会自动生成 IP 和 Location)
            await mockApiPost(name, content);
            contentInput.value = '';
            await fetchMessages(); 
        } catch (e) {
            alert("提交失败：" + e.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "发布留言";
        }
    });

    // 初始化加载
    fetchMessages();
})();