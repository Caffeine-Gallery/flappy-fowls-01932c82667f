import { backend } from "declarations/backend";

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        this.bird = {
            x: 100,
            y: 300,
            radius: 20,
            color: '#FF0000',
            velocity: { x: 0, y: 0 },
            isLaunched: false
        };
        
        this.slingshot = {
            x: 100,
            y: 400,
            width: 20,
            height: 100
        };
        
        this.targets = [
            { x: 600, y: 300, width: 50, height: 50, color: '#8B4513' },
            { x: 600, y: 250, width: 50, height: 50, color: '#8B4513' },
            { x: 600, y: 350, width: 50, height: 50, color: '#8B4513' }
        ];
        
        this.gravity = 0.5;
        this.elasticity = 0.7;
        this.isDragging = false;
        this.dragStartPos = { x: 0, y: 0 };
        this.score = 0;
        
        this.setupEventListeners();
        this.loadHighScore();
        this.gameLoop();
    }
    
    async loadHighScore() {
        try {
            const highScore = await backend.getHighScore();
            document.getElementById('high-score').textContent = highScore.toString();
        } catch (error) {
            console.error('Error loading high score:', error);
        }
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleMouseDown(touch);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleMouseMove(touch);
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleMouseUp(null);
        });
    }
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e ? (e.clientX - rect.left) * (this.canvas.width / rect.width) : 0,
            y: e ? (e.clientY - rect.top) * (this.canvas.height / rect.height) : 0
        };
    }
    
    handleMouseDown(e) {
        const pos = this.getMousePos(e);
        if (this.isPointInBird(pos.x, pos.y) && !this.bird.isLaunched) {
            this.isDragging = true;
            this.dragStartPos = { x: pos.x, y: pos.y };
        }
    }
    
    handleMouseMove(e) {
        if (!this.isDragging) return;
        
        const pos = this.getMousePos(e);
        
        // Limit the drag distance
        const dx = pos.x - this.slingshot.x;
        const dy = pos.y - this.slingshot.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 100;
        
        if (distance > maxDistance) {
            const angle = Math.atan2(dy, dx);
            this.bird.x = this.slingshot.x + Math.cos(angle) * maxDistance;
            this.bird.y = this.slingshot.y + Math.sin(angle) * maxDistance;
        } else {
            this.bird.x = pos.x;
            this.bird.y = pos.y;
        }
    }
    
    handleMouseUp(e) {
        if (this.isDragging) {
            const dx = this.bird.x - this.slingshot.x;
            const dy = this.bird.y - this.slingshot.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 10) { // Minimum distance threshold for launch
                this.launchBird();
            } else {
                this.resetBird();
            }
        }
        this.isDragging = false;
    }
    
    isPointInBird(x, y) {
        const dx = this.bird.x - x;
        const dy = this.bird.y - y;
        return Math.sqrt(dx * dx + dy * dy) < this.bird.radius * 1.5; // Increased hit area
    }
    
    launchBird() {
        this.bird.isLaunched = true;
        const dx = this.slingshot.x - this.bird.x;
        const dy = this.slingshot.y - this.bird.y;
        this.bird.velocity.x = dx * 0.15;
        this.bird.velocity.y = dy * 0.15;
    }
    
    update() {
        if (this.bird.isLaunched) {
            this.bird.velocity.y += this.gravity;
            this.bird.x += this.bird.velocity.x;
            this.bird.y += this.bird.velocity.y;
            
            // Collision with ground
            if (this.bird.y + this.bird.radius > this.canvas.height) {
                this.bird.y = this.canvas.height - this.bird.radius;
                this.bird.velocity.y *= -this.elasticity;
                this.bird.velocity.x *= 0.99; // Add friction
            }
            
            // Collision with walls
            if (this.bird.x + this.bird.radius > this.canvas.width || 
                this.bird.x - this.bird.radius < 0) {
                this.resetBird();
            }
            
            // Collision with targets
            this.targets.forEach((target, index) => {
                if (this.checkCollision(this.bird, target)) {
                    this.targets.splice(index, 1);
                    this.score += 100;
                    document.getElementById('current-score').textContent = this.score.toString();
                    this.updateHighScore();
                }
            });
            
            // Reset if all targets are hit
            if (this.targets.length === 0) {
                this.resetGame();
            }
        }
    }
    
    async updateHighScore() {
        try {
            await backend.updateScore(this.score);
            const highScore = await backend.getHighScore();
            document.getElementById('high-score').textContent = highScore.toString();
        } catch (error) {
            console.error('Error updating high score:', error);
        }
    }
    
    checkCollision(bird, target) {
        const closestX = Math.max(target.x, Math.min(bird.x, target.x + target.width));
        const closestY = Math.max(target.y, Math.min(bird.y, target.y + target.height));
        
        const distanceX = bird.x - closestX;
        const distanceY = bird.y - closestY;
        
        return (distanceX * distanceX + distanceY * distanceY) < (bird.radius * bird.radius);
    }
    
    resetBird() {
        this.bird.x = this.slingshot.x;
        this.bird.y = this.slingshot.y;
        this.bird.velocity.x = 0;
        this.bird.velocity.y = 0;
        this.bird.isLaunched = false;
    }
    
    resetGame() {
        this.resetBird();
        this.targets = [
            { x: 600, y: 300, width: 50, height: 50, color: '#8B4513' },
            { x: 600, y: 250, width: 50, height: 50, color: '#8B4513' },
            { x: 600, y: 350, width: 50, height: 50, color: '#8B4513' }
        ];
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw slingshot
        this.ctx.fillStyle = '#4B2810';
        this.ctx.fillRect(
            this.slingshot.x - this.slingshot.width/2,
            this.slingshot.y,
            this.slingshot.width,
            this.slingshot.height
        );
        
        // Draw targets
        this.targets.forEach(target => {
            this.ctx.fillStyle = target.color;
            this.ctx.fillRect(target.x, target.y, target.width, target.height);
        });
        
        // Draw bird
        this.ctx.beginPath();
        this.ctx.arc(this.bird.x, this.bird.y, this.bird.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = this.isDragging ? '#FF6B6B' : this.bird.color;
        this.ctx.fill();
        this.ctx.closePath();
        
        // Draw slingshot band
        if (this.isDragging) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.slingshot.x - this.slingshot.width/2, this.slingshot.y);
            this.ctx.lineTo(this.bird.x, this.bird.y);
            this.ctx.moveTo(this.slingshot.x + this.slingshot.width/2, this.slingshot.y);
            this.ctx.lineTo(this.bird.x, this.bird.y);
            this.ctx.strokeStyle = '#4B2810';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
});
