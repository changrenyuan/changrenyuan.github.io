/**
 * Live2D 高清一键加载脚本
 * 修复模糊问题，支持自定义位置与交互
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
        if (!L2D) throw new Error("Live2D 组件初始化失败");

        let canvas = document.getElementById('live2d-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'live2d-canvas';
            document.body.appendChild(canvas);
        }

        // --- 样式定义（还原你之前的 display 参数） ---
        Object.assign(canvas.style, {
            position: 'fixed',
            right: '0px',      // 对应 hOffset
            bottom: '-20px',    // 对应 vOffset
            zIndex: '9999',
            opacity: '0.7',    // 对应 opacityDefault
            transition: 'opacity 0.3s',
            pointerEvents: 'none'
        });

        // --- 核心优化：解决模糊问题 ---
        const app = new PIXI.Application({
            view: canvas,
            autoStart: true,
            transparent: true,
            antialias: true,
            // 关键：适配高倍屏像素比
            resolution: window.devicePixelRatio || 1,
            autoDensity: true, 
            width: 250,  // 画布宽度
            height: 350  // 画布高度
        });

        const model = await L2D.Live2DModel.from("/live2d/model/z16/z16.model.json");
        app.stage.addChild(model);
        canvas.style.pointerEvents = 'auto';

        // --- 模型位置与大小定义 ---
        model.scale.set(0.15); // 如果开了高清适配后觉得太小，可以适当调大这个值
        model.x = 0;
        model.y = 0;
        model.trackCursor = true;

        // --- 交互定义 ---
        
        // 1. 鼠标悬停透明度（还原之前的 react 配置）
        canvas.onmouseenter = () => canvas.style.opacity = '1';
        canvas.onmouseleave = () => canvas.style.opacity = '0.7';

        // 2. 点击动作定义
        model.on('hit', (hitAreas) => {
            console.log("点击区域:", hitAreas); // 可以在控制台看你点到了哪里
            if (hitAreas.includes('body')) {
                model.motion('tap_body'); 
            }
            if (hitAreas.includes('head')) {
                model.motion('talk'); 
            }
        });

        console.log("Live2D 高清版加载成功！");

    } catch (err) {
        console.error("Live2D 启动失败:", err);
    }
})();