// Holographic foil laid over the record label (the YouTube thumbnail) only; the
// vinyl itself stays plain. The overlay does not spin with the disc, so the
// glint stays put like light on a real foil sticker while the label turns
// beneath it. The pointer and the view angle shift the rainbow.
export const holoVertex = /* glsl */ `
varying vec2 vPos;
varying vec3 vWorld;
void main() {
  vPos = position.xz;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

export const holoFragment = /* glsl */ `
uniform float uTime;
uniform vec2 uLight;
uniform float uRadius;
uniform float uIntensity;
varying vec2 vPos;
varying vec3 vWorld;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

vec3 palette(float t) {
  return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67)));
}

void main() {
  vec2 p = vPos / uRadius;
  float r = length(p);
  vec3 V = normalize(cameraPosition - vWorld);

  float band = dot(p, uLight);
  float sweep = sin(uTime * 0.5) * 0.5;
  float glint = pow(max(0.0, 1.0 - abs(band - sweep) * 1.6), 3.0);

  float hue = band * 0.8 + V.x * 0.7 + V.z * 0.5 + uTime * 0.04;
  vec3 col = mix(vec3(0.85), palette(hue), 0.8);

  float grain = hash(floor(vPos * 90.0) + floor(uTime * 3.0));
  float sparkle = step(0.985, grain) * 0.6;
  float edge = 1.0 - smoothstep(0.96, 1.0, r);

  float k = (0.05 + 0.34 * glint + sparkle * 0.7) * edge * uIntensity;
  gl_FragColor = vec4(col, k);
  #include <colorspace_fragment>
}
`;
