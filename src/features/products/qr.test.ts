import { expect, test } from "bun:test";
import jsQR from "jsqr";
import { encode } from "uqr";

/** The customer's QR (uqr) must be readable by the staff's scanner (jsqr). */
test("a reservation code survives being drawn and read back", () => {
  const code = `${"a1b2c3d4e5f6a7b8c9d0e1f2"}.${"Zm9vYmFyYmF6cXV4MTIzNA"}`;
  const { data, size } = encode(code, { ecc: "M", border: 2 });
  const scale = 8;
  const width = size * scale;
  const pixels = new Uint8ClampedArray(width * width * 4);
  for (let y = 0; y < width; y++) {
    for (let x = 0; x < width; x++) {
      const dark = data[Math.floor(y / scale)]?.[Math.floor(x / scale)];
      const at = (y * width + x) * 4;
      const value = dark ? 0 : 255;
      pixels.set([value, value, value, 255], at);
    }
  }
  expect(jsQR(pixels, width, width)?.data).toBe(code);
});
