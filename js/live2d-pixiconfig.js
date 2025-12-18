/**
 * Live2D 深度定义脚本
 * 功能：高清渲染 + 动态对话框 + 随机交互
 */
if (window.innerWidth < 768) return; // 手机端直接退出不加载
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
        if (!L2D) throw new Error("Live2D 组件初始化失败");

        // --- 1. 创建 UI 容器（画布 + 对话框） ---
        const container = document.createElement('div');
        container.id = 'live2d-container';
        Object.assign(container.style, {
            position: 'fixed',
            right: '10px',
            bottom: '0px',
            zIndex: '9999',
            width: '280px',
            height: '350px',
            pointerEvents: 'none'
        });
        document.body.appendChild(container);

        // 创建对话气泡
        const messageBox = document.createElement('div');
        messageBox.id = 'live2d-message';
        Object.assign(messageBox.style, {
            width: '200px',
            margin: '0 auto',
            padding: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            border: '1px solid #ffcc00',
            borderRadius: '10px',
            fontSize: '14px',
            textAlign: 'center',
            opacity: '0',
            transition: 'opacity 0.5s',
            position: 'relative',
            bottom: '-20px'
        });
        container.appendChild(messageBox);

        const canvas = document.createElement('canvas');
        container.appendChild(canvas);

        // --- 2. 初始化高清 App ---
        const app = new PIXI.Application({
            view: canvas,
            autoStart: true,
            transparent: true,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
            width: 280,
            height: 350
        });

        const model = await L2D.Live2DModel.from("/live2d/model/z16/z16.model.json");
        app.stage.addChild(model);
        container.style.pointerEvents = 'auto';

        // --- 3. 模型定义 ---
        model.scale.set(0.14);
        model.trackCursor = true;

        // 对话函数
        function showMessage(text, timeout = 3000) {
            messageBox.innerText = text;
            messageBox.style.opacity = '1';
            setTimeout(() => { messageBox.style.opacity = '0'; }, timeout);
        }

        // --- 4. 定义交互事件 ---
        
        // 刚进入页面时的欢迎语
        setTimeout(() => {
            showMessage("指挥官，Z16 报到！要一起去海边吗？");
        }, 1000);

        // 鼠标移入变亮
        container.onmouseenter = () => { container.style.opacity = '1'; };
        container.onmouseleave = () => { container.style.opacity = '0.8'; };

        // 点击交互：点击不同部位有不同反应
        model.on('hit', (hitAreas) => {
            if (hitAreas.includes('head')) {
                showMessage("不可以摸头，会变笨的！");
                model.motion('talk'); // 播放说话动作
            } else if (hitAreas.includes('body')) {
                showMessage("哇！痒痒的...");
                model.motion('patted'); 
            }
        });

        // 闲置状态每隔 30 秒随机动一下
        setInterval(() => {
            if (messageBox.style.opacity === '0') {
                model.motion('idle');
            }
        }, 30000);

    } catch (err) {
        console.error("Live2D 定义失败:", err);
    }
})();