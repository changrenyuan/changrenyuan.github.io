window.onload = async () => {
    // 检查命名空间
    const L2D = PIXI.live2d;
    if (!L2D) {
        console.error("插件未加载，请检查网络或脚本引入顺序");
        return;
    }

    const app = new PIXI.Application({
        view: document.getElementById('live2d-canvas'),
        autoStart: true,
        transparent: true,
        antialias: true,
        width: 300,
        height: 400
    });

    try {
        // 使用绝对路径加载 Z16
        const model = await L2D.Live2DModel.from("/live2d/model/z16/z16.model.json");
        
        app.stage.addChild(model);

        // Z16 这种旧模型通常很大，需要缩小
        model.scale.set(0.1); 
        
        // 居中或调整位置
        model.x = 0;
        model.y = 0;

        // 开启鼠标跟随
        model.trackCursor = true;

    } catch (e) {
        console.error("加载模型出错，请检查文件路径是否正确:", e);
    }
};