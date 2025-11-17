// API Service for fetching lyrics with fallback mechanism
class LyricsAPI {
    constructor() {
        this.cache = this.loadCache();
    }

    // Main function to fetch lyrics with fallback
    async fetchLyrics(songTitle, artistName) {
        const cacheKey = `${songTitle}_${artistName}`.toLowerCase();
        
        if (this.cache[cacheKey] && !this.isCacheExpired(this.cache[cacheKey])) {
            console.log('Loading from cache');
            return this.cache[cacheKey].data;
        }

        try {
            console.log('Trying LRCLIB API...');
            const lrclibResult = await this.fetchFromLRCLIB(songTitle, artistName);
            if (lrclibResult) {
                this.saveToCache(cacheKey, lrclibResult);
                return lrclibResult;
            }
        } catch (error) {
            console.log('LRCLIB failed:', error.message);
        }

        try {
            console.log('Trying Genius API...');
            const geniusResult = await this.fetchFromGenius(songTitle, artistName);
            if (geniusResult) {
                this.saveToCache(cacheKey, geniusResult);
                return geniusResult;
            }
        } catch (error) {
            console.log('Genius failed:', error.message);
        }

        throw new Error('No lyrics found from any source');
    }

    // Fetch from LRCLIB
    async fetchFromLRCLIB(songTitle, artistName) {
        const query = encodeURIComponent(`${songTitle} ${artistName}`);
        const response = await fetch(`${API_CONFIG.lrclib.baseUrl}/search?q=${query}`);
        
        if (!response.ok) {
            throw new Error('LRCLIB API request failed');
        }

        const results = await response.json();
        if (!results || results.length === 0) {
            throw new Error('No results from LRCLIB');
        }

        const bestMatch = results[0];
        
        // Fetch album cover
        const cover = await this.getAlbumArt(bestMatch.artistName, bestMatch.trackName);
        
        return {
            source: 'lrclib',
            title: bestMatch.trackName || bestMatch.name,
            artist: bestMatch.artistName,
            album: bestMatch.albumName || 'Unknown Album',
            lyrics: bestMatch.plainLyrics || bestMatch.syncedLyrics || 'No lyrics available',
            syncedLyrics: bestMatch.syncedLyrics,
            duration: bestMatch.duration,
            cover: cover
        };
    }

    // Fetch from Genius API
    async fetchFromGenius(songTitle, artistName) {
        const query = encodeURIComponent(`${songTitle} ${artistName}`);
        const headers = {
            'Authorization': `Bearer ${API_CONFIG.genius.accessToken}`
        };

        const response = await fetch(`${API_CONFIG.genius.baseUrl}/search?q=${query}`, { headers });
        
        if (!response.ok) {
            throw new Error('Genius API request failed');
        }

        const data = await response.json();
        if (!data.response.hits || data.response.hits.length === 0) {
            throw new Error('No results from Genius');
        }

        const result = data.response.hits[0].result;
        
        return {
            source: 'genius',
            title: result.title,
            artist: result.primary_artist.name,
            album: result.album?.name || 'Unknown Album',
            cover: result.song_art_image_url,
            url: result.url,
            lyrics: `Note: Full lyrics require additional access.\n\nYou can view complete lyrics at:\n${result.url}`
        };
    }

    // Get Album Art from iTunes API
    async getAlbumArt(artist, track) {
        try {
            const query = encodeURIComponent(`${artist} ${track}`);
            const response = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`);
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                // Get high-quality artwork (600x600)
                return data.results[0].artworkUrl100.replace('100x100bb', '600x600bb');
            }
        } catch (error) {
            console.log('iTunes cover fetch failed:', error);
        }

        // Fallback placeholder
        return `https://via.placeholder.com/600x600/667eea/ffffff?text=${encodeURIComponent(track)}`;
    }

    // Search songs (for autocomplete)
    async searchSongs(query) {
        try {
            const encodedQuery = encodeURIComponent(query);
            const response = await fetch(`${API_CONFIG.lrclib.baseUrl}/search?q=${encodedQuery}`);
            
            if (!response.ok) {
                throw new Error('Search failed');
            }

            const results = await response.json();
            
            const formattedResults = await Promise.all(
                results.slice(0, 8).map(async (item) => {
                    const cover = await this.getAlbumArt(item.artistName, item.trackName);
                    return {
                        title: item.trackName || item.name || 'Unknown',
                        artist: item.artistName || 'Unknown Artist',
                        album: item.albumName || 'Unknown Album',
                        cover: cover
                    };
                })
            );
            
            return formattedResults;
        } catch (error) {
            console.error('Search error:', error);
            return [];
        }
    }

    // Detect language
    detectLanguage(text) {
        if (!text) return 'en';
        
        if (/[\u0900-\u097F]/.test(text)) return 'hi';
        if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja';
        if (/[\uAC00-\uD7AF]/.test(text)) return 'ko';
        if (/[\u0600-\u06FF]/.test(text)) return 'ar';
        if (/[\u4E00-\u9FFF]/.test(text)) return 'zh';
        return 'en';
    }

    // Cache management
    loadCache() {
        try {
            const cached = localStorage.getItem(STORAGE_KEYS.cache);
            return cached ? JSON.parse(cached) : {};
        } catch {
            return {};
        }
    }

    saveToCache(key, data) {
        this.cache[key] = {
            data,
            timestamp: Date.now()
        };
        localStorage.setItem(STORAGE_KEYS.cache, JSON.stringify(this.cache));
    }

    isCacheExpired(cacheEntry) {
        return Date.now() - cacheEntry.timestamp > CACHE_EXPIRY;
    }
}

// Initialize API service
const lyricsAPI = new LyricsAPI();
