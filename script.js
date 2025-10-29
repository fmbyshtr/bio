class MinimalBio {
    constructor() {
        this.discordUserId = '1009588950962286673'; // Replace with your Discord User ID
        this.discordData = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadDiscordProfile();
        this.setRandomOrbPositions();
    }

    bindEvents() {
        // Discord button - copy name to clipboard
        document.getElementById('discordButton').addEventListener('click', () => {
            this.copyNameToClipboard();
        });

        // Refresh button - reload Discord data
        document.getElementById('refreshButton').addEventListener('click', () => {
            this.loadDiscordProfile();
        });

    }

    async loadDiscordProfile() {
        try {
            // Use CORS proxy
            const targetUrl = `https://dashboard.botghost.com/api/public/tools/user_lookup/${this.discordUserId}`;
            const proxyUrl = `https://api.cors.lol/?url=${encodeURIComponent(targetUrl)}`;
            
            console.log('Fetching from BotGhost API...');
            
            const response = await fetch(proxyUrl);
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.success === false) {
                    throw new Error(data.error?.message || 'API returned error');
                }
                
                if (!data.username || !data.id) {
                    throw new Error('Invalid Discord data received');
                }
                
                this.discordData = {
                    username: data.username,
                    discriminator: data.discriminator || '0',
                    id: data.id,
                    avatar: data.avatar,
                    global_name: data.global_name,
                    public_flags: data.public_flags || 0,
                    created_at: data.created_at || new Date().toISOString()
                };
                
                console.log('Discord data loaded from BotGhost API:', this.discordData);
                this.updateProfileDisplay();
                this.showNotification('Discord profile loaded!', 'success');
            } else {
                throw new Error(`API error: ${response.status}`);
            }
        } catch (error) {
            console.error('Error loading Discord profile:', error);
            this.showNotification('Failed to load Discord data', 'error');
            this.setFallbackData();
        }
    }


    updateProfileDisplay() {
        if (!this.discordData) {
            console.log('No Discord data available');
            return;
        }

        console.log('Updating profile with data:', this.discordData);

        // Use global_name (display name) if available, otherwise username
        const displayName = this.discordData.global_name || this.discordData.username;
        
        // Update username
        document.getElementById('discordUsername').textContent = displayName;
        
        // Update discriminator (Discord now uses @username format instead of #discriminator)
        const discriminatorText = this.discordData.discriminator === '0' ? 
            `@${this.discordData.username}` : 
            `#${this.discordData.discriminator}`;
        document.getElementById('discordDiscriminator').textContent = discriminatorText;
        
        
        // Update button text
        document.getElementById('discordButtonText').textContent = displayName;
        
        // Update profile picture
        this.updateProfilePicture();
        
        
        // Set custom status (you can change this)
        this.setCustomStatus('dnd');
        
        // Update initial (fallback if no avatar)
        const initial = displayName.charAt(0).toUpperCase();
        document.getElementById('profileInitial').textContent = initial;
    }

    updateProfilePicture() {
        const avatarImg = document.getElementById('profileAvatar');
        const initialSpan = document.getElementById('profileInitial');
        
        if (this.discordData.avatar) {
            // Construct Discord CDN URL for avatar
            const avatarUrl = `https://cdn.discordapp.com/avatars/${this.discordData.id}/${this.discordData.avatar}.png?size=128`;
            
            avatarImg.src = avatarUrl;
            avatarImg.style.display = 'block';
            initialSpan.style.display = 'none';
            
            // Handle image load error
            avatarImg.onerror = () => {
                avatarImg.style.display = 'none';
                initialSpan.style.display = 'block';
            };
        } else {
            avatarImg.style.display = 'none';
            initialSpan.style.display = 'block';
        }
    }


    setFallbackData() {
        // Show loading state if API fails
        document.getElementById('discordUsername').textContent = 'Loading...';
        document.getElementById('discordDiscriminator').textContent = 'Loading...';
        document.getElementById('discordButtonText').textContent = 'Loading...';
        document.getElementById('profileInitial').textContent = '?';
        
        this.showNotification('Failed to load Discord data', 'error');
    }


    async copyNameToClipboard() {
        let name = 'Loading...';
        
        if (this.discordData) {
            const displayName = this.discordData.global_name || this.discordData.username;
            if (this.discordData.discriminator === '0') {
                name = `@${this.discordData.username}`;
            } else {
                name = `${displayName}#${this.discordData.discriminator}`;
            }
        }
        
        try {
            await navigator.clipboard.writeText(name);
            this.showNotification('Name copied to clipboard!', 'success');
            
            // Visual feedback on button
            const button = document.getElementById('discordButton');
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
                button.style.transform = '';
            }, 150);
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = name;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showNotification('Name copied to clipboard!', 'success');
        }
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // Create notification content safely
        const content = document.createElement('div');
        content.className = 'notification-content';
        
        const icon = document.createElement('i');
        icon.className = `fas fa-${this.getNotificationIcon(type)}`;
        
        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.className = 'notification-close';
        closeBtn.style.cssText = `
            background: transparent;
            border: none;
            color: var(--text-muted);
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-left: auto;
            transition: all 0.2s ease;
            opacity: 0.5;
        `;
        closeBtn.addEventListener('click', () => {
            notification.style.transform = 'translateX(calc(100% + 20px))';
            setTimeout(() => notification.remove(), 300);
        });
        
        content.appendChild(icon);
        content.appendChild(messageSpan);
        content.appendChild(closeBtn);
        notification.appendChild(content);

        // Add styles with better visual design
        const typeColors = {
            success: { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', icon: '#10b981' },
            error: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', icon: '#ef4444' },
            warning: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', icon: '#f59e0b' },
            info: { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)', icon: '#3b82f6' }
        };
        
        const colors = typeColors[type] || typeColors.info;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, ${colors.bg}, rgba(40, 40, 40, 0.9));
            border: 1px solid ${colors.border};
            border-radius: 16px;
            padding: 1rem 1.5rem;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
            z-index: 1001;
            transform: translateX(calc(100% + 20px));
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            backdrop-filter: blur(20px) saturate(180%);
            max-width: 320px;
            min-width: 250px;
        `;
        
        // Style the icon with color
        icon.style.cssText = `
            color: ${colors.icon};
            font-size: 1.3rem;
            margin-right: 0.75rem;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            background: ${colors.bg};
            border-radius: 50%;
            flex-shrink: 0;
        `;
        
        // Style the content
        content.style.cssText = `
            display: flex;
            align-items: center;
            gap: 0.5rem;
        `;
        
        // Style the message span
        messageSpan.style.cssText = `
            color: var(--text-primary);
            font-size: 0.95rem;
            font-weight: 500;
            line-height: 1.4;
        `;

        // Add hover effects
        notification.addEventListener('mouseenter', () => {
            notification.style.transform = 'translateX(0) scale(1.02)';
            notification.style.boxShadow = `0 12px 40px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)`;
            closeBtn.style.opacity = '1';
        });
        
        notification.addEventListener('mouseleave', () => {
            notification.style.transform = 'translateX(0) scale(1)';
            notification.style.boxShadow = `0 8px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)`;
            closeBtn.style.opacity = '0.5';
        });
        
        // Add hover effect to close button
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.color = 'var(--text-primary)';
            closeBtn.style.transform = 'rotate(90deg) scale(1.1)';
        });
        
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.color = 'var(--text-muted)';
            closeBtn.style.transform = 'rotate(0deg) scale(1)';
        });

        document.body.appendChild(notification);

        // Animate in with bounce effect
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(calc(100% + 20px))';
            setTimeout(() => {
                notification.remove();
            }, 400);
        }, 4000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            warning: 'exclamation-triangle',
            error: 'times-circle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }


    // Custom Status (set manually)
    setCustomStatus(status) {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        
        // Map status to display text and classes
        const statusMap = {
            'online': { text: 'Online', class: '' },
            'idle': { text: 'Idle', class: 'idle' },
            'dnd': { text: 'Do Not Disturb', class: 'dnd' },
            'offline': { text: 'Offline', class: 'offline' }
        };
        
        const statusInfo = statusMap[status] || statusMap['dnd'];
        
        // Update status text
        statusText.textContent = statusInfo.text;
        
        // Update status dot
        statusDot.className = 'status-dot';
        if (statusInfo.class) {
            statusDot.classList.add(statusInfo.class);
        }
        
        console.log(`Status set to: ${statusInfo.text}`);
    }

    setRandomOrbPositions() {
        // Generate random positions for each orb
        const orbs = [
            { id: 'gradient-orb-1', element: document.querySelector('.gradient-orb-1') },
            { id: 'gradient-orb-2', element: document.querySelector('.gradient-orb-2') },
            { id: 'gradient-orb-3', element: document.querySelector('.gradient-orb-3') }
        ];

        orbs.forEach(orb => {
            if (orb.element) {
                // Generate random position (10% to 90% to avoid edges)
                const top = Math.random() * 80 + 10; // 10% to 90%
                const left = Math.random() * 80 + 10; // 10% to 90%
                
                orb.element.style.top = `${top}%`;
                orb.element.style.left = `${left}%`;
                
                console.log(`${orb.id} positioned at: ${top}%, ${left}%`);
            }
        });
    }


}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MinimalBio();
    
    // Snake Game Easter Egg
    const SnakeGame = {
        canvas: null,
        ctx: null,
        gridSize: 20,
        snake: [{ x: 10, y: 10 }],
        food: { x: 15, y: 15 },
        direction: { x: 1, y: 0 },
        nextDirection: { x: 1, y: 0 },
        score: 0,
        gameLoop: null,
        gameElement: null,
        isActive: false,
        
        init() {
            this.canvas = document.getElementById('snakeCanvas');
            this.ctx = this.canvas.getContext('2d');
            this.gameElement = document.getElementById('snakeGame');
            
            // Keyboard listener for "snake" sequence
            let pressedKeys = [];
            document.addEventListener('keydown', (e) => {
                pressedKeys.push(e.key.toLowerCase());
                if (pressedKeys.length > 5) pressedKeys.shift();
                
                if (pressedKeys.join('') === 'snake') {
                    this.showGame();
                    pressedKeys = [];
                }
            });
            
            // Close button
            document.getElementById('snakeClose').addEventListener('click', () => {
                this.hideGame();
            });
            
            // Arrow key controls
            document.addEventListener('keydown', (e) => {
                if (!this.isActive) return;
                
                const key = e.key;
                if (key === 'ArrowUp' && this.direction.y === 0) {
                    this.nextDirection = { x: 0, y: -1 };
                } else if (key === 'ArrowDown' && this.direction.y === 0) {
                    this.nextDirection = { x: 0, y: 1 };
                } else if (key === 'ArrowLeft' && this.direction.x === 0) {
                    this.nextDirection = { x: -1, y: 0 };
                } else if (key === 'ArrowRight' && this.direction.x === 0) {
                    this.nextDirection = { x: 1, y: 0 };
                }
            });
        },
        
        showGame() {
            this.gameElement.classList.remove('hidden');
            this.gameElement.classList.add('show');
            this.isActive = true;
            this.startGame();
        },
        
        hideGame() {
            this.gameElement.classList.remove('show');
            this.gameElement.classList.add('hidden');
            this.isActive = false;
            this.stopGame();
        },
        
        startGame() {
            this.snake = [{ x: 10, y: 10 }];
            this.direction = { x: 1, y: 0 };
            this.nextDirection = { x: 1, y: 0 };
            this.score = 0;
            this.generateFood();
            this.updateScore();
            
            this.gameLoop = setInterval(() => {
                this.update();
                this.draw();
            }, 150);
        },
        
        stopGame() {
            if (this.gameLoop) {
                clearInterval(this.gameLoop);
                this.gameLoop = null;
            }
        },
        
        update() {
            this.direction = this.nextDirection;
            const head = { x: this.snake[0].x + this.direction.x, y: this.snake[0].y + this.direction.y };
            
            // Check wall collision
            if (head.x < 0 || head.x >= this.canvas.width / this.gridSize || 
                head.y < 0 || head.y >= this.canvas.height / this.gridSize) {
                this.gameOver();
                return;
            }
            
            // Check self collision
            if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
                this.gameOver();
                return;
            }
            
            this.snake.unshift(head);
            
            // Check food collision
            if (head.x === this.food.x && head.y === this.food.y) {
                this.score++;
                this.updateScore();
                this.generateFood();
            } else {
                this.snake.pop();
            }
        },
        
        draw() {
            // Clear canvas with gradient
            const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
            gradient.addColorStop(0, 'rgba(10, 10, 15, 0.95)');
            gradient.addColorStop(1, 'rgba(20, 20, 30, 0.95)');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw subtle grid
            this.ctx.strokeStyle = 'rgba(139, 92, 246, 0.08)';
            this.ctx.lineWidth = 0.5;
            for (let i = 0; i <= this.canvas.width; i += this.gridSize) {
                this.ctx.beginPath();
                this.ctx.moveTo(i, 0);
                this.ctx.lineTo(i, this.canvas.height);
                this.ctx.stroke();
            }
            for (let i = 0; i <= this.canvas.height; i += this.gridSize) {
                this.ctx.beginPath();
                this.ctx.moveTo(0, i);
                this.ctx.lineTo(this.canvas.width, i);
                this.ctx.stroke();
            }
            
            // Draw food with glow effect
            const foodX = this.food.x * this.gridSize;
            const foodY = this.food.y * this.gridSize;
            
            // Food glow
            const foodGradient = this.ctx.createRadialGradient(foodX + this.gridSize/2, foodY + this.gridSize/2, 0, foodX + this.gridSize/2, foodY + this.gridSize/2, this.gridSize);
            foodGradient.addColorStop(0, 'rgba(16, 185, 129, 0.8)');
            foodGradient.addColorStop(1, 'rgba(16, 185, 129, 0.3)');
            this.ctx.fillStyle = foodGradient;
            this.ctx.fillRect(foodX - 2, foodY - 2, this.gridSize + 4, this.gridSize + 4);
            
            // Food body
            this.ctx.fillStyle = '#10b981';
            this.ctx.fillRect(foodX, foodY, this.gridSize, this.gridSize);
            
            // Food inner highlight
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillRect(foodX + 2, foodY + 2, this.gridSize - 4, this.gridSize - 4);
            
            // Draw snake with rounded corners and gradient
            this.snake.forEach((segment, index) => {
                const x = segment.x * this.gridSize;
                const y = segment.y * this.gridSize;
                const size = this.gridSize;
                const radius = 4;
                
                // Draw glow for snake segments
                if (index === 0) {
                    const glowGradient = this.ctx.createRadialGradient(x + size/2, y + size/2, 0, x + size/2, y + size/2, size);
                    glowGradient.addColorStop(0, 'rgba(139, 92, 246, 0.6)');
                    glowGradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
                    this.ctx.fillStyle = glowGradient;
                    this.ctx.fillRect(x - 3, y - 3, size + 6, size + 6);
                }
                
                // Draw segment with rounded corners
                this.ctx.beginPath();
                this.ctx.roundRect(x, y, size, size, radius);
                
                if (index === 0) {
                    // Head gradient
                    const headGradient = this.ctx.createLinearGradient(x, y, x + size, y + size);
                    headGradient.addColorStop(0, '#8b5cf6');
                    headGradient.addColorStop(1, '#7c3aed');
                    this.ctx.fillStyle = headGradient;
                } else {
                    // Body gradient
                    const opacity = Math.max(0.3, 0.9 - index * 0.05);
                    const bodyGradient = this.ctx.createLinearGradient(x, y, x + size, y + size);
                    bodyGradient.addColorStop(0, `rgba(139, 92, 246, ${opacity})`);
                    bodyGradient.addColorStop(1, `rgba(124, 58, 237, ${opacity})`);
                    this.ctx.fillStyle = bodyGradient;
                }
                
                this.ctx.fill();
                
                // Add shine effect
                if (index === 0) {
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    this.ctx.beginPath();
                    this.ctx.roundRect(x + 2, y + 2, size - 4, size - 4, radius - 1);
                    this.ctx.fill();
                }
            });
        },
        
        generateFood() {
            this.food = {
                x: Math.floor(Math.random() * (this.canvas.width / this.gridSize)),
                y: Math.floor(Math.random() * (this.canvas.height / this.gridSize))
            };
            
            // Make sure food doesn't spawn on snake
            while (this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y)) {
                this.food = {
                    x: Math.floor(Math.random() * (this.canvas.width / this.gridSize)),
                    y: Math.floor(Math.random() * (this.canvas.height / this.gridSize))
                };
            }
        },
        
        updateScore() {
            document.getElementById('snakeScore').textContent = this.score;
        },
        
        gameOver() {
            this.stopGame();
            alert(`Game Over! Score: ${this.score}`);
            this.hideGame();
        }
    };
    
    SnakeGame.init();
    
    // Floating Particles Effect
    const particlesContainer = document.getElementById('particles');
    const particleCount = 50;
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random starting position
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        
        // Random animation duration (3-6 seconds)
        const duration = 3 + Math.random() * 3;
        particle.style.animationDuration = duration + 's';
        
        // Random delay
        particle.style.animationDelay = Math.random() * 2 + 's';
        
        // Set initial opacity
        particle.style.opacity = '0.5';
        
        particlesContainer.appendChild(particle);
        particles.push(particle);
    }
    
    // Mouse tracking for profile card interaction
    const profileCard = document.querySelector('.profile-card');
    const mouseTrack = document.querySelector('.profile-card-mouse-track');
    
    profileCard.addEventListener('mousemove', (e) => {
        const rect = profileCard.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        mouseTrack.style.setProperty('--mouse-x', x + '%');
        mouseTrack.style.setProperty('--mouse-y', y + '%');
        
        // Make particles react smoothly like orbs do
        particles.forEach(particle => {
            const particleRect = particle.getBoundingClientRect();
            const particleX = particleRect.left + particleRect.width / 2;
            const particleY = particleRect.top + particleRect.height / 2;
            
            const dx = e.clientX - particleX;
            const dy = e.clientY - particleY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 150) {
                particle.classList.add('interactive');
                const intensity = 1 - (distance / 150);
                // Smooth scale transition with transition delay
                particle.style.transition = 'all 0.5s ease';
                particle.style.transform = `scale(${1 + intensity * 0.5})`;
                particle.style.opacity = (0.5 + intensity * 0.5).toString();
            } else {
                particle.classList.remove('interactive');
                particle.style.transition = 'all 0.5s ease';
                particle.style.transform = 'scale(1)';
                particle.style.opacity = '0.5';
            }
        });
    });
    
    profileCard.addEventListener('mouseleave', () => {
        particles.forEach(particle => {
            particle.classList.remove('interactive');
            particle.style.transition = 'all 0.5s ease';
            particle.style.transform = 'scale(1)';
            particle.style.opacity = '0.5';
        });
    });
    
});
