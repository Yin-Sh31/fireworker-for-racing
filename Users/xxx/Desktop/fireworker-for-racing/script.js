
class ImageParticle {
    /**
     * 创建一个新的图像粒子
     * @param {number} x - 粒子的x坐标
     * @param {number} y - 粒子的y坐标
     * @param {string} color - 粒子的颜色
     * @param {number} targetX - 粒子的目标x坐标
     * @param {number} targetY - 粒子的目标y坐标
     */
    constructor(x, y, color, targetX, targetY) {
        this.initialX = x;  // 初始位置
        this.initialY = y;
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = 1; // 进一步减小粒子半径
        this.targetX = targetX;
        this.targetY = targetY;
        this.alpha = 0;  // 初始透明度为0
        this.maxLife = Math.random() * 800 + 200; // 大幅增加生命周期的随机性范围 (200-1000帧)
        this.life = 0;
        this.spawning = true; // 是否正在生成中
        
        // 添加随机偏移量，使粒子不完全从中心开始
        this.offsetX = (Math.random() - 0.5) * 40; // X方向随机偏移
        this.offsetY = (Math.random() - 0.5) * 40; // Y方向随机偏移
    }

    // 绘制粒子
    draw() {
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();

        // 添加发光效果
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius * 4
        );
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();

        ctx.globalAlpha = 1;
    }

    // 更新粒子状态
    update() {
        // 如果粒子正在生成中，逐渐增加透明度并移动到目标位置
        if (this.spawning) {
            this.life++;
            // 增加粒子透明度
            this.alpha = Math.min(this.life / 60, 0.8); // 调整透明度
            
            // 粒子从中心向外移动，添加随机偏移
            const dx = this.targetX - this.initialX;
            const dy = this.targetY - this.initialY;
            const progress = Math.min(this.life / 40, 1); // 控制移动速度
            
            this.x = this.initialX + dx * progress + this.offsetX;
            this.y = this.initialY + dy * progress + this.offsetY;
            
            if (this.life >= 60) {
                this.spawning = false; // 停止生成阶段
            }
        } else {
            // 粒子到达目标位置后，保持在目标位置
            this.x = this.targetX + this.offsetX;
            this.y = this.targetY + this.offsetY;
            
            // 开始倒计时，准备消失
            this.life++;
            if (this.life >= this.maxLife) {
                // 减慢消失速度
                this.alpha -= 0.01;
            }
        }

        // 绘制粒子
        this.draw();

        // 返回是否还存活
        return this.alpha > 0;
    }
}
