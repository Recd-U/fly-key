class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = []; // 敌人子弹
        this.particles = []; // 粒子效果
        this.score = 0;
        this.gameOver = false;
        this.isPaused = false; // 暂停状态
        this.lastTime = 0;
        this.deltaTime = 0;
        this.enemySpawner = new EnemySpawner(this);
        this.collisionManager = new CollisionManager(this);
        this.inputSystem = new InputSystem();

        // 设置全局引用
        window.currentGame = this;

        // 初始化游戏开始时间
        this.gameStartTime = Date.now();
        this.difficultyLevel = 1;

        // 波次结束提示相关属性
        this.showWaveEndMessage = false;
        this.waveEndMessage = "";

        this.init();
    }

    init() {
        this.player = new Player(this.canvas.width / 2, this.canvas.height - 100, this);
        this.setupEventListeners();
        this.gameLoop();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            // 处理暂停键（P 或 Esc）
            if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
                this.togglePause();
                return;
            }
            handleInput(e, true);
        });
        document.addEventListener('keyup', (e) => handleInput(e, false));
        document.getElementById('restart-btn').addEventListener('click', () => this.restart());
    }

    gameLoop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        this.deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        // 如果游戏未结束且未暂停，则更新游戏状态
        if (!this.gameOver && !this.isPaused) {
            this.update();
            this.render();
        }

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    update() {
        this.player.update(this.deltaTime);

        // 更新敌人
        this.enemies.forEach((enemy, index) => {
            enemy.update(this.deltaTime);
            if (enemy.y > this.canvas.height) {
                this.enemies.splice(index, 1);
            }
        });


        // 更新子弹
        this.bullets.forEach((bullet, index) => {
            bullet.update(this.deltaTime);
            if (bullet.y < 0) {
                this.bullets.splice(index, 1);
            }
        });

        // 更新敌人子弹
        this.enemyBullets.forEach((bullet, index) => {
            bullet.update(this.deltaTime);
            if (bullet.y > this.canvas.height) {
                this.enemyBullets.splice(index, 1);
            }
        });

        // 更新粒子效果
        this.updateParticles(this.deltaTime);

        // 更新敌人生成器
        this.enemySpawner.update(this.deltaTime);

        // 更新波次
        this.enemySpawner.updateWave(this.deltaTime);

        // 更新输入系统
        this.inputSystem.update();

        // 检测碰撞
        this.collisionManager.checkAllCollisions();
        this.collisionManager.handleCollisions();

        // 更新游戏难度
        this.updateDifficulty();
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制背景
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制粒子效果
        this.renderParticles(this.ctx);

        // 绘制敌人子弹
        this.enemyBullets.forEach(bullet => bullet.render(this.ctx));

        // 绘制玩家子弹
        this.bullets.forEach(bullet => bullet.render(this.ctx));

        // 绘制敌人
        this.enemies.forEach(enemy => enemy.render(this.ctx));



        // 绘制玩家
        this.player.render(this.ctx);

        // 绘制UI信息
        this.renderUI();
    }

    renderUI() {
        // 绘制特殊技能冷却
        if (this.player.specialCooldown > 0) {
            const cooldownPercent = this.player.specialCooldown / this.player.specialRate;
            const barWidth = 200;
            const barHeight = 10;
            const x = this.canvas.width - barWidth - 20;
            const y = 60;

            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(x, y, barWidth, barHeight);

            this.ctx.fillStyle = '#ff6b6b';
            this.ctx.fillRect(x, y, barWidth * (1 - cooldownPercent), barHeight);

            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '12px Arial';
            this.ctx.fillText('特殊技能冷却', x, y - 5);
        }

        // 绘制等级和经验
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`等级: ${this.player.level}`, 20, 80);
        this.ctx.fillText(`经验: ${this.player.exp}/${this.player.expToNextLevel}`, 20, 100);

        // 绘制波次信息
        this.ctx.fillText(`波次: ${this.enemySpawner.wave}`, 20, 120);
        // 确保waveDuration和waveTimer是有效数值
        const waveDuration = isFinite(this.enemySpawner.waveDuration) ? this.enemySpawner.waveDuration : 30;
        const waveTimer = isFinite(this.enemySpawner.waveTimer) ? this.enemySpawner.waveTimer : 0;
        const waveTimeLeft = waveDuration - waveTimer;
        this.ctx.fillText(`下一波: ${isFinite(waveTimeLeft) ? waveTimeLeft.toFixed(1) : '0.0'}秒`, 20, 140);

        // 绘制波次结束倒计时消息
        if (this.showWaveEndMessage) {
            this.ctx.fillStyle = '#ffff00';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.waveEndMessage, this.canvas.width / 2, this.canvas.height / 2 - 50);
            this.ctx.textAlign = 'left';
        }
    }



    updateUI() {
        document.getElementById('score').textContent = `分数: ${this.score}`;
        document.getElementById('health').textContent = `生命值: ${this.player.health}/${this.player.maxHealth}`;
    }

    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime;

            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    renderParticles(ctx) {
        this.particles.forEach(particle => {
            const alpha = particle.life;
            ctx.fillStyle = particle.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba').replace('hsl', 'hsla');
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    // 更新游戏难度
    updateDifficulty() {
        // 根据游戏时间和分数动态调整难度
        const timeElapsed = (Date.now() - this.gameStartTime) / 1000; // 已经过的时间（秒）

        // 难度等级基于时间和分数计算
        this.difficultyLevel = 1 + Math.floor(timeElapsed / 30) + Math.floor(this.score / 500);

        // 调整敌人属性
        this.enemySpawner.difficulty = this.difficultyLevel;
    }

    // 暂停/继续游戏
    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            // 暂停时的处理
            console.log('游戏已暂停');
        } else {
            // 继续时的处理
            console.log('游戏继续');
        }
    }

    restart() {
        this.player = new Player(this.canvas.width / 2, this.canvas.height - 100, this);
        this.enemies = [];
        this.bullets = [];
        this.score = 0;
        this.gameOver = false;
        this.isPaused = false;
        this.gameStartTime = Date.now(); // 重置游戏开始时间
        this.difficultyLevel = 1; // 重置难度等级
        document.getElementById('game-over').classList.add('hidden');
        this.updateUI();
    }
}

// 启动游戏
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});