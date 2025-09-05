class Enemy {
    constructor(x, y, type = 'basic', game) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.game = game;
        this.speed = 0;
        this.health = 1;
        this.width = 40;
        this.height = 40;
        this.color = '#e74c3c';
        this.pattern = null;
        this.time = 0;
        
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
                this.speed = 80;
                this.health = 10;
                this.color = '#8e44ad';
                this.width = 100;
                this.height = 80;
                break;
        }
        
        // 设置移动模式
        this.setMovementPattern();
    }
    
    setMovementPattern() {
        const patterns = [
            () => this.straightDown(),
            () => this.sineWave(),
            () => this.zigzag()
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
    
    render(ctx) {
        ctx.fillStyle = this.color;
        
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
        }
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
        return this.health <= 0;
    }
}

// 敌人生成器
class EnemySpawner {
    constructor(game) {
        this.game = game;
        this.spawnTimer = 0;
        this.spawnInterval = 2; // 生成间隔（秒）
        this.difficulty = 1;
    }
    
    update(deltaTime) {
        this.spawnTimer += deltaTime;
        
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnEnemy();
            this.spawnTimer = 0;
            
            // 随着时间增加难度
            this.spawnInterval = Math.max(0.5, 2 - this.game.score / 1000);
            this.difficulty = 1 + Math.floor(this.game.score / 500);
        }
    }
    
    spawnEnemy() {
        const enemyTypes = ['basic', 'fast', 'tank', 'boss'];
        const weights = [0.6, 0.25, 0.1, 0.05]; // 生成概率
        
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
        const enemy = new Enemy(x, -50, selectedType, this.game);
        
        // 根据难度调整敌人属性
        if (this.difficulty > 1) {
            enemy.speed *= (1 + (this.difficulty - 1) * 0.1);
            if (enemy.type !== 'boss') {
                enemy.health += this.difficulty - 1;
            }
        }
        
        this.game.enemies.push(enemy);
    }
}