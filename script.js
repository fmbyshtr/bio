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
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
            
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
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: var(--radius);
            padding: 1rem 1.5rem;
            box-shadow: var(--shadow);
            z-index: 1001;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            backdrop-filter: blur(10px);
            max-width: 300px;
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 2000);
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
});
