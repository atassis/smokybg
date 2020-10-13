class SmokeNiceBG {
  x0: number;

  y0: number;

  x1: number;

  y1: number;

  rad0: number;

  rad1: number;

  colorStops: { ratio: number, r: number, g: number, b: number }[] = [];

  constructor(_x0: number, _y0: number, _rad0: number, _x1: number, _y1: number, _rad1: number) {
    this.x0 = _x0;
    this.y0 = _y0;
    this.x1 = _x1;
    this.y1 = _y1;
    this.rad0 = _rad0;
    this.rad1 = _rad1;
  }

  addColorStop(ratio: number, r: number, g: number, b: number) {
    if (ratio < 0 || ratio > 1) {
      return;
    }
    const newStop = { ratio, r, g, b };
    if (ratio >= 0 && ratio <= 1) {
      if (this.colorStops.length === 0) {
        this.colorStops.push(newStop);
      } else {
        let i = 0;
        let found = false;
        const len = this.colorStops.length;
        // search for proper place to put stop in order.
        while (!found && i < len) {
          found = ratio <= this.colorStops[i].ratio;
          if (!found) {
            i += 1;
          }
        }
        // add stop - remove next one if duplicate ratio
        if (!found) {
          // place at end
          this.colorStops.push(newStop);
        } else if (ratio === this.colorStops[i].ratio) {
          // replace
          this.colorStops.splice(i, 1, newStop);
        } else {
          this.colorStops.splice(i, 0, newStop);
        }
      }
    }
  }

  fillRect(ctx: CanvasRenderingContext2D, rectX0: number, rectY0: number, rectW: number, rectH: number) {
    if (this.colorStops.length === 0) {
      return;
    }

    const image = ctx.getImageData(rectX0, rectY0, rectW, rectH);
    const pixelData = image.data;
    let nearestValue;
    let quantError;
    let x;
    let y;

    let ratio;

    let r;
    let g;
    let b;
    let ratio0;
    let ratio1;
    let stopNumber;
    let found;
    let q;

    const rBuffer = [];
    const gBuffer = [];
    const bBuffer = [];

    let c;
    let discrim;
    let dx;
    let dy;

    const xDiff = this.x1 - this.x0;
    const yDiff = this.y1 - this.y0;
    const rDiff = this.rad1 - this.rad0;
    const rConst1 = 2 * this.rad0 * (this.rad1 - this.rad0);
    const r0Square = this.rad0 * this.rad0;
    const a = rDiff * rDiff - xDiff * xDiff - yDiff * yDiff;

    // first complete color stops with 0 and 1 ratios if not already present
    if (this.colorStops[0].ratio !== 0) {
      this.colorStops.splice(0, 0, {
        ratio: 0,
        r: this.colorStops[0].r,
        g: this.colorStops[0].g,
        b: this.colorStops[0].b,
      });
    }
    if (this.colorStops[this.colorStops.length - 1].ratio !== 1) {
      this.colorStops.push({
        ratio: 1,
        r: this.colorStops[this.colorStops.length - 1].r,
        g: this.colorStops[this.colorStops.length - 1].g,
        b: this.colorStops[this.colorStops.length - 1].b,
      });
    }

    // create float valued gradient
    for (let i = 0; i < pixelData.length / 4; i += 1) {
      x = rectX0 + (i % rectW);
      y = rectY0 + Math.floor(i / rectW);

      dx = x - this.x0;
      dy = y - this.y0;
      b = rConst1 + 2 * (dx * xDiff + dy * yDiff);
      c = r0Square - dx * dx - dy * dy;
      discrim = b * b - 4 * a * c;

      if (discrim >= 0) {
        ratio = (-b + Math.sqrt(discrim)) / (2 * a);

        if (ratio < 0) {
          ratio = 0;
        } else if (ratio > 1) {
          ratio = 1;
        }

        // find out what two stops this is between
        if (ratio === 1) {
          stopNumber = this.colorStops.length - 1;
        } else {
          stopNumber = 0;
          found = false;
          while (!found) {
            found = ratio < this.colorStops[stopNumber].ratio;
            if (!found) {
              stopNumber += 1;
            }
          }
        }

        // calculate color.
        const r0 = this.colorStops[stopNumber - 1].r;
        const g0 = this.colorStops[stopNumber - 1].g;
        const b0 = this.colorStops[stopNumber - 1].b;
        const r1 = this.colorStops[stopNumber].r;
        const g1 = this.colorStops[stopNumber].g;
        const b1 = this.colorStops[stopNumber].b;
        ratio0 = this.colorStops[stopNumber - 1].ratio;
        ratio1 = this.colorStops[stopNumber].ratio;

        const f = (ratio - ratio0) / (ratio1 - ratio0);
        r = r0 + (r1 - r0) * f;
        g = g0 + (g1 - g0) * f;
        b = b0 + (b1 - b0) * f;
      }

      // set color as float values in buffer arrays
      rBuffer.push(r);
      gBuffer.push(g);
      bBuffer.push(b);
    }

    // While converting floats to integer valued color values, apply Floyd-Steinberg dither.
    for (let i = 0; i < pixelData.length / 4; i += 1) {
      /* @ts-ignore */
      nearestValue = ~~rBuffer[i];
      /* @ts-ignore */
      quantError = rBuffer[i] - nearestValue;
      /* @ts-ignore */
      rBuffer[i + 1] += (7 / 16) * quantError;
      /* @ts-ignore */
      rBuffer[i - 1 + rectW] += (3 / 16) * quantError;
      /* @ts-ignore */
      rBuffer[i + rectW] += (5 / 16) * quantError;
      /* @ts-ignore */
      rBuffer[i + 1 + rectW] += (1 / 16) * quantError;

      /* @ts-ignore */
      nearestValue = ~~gBuffer[i];
      /* @ts-ignore */
      quantError = gBuffer[i] - nearestValue;
      /* @ts-ignore */
      gBuffer[i + 1] += (7 / 16) * quantError;
      /* @ts-ignore */
      gBuffer[i - 1 + rectW] += (3 / 16) * quantError;
      /* @ts-ignore */
      gBuffer[i + rectW] += (5 / 16) * quantError;
      /* @ts-ignore */
      gBuffer[i + 1 + rectW] += (1 / 16) * quantError;

      /* @ts-ignore end */
      nearestValue = ~~bBuffer[i];
      quantError = bBuffer[i] - nearestValue;
      bBuffer[i + 1] += (7 / 16) * quantError;
      bBuffer[i - 1 + rectW] += (3 / 16) * quantError;
      bBuffer[i + rectW] += (5 / 16) * quantError;
      bBuffer[i + 1 + rectW] += (1 / 16) * quantError;
    }

    // copy to pixel data
    for (let i = 0; i < pixelData.length; i += 4) {
      q = i / 4;
      /* @ts-ignore */
      pixelData[i] = ~~rBuffer[q];
      /* @ts-ignore */
      pixelData[i + 1] = ~~gBuffer[q];
      pixelData[i + 2] = ~~bBuffer[q];
      pixelData[i + 3] = 255;
    }

    ctx.putImageData(image, rectX0, rectY0);
  }
}
export { SmokeNiceBG }
