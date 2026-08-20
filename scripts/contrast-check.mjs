const pairs = [
  ["Ink on Ivory", "#10253e", "#fbf8f2"],
  ["White on Ink", "#ffffff", "#10253e"],
  ["Ink on Apricot", "#10253e", "#ef795b"],
  ["Ink on Sage", "#10253e", "#e7f0eb"],
  ["Ink on Sand", "#10253e", "#f4eddd"],
  ["Sage dark on Ivory", "#397563", "#fbf8f2"],
  ["White on Sage dark", "#ffffff", "#397563"],
];
function rgb(hex) { return [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16) / 255); }
function channel(value) { return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4; }
function luminance(hex) { const [r, g, b] = rgb(hex).map(channel); return 0.2126 * r + 0.7152 * g + 0.0722 * b; }
function contrast(foreground, background) { const [a, b] = [luminance(foreground), luminance(background)].sort((x, y) => y - x); return (a + 0.05) / (b + 0.05); }
console.log(JSON.stringify(pairs.map(([name, foreground, background]) => ({ name, foreground, background, ratio: Number(contrast(foreground, background).toFixed(2)), aaNormal: contrast(foreground, background) >= 4.5, aaLarge: contrast(foreground, background) >= 3 })), null, 2));
