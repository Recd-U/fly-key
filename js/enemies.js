class Enemy {
    constructor(x, y, type = 'basic', game) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.game = game;
        this.speed = 0;
        this.health = 1;
        this.maxHealth = 1;
        this.width = 40;
        this.height = 40;
        this.color = '#e74c3c';
        this.pattern = null;
        this.time = 0;
        this.shootCooldown = 0;
        this.shootRate = 2; // 射击间隔（秒）
        this.isBoss = type === 'boss';
        this.phase = 1; // BOSS阶段
        this.particles = [];
        this.hitEffectTimer = 0;

        this.initEnemy();
    }

    initEnemy() {
        switch (this.type) {
            case 'basic':
                this.speed = 150;
                this.color = '#e74c3c';
                this.width = 40;
                this.height = 40;
                break;
            case 'fast':
                this.speed = 250;
                this.color = '#f39c12';
                this.width = 30;
                this.height = 30;
                break;
            case 'tank':
                this.speed = 100;
                this.health = 3;
                this.color = '#34495e';
                this.width = 60;
                this.height = 60;
                break;
            case 'boss':
                this.speed = 60;
                this.health = 50;
                this.maxHealth = 50;
                this.color = '#8e44ad';
                this.width = 120;
                this.height = 100;
                this.shootRate = 1.5;
                break;
            case 'elite':
                this.speed = 120;
                this.health = 5;
                this.maxHealth = 5;
                this.color = '#ff6b6b';
                this.width = 50;
                this.height = 50;
                this.shootRate = 1.0;
                break;
        }

        // 设置移动模式
        this.setMovementPattern();

        // 精英敌人总是追逐玩家
        if (this.type === 'elite') {
            this.pattern = (deltaTime) => this.chasePlayer(deltaTime);
        }
    }

    setMovementPattern() {
        const patterns = [
            (deltaTime) => this.straightDown(deltaTime),
            (deltaTime) => this.sineWave(deltaTime),
            (deltaTime) => this.zigzag(deltaTime)
        ];

        this.pattern = patterns[Math.floor(Math.random() * patterns.length)];
    }

    update(deltaTime) {
        this.time += deltaTime;

        if (this.pattern) {
            this.pattern(deltaTime);
        } else {
            this.straightDown(deltaTime);
        }

        // 敌人射击逻辑
        if (this.shootCooldown > 0) {
            this.shootCooldown -= deltaTime;
        }

        if (this.shootCooldown <= 0 && (this.type === 'boss' || this.type === 'elite')) {
            this.shoot();
            this.shootCooldown = this.shootRate;
        }

        // BOSS阶段转换
        if (this.isBoss) {
            this.updateBossPhase();
        }

        // 更新粒子效果
        this.updateParticles(deltaTime);

        // 受伤效果计时
        if (this.hitEffectTimer > 0) {
            this.hitEffectTimer -= deltaTime;
        }
    }

    straightDown(deltaTime) {
        this.y += this.speed * deltaTime;
    }

    sineWave(deltaTime) {
        this.y += this.speed * deltaTime;
        this.x += Math.sin(this.time * 2) * 100 * deltaTime;

        // 边界检查
        this.x = Math.max(0, Math.min(this.x, this.game.canvas.width - this.width));
    }

    zigzag(deltaTime) {
        this.y += this.speed * deltaTime;

        const period = 2; // 周期（秒）
        const amplitude = 200; // 振幅

        if (Math.floor(this.time / period) % 2 === 0) {
            this.x += amplitude * deltaTime;
        } else {
            this.x -= amplitude * deltaTime;
        }

        // 边界检查
        this.x = Math.max(0, Math.min(this.x, this.game.canvas.width - this.width));
    }

    // 新的移动模式：追逐玩家
    chasePlayer(deltaTime) {
        const player = this.game.player;
        if (!player) return;

        const targetX = player.x + player.width / 2;
        const targetY = player.y + player.height / 2;
        const currentX = this.x + this.width / 2;
        const currentY = this.y + this.height / 2;

        const dx = targetX - currentX;
        const dy = targetY - currentY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 10) {
            this.x += (dx / distance) * this.speed * deltaTime;
            this.y += (dy / distance) * this.speed * deltaTime;
        }

        // 边界检查
        this.x = Math.max(0, Math.min(this.x, this.game.canvas.width - this.width));
        this.y = Math.max(0, Math.min(this.y, this.game.canvas.height - this.height));
    }

    // 新的移动模式：盘旋
    circlePattern(deltaTime) {
        const centerX = this.game.canvas.width / 2;
        const radius = 100;
        const angularSpeed = 1.5;

        this.x = centerX + Math.cos(this.time * angularSpeed) * radius - this.width / 2;
        this.y += this.speed * 0.5 * deltaTime;

        // 生成盘旋粒子效果
        if (Math.floor(this.time * 10) % 5 === 0) {
            this.createCircleParticle();
        }
    }

    render(ctx) {
        // 调试信息
        // console.log('渲染敌人:', this.type, this.x, this.y);

        // 绘制粒子效果
        this.renderParticles(ctx);

        // 受伤闪烁效果
        if (this.hitEffectTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.fillStyle = '#ffffff';
        } else {
            ctx.fillStyle = this.color;
        }

        switch (this.type) {
            case 'basic':
                this.renderBasic(ctx);
                break;
            case 'fast':
                this.renderFast(ctx);
                break;
            case 'tank':
                this.renderTank(ctx);
                break;
            case 'boss':
                this.renderBoss(ctx);
                break;
            case 'elite':
                this.renderElite(ctx);
                break;
        }

        // 绘制血条
        this.renderHealthBar(ctx);
    }

    renderBasic(ctx) {
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // 绘制细节
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 4, 0, Math.PI * 2);
        ctx.fill();
    }

    renderFast(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.closePath();
        ctx.fill();
    }

    renderTank(ctx) {
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // 绘制装甲细节
        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(this.x + 10, this.y + 10, this.width - 20, this.height - 20);
    }

    renderBoss(ctx) {
        // 主体
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // 装饰
        ctx.fillStyle = '#9b59b6';
        ctx.fillRect(this.x + 20, this.y + 15, this.width - 40, 10);
        ctx.fillRect(this.x + 20, this.y + this.height - 25, this.width - 40, 10);

        // 核心
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 15, 0, Math.PI * 2);
        ctx.fill();
    }

    takeDamage(amount) {
        this.health -= amount;
        this.hitEffectTimer = 0.2; // 受伤闪烁时间

        // 受伤粒子效果
        this.createHitParticles();

        return this.health <= 0;
    }

    shoot() {
        if (!this.game.player) return;

        const bulletX = this.x + this.width / 2 - 2.5;
        const bulletY = this.y + this.height;

        const enemyBullet = new EnemyBullet(bulletX, bulletY, this);
        this.game.enemyBullets.push(enemyBullet);

        // 射击特效
        this.createShootEffect(bulletX, bulletY);
    }

    updateBossPhase() {
        // BOSS阶段转换逻辑
        if (this.health <= this.maxHealth * 0.3 && this.phase === 2) {
            this.phase = 3;
            this.speed = 80;
            this.shootRate = 0.8;
            this.createPhaseChangeEffect();
        } else if (this.health <= this.maxHealth * 0.6 && this.phase === 1) {
            this.phase = 2;
            this.speed = 70;
            this.shootRate = 1.0;
            this.createPhaseChangeEffect();
        }
    }

    // 粒子效果方法
    createHitParticles() {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                life: 1.0,
                color: '#ff0000',
                size: Math.random() * 3 + 2
            });
        }
    }

    createShootEffect(x, y) {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 100,
                vy: Math.random() * 100 + 50,
                life: 0.8,
                color: this.color,
                size: Math.random() * 2 + 1
            });
        }
    }

    createCircleParticle() {
        this.particles.push({
            x: this.x + this.width / 2,
            y: this.y + this.height / 2,
            vx: (Math.random() - 0.5) * 50,
            vy: (Math.random() - 0.5) * 50,
            life: 2.0,
            color: this.color,
            size: Math.random() * 1 + 1
        });
    }

    createPhaseChangeEffect() {
        for (let i = 0; i < 30; i++) {
            this.game.particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: (Math.random() - 0.5) * 300,
                vy: (Math.random() - 0.5) * 300,
                life: 1.5,
                color: '#ff00ff',
                size: Math.random() * 4 + 3
            });
        }
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

    renderHealthBar(ctx) {
        if (this.isBoss || this.type === 'elite' || this.type === 'tank') {
            const barWidth = this.width;
            const barHeight = 4;
            const healthPercent = this.health / this.maxHealth;

            // 背景
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(this.x, this.y - 10, barWidth, barHeight);

            // 血条
            ctx.fillStyle = healthPercent > 0.6 ? '#00ff00' :
                healthPercent > 0.3 ? '#ffff00' : '#ff0000';
            ctx.fillRect(this.x, this.y - 10, barWidth * healthPercent, barHeight);

            // 边框
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.strokeRect(this.x, this.y - 10, barWidth, barHeight);
        }
    }

    renderElite(ctx) {
        // 精英敌人渲染
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // 精英标识
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 4, 0, Math.PI * 2);
        ctx.fill();

        // 能量光环
        if (Math.floor(Date.now() / 200) % 2 === 0) {
            ctx.strokeStyle = 'rgba(255, 107, 107, 0.7)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2 + 3, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

// 敌人子弹类
class EnemyBullet {
    constructor(x, y, enemy) {
        this.x = x;
        this.y = y;
        this.width = 6;
        this.height = 12;
        this.speed = 300;
        this.damage = 10;
        this.color = enemy.type === 'boss' ? '#ff00ff' : '#ff6b6b';
        this.trail = [];
    }

    update(deltaTime) {
        this.y += this.speed * deltaTime;

        // 添加子弹尾迹
        if (this.trail.length < 8) {
            this.trail.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                life: 1.0
            });
        }

        // 更新尾迹
        for (let i = this.trail.length - 1; i >= 0; i--) {
            this.trail[i].life -= deltaTime * 3;
            if (this.trail[i].life <= 0) {
                this.trail.splice(i, 1);
            }
        }
    }

    render(ctx) {
        // 绘制子弹尾迹
        this.trail.forEach((point, index) => {
            const alpha = point.life;
            const size = 1.5 * alpha;
            ctx.fillStyle = this.color.replace(')', `, ${alpha * 0.3})`).replace('rgb', 'rgba');
            ctx.beginPath();
            ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
            ctx.fill();
        });

        // 绘制子弹主体
        ctx.fillStyle = this.color;

        // 发光效果
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;

        ctx.fillRect(this.x, this.y, this.width, this.height);

        // 重置阴影
        ctx.shadowBlur = 0;
    }
}

// 敌人生成器
class EnemySpawner {
    constructor(game) {
        this.game = game;
        this.spawnTimer = 0;
        this.spawnInterval = 2; // 生成间隔（秒）
        this.difficulty = 1;
        this.bossSpawned = false;
        this.wave = 1;
        this.waveTimer = 0;
        this.waveDuration = 30; // 每波持续时间（秒）
        this.waveEndTimer = 0; // 波次结束倒计时
    }

    update(deltaTime) {
        // 确保deltaTime是有效数值
        if (typeof deltaTime !== 'number' || isNaN(deltaTime) || deltaTime <= 0) {
            return;
        }

        // 波次倒计时期间停止敌人生成
        if (this.waveEndTimer > 0) {
            return;
        }

        this.spawnTimer += deltaTime;

        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnEnemy();
            this.spawnTimer = 0;

            // 随着时间增加难度
            this.spawnInterval = Math.max(0.8, 2 - Math.min(this.game.score / 1000, 1.2));
            this.difficulty = 1 + Math.floor(this.game.score / 500);
        }

        // 游戏开始时强制生成第一个敌人
        if (this.game.score === 0 && this.spawnTimer > 1.0) {
            this.spawnEnemy();
            this.spawnTimer = 0;
        }
    }

    spawnEnemy() {
        const enemyTypes = ['basic', 'fast', 'tank', 'elite', 'boss'];
        const weights = [0.5, 0.2, 0.15, 0.1, 0.05]; // 生成概率

        // 波次调整概率
        if (this.wave >= 3) {
            weights[3] = 0.15; // 增加精英概率
            weights[4] = 0.08; // 增加BOSS概率
        }

        // BOSS生成逻辑
        if (!this.bossSpawned && this.wave >= 3 && Math.random() < 0.3) {
            this.spawnBoss();
            return;
        }

        let random = Math.random();
        let cumulativeWeight = 0;
        let selectedType = 'basic';

        for (let i = 0; i < enemyTypes.length; i++) {
            cumulativeWeight += weights[i];
            if (random <= cumulativeWeight) {
                selectedType = enemyTypes[i];
                break;
            }
        }

        const x = Math.random() * (this.game.canvas.width - 50);
        let enemyType = selectedType;

        // 波次限制BOSS生成
        if (enemyType === 'boss' && this.wave < 3) {
            enemyType = 'elite'; // 波次不足时用精英代替
        }

        const enemy = new Enemy(x, 50, enemyType, this.game);

        // 根据难度和波次调整敌人属性
        const difficultyMultiplier = 1 + (this.difficulty - 1) * 0.05 + (this.wave - 1) * 0.02;
        enemy.speed *= difficultyMultiplier;
        if (enemy.type !== 'boss') {
            enemy.health += Math.floor((this.difficulty - 1) + (this.wave - 1) * 0.5);
        }

        // 保存原始属性用于计算
        enemy.maxHealth = enemy.health;

        this.game.enemies.push(enemy);

        // 生成特效
        this.createSpawnEffect(x, 30);
    }

    spawnBoss() {
        const x = this.game.canvas.width / 2 - 60;
        const boss = new Enemy(x, -50, 'boss', this.game);

        // BOSS特殊属性
        boss.speed *= 0.8; // BOSS移动较慢
        boss.health = 50 + (this.wave - 1) * 20;
        boss.maxHealth = boss.health;

        this.game.enemies.push(boss);
        this.bossSpawned = true;

        // BOSS出现特效
        this.createBossSpawnEffect(x, -50);
    }

    createSpawnEffect(x, y) {
        for (let i = 0; i < 15; i++) {
            this.game.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 100,
                vy: Math.random() * 50 + 25,
                life: 1.2,
                color: '#00ffff',
                size: Math.random() * 3 + 2
            });
        }
    }

    createBossSpawnEffect(x, y) {
        for (let i = 0; i < 50; i++) {
            const angle = (i / 50) * Math.PI * 2;
            this.game.particles.push({
                x: x + 60,
                y: y + 50,
                vx: Math.cos(angle) * 200,
                vy: Math.sin(angle) * 200,
                life: 2.0,
                color: `hsl(${Math.random() * 60 + 270}, 100%, 60%)`,
                size: Math.random() * 5 + 3
            });
        }
    }

    updateWave(deltaTime) {
        // 确保deltaTime是有效数值
        if (typeof deltaTime !== 'number' || isNaN(deltaTime) || deltaTime <= 0) {
            return;
        }

        this.waveTimer += deltaTime;

        if (this.waveTimer >= this.waveDuration) {
            // 波次结束，开始3秒倒计时
            this.waveEndTimer = 3.0;
            this.waveTimer = 0;
            
            // 显示波次结束提示
            this.game.showWaveEndMessage = true;
            this.game.waveEndMessage = `第${this.wave}波结束！下一波倒计时：3秒`;
        }
        
        // 处理波次结束倒计时
        if (this.waveEndTimer > 0) {
            this.waveEndTimer -= deltaTime;
            
            // 更新倒计时消息
            const countdown = Math.ceil(this.waveEndTimer);
            this.game.waveEndMessage = `第${this.wave}波结束！下一波倒计时：${countdown}秒`;
            
            if (this.waveEndTimer <= 0) {
                // 倒计时结束，开始新波次
                this.wave++;
                this.waveEndTimer = 0;
                this.waveDuration = Math.max(15, 30 - (this.wave - 1) * 2); // 波次时间递减
                
                // 每波开始时重置BOSS生成标志
                this.bossSpawned = false;
                
                // 隐藏波次结束提示
                this.game.showWaveEndMessage = false;
                
                // 波次开始特效
                this.createWaveStartEffect();
                
                // 增加难度：减少生成间隔，增加敌人属性
                this.spawnInterval = Math.max(0.5, 2 - (this.wave - 1) * 0.1);
                this.difficulty = 1 + Math.floor(this.wave / 2);
            }
        }
    }

    createWaveStartEffect() {
        for (let i = 0; i < 30; i++) {
            this.game.particles.push({
                x: Math.random() * this.game.canvas.width,
                y: Math.random() * this.game.canvas.height,
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100,
                life: 1.5,
                color: `hsl(${Math.random() * 360}, 100%, 70%)`,
                size: Math.random() * 4 + 2
            });
        }
    }
}