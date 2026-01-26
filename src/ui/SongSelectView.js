export class SongSelectView {
    constructor(container, songService, midiService, onSelect) {
        this.container = container;
        this.songService = songService;
        this.midiService = midiService;
        this.onSelect = onSelect;
        this.element = null;
    }

    render() {
        if (this.element) return;

        this.element = document.createElement('div');
        this.element.className = 'modal-overlay';
        this.element.innerHTML = `
            <div class="modal-glass">
                <div class="modal-header">
                    <h2>Select a Song</h2>
                    <button id="close-modal">×</button>
                </div>

                <!-- MIDI Drop Zone -->
                <div id="midi-drop-zone" class="drop-zone">
                    <div class="drop-icon">📁</div>
                    <div class="drop-text">Drag & Drop .mid file here</div>
                    <div class="drop-sub">to instantly create a lesson</div>
                </div>

                <div class="search-bar">
                    <input type="text" id="song-search-input" placeholder="Search curated songs...">
                </div>
                <div class="song-list" id="song-list">
                    <!-- Songs will be injected here -->
                </div>
            </div>
        `;

        this.container.appendChild(this.element);

        // Bind Events
        this.element.querySelector('#close-modal').addEventListener('click', () => this.close());
        this.element.querySelector('#song-search-input').addEventListener('input', (e) => this.filterSongs(e.target.value));

        // MIDI Drop Handlers
        const dropZone = this.element.querySelector('#midi-drop-zone');
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
        dropZone.addEventListener('drop', async (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');

            const file = e.dataTransfer.files[0];
            if (file && (file.name.endsWith('.mid') || file.name.endsWith('.midi'))) {
                try {
                    const song = await this.midiService.parseMidiFile(file);
                    this.onSelect(song);
                    this.close();
                } catch (err) {
                    console.error('Failed to parse MIDI', err);
                    alert('Error parsing MIDI file. Please try another one.');
                }
            } else {
                alert('Please drop a valid .mid or .midi file.');
            }
        });

        // Initial Render
        this.filterSongs('');
    }

    filterSongs(query) {
        const list = this.element.querySelector('#song-list');
        list.innerHTML = '';

        const songs = this.songService.search(query);

        if (songs.length === 0) {
            list.innerHTML = '<div class="no-results">No songs found</div>';
            return;
        }

        songs.forEach(song => {
            const item = document.createElement('div');
            item.className = 'song-item';
            item.innerHTML = `
                <div class="song-info">
                    <div class="song-title">${song.title}</div>
                    <div class="song-meta">${song.difficulty} • ${song.bpm} BPM</div>
                </div>
                <button class="play-btn">Play</button>
            `;

            item.querySelector('.play-btn').addEventListener('click', () => {
                this.onSelect(song);
                this.close();
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
