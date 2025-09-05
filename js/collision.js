// 碰撞检测函数
function checkCollision(obj1, obj2) {
    // 矩形碰撞检测
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

// 圆形碰撞检测（用于圆形敌人）
function checkCircleCollision(circle1, circle2) {
    const dx = circle1.x + circle1.width / 2 - (circle2.x + circle2.width / 2);
    const dy = circle1.y + circle1.height / 2 - (circle2.y + circle2.height / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance < (circle1.width / 2 + circle2.width / 2);
}

// 点与矩形碰撞检测
function pointInRect(pointX, pointY, rect) {
    return pointX >= rect.x &&
           pointX <= rect.x + rect.width &&
           pointY >= rect.y &&
           pointY <= rect.y + rect.height;
}

// 精确碰撞检测（根据对象类型选择不同的检测方法）
function preciseCollision(obj1, obj2) {
    // 如果都是圆形（基本敌人）
    if (obj1.type === 'basic' && obj2.type === 'basic') {
        return checkCircleCollision(obj1, obj2);
    }
    
    // 默认使用矩形碰撞检测
    return checkCollision(obj1, obj2);
}

// 子弹与敌人碰撞检测（优化版）
function checkBulletEnemyCollision(bullet, enemy) {
    // 对于圆形敌人，使用点与圆碰撞检测
    if (enemy.type === 'basic') {
        const centerX = enemy.x + enemy.width / 2;
        const centerY = enemy.y + enemy.height / 2;
        const radius = enemy.width / 2;
        
        // 检查子弹的四个角是否在圆内
        const points = [
            { x: bullet.x, y: bullet.y },
            { x: bullet.x + bullet.width, y: bullet.y },
            { x: bullet.x, y: bullet.y + bullet.height },
            { x: bullet.x + bullet.width, y: bullet.y + bullet.height }
        ];
        
        for (const point of points) {
            const dx = point.x - centerX;
            const dy = point.y - centerY;
            if (Math.sqrt(dx * dx + dy * dy) <= radius) {
                return true;
            }
        }
        return false;
    }
    
    // 对于其他类型的敌人，使用矩形碰撞检测
    return checkCollision(bullet, enemy);
}

// 玩家与敌人碰撞检测
function checkPlayerEnemyCollision(player, enemy) {
    // 对于圆形敌人，使用圆形碰撞检测
    if (enemy.type === 'basic') {
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        const enemyCenterX = enemy.x + enemy.width / 2;
        const enemyCenterY = enemy.y + enemy.height / 2;
        
        const dx = playerCenterX - enemyCenterX;
        const dy = playerCenterY - enemyCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < (player.width / 2 + enemy.width / 2);
    }
    
    // 对于其他类型的敌人，使用矩形碰撞检测
    return checkCollision(player, enemy);
}

// 碰撞管理器
class CollisionManager {
    constructor(game) {
        this.game = game;
        this.collisions = [];
    }
    
    // 检测所有碰撞
    checkAllCollisions() {
        this.collisions = [];
        
        // 子弹与敌人碰撞
        for (let i = this.game.bullets.length - 1; i >= 0; i--) {
            for (let j = this.game.enemies.length - 1; j >= 0; j--) {
                if (checkBulletEnemyCollision(this.game.bullets[i], this.game.enemies[j])) {
                    this.collisions.push({
                        type: 'bullet-enemy',
                        bulletIndex: i,
                        enemyIndex: j
                    });
                }
            }
        }
        
        // 玩家与敌人碰撞
        for (let j = this.game.enemies.length - 1; j >= 0; j--) {
            if (checkPlayerEnemyCollision(this.game.player, this.game.enemies[j])) {
                this.collisions.push({
                    type: 'player-enemy',
                    enemyIndex: j
                });
            }
        }
    }
    
    // 处理所有碰撞
    handleCollisions() {
        const bulletsToRemove = new Set();
        const enemiesToRemove = new Set();
        
        for (const collision of this.collisions) {
            switch (collision.type) {
                case 'bullet-enemy':
                    bulletsToRemove.add(collision.bulletIndex);
                    
                    const enemy = this.game.enemies[collision.enemyIndex];
                    if (enemy.takeDamage(1)) {
                        enemiesToRemove.add(collision.enemyIndex);
                        this.game.score += 10;
                    }
                    break;
                    
                case 'player-enemy':
                    enemiesToRemove.add(collision.enemyIndex);
                    this.game.player.takeDamage(20);
                    
                    if (this.game.player.health <= 0) {
                        this.game.gameOver = true;
                        document.getElementById('game-over').classList.remove('hidden');
                        document.getElementById('final-score').textContent = this.game.score;
                    }
                    break;
            }
        }
        
        // 移除碰撞的对象
        this.removeObjects(bulletsToRemove, this.game.bullets);
        this.removeObjects(enemiesToRemove, this.game.enemies);
        
        // 更新UI
        this.game.updateUI();
    }
    
    // 从数组中移除指定索引的对象
    removeObjects(indicesSet, array) {
        const sortedIndices = Array.from(indicesSet).sort((a, b) => b - a);
        for (const index of sortedIndices) {
            if (index >= 0 && index < array.length) {
                array.splice(index, 1);
            }
        }
    }
}

// 全局碰撞管理器实例
let collisionManager;