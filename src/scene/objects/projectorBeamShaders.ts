const FRUSTUM_CHUNK = /* glsl */ `
  uniform vec3 uApex[4];
  uniform vec3 uBase[4];

  vec3 bilerpCorners(vec3 corners[4], vec2 uv) {
    vec3 top = mix(corners[0], corners[1], uv.x);
    vec3 bottom = mix(corners[3], corners[2], uv.x);
    return mix(bottom, top, uv.y);
  }

  vec3 frustumPoint(vec2 uv, float along) {
    return mix(bilerpCorners(uApex, uv), bilerpCorners(uBase, uv), along);
  }
`;

export const BEAM_VERTEX_SHADER = /* glsl */ `
  ${FRUSTUM_CHUNK}
  varying float vAlong;
  varying vec3 vWorldPosition;

  void main() {
    vec3 worldPosition = frustumPoint(position.xy, position.z);
    vAlong = position.z;
    vWorldPosition = worldPosition;
    gl_Position = projectionMatrix * viewMatrix * vec4(worldPosition, 1.0);
  }
`;

export const BEAM_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uHotColor;
  uniform vec3 uFarColor;
  varying float vAlong;
  varying vec3 vWorldPosition;

  float hash(vec3 point) {
    point = fract(point * 0.3183099 + 0.1);
    point *= 17.0;
    return fract(point.x * point.y * point.z * (point.x + point.y + point.z));
  }

  float valueNoise(vec3 point) {
    vec3 cell = floor(point);
    vec3 local = fract(point);
    local = local * local * (3.0 - 2.0 * local);
    return mix(
      mix(
        mix(hash(cell), hash(cell + vec3(1.0, 0.0, 0.0)), local.x),
        mix(hash(cell + vec3(0.0, 1.0, 0.0)), hash(cell + vec3(1.0, 1.0, 0.0)), local.x),
        local.y
      ),
      mix(
        mix(hash(cell + vec3(0.0, 0.0, 1.0)), hash(cell + vec3(1.0, 0.0, 1.0)), local.x),
        mix(hash(cell + vec3(0.0, 1.0, 1.0)), hash(cell + vec3(1.0, 1.0, 1.0)), local.x),
        local.y
      ),
      local.z
    );
  }

  void main() {
    vec3 normal = normalize(cross(dFdx(vWorldPosition), dFdy(vWorldPosition)));
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float facing = abs(dot(normal, viewDirection));
    float thickness = mix(0.18, 1.0, smoothstep(0.0, 0.6, facing));
    float lensFade = smoothstep(0.0, 0.035, vAlong);
    float falloff = pow(1.0 - vAlong, 1.7) * 0.82 + 0.18;

    vec3 drift = vec3(0.0, uTime * 0.07, uTime * 0.025);
    float haze = valueNoise(vWorldPosition * 2.6 + drift) * 0.65
      + valueNoise(vWorldPosition * 6.1 - drift * 1.7) * 0.35;
    float hazeShape = 0.55 + 0.8 * haze;

    float alpha = uOpacity * 0.17 * lensFade * falloff * hazeShape * thickness;
    vec3 color = mix(uHotColor, uFarColor, smoothstep(0.0, 0.7, vAlong));
    gl_FragColor = vec4(color, alpha);
  }
`;

export const MOTE_VERTEX_SHADER = /* glsl */ `
  ${FRUSTUM_CHUNK}
  uniform float uTime;
  uniform float uScale;
  attribute vec4 aSeed;
  varying float vAlpha;

  void main() {
    float phase = aSeed.w * 6.2831853;
    float along = pow(fract(aSeed.z + uTime * (0.006 + aSeed.w * 0.01)), 0.62);
    vec2 sway = vec2(
      sin(uTime * (0.21 + aSeed.w * 0.17) + phase),
      cos(uTime * (0.17 + aSeed.w * 0.13) + phase * 1.3)
    ) * 0.05;
    vec2 uv = clamp(aSeed.xy + sway, 0.0, 1.0);
    vec3 worldPosition = frustumPoint(uv, along);
    vec4 viewPosition = viewMatrix * vec4(worldPosition, 1.0);
    gl_Position = projectionMatrix * viewPosition;

    vec2 centered = abs(uv * 2.0 - 1.0);
    float insideBeam = (1.0 - smoothstep(0.7, 1.0, centered.x)) *
      (1.0 - smoothstep(0.7, 1.0, centered.y));
    float alongFade = smoothstep(0.02, 0.1, along) * smoothstep(1.0, 0.86, along);
    float glint = pow(0.5 + 0.5 * sin(uTime * (1.2 + aSeed.w * 2.6) + phase * 7.0), 6.0);
    float lit = pow(1.0 - along, 1.1) * 0.75 + 0.25;
    vAlpha = insideBeam * alongFade * lit * (0.28 + glint * 0.72);
    gl_PointSize = (0.006 + aSeed.w * 0.007) * uScale / max(0.05, -viewPosition.z);
  }
`;

export const MOTE_FRAGMENT_SHADER = /* glsl */ `
  uniform float uOpacity;
  uniform vec3 uHotColor;
  varying float vAlpha;

  void main() {
    float distanceFromCenter = length(gl_PointCoord - 0.5);
    float disc = smoothstep(0.5, 0.0, distanceFromCenter);
    gl_FragColor = vec4(uHotColor, disc * disc * vAlpha * uOpacity * 0.85);
  }
`;

export const WALL_POOL_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const WALL_POOL_FRAGMENT_SHADER = /* glsl */ `
  uniform float uOpacity;
  uniform float uSpill;
  uniform vec3 uColor;
  varying vec2 vUv;

  void main() {
    vec2 centered = abs(vUv * 2.0 - 1.0) * uSpill;
    vec2 outside = max(centered - 1.0, 0.0) / (uSpill - 1.0);
    float halo = 1.0 - smoothstep(0.0, 1.0, length(outside));
    vec2 coreEdges = smoothstep(1.0, 0.985, centered);
    float core = coreEdges.x * coreEdges.y;
    float centerWeight = 1.0 - 0.25 * dot(centered, centered) / 2.0;
    float intensity = core * 0.085 * centerWeight + halo * halo * 0.035;
    gl_FragColor = vec4(uColor, intensity * uOpacity);
  }
`;
