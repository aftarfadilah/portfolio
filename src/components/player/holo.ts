// Additive holographic sheen laid over the record. The overlay does not spin with
// the disc, so the light wedges stay put like real vinyl sheen; the pointer and
// the view angle shift the rainbow.
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
uniform float uLabel;
uniform float uIntensity;
varying vec2 vPos;
varying vec3 vWorld;

vec3 palette(float t) {
  return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67)));
}

void main() {
  float r = length(vPos) / uRadius;
  float a = atan(vPos.y, vPos.x);
  vec3 V = normalize(cameraPosition - vWorld);
  float la = atan(uLight.y, uLight.x);

  float wedge = pow(max(0.0, cos(2.0 * (a - la))), 6.0);
  float wedge2 = pow(max(0.0, cos(2.0 * (a - la - 1.1))), 14.0) * 0.5;
  float fine = 0.65 + 0.35 * sin(r * 260.0);

  float hue = r * 2.2 + V.x * 0.6 + V.z * 0.4 + wedge * 0.35 + uTime * 0.03;
  vec3 col = mix(vec3(0.8), palette(hue), 0.75);

  float grooves = smoothstep(uLabel - 0.01, uLabel + 0.02, r) * (1.0 - smoothstep(0.985, 1.0, r));
  float label = (1.0 - smoothstep(uLabel - 0.01, uLabel + 0.02, r)) * step(0.05, r);

  float k = (0.025 + 0.5 * (wedge + wedge2)) * fine * grooves
          + label * (0.02 + 0.12 * wedge);
  k *= uIntensity;

  gl_FragColor = vec4(col, k);
  #include <colorspace_fragment>
}
`;
