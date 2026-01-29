export class SongBrowserView {
    constructor(container, songService, libraryService, onSelect) {
        this.container = container;
        this.songService = songService;
        this.libraryService = libraryService;
        this.onSelect = onSelect;
        this.currentTab = 'library';
        this.currentFilter = { difficulty: null, category: null };
        this.searchQuery = '';
        this.element = null;
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'modal-overlay';
        this.element.innerHTML = `
            <div class="song-browser">
                <div class="browser-header">
                    <h2>📚 Song Library</h2>
                    <button id="close-browser" class="close-btn">×</button>
                </div>
                
                <div class="browser-tabs">
                    <button class="tab active" data-tab="library">🎵 Library</button>
                    <button class="tab" data-tab="favorites">❤️ Favorites</button>
                    <button class="tab" data-tab="recent">🕐 Recent</button>
                    <button class="tab" data-tab="import">📥 Import MIDI</button>
                </div>
                
                <div class="browser-filters">
                    <select id="filter-difficulty">
                        <option value="">All Difficulties</option>
                        <option value="beginner">Beginner</option>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </select>
                    <select id="filter-category">
                        <option value="">All Categories</option>
                        <option value="classical">Classical</option>
                        <option value="pop">Pop</option>
                        <option value="children">Children</option>
                        <option value="scales">Scales</option>
                        <option value="christmas">Christmas</option>
                    </select>
                </div>
                
                <div class="browser-search">
                    <input type="text" id="search-input" placeholder="🔍 Search songs...">
                </div>
                
                <div class="song-list" id="song-list"></div>
                
                <div class="browser-footer">
                    <span id="song-count">0 songs</span>
                </div>
            </div>
        `;

        this.container.appendChild(this.element);
        this.bindEvents();
        this.loadSongs();
    }

    bindEvents() {
        // Close button
        this.element.querySelector('#close-browser').addEventListener('click', () => this.close());

        // Tab switching
        this.element.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.element.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.currentTab = e.target.dataset.tab;
                this.loadSongs();
            });
        });

        // Filters
        document.getElementById('filter-difficulty').addEventListener('change', (e) => {
            this.currentFilter.difficulty = e.target.value || null;
            this.loadSongs();
        });

        document.getElementById('filter-category').addEventListener('change', (e) => {
            this.currentFilter.category = e.target.value || null;
            this.loadSongs();
        });

        // Search
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.loadSongs();
        });

        // Click outside to close
        this.element.addEventListener('click', (e) => {
            if (e.target === this.element) this.close();
        });
    }

    loadSongs() {
        let songs = [];

        switch (this.currentTab) {
            case 'library':
                songs = this.songService.getAllSongs();
                break;
            case 'favorites':
                const favIds = this.libraryService.getFavorites();
                songs = favIds.map(id => this.songService.getSongById(id)).filter(Boolean);
                break;
            case 'recent':
                const recentIds = this.libraryService.getRecent();
                songs = recentIds.map(id => this.songService.getSongById(id)).filter(Boolean);
                break;
            case 'import':
                this.showImportArea();
                return;
        }

        // Apply filters
        if (this.currentFilter.difficulty) {
            songs = songs.filter(s => s.difficulty === this.currentFilter.difficulty);
        }
        if (this.currentFilter.category) {
            songs = songs.filter(s => s.category === this.currentFilter.category);
        }
        if (this.searchQuery) {
            songs = songs.filter(s =>
                s.title.toLowerCase().includes(this.searchQuery) ||
                s.description?.toLowerCase().includes(this.searchQuery)
            );
        }

        this.renderSongList(songs);
    }

    showImportArea() {
        const list = this.element.querySelector('#song-list');
        list.innerHTML = `
            <div class="import-area">
                <div class="drop-zone" id="midi-drop-zone">
                    <div class="drop-icon">🎹</div>
                    <div class="drop-text">Drag & Drop MIDI File</div>
                    <div class="drop-sub">or click to browse</div>
                    <input type="file" id="midi-file-input" accept=".mid,.midi" style="display: none;">
                </div>
                <div class="import-info">
                    <p>Import MIDI files to create custom lessons</p>
                    <p class="import-tips">💡 Tips: Files will be automatically simplified for learning</p>
                </div>
            </div>
        `;

        this.element.querySelector('#song-count').textContent = 'Import MIDI';

        // Bind drop zone events
        const dropZone = this.element.querySelector('#midi-drop-zone');
        const fileInput = this.element.querySelector('#midi-file-input');

        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
        dropZone.addEventListener('drop', async (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file) await this.handleMidiFile(file);
        });
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) await this.handleMidiFile(file);
        });
    }

    async handleMidiFile(file) {
        console.log('[SongBrowser] 🎵 Processing MIDI file:', file.name);

        if (!file.name.endsWith('.mid') && !file.name.endsWith('.midi')) {
            alert('Please select a valid MIDI file (.mid or .midi)');
            return;
        }

        // Check if MIDI library is loaded
        if (!window.Midi) {
            console.error('[SongBrowser] ❌ MIDI library not loaded');
            alert('MIDI library not loaded. Please refresh the page and try again.');
            return;
        }

        try {
            // Parse MIDI file
            console.log('[SongBrowser] 📖 Parsing MIDI file...');
            const arrayBuffer = await file.arrayBuffer();
            const Midi = window.Midi;
            const midi = new Midi(arrayBuffer);

            const title = midi.name || file.name.replace('.mid', '').replace('.midi', '');
            const bpm = midi.header.tempos[0]?.bpm || 120;

            console.log('[SongBrowser] 📋 Song info:', { title, bpm, tracks: midi.tracks.length });

            // Convert first track to notes
            const leadTrack = midi.tracks[0];
            if (!leadTrack || leadTrack.notes.length === 0) {
                alert('This MIDI file has no notes in the first track.');
                return;
            }

            const notes = leadTrack.notes.map(n => ({
                note: n.name,
                duration: Math.round(n.duration * 100) / 100,
                start: Math.round(n.time * 100) / 100
            }));

            console.log('[SongBrowser] 🎹 Extracted notes:', notes.length);

            const song = {
                id: `midi_${Date.now()}`,
                title: title,
                difficulty: 'medium',
                category: 'imported',
                bpm: Math.round(bpm),
                hands: 'right',
                description: 'Imported MIDI file',
                tracks: [{
                    instrument: 'piano',
                    notes: notes
                }]
            };

            // Save as custom song
            const savedSong = this.libraryService.addCustomSong(song);
            console.log('[SongBrowser] ✅ Song saved:', savedSong.id);

            // Select the song
            this.onSelect(savedSong);
            this.close();
        } catch (err) {
            console.error('[SongBrowser] ❌ Failed to parse MIDI:', err);
            alert('Failed to parse MIDI file: ' + err.message);
        }
    }

    renderSongList(songs) {
        const list = this.element.querySelector('#song-list');
        list.innerHTML = '';

        this.element.querySelector('#song-count').textContent = `${songs.length} songs`;

        if (songs.length === 0) {
            list.innerHTML = `
                <div class="no-songs">
                    <div class="no-songs-icon">🎵</div>
                    <div class="no-songs-text">No songs found</div>
                    <div class="no-songs-hint">Try adjusting your filters or search terms</div>
                </div>
            `;
            return;
        }

        songs.forEach(song => {
            const item = document.createElement('div');
            item.className = 'song-item';

            const isFavorite = this.libraryService.isFavorite(song.id);

            item.innerHTML = `
                <div class="song-info">
                    <div class="song-title">${song.title}</div>
                    <div class="song-meta">
                        <span class="difficulty-badge ${song.difficulty}">${song.difficulty}</span>
                        <span class="category-badge">${song.category}</span>
                        <span>${song.bpm} BPM</span>
                        <span>${song.hands || 'both'} hand</span>
                    </div>
                    <div class="song-description">${song.description || ''}</div>
                </div>
                <div class="song-actions">
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-id="${song.id}">
                        ${isFavorite ? '❤️' : '🤍'}
                    </button>
                    <button class="play-btn">▶</button>
                </div>
            `;

            // Play button
            item.querySelector('.play-btn').addEventListener('click', () => {
                this.libraryService.addToRecent(song.id);
                this.libraryService.incrementPlayCount(song.id);
                this.onSelect(song);
                this.close();
            });

            // Favorite button
            item.querySelector('.favorite-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                const btn = e.target;
                const isNowFavorite = this.libraryService.toggleFavorite(song.id);
                btn.classList.toggle('active');
                btn.textContent = isNowFavorite ? '❤️' : '🤍';
            });

            list.appendChild(item);
        });
    }

    close() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }
}
