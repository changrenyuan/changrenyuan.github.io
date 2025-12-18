/**
 * Live2D 一键加载脚本
 * 自动处理 PixiJS, Cubism Core 和模型渲染
 */

const dependencies = [
    // PixiJS - 使用 cdnjs 的国内镜像或 bootcdn
    'https://lib.baomitu.com/pixi.js/5.3.12/pixi.min.js',
    
    // Cubism 4 Core - 换一个更稳的源
    'https://cdn.jsdelivr.net/gh/dreamer-927/Live2D_Core/live2dcubismcore.min.js',
    
    // Cubism 2.1 Core - 换一个源
    'https://cdn.jsdelivr.net/gh/dylanNew/live2d/webgl/Live2D/lib/live2d.min.js',
    
    // 适配插件
    'https://lib.baomitu.com/pixi-live2d-display/0.4.0-beta.2/index.min.js'
];

// 动态加载脚本的函数
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
        // 1. 顺序加载所有依赖
        for (const res of dependencies) {
            await loadScript(res);
        }

        // 2. 检查环境是否就绪
        const L2D = PIXI.live2d;
        if (!L2D) throw new Error("Live2D 组件初始化失败");

        // 3. 创建 Canvas 容器 (如果 HTML 中没写，这里自动创建一个)
        let canvas = document.getElementById('live2d-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'live2d-canvas';
            canvas.style.position = 'fixed';
            canvas.style.bottom = '0';
            canvas.style.right = '0';
            canvas.style.zIndex = '9999';
            canvas.style.pointerEvents = 'none'; // 初始穿透，不影响点击页面
            document.body.appendChild(canvas);
        }

        // 4. 初始化 PixiApp
        const app = new PIXI.Application({
            view: canvas,
            autoStart: true,
            transparent: true,
            antialias: true,
            width: 300,
            height: 400
        });

        // 5. 加载模型
        // 注意：请确保路径正确
        const model = await L2D.Live2DModel.from("/live2d/model/z16/z16.model.json");
        
        app.stage.addChild(model);
        canvas.style.pointerEvents = 'auto'; // 加载成功后恢复点击

        // --- 自定义定义区域 ---
        model.scale.set(0.12); // 缩放
        model.x = 0;
        model.y = 0;
        model.trackCursor = true; // 鼠标跟随

        // 点击交互
        model.on('hit', (hitAreas) => {
            if (hitAreas.includes('body')) {
                model.motion('patted'); // 触发动作
            }
        });

        console.log("Live2D 看板娘加载成功！");

    } catch (err) {
        console.error("Live2D 启动失败:", err);
    }
})();