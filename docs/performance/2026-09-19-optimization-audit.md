# Auditoría de fluidez desktop y móvil

Fecha: 2026-09-19. Código analizado: `68c5998`, rama `optimizacion/codigo`.
Alcance: análisis y comprobaciones; no se modificó el comportamiento de la aplicación.

La arquitectura ya tiene una buena base: Canvas persistente, renderizado bajo demanda,
perfiles gráficos, recursos por destino y miniaturas. Las primeras mejoras deben corregir
trabajo innecesario y decisiones de calidad antes de reducir globalmente la fidelidad visual.

## Evidencia y límites

- `npm test`: build de producción correcto, 74 rutas generadas y **104 pruebas aprobadas**.
- Presupuesto existente aprobado: **268,0 KiB de JS inicial** y **496,4 KiB de miniaturas**.
- Inspección de código, dependencias instaladas, archivos del build y dimensiones de imágenes.
- Reproducción determinista de decisiones adaptativas importando el controlador TypeScript real.
- Comprobación local en navegador integrado, en desarrollo: About a 1280 × 720 y a
  390 × 844 con `perfProfile=mobile`. La segunda comprueba tamaño y perfil, no hardware móvil.
- No se realizó un benchmark de producción, una traza GPU ni una sesión sostenida en teléfonos
  físicos. No se afirman mejoras porcentuales de FPS, autonomía ni ausencia de fugas.
- Las mediciones de julio en esta carpeta son históricas. No describen el rendimiento actual.

## Hallazgos priorizados

### 1. Alta: el sistema adaptativo confunde ahorro de frames con bajo rendimiento

`QualityRuntimeBridge.tsx:60–99` introduce todos los intervalos de `useFrame` en la ventana de
calidad. No distingue espera intencional del scheduler y tiempo de trabajo. La cámara solicita
30 fps (`CameraRig.tsx:163`) y el vapor 15 fps (`DeskObjects.tsx:1021`). Ambos intervalos superan
los umbrales del controlador aunque el renderer termine rápidamente.

Reproducción con `evaluateAdaptiveDpr`, sin GPU:

| Perfil | Entrada sintética          | DPR inicial | Resultado                              |
| ------ | -------------------------- | ----------: | -------------------------------------- |
| Ultra  | 4 s a 30 fps intencionales |         1,6 | Baja a 1,4 por `sustained-poor-frames` |
| Mobile | 4 s a 30 fps intencionales |        1,25 | Baja a 1 por la misma razón            |
| Ultra  | 20 s a 60 fps estables     |           1 | No recupera resolución                 |

La tercera fila se explica por `adaptiveController.ts:55–58`: Ultra exige un p95 inferior a
14,6696 ms, equivalente a más de 68 fps. Una pantalla estable de 60 Hz no satisface esa condición.

La comprobación local de About mostró Ultra en modo periódico, solo vapor activo, dos reducciones
de DPR y resolución actual 1,25. Esto es consistente con el defecto reproducido; los intervalos
de unos 75 ms del panel no son una medición del coste GPU.

**Acción:** etiquetar muestras según la cadencia solicitada; excluir espera y primer frame tras
reposo; calibrar la recuperación a la frecuencia real de pantalla. Separar recolección de datos
durante transiciones de la decisión de aplicar cambios, que puede esperar a un punto estable.
Actualmente se omite la decisión durante transiciones, pero sus muestras permanecen en la ventana.

**Verificación:** pruebas con reposo real, 15/30 fps intencionales, pantallas 60/120 Hz y carga
continua lenta. El reposo no debe provocar degradación; una carga lenta real sí.

### 2. Alta para móvil: la foto de la polaroid usa una textura excesiva

`DeskObjects.tsx:769` carga `/me.jpeg?polaroid=1` como textura. El archivo mide **2653 × 3538**.
En RGBA8 con mipmaps completos equivale aproximadamente a **47,7 MiB** de almacenamiento de
textura, aunque su JPEG ocupa mucho menos en disco. Es una estimación de formato, no VRAM medida;
no incluye copia decodificada del navegador ni diferencias del driver.

**Acción:** generar una variante dedicada para el objeto 3D, por ejemplo 768 × 1024, y conservar
el original para `PhotoLightbox.tsx:76`. Esa variante requeriría aproximadamente **4 MiB** bajo
los mismos supuestos. Validar nitidez en el encuadre más cercano antes de fijar tamaño definitivo.
Convertir a WebP sin reducir dimensiones mejora transferencia, pero no reduce por sí solo esta
memoria decodificada.

También conviene dimensionar `wall/arrival.jpg` (1920 × 1200) según su máximo tamaño proyectado.
La imagen de poema `2024-05-10/image.webp` mide 2985 × 2985 y ocupa alrededor de 1,1 MiB en disco;
pertenece al lector HTML con carga diferida y no debe contarse como textura inicial del mundo.

### 3. Media-alta: los overlays siguen trabajando cuando la proyección no cambia

About, PolaroidCaption, Projects, Poems y Phone mantienen su propio `requestAnimationFrame`.
Cada iteración resuelve una homografía y escribe estilos, aunque el Canvas no haya publicado una
proyección nueva. About mantiene dos de estos bucles a la vez.

Referencias: `AboutOverlay.tsx:49–72`, `PolaroidCaptionOverlay.tsx:23–45`,
`ProjectsOverlay.tsx:112–121`, `PoemsOverlay.tsx:60–69`, `PhoneOverlay.tsx:243–252`.
`homography.ts` crea arrays y una matriz 8 × 8 en cada cálculo.

**Acción:** publicar una revisión o evento al cambiar la proyección y actualizar el DOM una vez
por cambio; evitar escrituras idénticas. Mantener el seguimiento durante navegación y resize,
sin introducir estado React por frame. Medir CPU y asignaciones para cuantificar el beneficio.

### 4. Media: el diagnóstico oculto recibe actualizaciones en producción

`Experience.tsx:896` monta `PerformanceOverlay` siempre. Sus hooks se suscriben a snapshots
completos antes del retorno que lo oculta (`PerformanceDiagnostics.tsx:157–187`). El scheduler
publica desde `frame()` y desde `expire() → commit()` en cada frame, aunque no venza ningún lease
(`renderSchedulerStore.ts:128–158`). Esto genera notificaciones y trabajo React evitable.

**Acción:** condicionar el montaje del componente con suscripciones a diagnóstico habilitado;
separar métricas de los cambios de control y no hacer `commit` cuando nada expiró. No asumir una
cantidad exacta de commits React: React puede agrupar notificaciones.

### 5. Alta como límite de protección: Auto solo reduce DPR

La selección inicial elige Ultra para el desktop habitual, sin una medición de potencia GPU
(`qualitySelection.ts:57–86`). Después `evaluateAdaptiveDpr` cambia únicamente DPR. Cuando llega
a 1, un dispositivo que siga sobrecargado conserva AO, DOF, bloom y sombras del perfil original.
El perfil Mobile ya elimina AO, DOF, sombras de contacto y sombra del foco: conviene conservarlo.

**Acción:** después de corregir la medición, permitir una degradación gradual de efectos/perfil
si persiste la sobrecarga a DPR mínimo. Aplicarla con histéresis y en momentos estables para evitar
saltos visuales. Evaluar Balanced como arranque conservador del desktop desconocido; no imponerlo
sin comparar calidad y tiempo hasta la primera interacción.

### 6. Media: sombras estáticas se recalculan con las animaciones ambientales

`Lighting.tsx:72–80` usa `ContactShadows` sin límite de frames. En la versión instalada de Drei,
`frames` vale `Infinity` por defecto (`core/ContactShadows.js:9,76`). Cada frame solicitado por
vapor o movimiento de cámara vuelve a ejecutar ese trabajo, aunque los objetos que proyectan
la sombra no hayan cambiado. El perfil móvil ya desactiva esta técnica.

**Acción:** reutilizar sombras para escenas estáticas y actualizarlas cuando cambien luces,
geometría, recursos o estado del cajón. No fijar simplemente `frames={1}`: puede congelar una
sombra incompleta antes de que carguen los objetos. Comparar ContactShadows y sombras de luces
por separado; no atribuirles los porcentajes de mejora de la auditoría histórica.

### 7. Media: el presupuesto inicial no cubre la carga necesaria para entrar al 3D

`scripts/check-performance-budget.mjs:5–13` solo suma JS referenciado desde el HTML. `SceneShell`
monta inmediatamente el componente lazy Experience; sus dependencias llegan después y quedan
fuera del presupuesto actual.

| Conjunto del build                                   | JS minificado sin comprimir |                 Gzip local estimado |
| ---------------------------------------------------- | --------------------------: | ----------------------------------: |
| HTML inicial, presupuesto actual                     |                   268,0 KiB | No calculado como conjunto separado |
| SceneShell + Experience y dependencias de su preload |                  1915,8 KiB |                           551,2 KiB |
| Conjunto anterior + CinematicEffects                 |                  2144,0 KiB |                           647,0 KiB |

Los conjuntos son acumulativos; no deben sumarse entre sí. Excluyen imágenes, fuentes, GLB y
otros overlays. Gzip se calculó por archivo con Node, no es transferencia HTTP observada.
Los mayores chunks son CameraRig (882,1 KiB), Experience (707,4 KiB) y CinematicEffects
(228,2 KiB); el nombre de un chunk no atribuye todo ese peso a ese componente.

**Acción:** conservar el presupuesto del shell y añadir otro para «3D listo», con waterfall,
CPU de parseo/evaluación y tiempo hasta aceptar navegación. Examinar la importación síncrona de
Mixpanel y las dependencias incluidas antes de dividir más módulos. El fraccionamiento por sí
solo no reduce los bytes si todos los chunks se necesitan inmediatamente.

### 8. Secundarios: ownership y calidad visual

- `useOwnedTextures` registra los recursos en `owned` solo después de que todo `Promise.all`
  termine (`OwnedTexture.tsx:115–163`). Si una imagen falla, las que sí cargaron no pasan por el
  `dispose` previsto. Registrar ownership por carga y limpiar también completions tardías tras
  fallo. No se ha demostrado crecimiento de VRAM: ese camino todavía no ejecuta `initTexture`.
- `CinematicEffects.tsx:57,80` inicializa `lastFocus` con NaN y compara su diferencia con un
  epsilon. Esa condición nunca es verdadera; el foco dinámico no se actualiza por ese camino.
  Corregirlo antes de evaluar si DOF merece su coste visual/GPU.
- El GLB del proyector tiene 544,0 KiB, 27 primitivas y 5836 triángulos. Es candidato secundario
  a combinar primitivas compatibles, no evidencia de que la geometría sea el cuello principal.

## Orden recomendado y criterios de aceptación

1. Corregir medición/adaptación y retirar suscripciones de diagnóstico de producción.
2. Crear la variante de la foto 3D y detener cálculos de overlays sin cambios.
3. Medir producción y ajustar sombras, efectos y límites por dispositivo con esa evidencia.
4. Ampliar presupuestos, validar ownership y realizar recorridos sostenidos.

Validar desktop con GPU integrada y dedicada, Android de gama media e iPhone/Safari; incluir
orientación vertical/horizontal. Ejecutar tres recorridos en frío y caliente por Opening →
About → Certificates → Projects → Wall → Phone → Poems, foco de certificados y lector.

Objetivos propuestos, aún no resultados: 60 fps durante movimiento cuando el dispositivo lo
permita; modo estable de 30 fps en equipos limitados; cero trabajo de proyección si no cambia;
cero frames WebGL tras asentarse cuando no exista una animación declarada. Separar intervalos
intencionales de 15/30 fps de frames perdidos. Registrar p95/p99 y tareas largas, primera llegada,
revisitas, tiempo «3D listo», recursos residentes y evolución tras 10–15 minutos. Verificar también
teclado, navegación atrás, reduced motion y lectura de texto al reducir resolución.

El renderizado bajo demanda y la reducción de draw calls están alineados con la
[guía oficial de rendimiento de React Three Fiber](https://r3f.docs.pmnd.rs/advanced/scaling-performance).
La prioridad concreta de este informe proviene del código y las comprobaciones locales anteriores.
