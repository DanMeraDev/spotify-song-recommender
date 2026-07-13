# Fórmulas del motor de recomendación

Responsable: Persona 2 (Fórmulas / motor)

El sistema usa **filtrado basado en contenido**. Para una canción de consulta `q`,
cada canción candidata `c` del catálogo recibe un puntaje de afinidad `Score(c)`.
El catálogo se ordena por ese puntaje y se devuelve el Top N (por defecto, 5).

Implementación: `model/recommender.py` (`get_recommendations`) y `model/similarity.py`.

---

## 1. Fórmula global de predicción (Score)

$$
Score(c) = w_1 \cdot Sim_{audio}(c,q) + w_2 \cdot Sim_{mood}(c,q) + w_3 \cdot G\acute{e}nero(c,q) + w_4 \cdot Pop(c)
$$

Con los pesos calibrados (definidos en `WEIGHTS`, deben sumar 1.0):

| Factor | Peso | Símbolo |
|---|---|---|
| Similitud acústica | 0.45 | `w1` |
| Similitud de mood | 0.25 | `w2` |
| Coincidencia de género | 0.20 | `w3` |
| Popularidad | 0.10 | `w4` |

Cada término está acotado en `[0, 1]`, por lo que `Score(c) ∈ [0, 1]`.

---

## 2. Similitud acústica — `w1 ≈ 0.45`

Similitud del **coseno** entre los vectores de audio features de ambas canciones:

$$
Sim_{audio}(c,q) = \cos(\theta) = \frac{A \cdot B}{\lVert A \rVert \, \lVert B \rVert}
$$

donde `A` y `B` son los vectores `[danceability, energy, loudness, speechiness]`
de `c` y `q`.

**Normalización previa (crítica).** `loudness` vive en el rango `[-60, 0]` dB mientras
que las demás features están en `[0, 1]`. Sin normalizar, `loudness` domina la magnitud
del vector y el coseno pierde sentido. Por eso el ETL aplica **min-max** a cada feature
antes de calcular la similitud:

$$
x_{norm} = \frac{x - \min(x)}{\max(x) - \min(x)}
$$

Las columnas normalizadas se almacenan como `danceability_n, energy_n, loudness_n,
speechiness_n` (ver `model/similarity.normalize_minmax` y `etl/transform.py`).

---

## 3. Similitud de mood — `w2 ≈ 0.25`

Se adopta el **Modelo Circumplejo del Afecto de Russell (1980)**: cada canción se
representa por un vector emocional bidimensional

$$
Mood(c) = (Valence(c),\; Energy(c))
$$

- **Valence**: carga emocional positiva/negativa.
- **Energy**: nivel de intensidad o activación.

La proximidad emocional se mide con la **distancia euclidiana** sobre el plano
Valence–Energy. Como ambos ejes están en `[0, 1]`, la distancia máxima posible es `√2`,
por lo que la similitud normalizada es:

$$
Sim_{mood}(c,q) = 1 - \frac{\sqrt{(Valence_c - Valence_q)^2 + (Energy_c - Energy_q)^2}}{\sqrt{2}}
$$

Resultado en `[0, 1]`: 1 = mismo estado emocional, 0 = estados opuestos.
Implementado en `model/similarity.calculate_russell_mood_similarity`.

### Clasificación por cuadrantes (para el dashboard)

A partir de `(Valence, Energy)` con umbral 0.5, cada canción cae en un cuadrante:

| Cuadrante | Condición |
|---|---|
| Enérgico / Festivo | `valence ≥ 0.5` y `energy ≥ 0.5` |
| Intenso / Agresivo | `valence < 0.5` y `energy ≥ 0.5` |
| Relajado / Alegre | `valence ≥ 0.5` y `energy < 0.5` |
| Melancólico | `valence < 0.5` y `energy < 0.5` |

> Nota: la propuesta inicial planteaba un mood lineal escalar
> `Mood = 0.5·energy + 0.3·danceability + 0.2·mode`. Se sustituyó por el modelo de
> Russell porque preserva la independencia de los ejes y da una métrica de similitud
> con sustento académico (ver `Diccionario_Datos_y_Formula_Mood.pdf`).

---

## 4. Coincidencia de género — `w3 ≈ 0.20`

Comparación en tiempo de consulta usando `main_genre` y la lista `genres` del artista
(obtenidas del JOIN canción–artista):

$$
G\acute{e}nero(c,q) =
\begin{cases}
1.0 & \text{si } main\_genre_c = main\_genre_q \\
0.5 & \text{si comparten al menos un subgénero de } genres \\
0.0 & \text{en caso contrario}
\end{cases}
$$

Vectorizado en `recommender.py`: igualdad de `main_genre` (rápida) y, para el resto,
comprobación de solapamiento de subgéneros con `str.contains`.

---

## 5. Popularidad — `w4 ≈ 0.10`

Normalización del campo `popularity [0-100]` del artista (de `artists.csv`):

$$
Pop(c) = \frac{popularity_{artista}}{100}
$$

**Modo descubrimiento** (opcional): invierte el factor a `1 - Pop(c)` para sugerir
canciones menos conocidas (`discovery=True`).

---

## 6. Salida

Se excluye la canción de entrada, se ordena el catálogo por `Score` de forma
descendente y se devuelve el **Top N**. El motor también devuelve el desglose por
factor (`sim_audio, sim_mood, sim_genre, sim_pop`) para explicar visualmente en el
dashboard por qué se recomendó cada canción.
