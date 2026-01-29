export class SongLibraryService {
    constructor(songService) {
        this.songService = songService;
        this.STORAGE_KEYS = {
            FAVORITES: 'keyboard_favorites',
            CUSTOM: 'keyboard_custom_songs',
            RECENT: 'keyboard_recent_songs',
            PROGRESS: 'keyboard_progress'
        };
    }

    // Favorites Management
    getFavorites() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.FAVORITES) || '[]');
        } catch (e) {
            console.error('Error reading favorites:', e);
            return [];
        }
    }

    saveFavoriteSong(songId) {
        const favorites = this.getFavorites();
        if (!favorites.includes(songId)) {
            favorites.push(songId);
            localStorage.setItem(this.STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
            return true;
        }
        return false;
    }

    removeFavoriteSong(songId) {
        const favorites = this.getFavorites().filter(id => id !== songId);
        localStorage.setItem(this.STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    }

    isFavorite(songId) {
        return this.getFavorites().includes(songId);
    }

    toggleFavorite(songId) {
        if (this.isFavorite(songId)) {
            this.removeFavoriteSong(songId);
            return false;
        } else {
            this.saveFavoriteSong(songId);
            return true;
        }
    }

    // Custom Songs Management
    getCustomSongs() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.CUSTOM) || '[]');
        } catch (e) {
            console.error('Error reading custom songs:', e);
            return [];
        }
    }

    addCustomSong(song) {
        const customSongs = this.getCustomSongs();
        song.id = `custom_${Date.now()}`;
        song.isCustom = true;
        song.createdAt = new Date().toISOString();
        customSongs.push(song);
        localStorage.setItem(this.STORAGE_KEYS.CUSTOM, JSON.stringify(customSongs));
        return song;
    }

    deleteCustomSong(songId) {
        if (!songId.startsWith('custom_')) return false;
        const customSongs = this.getCustomSongs().filter(s => s.id !== songId);
        localStorage.setItem(this.STORAGE_KEYS.CUSTOM, JSON.stringify(customSongs));
        return true;
    }

    // Recent Songs Management
    getRecent() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.RECENT) || '[]');
        } catch (e) {
            console.error('Error reading recent songs:', e);
            return [];
        }
    }

    addToRecent(songId) {
        const recent = this.getRecent();
        // Remove if already exists
        const filtered = recent.filter(id => id !== songId);
        // Add to front
        filtered.unshift(songId);
        // Keep only last 10
        const trimmed = filtered.slice(0, 10);
        localStorage.setItem(this.STORAGE_KEYS.RECENT, JSON.stringify(trimmed));
    }

    getRecentSongs() {
        const recentIds = this.getRecent();
        return recentIds
            .map(id => this.songService.getSongById(id))
            .filter(Boolean);
    }

    // Progress Tracking
    getAllProgress() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.PROGRESS) || '{}');
        } catch (e) {
            console.error('Error reading progress:', e);
            return {};
        }
    }

    saveSongProgress(songId, progress) {
        const allProgress = this.getAllProgress();
        allProgress[songId] = {
            ...progress,
            lastPlayed: new Date().toISOString()
        };
        localStorage.setItem(this.STORAGE_KEYS.PROGRESS, JSON.stringify(allProgress));
    }

    getSongProgress(songId) {
        const allProgress = this.getAllProgress();
        return allProgress[songId] || null;
    }

    updateSongProgress(songId, updates) {
        const current = this.getSongProgress(songId) || {};
        this.saveSongProgress(songId, { ...current, ...updates });
    }

    incrementPlayCount(songId) {
        const progress = this.getSongProgress(songId) || {};
        const newCount = (progress.playCount || 0) + 1;
        this.updateSongProgress(songId, { playCount: newCount });
    }

    // Statistics
    getStats() {
        const progress = this.getAllProgress();
        const favorites = this.getFavorites();
        const customSongs = this.getCustomSongs();
        const recent = this.getRecent();

        let totalPlayTime = 0;
        let totalNotesPlayed = 0;

        Object.values(progress).forEach(p => {
            totalPlayTime += p.totalPlayTime || 0;
            totalNotesPlayed += p.totalNotesPlayed || 0;
        });

        return {
            favoriteCount: favorites.length,
            customSongCount: customSongs.length,
            recentSongCount: recent.length,
            totalSongsPlayed: Object.keys(progress).length,
            totalPlayTime: totalPlayTime,
            totalNotesPlayed: totalNotesPlayed
        };
    }

    // Export/Import
    exportLibrary() {
        return {
            favorites: this.getFavorites(),
            customSongs: this.getCustomSongs(),
            progress: this.getAllProgress(),
            exportedAt: new Date().toISOString()
        };
    }

    importLibrary(data) {
        if (data.favorites) {
            localStorage.setItem(this.STORAGE_KEYS.FAVORITES, JSON.stringify(data.favorites));
        }
        if (data.customSongs) {
            localStorage.setItem(this.STORAGE_KEYS.CUSTOM, JSON.stringify(data.customSongs));
        }
        if (data.progress) {
            localStorage.setItem(this.STORAGE_KEYS.PROGRESS, JSON.stringify(data.progress));
        }
    }

    clearAllData() {
        Object.values(this.STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    }
}
