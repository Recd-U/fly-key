class Player {
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.game = game;
        this.width = 50;
        this.height = 70;
        this.speed = 300;
        this.health = 100;
        this.maxHealth = 100;
        this.isMovingLeft = false;
        this.isMovingRight = false;
        this.isMovingUp = false;
        this.isMovingDown = false;
        this.shootCooldown = 0;
        this.shootRate = 0.2; // 射击间隔（秒）
        this.specialCooldown = 0;
        this.specialRate = 5; // 特殊技能冷却时间（秒）
        this.isInvincible = false;
        this.invincibleTimer = 0;
        this.trailParticles = [];
        this.level = 1;
        this.exp = 0;
        this.expToNextLevel = 100;
    }
    
    update(deltaTime) {
        // 移动逻辑
        if (this.isMovingLeft) this.x -= this.speed * deltaTime;
        if (this.isMovingRight) this.x += this.speed * deltaTime;
        if (this.isMovingUp) this.y -= this.speed * deltaTime;
        if (this.isMovingDown) this.y += this.speed * deltaTime;
        
        // 边界检查
        this.x = Math.max(0, Math.min(this.x, this.game.canvas.width - this.width));
        this.y = Math.max(0, Math.min(this.y, this.game.canvas.height - this.height));
        
        // 射击冷却
        if (this.shootCooldown > 0) {
            this.shootCooldown -= deltaTime;
        }
        
        // 特殊技能冷却
        if (this.specialCooldown > 0) {
            this.specialCooldown -= deltaTime;
        }
        
        // 无敌时间
        if (this.isInvincible) {
            this.invincibleTimer -= deltaTime;
            if (this.invincibleTimer <= 0) {
                this.isInvincible = false;
            }
        }
        
        // 自动射击
        if (this.shootCooldown <= 0) {
            this.shoot();
            this.shootCooldown = this.shootRate;
        }
        
        // 更新尾迹粒子
        this.updateTrailParticles(deltaTime);
        
        // 生成移动尾迹
        if (this.isMovingLeft || this.isMovingRight || this.isMovingUp || this.isMovingDown) {
            this.createTrailParticle();
        }
    }
    
    render(ctx) {
        // 绘制尾迹粒子
        this.renderTrailParticles(ctx);
        
        // 绘制玩家飞机（无敌状态闪烁）
        if (!this.isInvincible || Math.floor(Date.now() / 200) % 2 === 0) {
            ctx.fillStyle = '#3498db';
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y);
            ctx.lineTo(this.x + this.width, this.y + this.height);
            ctx.lineTo(this.x, this.y + this.height);
            ctx.closePath();
            ctx.fill();
            
            // 绘制飞机细节
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(this.x + this.width / 2 - 5, this.y + this.height - 10, 10, 15);
            
            // 绘制引擎光效
            this.renderEngineEffect(ctx);
        }
        
        // 绘制等级标识
        this.renderLevelIndicator(ctx);
    }
    
    shoot() {
        const bulletCount = Math.min(this.level, 3); // 最多3发子弹
        const spread = 20; // 子弹散布角度
        
        for (let i = 0; i < bulletCount; i++) {
            const angleOffset = (i - (bulletCount - 1) / 2) * (spread * Math.PI / 180);
            const bulletX = this.x + this.width / 2 - 2.5;
            const bulletY = this.y;
            
            const bullet = new Bullet(bulletX, bulletY);
            
            // 设置子弹伤害
            bullet.damage = 1;
            
            // 高级子弹有角度偏移
            if (bulletCount > 1) {
                bullet.angle = angleOffset;
                bullet.speedX = Math.sin(angleOffset) * 100;
            }
            
            // 高级子弹有更大伤害
            if (this.level >= 3) {
                bullet.damage = 2;
                bullet.color = '#ff6b6b';
            }
            
            this.game.bullets.push(bullet);
            
            // 射击特效
            this.createShootEffect(bulletX, bulletY);
        }
    }
    
    takeDamage(amount) {
        if (this.isInvincible) return;
        
        this.health -= amount;
        this.health = Math.max(0, this.health);
        
        // 受伤无敌时间
        this.isInvincible = true;
        this.invincibleTimer = 1.0; // 1秒无敌
        
        // 受伤特效
        this.createDamageEffect();
        
        if (this.health <= 0) {
            this.createExplosionEffect();
        }
    }
    
    useSpecial() {
        if (this.specialCooldown > 0) return;
        
        // 全屏清场技能
        for (let i = this.game.enemies.length - 1; i >= 0; i--) {
            const enemy = this.game.enemies[i];
            this.game.score += enemy.type === 'boss' ? 200 : 50;
            this.createSpecialEffect(enemy.x, enemy.y);
        }
        this.game.enemies = [];
        
        this.specialCooldown = this.specialRate;
        this.createSpecialActivationEffect();
    }
    
    addExp(amount) {
        this.exp += amount;
        if (this.exp >= this.expToNextLevel) {
            this.levelUp();
        }
    }
    
    levelUp() {
        this.level++;
        this.exp -= this.expToNextLevel;
        this.expToNextLevel = Math.floor(this.expToNextLevel * 1.5);
        
        // 升级奖励
        this.health = this.maxHealth;
        this.shootRate = Math.max(0.1, this.shootRate - 0.02);
        
        // 更新现有子弹伤害
        this.game.bullets.forEach(bullet => {
            if (this.level >= 3) {
                bullet.damage = 2;
                bullet.color = '#ff6b6b';
            }
        });
        
        this.createLevelUpEffect();
    }
    
    // 特效方法
    createTrailParticle() {
        if (this.trailParticles.length > 20) return;
        
        const particle = {
            x: this.x + this.width / 2 + (Math.random() - 0.5) * 10,
            y: this.y + this.height,
            size: Math.random() * 3 + 2,
            speed: Math.random() * 50 + 100,
            life: 1.0,
            color: `hsl(${200 + Math.random() * 40}, 80%, 60%)`
        };
        this.trailParticles.push(particle);
    }
    
    updateTrailParticles(deltaTime) {
        for (let i = this.trailParticles.length - 1; i >= 0; i--) {
            const particle = this.trailParticles[i];
            particle.y += particle.speed * deltaTime;
            particle.life -= deltaTime;
            
            if (particle.life <= 0) {
                this.trailParticles.splice(i, 1);
            }
        }
    }
    
    renderTrailParticles(ctx) {
        this.trailParticles.forEach(particle => {
            const alpha = particle.life;
            ctx.fillStyle = particle.color.replace(')', `, ${alpha})`).replace('hsl', 'hsla');
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    renderEngineEffect(ctx) {
        // 引擎火焰效果
        const gradient = ctx.createRadialGradient(
            this.x + this.width / 2, this.y + this.height + 5,
            0,
            this.x + this.width / 2, this.y + this.height + 5,
            15
        );
        gradient.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x + this.width / 2 - 15, this.y + this.height, 30, 20);
    }
    
    renderLevelIndicator(ctx) {
        ctx.fillStyle = '#ffd700';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Lv.${this.level}`, this.x + this.width / 2, this.y - 10);
    }
    
    createShootEffect(x, y) {
        // 射击火花效果
        for (let i = 0; i < 5; i++) {
            this.game.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 200,
                vy: -Math.random() * 300 - 100,
                life: 0.5,
                color: '#ffd700',
                size: Math.random() * 2 + 1
            });
        }
    }
    
    createDamageEffect() {
        // 受伤闪烁效果
        for (let i = 0; i < 10; i++) {
            this.game.particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: (Math.random() - 0.5) * 300,
                vy: (Math.random() - 0.5) * 300,
                life: 1.0,
                color: '#ff0000',
                size: Math.random() * 3 + 2
            });
        }
    }
    
    createExplosionEffect() {
        // 爆炸效果
        for (let i = 0; i < 50; i++) {
            this.game.particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: (Math.random() - 0.5) * 500,
                vy: (Math.random() - 0.5) * 500,
                life: 2.0,
                color: `hsl(${Math.random() * 60}, 100%, 50%)`,
                size: Math.random() * 5 + 3
            });
        }
    }
    
    createSpecialEffect(x, y) {
        // 特殊技能效果
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            this.game.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * 400,
                vy: Math.sin(angle) * 400,
                life: 1.5,
                color: '#00ffff',
                size: Math.random() * 4 + 3
            });
        }
    }
    
    createSpecialActivationEffect() {
        // 技能激活效果
        for (let i = 0; i < 100; i++) {
            const angle = (i / 100) * Math.PI * 2;
            this.game.particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: Math.cos(angle) * 600,
                vy: Math.sin(angle) * 600,
                life: 2.0,
                color: `hsl(${Math.random() * 360}, 100%, 70%)`,
                size: Math.random() * 6 + 4
            });
        }
    }
    
    // 处理道具效果
    applyPowerUp(type) {
        switch (type) {
            case 'health':
                this.health = Math.min(this.maxHealth, this.health + 20);
                break;
            case 'speed':
                this.speed += 50;
                break;
            case 'fireRate':
                this.shootRate = Math.max(0.05, this.shootRate - 0.02);
                break;
            case 'damage':
                // 增加子弹伤害
                this.game.bullets.forEach(bullet => {
                    bullet.damage += 1;
                });
                break;
        }
    }
}

class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 5;
        this.height = 15;
        this.speed = 500;
        this.speedX = 0;
        this.angle = 0;
        this.damage = 1;
        this.color = '#f1c40f';
        this.trail = [];
    }
    
    update(deltaTime) {
        this.y -= this.speed * deltaTime;
        this.x += this.speedX * deltaTime;
        
        // 添加子弹尾迹
        if (this.trail.length < 10) {
            this.trail.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                life: 1.0
            });
        }
        
        // 更新尾迹
        for (let i = this.trail.length - 1; i >= 0; i--) {
            this.trail[i].life -= deltaTime * 2;
            if (this.trail[i].life <= 0) {
                this.trail.splice(i, 1);
            }
        }
    }
    
    render(ctx) {
        // 绘制子弹尾迹
        this.trail.forEach((point, index) => {
            const alpha = point.life;
            const size = 2 * alpha;
            ctx.fillStyle = `rgba(241, 196, 15, ${alpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // 绘制子弹主体
        ctx.fillStyle = this.color;
        
        // 高级子弹有发光效果
        if (this.damage > 1) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
        }
        
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 重置阴影
        ctx.shadowBlur = 0;
    }
}