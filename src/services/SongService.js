export class SongService {
    constructor() {
        this.songs = [
            {
                id: 'twinkle',
                title: 'Twinkle Twinkle Little Star',
                difficulty: 'Easy',
                bpm: 100,
                tracks: [
                    {
                        instrument: 'piano',
                        notes: [
                            // C C G G A A G
                            { note: 'C4', duration: 1, start: 0 },
                            { note: 'C4', duration: 1, start: 1 },
                            { note: 'G4', duration: 1, start: 2 },
                            { note: 'G4', duration: 1, start: 3 },
                            { note: 'A4', duration: 1, start: 4 },
                            { note: 'A4', duration: 1, start: 5 },
                            { note: 'G4', duration: 2, start: 6 },
                            // F F E E D D C
                            { note: 'F4', duration: 1, start: 8 },
                            { note: 'F4', duration: 1, start: 9 },
                            { note: 'E4', duration: 1, start: 10 },
                            { note: 'E4', duration: 1, start: 11 },
                            { note: 'D4', duration: 1, start: 12 },
                            { note: 'D4', duration: 1, start: 13 },
                            { note: 'C4', duration: 2, start: 14 }
                        ]
                    }
                ]
            },
            {
                id: 'scale_c',
                title: 'C Major Scale',
                difficulty: 'Beginner',
                bpm: 120,
                tracks: [
                    {
                        instrument: 'piano',
                        notes: [
                            { note: 'C4', duration: 1, start: 0 },
                            { note: 'D4', duration: 1, start: 1 },
                            { note: 'E4', duration: 1, start: 2 },
                            { note: 'F4', duration: 1, start: 3 },
                            { note: 'G4', duration: 1, start: 4 },
                            { note: 'A4', duration: 1, start: 5 },
                            { note: 'B4', duration: 1, start: 6 },
                            { note: 'C5', duration: 1, start: 7 }
                        ]
                    }
                ]
            }
        ];
    }

    getAllSongs() {
        return this.songs;
    }

    getSongById(id) {
        return this.songs.find(s => s.id === id);
    }

    search(query) {
        const q = query.toLowerCase();
        return this.songs.filter(s => s.title.toLowerCase().includes(q));
    }
}
