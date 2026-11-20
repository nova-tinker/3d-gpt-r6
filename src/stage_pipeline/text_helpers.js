
// Text helpers available to every module (plain function declarations, hoisted).
// textTextureKit(THREE, text, o) -> THREE.DataTexture with the text in a 5x7 pixel font.
//   o.color (default "#111111"), o.background (default "#ffffff"; null = transparent), o.scale (pixels per font dot, default 4).
// textLabelKit(THREE, text, o) -> a flat plane Mesh facing +Z showing the text; o.height (default 0.1) sets its height and the
//   width follows the text; o.color, o.background, o.scale as above; o.roughness (default 0.8).
// Letters are drawn in upper case. Supported: A-Z 0-9 space . , - : ! / % & + ( ) ' ? # *
function textTextureKit(THREE, text, o) {
  o = o || {};
  const font = {
    "A": "01110100011000111111100011000110001", "B": "11110100011000111110100011000111110",
    "C": "01110100011000010000100001000101110", "D": "11110100011000110001100011000111110",
    "E": "11111100001000011110100001000011111", "F": "11111100001000011110100001000010000",
    "G": "01110100011000010111100011000101111", "H": "10001100011000111111100011000110001",
    "I": "01110001000010000100001000010001110", "J": "00111000100001000010000101001001100",
    "K": "10001100101010011000101001001010001", "L": "10000100001000010000100001000011111",
    "M": "10001110111010110101100011000110001", "N": "10001110011010110011100011000110001",
    "O": "01110100011000110001100011000101110", "P": "11110100011000111110100001000010000",
    "Q": "01110100011000110001101011001001101", "R": "11110100011000111110101001001010001",
    "S": "01111100001000001110000010000111110", "T": "11111001000010000100001000010000100",
    "U": "10001100011000110001100011000101110", "V": "10001100011000110001100010101000100",
    "W": "10001100011000110101101011010101010", "X": "10001100010101000100010101000110001",
    "Y": "10001100010101000100001000010000100", "Z": "11111000010001000100010001000011111",
    "0": "01110100011001110101110011000101110", "1": "00100011000010000100001000010001110",
    "2": "01110100010000100010001000100011111", "3": "11111000100010000010000011000101110",
    "4": "00010001100101010010111110001000010", "5": "11111100001111000001000011000101110",
    "6": "00110010001000011110100011000101110", "7": "11111000010001000100010000100001000",
    "8": "01110100011000101110100011000101110", "9": "01110100011000101111000010001001100",
    " ": "00000000000000000000000000000000000", ".": "00000000000000000000000000110001100",
    ",": "00000000000000000000001100010001000", "-": "00000000000000011111000000000000000",
    ":": "00000011000110000000011000110000000", "!": "00100001000010000100001000000000100",
    "/": "00001000010001000100010001000010000", "%": "11000110010001000100010001001100011",
    "&": "01100100101010001000101011001001101", "+": "00000001000010011111001000010000000",
    "(": "00010001000100001000010000010000010", ")": "01000001000001000010000100010001000",
    "'": "00100001000100000000000000000000000", "?": "01110100010000100010001000000000100",
    "#": "01010010101111101010111110101001010", "*": "00000001001010101110101010010000000"
  };
  const rgb = function (v, fallback) {  // a 0xRRGGBB number or a "#rgb" / "#rrggbb" string, as sRGB bytes
    if (typeof v === "number" && isFinite(v)) return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
    const m = typeof v === "string" ? v.trim().replace("#", "") : "";
    if (/^[0-9a-fA-F]{6}$/.test(m)) return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)];
    if (/^[0-9a-fA-F]{3}$/.test(m)) return [0, 1, 2].map(function (i) { return parseInt(m[i] + m[i], 16); });
    return fallback;
  };
  const ink = rgb(o.color, [17, 17, 17]);
  const paper = o.background === null ? null : rgb(o.background, [255, 255, 255]);
  const sc = Math.max(1, Math.min(8, Math.round(o.scale || 4)));
  const chars = String(text).toUpperCase().split("").map(function (c) { return font[c] ? c : " "; });
  const n = Math.max(1, chars.length);
  const cols = 6 * n + 1, rows = 9;  // one blank dot between letters and around the edge
  const w = cols * sc, h = rows * sc;
  const data = new Uint8Array(w * h * 4);
  const put = function (x, y, c, a) {
    const i = (y * w + x) * 4;
    data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = a;
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (paper) put(x, y, paper, 255); else put(x, y, ink, 0);
  }
  chars.forEach(function (c, k) {
    const g = font[c];
    for (let r = 0; r < 7; r++) for (let q = 0; q < 5; q++) {
      if (g[r * 5 + q] !== "1") continue;
      const x0 = (1 + 6 * k + q) * sc, y0 = (1 + r) * sc;
      for (let dy = 0; dy < sc; dy++) for (let dx = 0; dx < sc; dx++) put(x0 + dx, h - 1 - (y0 + dy), ink, 255);
    }
  });
  const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}
function textLabelKit(THREE, text, o) {
  o = o || {};
  const tex = textTextureKit(THREE, text, o);
  const height = o.height || 0.1;
  const width = height * tex.image.width / tex.image.height;
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: o.roughness === undefined ? 0.8 : o.roughness, metalness: 0,
                                               transparent: o.background === null, side: THREE.DoubleSide });
  return new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
}
