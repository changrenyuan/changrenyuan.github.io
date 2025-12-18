/**
 * Live2D 高清 AI 增强版加载脚本
 * 集成：PixiJS 高清渲染、Cloudflare Workers AI 对话、自动气泡
 */

// 1. 依赖库配置（请确保这些文件已放在您的 /js/pixi/ 目录下）
const dependencies = [
    '/js/pixi/pixi.min.js',
    '/js/pixi/live2dcubismcore.min.js',
    '/js/pixi/live2d.min.js',
    '/js/pixi/index.min.js'
];

// 2. 动态加载脚本函数
function loadScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

(async function initLive2D() {
    try {
        // 顺序加载依赖
        for (const res of dependencies) {
            await loadScript(res);
        }

        const L2D = PIXI.live2d;
        if (!L2D) throw new Error("Live2D 组件初始化失败");

        // --- 1. 自动创建 UI 结构 ---
        const container = document.createElement('div');
        container.id = 'live2d-container';
        Object.assign(container.style, {
            position: 'fixed',
            right: '0px',
            bottom: '0px',
            zIndex: '9999',
            width: '280px',
            height: '380px',
            pointerEvents: 'none'
        });
        document.body.appendChild(container);

        // 创建对话气泡
        const messageBox = document.createElement('div');
        messageBox.id = 'live2d-message';
        Object.assign(messageBox.style, {
            width: '180px',
            margin: '0 auto',
            padding: '10px 15px',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            border: '2px solid #ffcc00',
            borderRadius: '15px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            fontSize: '13px',
            fontWeight: 'bold',
            color: '#333',
            textAlign: 'center',
            opacity: '0',
            transition: 'opacity 0.5s, transform 0.5s',
            transform: 'translateY(10px)',
            position: 'relative',
            bottom: '0px',
            pointerEvents: 'none',
            wordBreak: 'break-all'
        });
        container.appendChild(messageBox);

        const canvas = document.createElement('canvas');
        canvas.id = 'live2d-canvas';
        container.appendChild(canvas);

        // --- 2. 初始化 PixiApp (高清方案) ---
        const app = new PIXI.Application({
            view: canvas,
            autoStart: true,
            transparent: true,
            antialias: true,
            resolution: window.devicePixelRatio || 1, // 解决模糊的关键
            autoDensity: true,
            width: 280,
            height: 350
        });

        // --- 3. 加载模型 ---
        const model = await L2D.Live2DModel.from("/live2d/model/z16/z16.model.json");
        app.stage.addChild(model);
        container.style.pointerEvents = 'auto'; // 加载成功后允许点击

        // 模型初始设置
        model.scale.set(0.14); // 缩放比例
        model.x = 0;
        model.y = 0;
        model.trackCursor = true; // 开启鼠标跟随

        // --- 4. 功能函数 ---

        // 显示对话气泡
        function showZ16Message(text, timeout = 5000) {
            messageBox.innerText = text;
            messageBox.style.opacity = '1';
            messageBox.style.transform = 'translateY(0px)';
            
            // 触发模型说话动作 (Z16 常用动作名，若点不出来请检查 json)
            model.motion('talk'); 
            
            setTimeout(() => {
                messageBox.style.opacity = '0';
                messageBox.style.transform = 'translateY(10px)';
            }, timeout);
        }

        // 调用 Cloudflare Workers AI 接口
        async function fetchAiQuote() {
            try {
                const title = encodeURIComponent(document.title);
                // ！！！注意：请将此处替换为您 Worker 的真实访问地址！！！
                const response = await fetch(`https://your-worker-name.workers.dev/api/ai/z16-chat?title=${title}`);
                const data = await response.json();
                return data.text || "指挥官，我在听哦。";
            } catch (err) {
                console.error("AI 获取失败:", err);
                return "指挥官，网络好像有点阻塞呢。";
            }
        }

        // --- 5. 事件定义 ---

        // 鼠标移入/移出透明度交互
        container.onmouseenter = () => { container.style.opacity = '1'; };
        container.onmouseleave = () => { container.style.opacity = '0.8'; };

        // 点击模型交互
        model.on('hit', (hitAreas) => {
            if (hitAreas.includes('head')) {
                showZ16Message("不可以摸头，会变笨的！");
                model.motion('talk');
            } else if (hitAreas.includes('body')) {
                showZ16Message("哇！痒痒的...");
                model.motion('patted'); 
            }
        });

        // --- 6. 启动 AI 轮询任务 (每 10 秒) ---
        setInterval(async () => {
            // 只有在没说话的时候才请求 AI，避免重叠
            if (messageBox.style.opacity === '0') {
                const aiText = await fetchAiQuote();
                showZ16Message(aiText);
            }
        }, 10000);

        // 页面初次加载欢迎语
        setTimeout(() => {
            showZ16Message("指挥官，Z16 报到！今天也要一起加油哦！");
        }, 2000);

        console.log("Live2D AI 高清版配置完成");

    } catch (err) {
        console.error("Live2D 启动失败:", err);
    }
})();