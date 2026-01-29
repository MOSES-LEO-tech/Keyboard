export class SongService {
    constructor() {
        this.songs = [
            // Beginner - Single hand, slow tempo
            {
                id: 'twinkle',
                title: 'Twinkle Twinkle Little Star',
                difficulty: 'beginner',
                category: 'children',
                bpm: 80,
                hands: 'right',
                description: 'A classic children\'s song, perfect for beginners',
                tracks: [
                    {
                        instrument: 'piano',
                        notes: [
                            { note: 'C4', duration: 1, start: 0 },
                            { note: 'C4', duration: 1, start: 1 },
                            { note: 'G4', duration: 1, start: 2 },
                            { note: 'G4', duration: 1, start: 3 },
                            { note: 'A4', duration: 1, start: 4 },
                            { note: 'A4', duration: 1, start: 5 },
                            { note: 'G4', duration: 2, start: 6 },
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
                id: 'hot_cross_buns',
                title: 'Hot Cross Buns',
                difficulty: 'beginner',
                category: 'children',
                bpm: 100,
                hands: 'right',
                description: 'A fun, simple melody for first-time learners',
                tracks: [
                    {
                        instrument: 'piano',
                        notes: [
                            { note: 'E4', duration: 1, start: 0 },
                            { note: 'E4', duration: 1, start: 1 },
                            { note: 'D4', duration: 1, start: 2 },
                            { note: 'D4', duration: 1, start: 3 },
                            { note: 'C4', duration: 2, start: 4 },
                            { note: 'D4', duration: 1, start: 6 },
                            { note: 'D4', duration: 1, start: 7 },
                            { note: 'E4', duration: 1, start: 8 },
                            { note: 'E4', duration: 1, start: 9 },
                            { note: 'E4', duration: 1.5, start: 10 },
                            { note: 'D4', duration: 0.5, start: 11.5 },
                            { note: 'D4', duration: 2, start: 12 },
                            { note: 'C4', duration: 2, start: 14 }
                        ]
                    }
                ]
            },
            {
                id: 'mary_had_lamb',
                title: 'Mary Had a Little Lamb',
                difficulty: 'beginner',
                category: 'children',
                bpm: 90,
                hands: 'right',
                description: 'A gentle melody using only white keys',
                tracks: [
                    {
                        instrument: 'piano',
                        notes: [
                            { note: 'E4', duration: 1, start: 0 },
                            { note: 'D4', duration: 1, start: 1 },
                            { note: 'C4', duration: 1, start: 2 },
                            { note: 'D4', duration: 1, start: 3 },
                            { note: 'E4', duration: 1, start: 4 },
                            { note: 'E4', duration: 1, start: 5 },
                            { note: 'E4', duration: 2, start: 6 },
                            { note: 'D4', duration: 1, start: 8 },
                            { note: 'D4', duration: 1, start: 9 },
                            { note: 'D4', duration: 2, start: 10 },
                            { note: 'E4', duration: 1, start: 12 },
                            { note: 'G4', duration: 1, start: 13 },
                            { note: 'G4', duration: 2, start: 14 }
                        ]
                    }
                ]
            },
            {
                id: 'scale_c',
                title: 'C Major Scale',
                difficulty: 'beginner',
                category: 'scales',
                bpm: 80,
                hands: 'both',
                description: 'Learn the fundamental C Major scale',
                tracks: [
                    {
                        instrument: 'piano',
                        notes: [
                            { note: 'C4', duration: 0.5, start: 0 },
                            { note: 'D4', duration: 0.5, start: 0.5 },
                            { note: 'E4', duration: 0.5, start: 1 },
                            { note: 'F4', duration: 0.5, start: 1.5 },
                            { note: 'G4', duration: 0.5, start: 2 },
                            { note: 'A4', duration: 0.5, start: 2.5 },
                            { note: 'B4', duration: 0.5, start: 3 },
                            { note: 'C5', duration: 0.5, start: 3.5 }
                        ]
                    }
                ]
            },

            // Easy - Both hands, simple melodies
            {
                id: 'ode_to_joy',
                title: 'Ode to Joy',
                difficulty: 'easy',
                category: 'classical',
                bpm: 100,
                hands: 'both',
                description: 'Beethoven\'s famous theme, beginner-friendly',
                tracks: [
                    {
                        instrument: 'piano',
                        notes: [
                            { note: 'E4', duration: 1, start: 0 },
                            { note: 'E4', duration: 1, start: 1 },
                            { note: 'F4', duration: 1, start: 2 },
                            { note: 'G4', duration: 1, start: 3 },
                            { note: 'G4', duration: 1, start: 4 },
                            { note: 'F4', duration: 1, start: 5 },
                            { note: 'E4', duration: 1, start: 6 },
                            { note: 'D4', duration: 1, start: 7 },
                            { note: 'C4', duration: 1, start: 8 },
                            { note: 'C4', duration: 1, start: 9 },
                            { note: 'D4', duration: 1, start: 10 },
                            { note: 'E4', duration: 1, start: 11 },
                            { note: 'E4', duration: 1.5, start: 12 },
                            { note: 'D4', duration: 0.5, start: 13.5 },
                            { note: 'D4', duration: 2, start: 14 }
                        ]
                    }
                ]
            },
            {
                id: 'fur_elise_simple',
                title: 'Für Elise (Simplified)',
                difficulty: 'easy',
                category: 'classical',
                bpm: 100,
                hands: 'right',
                description: 'The famous opening of Für Elise, simplified',
                tracks: [
                    {
                        instrument: 'piano',
                        notes: [
                            { note: 'E5', duration: 0.5, start: 0 },
                            { note: 'D#5', duration: 0.5, start: 0.5 },
                            { note: 'E5', duration: 0.5, start: 1 },
                            { note: 'D#5', duration: 0.5, start: 1.5 },
                            { note: 'E5', duration: 0.5, start: 2 },
                            { note: 'B4', duration: 0.5, start: 2.5 },
                            { note: 'D5', duration: 0.5, start: 3 },
                            { note: 'C5', duration: 0.5, start: 3.5 },
                            { note: 'A4', duration: 1, start: 4 },
                            { note: 'C4', duration: 0.5, start: 5 },
                            { note: 'E4', duration: 0.5, start: 5.5 },
                            { note: 'A4', duration: 0.5, start: 6 },
                            { note: 'B4', duration: 0.5, start: 6.5 }
                        ]
                    }
                ]
            },

            // Medium - With more complex patterns
            {
                id: 'canon_main_melody',
                title: 'Canon in D (Main Melody)',
                difficulty: 'medium',
                category: 'classical',
                bpm: 80,
                hands: 'right',
                description: 'Pachelbel\'s Canon main melody',
                tracks: [
                    {
                        instrument: 'piano',
                        notes: [
                            { note: 'D4', duration: 2, start: 0 },
                            { note: 'A3', duration: 2, start: 2 },
                            { note: 'B3', duration: 1, start: 4 },
                            { note: 'C4', duration: 1, start: 5 },
                            { note: 'D4', duration: 2, start: 6 },
                            { note: 'A3', duration: 2, start: 8 },
                            { note: 'F#3', duration: 2, start: 10 },
                            { note: 'D3', duration: 2, start: 12 },
                            { note: 'G3', duration: 2, start: 14 },
                            { note: 'F#3', duration: 2, start: 16 }
                        ]
                    }
                ]
            },
            {
                id: 'river_flows_simplified',
                title: 'River Flows in You (Simplified)',
                difficulty: 'medium',
                category: 'pop',
                bpm: 70,
                hands: 'right',
                description: 'Yiruma\'s beautiful piece, simplified version',
                tracks: [
                    {
                        instrument: 'piano',
                        notes: [
                            { note: 'A4', duration: 1.5, start: 0 },
                            { note: 'C5', duration: 0.5, start: 1.5 },
                            { note: 'B4', duration: 1, start: 2 },
                            { note: 'G4', duration: 2, start: 3 },
                            { note: 'A4', duration: 1.5, start: 5 },
                            { note: 'C5', duration: 0.5, start: 6.5 },
                            { note: 'B4', duration: 0.5, start: 7 },
                            { note: 'A4', duration: 0.5, start: 7.5 },
                            { note: 'G4', duration: 0.5, start: 8 },
                            { note: 'A4', duration: 0.5, start: 8.5 },
                            { note: 'B4', duration: 0.5, start: 9 },
                            { note: 'F#4', duration: 2, start: 9.5 }
                        ]
                    }
                ]
            },

            // Hard - Full arrangements
            {
                id: 'moonlight_sonata_1',
                title: 'Moonlight Sonata 1st Movement',
                difficulty: 'hard',
                category: 'classical',
                bpm: 60,
                hands: 'both',
                description: 'Beethoven\'s famous sonata, iconic opening',
                tracks: [
                    {
                        instrument: 'piano',
                        notes: [
                            { note: 'C#4', duration: 4, start: 0 },
                            { note: 'C#4', duration: 4, start: 4 },
                            { note: 'C#4', duration: 2, start: 8 },
                            { note: 'D#4', duration: 2, start: 10 },
                            { note: 'F#4', duration: 2, start: 12 },
                            { note: 'F#4', duration: 2, start: 14 },
                            { note: 'F#4', duration: 1, start: 16 },
                            { note: 'E#4', duration: 1, start: 17 },
                            { note: 'F#4', duration: 4, start: 18 }
                        ]
                    }
                ]
            },

            // Scales and exercises
            {
                id: 'chromatic_scale',
                title: 'Chromatic Scale',
                difficulty: 'easy',
                category: 'scales',
                bpm: 100,
                hands: 'both',
                description: 'Practice all 12 notes with this chromatic scale',
                tracks: [
                    {
                        instrument: 'piano',
                        notes: [
                            { note: 'C4', duration: 0.5, start: 0 },
                            { note: 'C#4', duration: 0.5, start: 0.5 },
                            { note: 'D4', duration: 0.5, start: 1 },
                            { note: 'D#4', duration: 0.5, start: 1.5 },
                            { note: 'E4', duration: 0.5, start: 2 },
                            { note: 'F4', duration: 0.5, start: 2.5 },
                            { note: 'F#4', duration: 0.5, start: 3 },
                            { note: 'G4', duration: 0.5, start: 3.5 },
                            { note: 'G#4', duration: 0.5, start: 4 },
                            { note: 'A4', duration: 0.5, start: 4.5 },
                            { note: 'A#4', duration: 0.5, start: 5 },
                            { note: 'B4', duration: 0.5, start: 5.5 },
                            { note: 'C5', duration: 0.5, start: 6 }
                        ]
                    }
                ]
            },
            {
                id: 'g_major_scale',
                title: 'G Major Scale',
                difficulty: 'beginner',
                category: 'scales',
                bpm: 80,
                hands: 'right',
                description: 'Learn the G Major scale with F#',
                tracks: [
                    {
                        instrument: 'piano',
                        notes: [
                            { note: 'G4', duration: 0.5, start: 0 },
                            { note: 'A4', duration: 0.5, start: 0.5 },
                            { note: 'B4', duration: 0.5, start: 1 },
                            { note: 'C5', duration: 0.5, start: 1.5 },
                            { note: 'D5', duration: 0.5, start: 2 },
                            { note: 'E5', duration: 0.5, start: 2.5 },
                            { note: 'F#5', duration: 0.5, start: 3 },
                            { note: 'G5', duration: 0.5, start: 3.5 }
                        ]
                    }
                ]
            },

            // Christmas songs
            {
                id: 'jingle_bells',
                title: 'Jingle Bells',
                difficulty: 'easy',
                category: 'christmas',
                bpm: 120,
                hands: 'right',
                description: 'Classic holiday tune',
                tracks: [
                    {
                        instrument: 'piano',
                        notes: [
                            { note: 'E4', duration: 0.5, start: 0 },
                            { note: 'E4', duration: 0.5, start: 0.5 },
                            { note: 'E4', duration: 1, start: 1 },
                            { note: 'E4', duration: 0.5, start: 2 },
                            { note: 'E4', duration: 0.5, start: 2.5 },
                            { note: 'E4', duration: 1, start: 3 },
                            { note: 'G4', duration: 0.5, start: 4 },
                            { note: 'C5', duration: 0.5, start: 4.5 },
                            { note: 'D4', duration: 0.5, start: 5 },
                            { note: 'E4', duration: 2, start: 5.5 }
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
        return this.songs.filter(s =>
            s.title.toLowerCase().includes(q) ||
            s.category.toLowerCase().includes(q) ||
            s.difficulty.toLowerCase().includes(q)
        );
    }

    getByDifficulty(difficulty) {
        return this.songs.filter(s => s.difficulty === difficulty);
    }

    getByCategory(category) {
        return this.songs.filter(s => s.category === category);
    }
}
