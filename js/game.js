class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.score = 0;
        this.gameOver = false;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.enemySpawner = new EnemySpawner(this);
        this.collisionManager = new CollisionManager(this);
        
        this.init();
    }
    
    init() {
        this.player = new Player(this.canvas.width / 2, this.canvas.height - 100, this);
        this.setupEventListeners();
        this.gameLoop();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => handleInput(e, true));
        document.addEventListener('keyup', (e) => handleInput(e, false));
        document.getElementById('restart-btn').addEventListener('click', () => this.restart());
    }
    
    gameLoop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        this.deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;
        
        if (!this.gameOver) {
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
    }
    

    
    updateUI() {
        document.getElementById('score').textContent = `分数: ${this.score}`;
        document.getElementById('health').textContent = `生命值: ${this.player.health}`;
    }
    
    restart() {
        this.player = new Player(this.canvas.width / 2, this.canvas.height - 100, this);
        this.enemies = [];
        this.bullets = [];
        this.score = 0;
        this.gameOver = false;
        document.getElementById('game-over').classList.add('hidden');
        this.updateUI();
    }
}

// 启动游戏
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});