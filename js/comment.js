
(function() {
    const API = "https://api.yikii.cn/api/message";
    
    // --- 1. 注入 CSS 样式 (现代化风格) ---
    const style = document.createElement('style');
    style.textContent = `
        /* 容器样式 */
        #gb-container {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            max-width: 600px;
            margin: 40px auto;
            padding: 20px;
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            color: #333;
        }
        #gb-header {
            margin-bottom: 20px;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 10px;
        }
        #gb-header h3 { margin: 0; font-size: 1.5em; color: #1a1a1a; }
        
        /* 表单区域 */
        .gb-form-group { margin-bottom: 15px; }
        .gb-input, .gb-textarea {
            width: 100%;
            padding: 12px;
            border: 1px solid #e1e1e1;
            border-radius: 8px;
            font-size: 14px;
            box-sizing: border-box;
            transition: all 0.3s ease;
            outline: none;
            background: #f9f9f9;
        }
        .gb-input:focus, .gb-textarea:focus {
            border-color: #007aff;
            background: #fff;
            box-shadow: 0 0 0 3px rgba(0,122,255,0.1);
        }
        .gb-textarea { resize: vertical; min-height: 80px; }
        
        /* 按钮样式 */
        #gb-submit {
            background-color: #007aff;
            color: white;
            border: none;
            padding: 10px 24px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
            width: 100%;
        }
        #gb-submit:hover { background-color: #0056b3; }
        #gb-submit:disabled { background-color: #ccc; cursor: not-allowed; }

        /* 留言列表 */
        #gb-list { margin-top: 30px; }
        .gb-card {
            display: flex;
            gap: 15px;
            padding: 15px 0;
            border-bottom: 1px solid #f0f0f0;
            animation: fadeIn 0.5s ease;
        }
        .gb-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #eee;
            flex-shrink: 0;
        }
        .gb-content-wrap { flex-grow: 1; }
        .gb-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
        }
        .gb-name { font-weight: bold; font-size: 15px; color: #222; }
        .gb-date { font-size: 12px; color: #999; }
        .gb-text { font-size: 14px; line-height: 1.6; color: #444; word-break: break-all; }
        
        /* 简单的加载动画 */
        .gb-loading { text-align: center; color: #999; padding: 20px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.appendChild(style);

    // --- 2. 构建 HTML 结构 ---
    const container = document.createElement("div");
    container.id = "gb-container";
    container.innerHTML = `
        <div id="gb-header">
            <h3>留言板</h3>
        </div>
        <div id="gb-form">
            <div class="gb-form-group">
                <input type="text" class="gb-input" id="gb-name" placeholder="你的昵称" maxlength="20" />
            </div>
            <div class="gb-form-group">
                <textarea class="gb-textarea" id="gb-content" placeholder="写下你的想法..." maxlength="500"></textarea>
            </div>
            <button id="gb-submit">发布留言</button>
        </div>
        <div id="gb-list">
            <div class="gb-loading">加载中...</div>
        </div>
    `;
    
    // 插入到页面中 (优先寻找 id="comments-section"，找不到则插到 body 底部)
    const target = document.getElementById('comments-section') || document.body;
    target.appendChild(container);

    // --- 3. 逻辑处理 ---
    const listEl = container.querySelector("#gb-list");
    const submitBtn = container.querySelector("#gb-submit");
    const nameInput = container.querySelector("#gb-name");
    const contentInput = container.querySelector("#gb-content");

    // 辅助：生成头像 URL
    const getAvatar = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=64`;

    // 辅助：格式化时间
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    // 渲染单条留言
    const createMessageCard = (msg) => {
        const div = document.createElement("div");
        div.className = "gb-card";
        div.innerHTML = `
            <img class="gb-avatar" src="${getAvatar(msg.name)}" alt="${msg.name}">
            <div class="gb-content-wrap">
                <div class="gb-meta">
                    <span class="gb-name">${msg.name || '匿名用户'}</span>
                    <span class="gb-date">${formatDate(msg.created_at)}</span>
                </div>
                <div class="gb-text">${msg.content}</div>
            </div>
        `;
        return div;
    };

    // 获取留言
    async function fetchMessages() {
        try {
            const res = await fetch(API);
            const data = await res.json();
            listEl.innerHTML = ''; // 清空加载状态
            
            if (Array.isArray(data) && data.length > 0) {
                // 假设 API 返回是旧到新，我们反转一下让最新的在上面
                // 如果 API 已经是倒序，可以去掉 .reverse()
                data.reverse().forEach(msg => {
                    listEl.appendChild(createMessageCard(msg));
                });
            } else {
                listEl.innerHTML = '<div class="gb-loading">还没有留言，抢个沙发吧！</div>';
            }
        } catch (e) {
            listEl.innerHTML = '<div class="gb-loading" style="color:red">加载失败，请刷新重试</div>';
            console.error(e);
        }
    }

    // 提交留言
    submitBtn.addEventListener("click", async () => {
        const name = nameInput.value.trim();
        const content = contentInput.value.trim();

        if (!name || !content) {
            // 简单的抖动提示或边框变红，这里用 alert 简化，但你可以优化
            alert("请填写昵称和内容"); 
            return;
        }

        // 锁定按钮，防止重复提交
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = "提交中...";

        try {
            await fetch(API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, content })
            });

            // 清空输入框
            contentInput.value = '';
            // nameInput.value = ''; // 名字通常保留，方便用户继续回复，看你需求

            // 重新加载列表
            await fetchMessages();
        } catch (e) {
            alert("提交失败：" + e.message);
        } finally {
            // 恢复按钮状态
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });

    // 初始化
    fetchMessages();
})();
