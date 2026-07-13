-- schema.sql
--
-- Responsable: Persona 1 (Datos)
--
-- Esquema relacional del sistema de recomendación (SQLite).
-- Tablas: artistas, canciones, generos (bridge N:M) y recomendaciones.
-- Poblado por etl/load.py. Ver database/modelo_er.md para el diagrama ER.

PRAGMA foreign_keys = ON;

-- Catálogo de artistas (fuente: artists.csv)
CREATE TABLE IF NOT EXISTS artistas (
    id          TEXT PRIMARY KEY,          -- Spotify ID del artista (22 chars)
    name        TEXT,
    followers   INTEGER,
    popularity  INTEGER,                   -- [0-100] popularidad del artista
    main_genre  TEXT                       -- género principal (Rock, Pop, ...)
);

-- Catálogo de canciones enriquecido (fuente: songs_final.csv + JOIN artistas)
CREATE TABLE IF NOT EXISTS canciones (
    id             TEXT PRIMARY KEY,        -- Spotify ID de la canción (22 chars)
    name           TEXT,
    album_name     TEXT,
    artist_id      TEXT,                    -- FK al artista principal
    danceability   REAL,                    -- [0.0-1.0]
    energy         REAL,                    -- [0.0-1.0]
    key            INTEGER,                 -- [0-11]
    loudness       REAL,                    -- dB [-60.0-0.0]
    mode           INTEGER,                 -- {0,1}
    speechiness    REAL,                    -- [0.0-1.0]
    valence        REAL,                    -- [0.0-1.0] positividad emocional
    genre          TEXT,                    -- género de la canción
    popularity     INTEGER,                 -- [0-100] popularidad de la canción
    danceability_n REAL,                    -- feature normalizada [0-1]
    energy_n       REAL,
    loudness_n     REAL,
    speechiness_n  REAL,
    mood_quadrant  TEXT,                    -- cuadrante de Russell
    FOREIGN KEY (artist_id) REFERENCES artistas (id)
);

-- Relación N:M artista-género (un artista puede tener varios géneros)
CREATE TABLE IF NOT EXISTS generos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    artist_id  TEXT,
    genre      TEXT,
    FOREIGN KEY (artist_id) REFERENCES artistas (id)
);

-- Recomendaciones generadas por el motor (poblada on-demand desde la app)
CREATE TABLE IF NOT EXISTS recomendaciones (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    song_origen_id       TEXT,              -- canción consultada
    song_recomendada_id  TEXT,              -- canción sugerida
    score                REAL,              -- prediction_score [0-1]
    rank                 INTEGER,           -- posición en el Top N (1 = mejor)
    FOREIGN KEY (song_origen_id) REFERENCES canciones (id),
    FOREIGN KEY (song_recomendada_id) REFERENCES canciones (id)
);

-- Índices para acelerar los JOIN y las consultas del motor
CREATE INDEX IF NOT EXISTS idx_canciones_artist ON canciones (artist_id);
CREATE INDEX IF NOT EXISTS idx_canciones_genre  ON canciones (genre);
CREATE INDEX IF NOT EXISTS idx_generos_artist   ON generos (artist_id);
CREATE INDEX IF NOT EXISTS idx_reco_origen      ON recomendaciones (song_origen_id);
