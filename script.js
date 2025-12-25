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

// 添加螺旋模式相关变量
let particleCountThreshold = 0; // 连续粒子数超过1500的次数
const PARTICLE_COUNT_THRESHOLD_MAX = 36; // 阈值：连续3650次
let spiralModeActive = false; // 螺旋模式是否激活

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

// 图像粒子类 - 用于显示图像中的像素点
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
        this.radius = 2; // 增加粒子半径
        this.targetX = targetX;
        this.targetY = targetY;
        this.alpha = 0;  // 初始透明度为0
        this.maxLife = Math.random() * 100 + 250; // 增加生命周期，让图像显示更久
        this.life = 0;
        this.spawning = true; // 是否正在生成中
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
            this.alpha = Math.min(this.life / 30, 1); // 逐渐增加透明度直到1
            
            // 粒子从中心向外移动
            const dx = this.targetX - this.initialX;
            const dy = this.targetY - this.initialY;
            const progress = Math.min(this.life / 40, 1); // 控制移动速度
            
            this.x = this.initialX + dx * progress;
            this.y = this.initialY + dy * progress;
            
            if (this.life >= 40) {
                this.spawning = false; // 停止生成阶段
            }
        } else {
            // 粒子到达目标位置后，保持在目标位置
            this.x = this.targetX;
            this.y = this.targetY;
            
            // 开始倒计时，准备消失
            this.life++;
            if (this.life >= this.maxLife) {
                this.alpha -= 0.05; // 逐渐消失
            }
        }

        // 绘制粒子
        this.draw();

        // 返回是否还存活
        return this.alpha > 0;
    }
}

// 加载并显示图像的函数
function displayImageAsParticles(imagePath) {
    // 使用fetch API加载图片，转换为Blob，然后转为Base64
    fetch(imagePath)
        .then(response => response.blob())
        .then(blob => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const img = new Image();
                    img.src = reader.result;
                    
                    img.onload = function() {
                        console.log(`Image loaded: ${imagePath}, size: ${img.width}x${img.height}`);
                        
                        // 创建一个临时canvas来处理图像
                        const tempCanvas = document.createElement('canvas');
                        const tempCtx = tempCanvas.getContext('2d');
                        const maxSize = 64; // 最大尺寸为64像素
                        
                        // 计算缩放后的尺寸，保持宽高比
                        let width = img.width;
                        let height = img.height;
                        if (width > height && width > maxSize) {
                            height = (height / width) * maxSize;
                            width = maxSize;
                        } else if (height > maxSize) {
                            width = (width / height) * maxSize;
                            height = maxSize;
                        }
                        
                        tempCanvas.width = width;
                        tempCanvas.height = height;
                        tempCtx.drawImage(img, 0, 0, width, height);
                        
                        // 获取图像数据
                        const imageData = tempCtx.getImageData(0, 0, width, height);
                        const data = imageData.data;
                        
                        // 计算图像在屏幕中央的位置
                        const centerX = canvas.width / 2 - width / 2;
                        const centerY = canvas.height / 2 - height / 2;
                        
                        // 遍历每个像素，创建粒子
                        let particleCount = 0;
                        for (let y = 0; y < height; y++) {
                            for (let x = 0; x < width; x++) {
                                const index = (y * width + x) * 4; // 每个像素有4个值(R,G,B,A)
                                const r = data[index];
                                const g = data[index + 1];
                                const b = data[index + 2];
                                const a = data[index + 3];
                                
                                // 如果像素不是完全透明的，则创建粒子
                                if (a > 30) { // 提高透明度阈值，避免创建太多几乎透明的粒子
                                    const pixelX = centerX + x;
                                    const pixelY = centerY + y;
                                    const color = `rgb(${r}, ${g}, ${b})`;
                                    
                                    // 创建图像粒子，从屏幕中心开始向外扩散
                                    const imageParticle = new ImageParticle(
                                        canvas.width / 2,  // 初始位置为屏幕中心
                                        canvas.height / 2,
                                        color,
                                        pixelX,  // 目标位置为图像中对应像素位置
                                        pixelY
                                    );
                                    
                                    particles.push(imageParticle);
                                    particleCount++;
                                }
                            }
                        }
                        console.log(`Created ${particleCount} particles from image`);
                        resolve();
                    };
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        })
        .catch(error => {
            console.error(`Failed to load image: ${imagePath}`, error);
        });
}

// 随机选择图片并显示
function showRandomImage() {
    const randomNum = Math.floor(Math.random() * 3) + 1; // 1-3之间的随机数
    const imagePath = `${randomNum}.jpg`;
    console.log(`Loading image: ${imagePath}`);
    displayImageAsParticles(imagePath);
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
            this.x, this.y, 6
        );
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
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
    for (let i = 0; i < 1; i++) {
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
                return true;
            }
        });
    }
}

// 螺旋汇集动画函数 - 所有粒子向中心螺旋汇集并逐渐消失
function spiralGatherAnimation() {
    // 计算中心点
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // 螺旋参数
    const spiralSpeed = 0.01; // 减慢螺旋速度
    const rotationSpeed = 0.02; // 减慢旋转速度
    const shrinkFactor = 0.995; // 减慢收缩因子

    // 更新所有粒子位置
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];

        // 计算到中心的距离
        const dx = centerX - particle.x;
        const dy = centerY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 如果距离中心很近，加速消失
        if (distance < 2) {
            particle.life = 0; // 立即消失
        } else {
            // 螺旋运动：逐渐靠近中心并旋转
            particle.x += dx * spiralSpeed;
            particle.y += dy * spiralSpeed;

            // 添加旋转效果
            const rotatedX = centerX + Math.cos(rotationSpeed) * (particle.x - centerX) - Math.sin(rotationSpeed) * (particle.y - centerY);
            const rotatedY = centerY + Math.sin(rotationSpeed) * (particle.x - centerX) + Math.cos(rotationSpeed) * (particle.y - centerY);
            particle.x = rotatedX;
            particle.y = rotatedY;

            // 减少粒子生命值，现在更慢地消失
            particle.life += 1;
            particle.alpha = particle.life > 15 ? 1 : particle.life / 15;

            // 缩小粒子半径
            particle.radius *= shrinkFactor;
        }

        // 更新并绘制粒子
        if (!particle.update()) {
            particles.splice(i, 1);
        }
    }

    // 如果所有粒子都消失了，退出螺旋模式
    if (particles.length === 0) {
        spiralModeActive = false;
        particleCountThreshold = 0; // 重置计数器
    }
}

// 动画循环函数 - 持续更新和绘制所有元素
function animate() {
    // 清除画布，使用半透明黑色创建轨迹效果
    ctx.fillStyle = 'rgba(12, 20, 69, 0.12)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 检查是否处于螺旋模式
    if (spiralModeActive) {
        // 执行螺旋汇集动画
        spiralGatherAnimation();
    } else {
        // 检查粒子数量是否超过1500
        if (particles.length > 500) {
            particleCountThreshold++;
        } else {
            particleCountThreshold = 0; // 重置计数器
        }

        // 如果连续3650次粒子数超过1500，激活螺旋模式
        if (particleCountThreshold >= PARTICLE_COUNT_THRESHOLD_MAX) {
            spiralModeActive = true;
            console.log("螺旋模式激活：所有粒子开始向中心汇集");
            showRandomImage(); // 在螺旋模式激活时显示随机图片
        }

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
    }

    // 更新粒子计数显示
    counterElement.textContent = particles.length;

    requestAnimationFrame(animate);
}

// 鼠标点击事件 - 发射烟花
canvas.addEventListener('click', function (e) {
    // 在螺旋模式期间禁用烟花发射
    if (!spiralModeActive && particles.length < PARTICLE_LIMIT) { // 预留足够空间
        launchFirework(e.clientX, e.clientY);
    }
});

// 初始化星星
createStars();

// 启动动画
animate();