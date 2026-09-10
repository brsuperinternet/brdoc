type LabelColor = {
  bg: string;
  fg: string;
  dot: string;
};

const LABEL_PALETTE: Record<string, LabelColor> = {
  amber: { bg: "#fbf0d9", dot: "#d99c1f", fg: "#8a5a00" },
  blue: { bg: "#e6f0ff", dot: "#3b82f6", fg: "#1e4fbf" },
  green: { bg: "#e3f5ea", dot: "#22a05a", fg: "#1f7a47" },
  pink: { bg: "#fce6ee", dot: "#dc6699", fg: "#a8336d" },
  purple: { bg: "#efe9fb", dot: "#8b6bd9", fg: "#5a3aa8" },
  red: { bg: "#fde6e6", dot: "#dc4a4a", fg: "#a02b2b" },
  slate: { bg: "#eef1f5", dot: "#6b7a90", fg: "#3b475a" },
  teal: { bg: "#daf1ee", dot: "#2fa39a", fg: "#1f6f6a" },
};

const PALETTE_KEYS = Object.keys(LABEL_PALETTE);

const DARK_PALETTE: Record<string, LabelColor> = {
  amber: { bg: "#3d2c0e", dot: "#e6b34a", fg: "#f5cf85" },
  blue: { bg: "#152a52", dot: "#5b9aff", fg: "#a9c4ff" },
  green: { bg: "#143b27", dot: "#3ec97c", fg: "#9ce3b8" },
  pink: { bg: "#3c1a2a", dot: "#e07ab0", fg: "#f3a9c9" },
  purple: { bg: "#2a1f4d", dot: "#a48ce6", fg: "#c8b4f4" },
  red: { bg: "#401a1a", dot: "#e26565", fg: "#f1a8a8" },
  slate: { bg: "#2a3140", dot: "#7e8da8", fg: "#c8d3e3" },
  teal: { bg: "#103633", dot: "#48b8af", fg: "#92d5cf" },
};

function hashName(name: string): number {
  // Per-char accumulation with 31. Note: 31 ≡ -1 (mod 8), so the low bits of
  // this hash are highly correlated across short strings — `% 8` would cluster.
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (Math.imul(h, 31) + name.charCodeAt(i)) | 0;
  }
  // Murmur3 fmix32 finalizer — avalanches high bits into low bits so the
  // subsequent `% palette.length` (small power of two) is well-distributed.
  h ^= h >>> 16;
  h = Math.imul(h, 0x85_eb_ca_6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2_b2_ae_35);
  h ^= h >>> 16;
  return h >>> 0;
}

export function getLabelColor(
  name: string,
  scheme: "light" | "dark" = "light"
): LabelColor {
  const key = PALETTE_KEYS[hashName(name) % PALETTE_KEYS.length];
  const palette = scheme === "dark" ? DARK_PALETTE : LABEL_PALETTE;
  return palette[key];
}
