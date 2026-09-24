# Análisis: camino hacia un workspace hiperrealista

## Alcance

Este documento analiza el estado actual del render 3D del portfolio y propone una hoja de ruta
priorizada para acercarlo al fotorrealismo. No modifica código. Todas las propuestas respetan los
invariantes de `AGENTS.md`: un único `<Canvas>` persistente, render en modo _demand_, navegación
agnóstica del renderer, propiedad explícita de recursos y los presupuestos de
`scripts/check-performance-budget.mjs`.

## Diagnóstico del estado actual

| Área                   | Estado actual                                                                                                                                                                  | Impacto en realismo |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------- |
| Iluminación de entorno | Sin mapa de entorno (`RENDERING_INTENT.environment.intensity: 0`). Solo `hemisphereLight`.                                                                                     | **Crítico**         |
| Luces directas         | 1 `directionalLight` (sol), 1 `pointLight` de relleno, luz de lectura del portfolio. La lámpara solo se aproxima con un `pointLight` omnidireccional sin sombra (`desk-fill`). | Alto                |
| Iluminación global     | Ninguna: sin rebote de luz, sin _color bleeding_, sin lightmaps horneados.                                                                                                     | **Crítico**         |
| Materiales             | 46 `meshStandardMaterial` con color plano; 1 `meshPhysicalMaterial`. Sin mapas de albedo/normal/roughness salvo un grano de pared procedural.                                  | Alto                |
| Geometría              | Procedural (`RoundedBox`, cilindros de 8–16 segmentos). Solo el mini-proyector es un modelo GLB.                                                                               | Medio               |
| Tone mapping           | `ACESFilmicToneMapping`, exposición 0.82.                                                                                                                                      | Medio               |
| Sombras                | PCF (`shadows="percentage"`), radio fijo, más contact shadows cacheadas.                                                                                                       | Medio               |
| Anti-aliasing          | `EffectComposer multisampling={0}`: con post-procesado activo, el `antialias` del contexto WebGL no se aplica y no hay SMAA/FXAA.                                              | Medio               |
| Post-procesado         | N8AO, DOF, Bloom, Hue/Saturation, Vignette. Buena base.                                                                                                                        | Bajo (ya existe)    |
| Niebla                 | `fog` lineal de 7 a `s.fog` dentro de una habitación cerrada.                                                                                                                  | Bajo                |

### Hallazgos concretos

1. **Los metales se ven negros o plásticos.** `PALETTE.metal` es `#111111` con `metalness` 0.65–0.8.
   Un metal PBR no tiene color difuso: todo su aspecto viene de lo que refleja. Sin mapa de entorno
   no refleja nada, por eso el latón de la lámpara, el aluminio del laptop y la base de la silla
   pierden lectura material.
2. **El perfil de calidad declara una luz de escritorio que no existe.** `profiles.ts` define
   `deskSpotEnabled` / `deskSpotMapSize` y `qualitySelection.ts` deriva `deskShadow`, pero ningún
   componente renderiza un `spotLight`. La lámpara se reduce a un emisivo más el `pointLight`
   `desk-fill` (omnidireccional, sin sombra, intensidad `desk * 0.24`), cuando es precisamente la
   luz direccional y "cinematográfica" de la escena.
3. **Albedos demasiado oscuros.** Suelo `#29231d`, madera `#38261b`, borde `#211712`. En un flujo PBR
   con iluminación real, los albedos físicos rara vez bajan de ~0.04 lineal (≈ `#3a3a3a` sRGB para
   materiales no carbonizados). Los valores actuales compensan la falta de luz ambiental y producen
   el aspecto "turbio" que el test de `DARK_REGION_LUMINANCE_FLOOR` intenta vigilar.
4. **La habitación no tiene rebote.** Una pared clara (`#ebeced`) junto a un suelo de madera debería
   teñir de cálido las zonas bajas y aclarar las sombras. Sin GI, las sombras son del mismo tono frío
   del hemisferio.
5. **Facetado visible en primeros planos.** Los cilindros de la lámpara (8–16 segmentos) y las formas
   con `curveSegments` bajos se notan en los planos cercanos (`Folder`, `Desk`).

## Hoja de ruta priorizada

Las fases están ordenadas por relación impacto/coste. Cada fase es entregable por separado.

### Fase 1 — Luz y respuesta de materiales (alto impacto, bajo coste)

1. **Iluminación basada en imagen (IBL).**
   - Generar un mapa de entorno una sola vez con PMREM: bien un HDRI interior CC0 de 1K (Poly Haven)
     o un entorno sintético con `<Environment frames={1}>` + `Lightformer` (ventana, lámpara, techo).
   - Asignar `scene.environment` con `environmentIntensity` ajustable; no usarlo como fondo.
   - Encaja con el modo _demand_: se calcula una vez y no exige frames continuos.
   - Registrar la textura en el working set (`OwnedTexture` / `ResourceBoundary`) para que tenga
     propietario y `dispose` explícitos.
   - En la realidad `blueprint`, reducir o anular la intensidad del entorno.
2. **Luz real de la lámpara.** Sustituir o complementar `desk-fill` con un `spotLight` en la cabeza de la lámpara, con `decay={2}`,
   `penumbra` alta, temperatura ~2700 K y sombra gobernada por `features.deskShadow` y
   `profile.shadows.deskSpotMapSize`, que ya existen. Mantener el emisivo del difusor con intensidad
   > 1 para que el Bloom solo actúe sobre la bombilla.
3. **Tone mapping.** Evaluar `AgXToneMapping` y `NeutralToneMapping` (disponibles en Three r185)
   frente a ACES. AgX conserva mejor el color en altas luces cálidas (lámpara, pantalla). Reajustar
   la exposición y re-ejecutar el control de luminancia de zonas oscuras.
4. **Anti-aliasing con post-procesado.** Activar `multisampling={4}` en los perfiles `ultra`/`high`
   o añadir un efecto SMAA para `balanced`/`mobile`. Los bordes dentados delatan el render más que
   casi cualquier otra cosa.
5. **Recalibrar materiales a valores físicos.**
   - Metales: `metalness: 1`, color = reflectancia real (aluminio `#d6d6d6`, latón `#c9a36b`,
     acero `#a8a8a8`), `roughness` 0.25–0.45.
   - Dieléctricos: albedo sRGB entre `#3a3a3a` y `#f0f0f0` según el material.
   - `meshPhysicalMaterial` con `clearcoat` para madera barnizada y cerámica, `sheen` para la tela
     de la silla y el cuero del portfolio.
6. **Eliminar o suavizar la niebla lineal.** En un interior no hay niebla; si se quiere profundidad
   atmosférica, es mejor un gradiente muy sutil en el fondo o un _height fog_ mínimo.

### Fase 2 — Superficies con textura (alto impacto, coste medio)

1. **Sets PBR para las superficies grandes:** suelo de madera, tablero del escritorio, pared de yeso,
   tela de la silla, cuero. Albedo + normal + ORM (oclusión/rugosidad/metalicidad empaquetados).
   Fuentes CC0: Poly Haven, ambientCG.
2. **Formato:** KTX2/Basis (UASTC para normales, ETC1S para albedo) con `KTX2Loader`. Reduce VRAM
   de 4 a 8 veces frente a JPG/PNG y evita picos de decodificación en móvil.
3. **Resolución por perfil:** 2K en `ultra`, 1K en `high`/`balanced`, 512 en `mobile`; `fallback`
   sin mapas. Seleccionarlo desde el perfil de calidad, no desde los componentes.
4. **Micro-detalle:** variación de rugosidad (huellas en la pantalla del laptop, desgaste en los
   bordes del escritorio, polvo en la estantería). Es lo que separa "bien iluminado" de "real".
5. **Presupuesto:** ampliar `check-performance-budget.mjs` con un límite de peso para `public/textures`
   y un recuento de texturas por perfil.
6. **Compatibilidad con `blueprint`:** `RealityRuntimeBridge` ya suprime `normalMap`,
   `roughnessMap`, `metalnessMap` y `aoMap`; habrá que añadir `lightMap` si se adopta la Fase 3.

### Fase 3 — Iluminación global horneada (el mayor salto, coste alto)

La escena es estática y se renderiza bajo demanda: es el caso ideal para hornear la luz.

1. **Opción A — Blender + Cycles (máxima calidad).**
   - Exportar la arquitectura y el mobiliario estático a Blender, hornear lightmaps (GI + AO) en un
     segundo canal UV y reimportar como GLB con Meshopt/Draco + lightmaps KTX2.
   - Los objetos móviles o interactivos (laptop abierto, portfolio, taza, teléfono) mantienen luz en
     tiempo real y sombras dinámicas.
   - Coste: mover parte de la geometría procedural a un pipeline de assets y fijar posiciones que hoy
     se ajustan con Leva (`laptopPosition`, `plantPosition`, etc.). Requiere decidir qué objetos se
     "congelan".
2. **Opción B — Horneado en el navegador al cargar.** Un lightmap progresivo (en la línea del
   ejemplo `ProgressiveLightMap` de Three) o `AccumulativeShadows` de drei que acumula N frames una
   sola vez y después queda cacheado. Mantiene la geometría procedural, pero alarga el tiempo de
   entrada y no aporta GI real, solo sombras suaves.
3. **Recomendación:** Opción A para la arquitectura (suelo, paredes, estantería, escritorio) y
   dejar dinámico todo lo que es navegable o animado. Es el cambio que más acerca la escena a
   "fotografía".

### Fase 4 — Geometría de héroe (impacto medio, coste medio-alto)

1. Sustituir por modelos GLB los objetos que la cámara encuadra de cerca: laptop, silla, lámpara,
   planta y taza. El mini-proyector (`useGLTF`) ya es el precedente del patrón.
2. Mientras tanto, subir los segmentos radiales de los cilindros visibles en planos cercanos a
   24–32 y usar `curveSegments` más altos en `useMacBookShellGeometry`.
3. Planta: las hojas procedurales son el objeto más "sintético" de la escena. Un modelo con
   _alpha-tested_ leaves y `transmission`/`thickness` falsos en las hojas mejora mucho la lectura.

### Fase 5 — Óptica de cámara (acabado, coste bajo)

1. **Grano de película** (`Noise` con `premultiply`, opacidad ~0.03–0.05): enmascara el banding en
   las zonas oscuras y aporta textura fotográfica.
2. **Aberración cromática** muy sutil y solo en los bordes; distorsión de lente mínima.
3. **Gradación con LUT** (`LUT3DEffect` con un `.cube`) en lugar de solo `HueSaturation`, para un
   look consistente y editable fuera del código.
4. **DOF físico:** derivar `focalLength` y `bokehScale` de una distancia focal y un número f
   simulados por plano (`shotRegistry`), en vez de valores globales por perfil.
5. **Bloom solo en HDR:** con emisivos > 1 y `luminanceThreshold` ≈ 1, el bloom afecta a la bombilla
   y la pantalla, no a la pared clara.
6. **Micro-movimiento de cámara** (respiración de cámara en mano) solo durante transiciones o
   planos activos, respetando `reducedMotion` y sin romper el modo _demand_.

## Riesgos y restricciones

- **Rendimiento móvil.** El perfil `mobile` ya desactiva AO, DOF y contact shadows. IBL y lightmaps
  horneados son baratos en GPU (una lectura de textura), por eso son preferibles a más luces
  dinámicas o SSR. Evitar reflejos en espacio de pantalla y sombras PCSS en `mobile`.
- **Presupuesto de JS.** `KTX2Loader` y el transcoder Basis (WASM) deben cargarse bajo demanda con
  la escena, no en el bundle inicial (límite de 350 KiB).
- **Modo demand.** Nada de lo propuesto requiere render continuo. El horneado en navegador (Opción B)
  sí necesita una ráfaga de frames acotada, que debe pedirse con `renderDemand.acquireFor`.
- **Realidades.** Toda textura o luz nueva debe comportarse correctamente en `blueprint`.
- **Regresiones visuales.** Antes de empezar, capturar una referencia por plano (`Opening`,
  `Projects`, `Desk`, `Folder`, `Wall`, `Drawer`, móvil y escritorio) con Playwright para comparar
  antes/después en cada fase.

## Siguiente paso sugerido

Implementar la Fase 1 en una rama propia: IBL + `spotLight` de la lámpara + recalibración de metales

- AA con post-procesado. Es un cambio acotado a `Lighting.tsx`, `profiles.ts`,
  `CinematicEffects.tsx`, `DeskObjects.tsx` y `renderingIntent.ts`, sin tocar navegación ni
  arquitectura, y probablemente aporte la mitad de la mejora percibida.
