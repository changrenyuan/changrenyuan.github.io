/**
 * Live2D Z16 AI 最终整合版
 * 包含：动态注入、AI 轮询、点赞联动、高清适配
 */

const dependencies = [
    '/js/pixi/pixi.min.js',
    '/js/pixi/live2dcubismcore.min.js',
    '/js/pixi/live2d.min.js',
    '/js/pixi/index.min.js'
];

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
        for (const res of dependencies) {
            await loadScript(res);
        }

        const L2D = PIXI.live2d;
        if (!L2D) return;

        // --- 1. 构造容器与 UI ---
        const container = document.createElement('div');
        Object.assign(container.style, {
            position: 'fixed',
            right: '0',
            bottom: '0',
            zIndex: '99999',
            width: '280px',
            height: '400px',
            pointerEvents: 'none'
        });
        document.body.appendChild(container);

        const messageBox = document.createElement('div');
        messageBox.id = 'live2d-message';
        Object.assign(messageBox.style, {
            position: 'absolute',
            top: '0',
            left: '50%',
            transform: 'translateX(-50%) translateY(10px)',
            width: '200px',
            padding: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            border: '2px solid #ffcc00',
            borderRadius: '12px',
            fontSize: '13px',
            color: '#333',
            textAlign: 'center',
            opacity: '0',
            transition: 'all 0.4s ease',
            zIndex: '100000'
        });
        container.appendChild(messageBox);

        const canvas = document.createElement('canvas');
        container.appendChild(canvas);

        // --- 2. 初始化渲染引擎 ---
        const app = new PIXI.Application({
            view: canvas,
            autoStart: true,
            transparent: true,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
            width: 280,
            height: 400
        });

        const model = await L2D.Live2DModel.from("/live2d/model/z16/z16.model.json");
        app.stage.addChild(model);
        container.style.pointerEvents = 'auto';

        // 模型定位与缩放
        model.scale.set(0.14);
        model.anchor.set(0.5, 1); 
        model.x = app.screen.width / 2;
        model.y = app.screen.height; 
        model.trackCursor = true;

        // --- 3. 核心功能函数 ---

        function showMessage(text, timeout = 5000) {
            messageBox.innerText = text;
            messageBox.style.opacity = '1';
            messageBox.style.transform = 'translateX(-50%) translateY(0px)';
            model.motion('talk'); 
            
            // 清除之前的定时器防止闪烁
            if (window.l2dTimer) clearTimeout(window.l2dTimer);
            window.l2dTimer = setTimeout(() => {
                messageBox.style.opacity = '0';
                messageBox.style.transform = 'translateX(-50%) translateY(10px)';
            }, timeout);
        }

        async function fetchAI() {
            try {
                const title = encodeURIComponent(document.title);
                const res = await fetch(`https://api2.yikii.cn/api/ai/z16-chat?title=${title}`);
                const data = await res.json();
                return data.text;
            } catch (e) {
                return "指挥官，加油哦！";
            }
        }

        // --- 4. 外部联动：监听点赞事件 ---
        // 在你页面的点赞代码成功回调里，加入这一行：
        // window.dispatchEvent(new CustomEvent('l2d_thanks'));
        window.addEventListener('l2d_thanks', () => {
            showMessage("谢谢指挥官的点赞！Z16 动力满满！");
            model.motion('patted');
        });

        // --- 5. 启动循环任务 ---
        setInterval(async () => {
            if (messageBox.style.opacity === '0') {
                const quote = await fetchAI();
                showMessage(quote);
            }
        }, 10000);

        // 点击交互
        model.on('hit', (areas) => {
            if (areas.includes('head')) {
                showMessage("不可以摸头！");
            } else {
                showMessage("有什么吩咐吗，指挥官？");
            }
        });

        // 初始欢迎语
        setTimeout(() => showMessage("Z16 报到！AI 脑波已接通至 api2.yikii.cn"), 1500);

    } catch (err) {
        console.error("Live2D 初始化异常", err);
    }
})();