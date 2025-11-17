// API Configuration
const API_CONFIG = {
    genius: {
        baseUrl: 'https://api.genius.com',
        accessToken: 'Q13nDStVm-_nuyqcvnPsj7axcBHh5q0IBEogEaM_CISUVfmT4k32VI8S-G_mNCX0'
    },
    lrclib: {
        baseUrl: 'https://lrclib.net/api'
    }
};

// Font mapping for different languages
const FONT_MAP = {
    'en': 'Poppins, Inter, Roboto',
    'hi': 'Noto Sans Devanagari, Mukta',
    'ja': 'Noto Sans JP, M PLUS Rounded 1c',
    'ko': 'Noto Sans KR, Jua',
    'ar': 'Noto Sans Arabic, Cairo',
    'zh': 'Noto Sans SC, Ma Shan Zheng',
    'default': 'Quicksand, Raleway, Nunito'
};

// Trending songs (sample data)
const TRENDING_SONGS = [
    { title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours' },
    { title: 'Shape of You', artist: 'Ed Sheeran', album: 'Divide' },
    { title: 'Someone Like You', artist: 'Adele', album: '21' },
    { title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera' },
    { title: 'Hotel California', artist: 'Eagles', album: 'Hotel California' },
    { title: 'Imagine', artist: 'John Lennon', album: 'Imagine' },
    { title: 'Yesterday', artist: 'The Beatles', album: 'Help!' },
    { title: 'Stairway to Heaven', artist: 'Led Zeppelin', album: 'Led Zeppelin IV' },
    { title: 'Smells Like Teen Spirit', artist: 'Nirvana', album: 'Nevermind' },
    { title: 'Billie Jean', artist: 'Michael Jackson', album: 'Thriller' },
    { title: 'Sweet Child O Mine', artist: 'Guns N Roses', album: 'Appetite for Destruction' },
    { title: 'Wonderwall', artist: 'Oasis', album: 'Whats the Story Morning Glory' }
];

// Storage keys
const STORAGE_KEYS = {
    theme: 'lyricsfind_theme',
    favorites: 'lyricsfind_favorites',
    history: 'lyricsfind_history',
    cache: 'lyricsfind_cache',
    preferences: 'lyricsfind_preferences'
};

// Debounce delay
const DEBOUNCE_DELAY = 300;

// Cache expiry (24 hours)
const CACHE_EXPIRY = 24 * 60 * 60 * 1000;
