class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.score = 0;
        this.gameOver = false;
        this.isPaused = false; // 暂停状态
        this.lastTime = 0;
        this.deltaTime = 0;
        this.enemySpawner = new EnemySpawner(this);
        this.collisionManager = new CollisionManager(this);
        this.gameStartTime = Date.now(); // 游戏开始时间
        this.difficultyLevel = 1; // 当前难度等级
        
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
        
        // 更新敌人生成器
        this.enemySpawner.update(this.deltaTime);
        
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
        
        // 绘制玩家
        this.player.render(this.ctx);
        
        // 绘制敌人
        this.enemies.forEach(enemy => enemy.render(this.ctx));
        
        // 绘制子弹
        this.bullets.forEach(bullet => bullet.render(this.ctx));
        
        // 如果游戏暂停，显示暂停界面
        if (this.isPaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.font = '48px Arial';
            this.ctx.fillStyle = 'white';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('游戏暂停', this.canvas.width / 2, this.canvas.height / 2);
            
            this.ctx.font = '24px Arial';
            this.ctx.fillText('按 P 或 Esc 继续', this.canvas.width / 2, this.canvas.height / 2 + 50);
        }
    }
    

    
    updateUI() {
        document.getElementById('score').textContent = `分数: ${this.score}`;
        document.getElementById('health').textContent = `生命值: ${this.player.health}`;
    }
    
    // 更新游戏难度
    updateDifficulty() {
        // 根据游戏时间和分数动态调整难度
        const timeElapsed = (Date.now() - this.gameStartTime) / 1000; // 已经过的时间（秒）
        
        // 难度等级基于时间和分数计算
        this.difficultyLevel = 1 + Math.floor(timeElapsed / 30) + Math.floor(this.score / 500);
        
        // 调整敌人生成间隔
        this.enemySpawner.spawnInterval = Math.max(0.5, 2 - this.difficultyLevel * 0.1);
        
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