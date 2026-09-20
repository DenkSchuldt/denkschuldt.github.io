# Correcciones de rendimiento — 2026-09-20

Implementación del [análisis del 19 de septiembre](2026-09-19-optimization-audit.md).

## Cambios

- La calidad adaptativa solo muestrea frames consecutivos con demanda continua. Excluye
  pausas, cadencias ambientales, el primer frame al reanudar, calentamiento y pestañas ocultas.
  Acumula tiempo de renderizado activo dentro de una ventana de 30 segundos; las decisiones
  esperan a que termine la transición. La recuperación admite 60 Hz y respeta el DPR nativo.
- A DPR mínimo, una sobrecarga sostenida puede reducir el perfil: Ultra → High → Balanced →
  Mobile → Fallback. Conserva cooldown y calentamiento entre cambios, descarta las muestras
  anteriores y respeta perfiles forzados. Resize no revierte una degradación justificada.
  Los perfiles no vuelven a subir automáticamente durante la sesión; la selección manual
  permite restablecerlos. Antialias y powerPreference del contexto existente siguen siendo
  opciones de creación del renderer: el Canvas permanece vivo.
- About, Polaroid, Projects, Poems y Phone actualizan su transformación al publicarse una
  nueva proyección, sin bucles RAF de seguimiento independientes. La proyección compara
  matrices con almacenamiento reutilizable y conserva la actualización por resize y remontaje.
- El diagnóstico solo se monta cuando está habilitado. El scheduler deja de publicar cambios
  de control y reprogramar timers en cada frame sin expiraciones; suspende timers periódicos
  mientras un propietario continuo ya produce frames.
- ContactShadows reutiliza su resultado en reposo y vuelve a actualizarlo por cambios de recursos,
  viewport, calidad o realidad. Permanece dinámico mientras existen leases continuos para
  cubrir movimientos y fades. Las sombras de luces mantienen su comportamiento original.
- El foco de DOF compara contra el valor efectivo del uniform, eliminando el bloqueo por NaN.
- La polaroid carga una variante de 768 × 1024. El lightbox conserva el original.
- La carga de texturas por lote registra ownership desde cada resolución: libera cargas
  parciales, éxitos tardíos tras fallo y completions posteriores al desmontaje. Los errores de
  inicialización GPU se registran y limpian. Completions canceladas no sobrescriben el estado
  de una carga nueva con el mismo identificador.
- Mixpanel se importa después de que la escena esté lista y haya una oportunidad de ejecución
  ociosa. Los eventos propios esperan en una cola acotada; autocapture comienza al inicializarse.
- El build emite un manifiesto de dependencias estáticas de SceneShell, Experience y efectos.
  El presupuesto verifica el conjunto 3D, además del shell inicial y las miniaturas.

## Resultados cuantificados

| Métrica                                        |  Auditoría |                  Después |
| ---------------------------------------------- | ---------: | -----------------------: |
| JS del conjunto 3D, minificado                 | 2144,0 KiB | aproximadamente 1733 KiB |
| Gzip calculado localmente, por archivo         |  647,0 KiB |  aproximadamente 527 KiB |
| JS del shell inicial                           |  268,0 KiB |                268,0 KiB |
| Textura de polaroid, RGBA8 + mipmaps estimados |   47,7 MiB |                  4,0 MiB |

La disminución del conjunto JS crítico es aproximadamente 19 %. La analítica sigue descargándose
después: esta cifra no representa una reducción equivalente del total transferido durante toda
la visita. La estimación de textura disminuye aproximadamente 92 %; no es una medición de VRAM.

## Validación

- Pruebas de regresión para 15/30 fps intencionales, 60/120 Hz, pausas y visibilidad, downgrade
  a DPR mínimo, cooldown, resize, timers periódicos, revisiones de sombras, ownership de cargas
  fallidas y canceladas, suscripciones de proyección y grafo del presupuesto.
- `npm test`: 117 pruebas, build de 74 rutas y presupuestos aprobados.
- `npm run quality`: formato, ESLint y TypeScript aprobados; ESLint reporta 34 advertencias
  y cero errores.
- Revisión en navegador local de About, apertura/cierre de un certificado, Projects desktop y
  Projects/Phone y entrada directa a Poems con apertura del lector a 390 × 844.
  About mantuvo DPR 1,6 con cero cambios adaptativos mientras solo
  estaba activo el vapor; su proyección dejó de recalcularse al permanecer estable.
- La polaroid, su leyenda y los overlays se comprobaron visualmente. Las pruebas del navegador
  integrado son comprobaciones funcionales en desktop y viewport móvil, no resultados en un
  teléfono físico ni benchmarks de producción.

Se observó una limitación pendiente al cambiar el viewport de desktop a móvil con Poems ya
abierto: la cámara conserva el encuadre anterior hasta recargar o navegar. La entrada directa
en móvil y la apertura del lector funcionan. Las actualizaciones de proyección por resize no
sustituyen el reenfoque responsive del controlador de cámara; ese comportamiento requiere una
corrección adicional y validación de transiciones.

Quedan para una medición con hardware real: FPS/p95/p99 durante recorridos comparables,
autonomía, comportamiento térmico y memoria tras 10–15 minutos. Los intervalos del scheduler
periódico no se interpretan como tiempo de trabajo GPU.
