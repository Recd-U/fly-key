class Player {
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.game = game;
        this.width = 50;
        this.height = 70;
        this.speed = 300;
        this.health = 100;
        this.isMovingLeft = false;
        this.isMovingRight = false;
        this.isMovingUp = false;
        this.isMovingDown = false;
        this.shootCooldown = 0;
        this.shootRate = 0.2; // 射击间隔（秒）
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
        
        // 自动射击
        if (this.shootCooldown <= 0) {
            this.shoot();
            this.shootCooldown = this.shootRate;
        }
    }
    
    render(ctx) {
        // 绘制玩家飞机
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
    }
    
    shoot() {
        const bulletX = this.x + this.width / 2 - 2.5;
        const bulletY = this.y;
        this.game.bullets.push(new Bullet(bulletX, bulletY));
    }
    
    takeDamage(amount) {
        this.health -= amount;
        this.health = Math.max(0, this.health);
    }
}

class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 5;
        this.height = 15;
        this.speed = 500;
    }
    
    update(deltaTime) {
        this.y -= this.speed * deltaTime;
    }
    
    render(ctx) {
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}