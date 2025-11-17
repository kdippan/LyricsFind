// Animation Manager
class AnimationManager {
    constructor() {
        this.initGSAP();
        this.initScrollReveal();
        this.initWaveform();
    }

    initGSAP() {
        gsap.registerPlugin(ScrollTrigger);

        gsap.to('.logo', {
            scale: 1.1,
            duration: 1,
            ease: 'power1.inOut',
            yoyo: true,
            repeat: -1
        });
    }

    animateTrendingCards() {
        gsap.fromTo('.song-card',
            { opacity: 0, y: 50 },
            {
                opacity: 1,
                y: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: 'power2.out'
            }
        );
    }

    animateLyricsLines() {
        const lines = document.querySelectorAll('.lyrics-line');
        
        gsap.fromTo(lines,
            { opacity: 0, x: -30 },
            {
                opacity: 1,
                x: 0,
                duration: 0.5,
                stagger: 0.03,
                ease: 'power2.out'
            }
        );
    }

    initScrollReveal() {
        ScrollReveal().reveal('.section-header', {
            origin: 'top',
            distance: '30px',
            duration: 800
        });
    }

    initWaveform() {
        const canvas = document.getElementById('waveformCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const bars = 50;
        const barWidth = canvas.width / bars;

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            for (let i = 0; i < bars; i++) {
                const height = Math.random() * canvas.height * 0.5;
                const x = i * barWidth;
                const y = canvas.height - height;
                
                const gradient = ctx.createLinearGradient(0, y, 0, canvas.height);
                gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
                gradient.addColorStop(1, 'rgba(139, 92, 246, 0.1)');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(x, y, barWidth - 2, height);
            }
            
            requestAnimationFrame(animate);
        }

        animate();

        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} active`;

        setTimeout(() => {
            toast.classList.remove('active');
        }, 3000);
    }
}

const animationManager = new AnimationManager();
