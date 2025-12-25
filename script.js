// 获取canvas元素和上下文
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const counterElement = document.getElementById('counter');

// 设置canvas尺寸为窗口大小
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// 初始化canvas尺寸
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// 烟花粒子数组
const particles = [];
const fireworks = [];

// 设置粒子数量上限
const PARTICLE_LIMIT = 2048;

// 颜色数组
const colors = [
    '#FF5252', '#FF4081', '#E040FB', '#7C4DFF',
    '#536DFE', '#448AFF', '#40C4FF', '#18FFFF',
    '#64FFDA', '#69F0AE', '#B2FF59', '#EEFF41',
    '#FFFF00', '#FFD740', '#FFAB40', '#FF6E40'
];

// 粒子类 - 定义烟花粒子的属性和行为
class Particle {
    /**
     * 创建一个新的粒子
     * @param {number} x - 粒子的x坐标
     * @param {number} y - 粒子的y坐标
     * @param {string} color - 粒子的颜色
     * @param {string} type - 粒子类型 (normal, trail, spark)
     */
    constructor(x, y, color, type) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = (Math.random() * 1.5 + 0.5);
        this.velocity = {
            x: (Math.random() - 0.5) * 16,
            y: (Math.random() - 0.5) * 16
        };
        this.alpha = 1;
        this.type = type || 'normal'; // normal, trail, spark
        this.gravity = 0.05;
        this.resistance = 0.92;
        this.shrink = Math.random() * 0.02 + 0.005;

        // 不同类型的粒子有不同的特性
        if (this.type === 'trail') {
            this.velocity.y = Math.random() * -3 - 1; // 向上运动
            this.gravity = 0.01;
            this.life = Math.random() * 16 + 16; // 缩短生命周期
        } else if (this.type === 'spark') {
            this.velocity.x *= 2;
            this.velocity.y *= 2;
            this.life = Math.random() * 32 + 32; // 缩短生命周期
            this.shrink = Math.random() * 0.03 + 0.01;
        } else {
            this.life = Math.random() * 24 + 24; // 缩短生命周期
        }
    }

    // 绘制粒子及其发光效果
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
            this.x, this.y, this.radius * 2
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

    // 更新粒子状态并返回是否存活
    update() {
        // 更新位置
        this.velocity.x *= this.resistance;
        this.velocity.y *= this.resistance;
        this.velocity.y += this.gravity;
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // 减少alpha值，模拟消失效果
        this.life--;
        this.alpha = this.life > 15 ? 1 : this.life / 15; // 更快地减少alpha值

        // 减小半径
        this.radius -= this.shrink;
        if (this.radius < 0) this.radius = 0;

        // 绘制粒子
        this.draw();

        // 返回是否还存活
        return this.life > 0 && this.alpha > 0.01 && this.radius > 0.1; // 调整最小半径
    }
}

// 烟花类 - 定义烟花发射和爆炸的逻辑
class Firework {
    /**
     * 创建一个新的烟花
     * @param {number} startX - 烟花起始x坐标
     * @param {number} startY - 烟花起始y坐标
     * @param {number} targetX - 烟花目标x坐标
     * @param {number} targetY - 烟花目标y坐标
     */
    constructor(startX, startY, targetX, targetY) {
        this.x = startX;
        this.y = startY;
        this.targetX = targetX;
        this.targetY = targetY;

        // 计算速度向量
        const distance = Math.sqrt(
            Math.pow(targetX - startX, 2) +
            Math.pow(targetY - startY, 2)
        );

        this.velocity = {
            x: (targetX - startX) / distance * 6, // 减慢速度
            y: (targetY - startY) / distance * 6
        };

        this.startX = startX;
        this.startY = startY;
        this.distance = distance;
        this.traveled = 0;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.brightness = Math.random() * 50 + 50;
        this.particleCount = Math.random() * 150 + 150; // 爆炸粒子数
    }

    // 绘制烟花主体及其发光效果
    draw() {
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();

        // 添加发光效果
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, 8
        );
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }

    // 更新烟花位置并检查是否到达目标
    update() {
        // 更新位置
        this.traveled += Math.sqrt(
            Math.pow(this.velocity.x, 2) +
            Math.pow(this.velocity.y, 2)
        );

        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // 绘制轨迹粒子
        if (Math.random() < 0.3) { // 增加轨迹粒子
            particles.push(new Particle(this.x, this.y, this.color, 'trail'));
        }

        // 绘制烟花
        this.draw();

        // 检查是否到达目标位置
        const reachedTarget =
            Math.abs(this.x - this.targetX) < 2 &&
            Math.abs(this.y - this.targetY) < 2;

        // 或者已经 traveled 超过总距离
        const passedTarget = this.traveled >= this.distance;

        if (reachedTarget || passedTarget) {
            // 创建爆炸效果
            this.explode();
            return false; // 表示烟花已完成
        }

        return true; // 表示烟花还在移动
    }

    // 烟花爆炸效果 - 创建大量粒子形成爆炸效果
    explode() {
        // 创建爆炸粒子，增加扩散半径（速度是原来的2倍）
        for (let i = 0; i < this.particleCount; i++) {
            // 随机方向
            const angle = Math.random() * Math.PI * 2;
            // 增加速度以增大扩散半径（是原来的2倍）
            const speed = (Math.random() * 5 + 3) * 2; // 速度是原来的2倍

            const velocity = {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            };

            // 随机颜色变化
            const color = i % 5 === 0 ?
                colors[Math.floor(Math.random() * colors.length)] :
                this.color;

            // 创建主粒子
            particles.push(new Particle(this.x, this.y, color, 'normal'));

            // 创建火花粒子
            if (Math.random() > 0.3) {
                particles.push(new Particle(this.x, this.y, color, 'spark'));
            }
        }
    }
}

// 发射烟花函数 - 从底部向上发射烟花
function launchFirework(x, y) {
    // 从底部发射
    const startX = x;
    const startY = canvas.height;

    fireworks.push(new Firework(startX, startY, x, y));
}

// 创建星空背景 - 在天空中随机生成星星
function createStars() {
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height / 2;
        const radius = (Math.random() * 1.2);
        const opacity = Math.random() * 0.8 + 0.2;

        particles.push({
            x: x,
            y: y,
            radius: radius,
            color: '#FFFFFF',
            alpha: opacity,
            draw: function () {
                ctx.globalAlpha = this.alpha;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
                ctx.closePath();
                ctx.globalAlpha = 1;
            },
            update: function () {
                // 星星微微闪烁
                this.alpha = Math.sin(Date.now() / 1000 + this.x) * 0.2 +
                    Math.random() * 0.3 + 0.5;
                this.draw();
                return true; // 永远存活
            }
        });
    }
}

// 动画循环函数 - 持续更新和绘制所有元素
function animate() {
    // 清除画布，使用半透明黑色创建轨迹效果
    ctx.fillStyle = 'rgba(12, 20, 69, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 更新并绘制烟花
    for (let i = fireworks.length - 1; i >= 0; i--) {
        if (!fireworks[i].update()) {
            fireworks.splice(i, 1);
        }
    }

    // 更新并绘制粒子
    for (let i = particles.length - 1; i >= 0; i--) {
        if (!particles[i].update()) {
            particles.splice(i, 1);
        }
    }

    // 如果粒子数量超过限制，移除最早的粒子
    if (particles.length > PARTICLE_LIMIT) {
        const excess = particles.length - PARTICLE_LIMIT;
        particles.splice(0, excess);
    }

    // 更新粒子计数显示
    counterElement.textContent = particles.length;

    requestAnimationFrame(animate);
}

// 鼠标点击事件 - 发射烟花
canvas.addEventListener('click', function (e) {
    if (particles.length < PARTICLE_LIMIT - 150) { // 预留足够空间
        launchFirework(e.clientX, e.clientY);
    }
});

// 初始化星星
createStars();

// 启动动画
animate();
