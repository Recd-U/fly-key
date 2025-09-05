// 输入处理系统
class InputSystem {
    constructor() {
        this.keys = {};
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchMoveX = 0;
        this.touchMoveY = 0;
        this.isTouching = false;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // 键盘事件
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // 触摸事件
        const canvas = document.getElementById('game-canvas');
        canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        canvas.addEventListener('touchend', () => this.handleTouchEnd());
        canvas.addEventListener('touchcancel', () => this.handleTouchEnd());
        
        // 鼠标事件（备用）
        canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        canvas.addEventListener('mouseup', () => this.handleMouseUp());
        canvas.addEventListener('mouseleave', () => this.handleMouseUp());
    }
    
    handleKeyDown(event) {
        this.keys[event.code] = true;
        
        // 防止页面滚动
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
            event.preventDefault();
        }
    }
    
    handleKeyUp(event) {
        this.keys[event.code] = false;
    }
    
    handleTouchStart(event) {
        event.preventDefault();
        const touch = event.touches[0];
        const rect = event.target.getBoundingClientRect();
        
        this.touchStartX = touch.clientX - rect.left;
        this.touchStartY = touch.clientY - rect.top;
        this.touchMoveX = this.touchStartX;
        this.touchMoveY = this.touchStartY;
        this.isTouching = true;
    }
    
    handleTouchMove(event) {
        event.preventDefault();
        if (!this.isTouching) return;
        
        const touch = event.touches[0];
        const rect = event.target.getBoundingClientRect();
        
        this.touchMoveX = touch.clientX - rect.left;
        this.touchMoveY = touch.clientY - rect.top;
    }
    
    handleTouchEnd() {
        this.isTouching = false;
        
        // 重置移动状态
        if (window.currentGame && window.currentGame.player) {
            window.currentGame.player.isMovingLeft = false;
            window.currentGame.player.isMovingRight = false;
            window.currentGame.player.isMovingUp = false;
            window.currentGame.player.isMovingDown = false;
        }
    }
    
    handleMouseDown(event) {
        const rect = event.target.getBoundingClientRect();
        this.touchStartX = event.clientX - rect.left;
        this.touchStartY = event.clientY - rect.top;
        this.touchMoveX = this.touchStartX;
        this.touchMoveY = this.touchStartY;
        this.isTouching = true;
    }
    
    handleMouseMove(event) {
        if (!this.isTouching) return;
        
        const rect = event.target.getBoundingClientRect();
        this.touchMoveX = event.clientX - rect.left;
        this.touchMoveY = event.clientY - rect.top;
    }
    
    handleMouseUp() {
        this.isTouching = false;
        
        // 重置移动状态
        if (window.currentGame && window.currentGame.player) {
            window.currentGame.player.isMovingLeft = false;
            window.currentGame.player.isMovingRight = false;
            window.currentGame.player.isMovingUp = false;
            window.currentGame.player.isMovingDown = false;
        }
    }
    
    update() {
        this.handleKeyboardInput();
        this.handleTouchInput();
    }
    
    handleKeyboardInput() {
        if (!window.currentGame || !window.currentGame.player) return;
        
        // 移动控制
        window.currentGame.player.isMovingLeft = this.keys['ArrowLeft'] || this.keys['KeyA'];
        window.currentGame.player.isMovingRight = this.keys['ArrowRight'] || this.keys['KeyD'];
        window.currentGame.player.isMovingUp = this.keys['ArrowUp'] || this.keys['KeyW'];
        window.currentGame.player.isMovingDown = this.keys['ArrowDown'] || this.keys['KeyS'];
        
        // 特殊功能键
        if (this.keys['Space'] || this.keys['KeyJ']) {
            // 可以在这里实现特殊技能
        }
        
        // 暂停游戏
        if (this.keys['Escape'] || this.keys['KeyP']) {
            // 实现暂停功能
        }
    }
    
    handleTouchInput() {
        if (!this.isTouching || !window.currentGame || !window.currentGame.player) return;
        
        const sensitivity = 2.0; // 触摸灵敏度
        const deadZone = 20; // 死区范围
        
        const deltaX = this.touchMoveX - this.touchStartX;
        const deltaY = this.touchMoveY - this.touchStartY;
        
        // 水平移动
        if (Math.abs(deltaX) > deadZone) {
            if (deltaX > 0) {
                window.currentGame.player.isMovingRight = true;
                window.currentGame.player.isMovingLeft = false;
            } else {
                window.currentGame.player.isMovingLeft = true;
                window.currentGame.player.isMovingRight = false;
            }
        } else {
            window.currentGame.player.isMovingLeft = false;
            window.currentGame.player.isMovingRight = false;
        }
        
        // 垂直移动
        if (Math.abs(deltaY) > deadZone) {
            if (deltaY > 0) {
                window.currentGame.player.isMovingDown = true;
                window.currentGame.player.isMovingUp = false;
            } else {
                window.currentGame.player.isMovingUp = true;
                window.currentGame.player.isMovingDown = false;
            }
        } else {
            window.currentGame.player.isMovingUp = false;
            window.currentGame.player.isMovingDown = false;
        }
        
        // 更新触摸起始位置，实现相对移动
        this.touchStartX = this.touchMoveX;
        this.touchStartY = this.touchMoveY;
    }
    
    // 获取摇杆方向（用于移动指示器）
    getJoystickDirection() {
        if (!this.isTouching) return null;
        
        const deltaX = this.touchMoveX - this.touchStartX;
        const deltaY = this.touchMoveY - this.touchStartY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance < 20) return null; // 忽略小范围移动
        
        return {
            x: deltaX / distance,
            y: deltaY / distance,
            magnitude: Math.min(distance / 100, 1.0) // 标准化到 0-1
        };
    }
    
    // 重置输入状态
    reset() {
        this.keys = {};
        this.isTouching = false;
        
        if (window.currentGame && window.currentGame.player) {
            window.currentGame.player.isMovingLeft = false;
            window.currentGame.player.isMovingRight = false;
            window.currentGame.player.isMovingUp = false;
            window.currentGame.player.isMovingDown = false;
        }
    }
}

// 全局输入系统实例
const inputSystem = new InputSystem();

// 处理输入的函数（供外部调用）
function handleInput(event, isKeyDown) {
    if (isKeyDown) {
        inputSystem.handleKeyDown(event);
    } else {
        inputSystem.handleKeyUp(event);
    }
}

// 在游戏循环中更新输入
function updateInput(deltaTime) {
    inputSystem.update();
}