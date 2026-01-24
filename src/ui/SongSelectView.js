export class SongSelectView {
    constructor(container, songService, onSelect) {
        this.container = container; // Parent container (e.g. document.body)
        this.songService = songService;
        this.onSelect = onSelect;
        this.element = null;
    }

    render() {
        if (this.element) return; // Already open

        this.element = document.createElement('div');
        this.element.className = 'modal-overlay';
        this.element.innerHTML = `
            <div class="modal-glass">
                <div class="modal-header">
                    <h2>Select a Song</h2>
                    <button id="close-modal">×</button>
                </div>
                <div class="search-bar">
                    <input type="text" id="song-search-input" placeholder="Search songs...">
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
