// Main Application Logic
class LyricsFindApp {
    constructor() {
        this.currentView = 'home';
        this.currentSong = null;
        this.favorites = this.loadFavorites();
        this.history = this.loadHistory();
        this.searchTimeout = null;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTheme();
        this.loadTrendingSongs();
        this.updateScrollProgress();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchView(btn.dataset.view));
        });

        // Search
        const searchInput = document.getElementById('searchInput');
        const clearSearch = document.getElementById('clearSearch');

        searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
            clearSearch.style.display = e.target.value ? 'block' : 'none';
        });

        clearSearch.addEventListener('click', () => {
            searchInput.value = '';
            clearSearch.style.display = 'none';
            this.clearSuggestions();
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Back button
        document.getElementById('backToHome').addEventListener('click', () => {
            this.switchView('home');
        });

        // Lyrics controls
        document.getElementById('decreaseFontSize').addEventListener('click', () => {
            this.adjustFontSize(-2);
        });

        document.getElementById('increaseFontSize').addEventListener('click', () => {
            this.adjustFontSize(2);
        });

        document.getElementById('copyLyrics').addEventListener('click', () => {
            this.copyLyrics();
        });

        document.getElementById('shareLyrics').addEventListener('click', () => {
            this.showShareModal();
        });

        document.getElementById('printLyrics').addEventListener('click', () => {
            window.print();
        });

        document.getElementById('toggleFavorite').addEventListener('click', () => {
            this.toggleFavorite();
        });

        // Share modal
        document.querySelector('.modal-close').addEventListener('click', () => {
            this.closeShareModal();
        });

        document.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.shareTo(btn.dataset.platform);
            });
        });

        // Clear history
        document.getElementById('clearHistory').addEventListener('click', () => {
            this.clearHistory();
        });

        // Scroll progress
        window.addEventListener('scroll', () => {
            this.updateScrollProgress();
        });
    }

    switchView(viewName) {
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        document.getElementById(`${viewName}View`).classList.add('active');
        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

        this.currentView = viewName;

        if (viewName === 'favorites') {
            this.renderFavorites();
        } else if (viewName === 'history') {
            this.renderHistory();
        }

        gsap.fromTo(`#${viewName}View`,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.5 }
        );
    }

    handleSearch(query) {
        clearTimeout(this.searchTimeout);

        if (query.length < 2) {
            this.clearSuggestions();
            return;
        }

        this.searchTimeout = setTimeout(async () => {
            try {
                const results = await lyricsAPI.searchSongs(query);
                this.showSuggestions(results);
            } catch (error) {
                console.error('Search error:', error);
            }
        }, DEBOUNCE_DELAY);
    }

    showSuggestions(results) {
        const dropdown = document.getElementById('searchSuggestions');
        dropdown.innerHTML = '';

        if (results.length === 0) {
            dropdown.classList.remove('active');
            return;
        }

        results.forEach(song => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.innerHTML = `
                <img src="${song.cover}" alt="${song.title}" class="suggestion-cover" loading="lazy">
                <div class="suggestion-info">
                    <h4>${song.title}</h4>
                    <p>${song.artist}</p>
                </div>
            `;
            item.addEventListener('click', () => {
                this.loadLyrics(song.title, song.artist);
                this.clearSuggestions();
                document.getElementById('searchInput').value = '';
            });
            dropdown.appendChild(item);
        });

        dropdown.classList.add('active');
    }

    clearSuggestions() {
        const dropdown = document.getElementById('searchSuggestions');
        dropdown.innerHTML = '';
        dropdown.classList.remove('active');
    }

    async loadLyrics(title, artist) {
        if (!title || !artist) {
            animationManager.showToast('Invalid song information', 'error');
            return;
        }

        try {
            animationManager.showToast('Loading lyrics...', 'success');
            
            const data = await lyricsAPI.fetchLyrics(title, artist);
            
            if (!data || !data.lyrics) {
                throw new Error('No lyrics data received');
            }
            
            this.currentSong = {
                title: data.title || title,
                artist: data.artist || artist,
                album: data.album || 'Unknown Album',
                lyrics: data.lyrics,
                syncedLyrics: data.syncedLyrics || null,
                cover: data.cover
            };

            this.displayLyrics();
            this.addToHistory(title, artist);
            this.switchView('lyrics');
            
            animationManager.showToast('Lyrics loaded!', 'success');
        } catch (error) {
            console.error('Error loading lyrics:', error);
            animationManager.showToast(`Failed to load lyrics: ${error.message}`, 'error');
        }
    }

    displayLyrics() {
        if (!this.currentSong) return;

        // Update metadata
        document.getElementById('lyricsTitle').textContent = this.currentSong.title;
        document.getElementById('lyricsArtist').textContent = this.currentSong.artist;
        document.getElementById('lyricsAlbum').textContent = this.currentSong.album;
        document.getElementById('lyricsCover').src = this.currentSong.cover;

        // Display lyrics with proper formatting
        const content = document.getElementById('lyricsContent');
        content.innerHTML = '';
        
        let lyricsText = this.currentSong.lyrics || '';
        
        // Normalize line breaks
        lyricsText = lyricsText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        
        // Split into lines
        const lines = lyricsText.split('\n');
        
        // Create paragraph for each line
        lines.forEach((line) => {
            const p = document.createElement('p');
            p.className = 'lyrics-line';
            
            if (line.trim() === '') {
                p.innerHTML = '&nbsp;';
            } else {
                p.textContent = line;
            }
            
            content.appendChild(p);
        });

        // Detect language and apply font
        const language = lyricsAPI.detectLanguage(this.currentSong.lyrics);
        const font = FONT_MAP[language] || FONT_MAP.default;
        content.style.fontFamily = font;

        // Animate lyrics
        setTimeout(() => {
            animationManager.animateLyricsLines();
        }, 100);

        // Update favorite button
        this.updateFavoriteButton();
    }

    async loadTrendingSongs() {
        const grid = document.getElementById('trendingGrid');
        grid.innerHTML = '<div class="loading-text">Loading trending songs...</div>';

        try {
            // Get covers for trending songs
            const songsWithCovers = await Promise.all(
                TRENDING_SONGS.map(async (song) => {
                    const cover = await lyricsAPI.getAlbumArt(song.artist, song.title);
                    return { ...song, cover };
                })
            );

            grid.innerHTML = '';

            songsWithCovers.forEach(song => {
                const card = this.createSongCard(song);
                grid.appendChild(card);
            });

            setTimeout(() => {
                animationManager.animateTrendingCards();
            }, 100);
        } catch (error) {
            console.error('Error loading trending songs:', error);
            grid.innerHTML = '<p>Failed to load trending songs</p>';
        }
    }

    createSongCard(song) {
        const card = document.createElement('div');
        card.className = 'song-card';
        card.innerHTML = `
            <img src="${song.cover}" alt="${song.title}" class="song-cover" loading="lazy">
            <div class="song-info">
                <h3>${song.title}</h3>
                <p>${song.artist}</p>
            </div>
            <div class="song-actions">
                <button class="song-action-btn play-btn" title="View Lyrics">
                    <i class="fas fa-play"></i>
                </button>
                <button class="song-action-btn favorite-btn" title="Add to Favorites">
                    <i class="far fa-heart"></i>
                </button>
            </div>
        `;

        card.querySelector('.play-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.loadLyrics(song.title, song.artist);
        });

        card.querySelector('.favorite-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSongFavorite(song, e.currentTarget);
        });

        card.addEventListener('click', () => {
            this.loadLyrics(song.title, song.artist);
        });

        return card;
    }

    setupTheme() {
        const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem(STORAGE_KEYS.theme, newTheme);
        this.updateThemeIcon(newTheme);
        
        animationManager.showToast(`Switched to ${newTheme} mode`, 'success');
    }

    updateThemeIcon(theme) {
        const icon = document.querySelector('#themeToggle i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    adjustFontSize(delta) {
        const content = document.getElementById('lyricsContent');
        const currentSize = parseFloat(window.getComputedStyle(content).fontSize);
        content.style.fontSize = `${currentSize + delta}px`;
    }

    copyLyrics() {
        if (!this.currentSong) return;

        navigator.clipboard.writeText(this.currentSong.lyrics).then(() => {
            animationManager.showToast('Lyrics copied to clipboard!', 'success');
        }).catch(() => {
            animationManager.showToast('Failed to copy lyrics', 'error');
        });
    }

    showShareModal() {
        const modal = document.getElementById('shareModal');
        modal.classList.add('active');
    }

    closeShareModal() {
        const modal = document.getElementById('shareModal');
        modal.classList.remove('active');
    }

    shareTo(platform) {
        if (!this.currentSong) return;

        const url = window.location.href;
        const text = `Check out "${this.currentSong.title}" by ${this.currentSong.artist} on LyricsFind!`;

        const shareUrls = {
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
            copy: null
        };

        if (platform === 'copy') {
            navigator.clipboard.writeText(url).then(() => {
                animationManager.showToast('Link copied!', 'success');
                this.closeShareModal();
            });
        } else if (shareUrls[platform]) {
            window.open(shareUrls[platform], '_blank', 'width=600,height=400');
        }
    }

    toggleFavorite() {
        if (!this.currentSong) return;

        const key = `${this.currentSong.title}_${this.currentSong.artist}`;
        const index = this.favorites.findIndex(fav => `${fav.title}_${fav.artist}` === key);

        if (index > -1) {
            this.favorites.splice(index, 1);
            animationManager.showToast('Removed from favorites', 'success');
        } else {
            this.favorites.push({
                title: this.currentSong.title,
                artist: this.currentSong.artist,
                cover: this.currentSong.cover,
                album: this.currentSong.album
            });
            animationManager.showToast('Added to favorites', 'success');
        }

        this.saveFavorites();
        this.updateFavoriteButton();
    }

    toggleSongFavorite(song, button) {
        const key = `${song.title}_${song.artist}`;
        const index = this.favorites.findIndex(fav => `${fav.title}_${fav.artist}` === key);

        if (index > -1) {
            this.favorites.splice(index, 1);
            button.innerHTML = '<i class="far fa-heart"></i>';
        } else {
            this.favorites.push(song);
            button.innerHTML = '<i class="fas fa-heart"></i>';
        }

        this.saveFavorites();
    }

    updateFavoriteButton() {
        const button = document.getElementById('toggleFavorite');
        if (!this.currentSong) return;

        const key = `${this.currentSong.title}_${this.currentSong.artist}`;
        const isFavorite = this.favorites.some(fav => `${fav.title}_${fav.artist}` === key);

        button.innerHTML = isFavorite ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
    }

    renderFavorites() {
        const grid = document.getElementById('favoritesGrid');
        grid.innerHTML = '';

        if (this.favorites.length === 0) {
            grid.innerHTML = '<p style="text-align: center; color: var(--text-secondary); grid-column: 1/-1;">No favorites yet. Start adding songs!</p>';
            return;
        }

        this.favorites.forEach(song => {
            const card = this.createSongCard(song);
            grid.appendChild(card);
        });
    }

    addToHistory(title, artist) {
        const entry = {
            title,
            artist,
            timestamp: Date.now()
        };

        this.history = [entry, ...this.history.filter(
            h => !(h.title === title && h.artist === artist)
        )].slice(0, 50);

        this.saveHistory();
    }

    renderHistory() {
        const list = document.getElementById('historyList');
        list.innerHTML = '';

        if (this.history.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No search history</p>';
            return;
        }

        this.history.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <div class="history-item-info">
                    <h4>${item.title}</h4>
                    <p>${item.artist} • ${this.formatDate(item.timestamp)}</p>
                </div>
                <button class="history-item-delete" data-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            `;

            div.addEventListener('click', (e) => {
                if (!e.target.closest('.history-item-delete')) {
                    this.loadLyrics(item.title, item.artist);
                }
            });

            div.querySelector('.history-item-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteHistoryItem(index);
            });

            list.appendChild(div);
        });
    }

    deleteHistoryItem(index) {
        this.history.splice(index, 1);
        this.saveHistory();
        this.renderHistory();
        animationManager.showToast('Removed from history', 'success');
    }

    clearHistory() {
        if (confirm('Clear all search history?')) {
            this.history = [];
            this.saveHistory();
            this.renderHistory();
            animationManager.showToast('History cleared', 'success');
        }
    }

    loadFavorites() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.favorites)) || [];
        } catch {
            return [];
        }
    }

    saveFavorites() {
        localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(this.favorites));
    }

    loadHistory() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.history)) || [];
        } catch {
            return [];
        }
    }

    saveHistory() {
        localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(this.history));
    }

    updateScrollProgress() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const progress = (scrollTop / scrollHeight) * 100;

        const bar = document.querySelector('.scroll-progress-bar');
        if (bar) {
            bar.style.width = `${progress}%`;
        }
    }

    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    const app = new LyricsFindApp();
    window.lyricsFindApp = app;
});
