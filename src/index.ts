import { SmokeNiceBG } from "./smoky-background";

function getElementHeight(element: Element) {
  return Number.parseFloat(
    getComputedStyle(element, null).height.replace('px', ''),
  );
}

function getGradientStart(rawHex: string): [number, number, number] {
  const hex = rawHex.replace('#', '');

  const r0 = Number.parseInt(hex.substring(0, 2), 16);
  const g0 = Number.parseInt(hex.substring(2, 4), 16);
  const b0 = Number.parseInt(hex.substring(4, 6), 16);
  return [r0, g0, b0];
}

function hexToRGBA(hex: string, opacity: number): string {
  return `rgba(${getGradientStart(hex).join(',')},${opacity})`;
}

const TWO_PI = 2 * Math.PI;
let timer: number;

type SmokeSettings = {
  gradientStart: string;
  gradientEnd: string;
  smokeOpacity: number;
  numCircles: number;
  maxMaxRad: number;
  minMaxRad: number;
  minRadFactor: number;
  iterations: number;
  drawsPerFrame: number;
  lineWidth: number;
  speed: number;
  bgColorInner: string;
  bgColorOuter: string;
};

interface Point {
  x: number;
  y: number;
  next?: Point;
}

export type ISmokeSettings = Partial<SmokeSettings> & {
  maxMaxRad: 'auto' | number;
  minMaxRad: 'auto' | number;
};

function setLinePoints(iterations: number) {
  const firstPoint: Point = { x: 0, y: 1 };
  const lastPoint: Point = { x: 1, y: 1 };
  let minY = 1;
  let maxY = 1;
  let point;
  let nextPoint;
  let dx;
  let newX;
  let newY;

  firstPoint.next = lastPoint;
  for (let i = 0; i < iterations; i += 1) {
    point = firstPoint;
    while (point.next) {
      nextPoint = point.next;

      dx = nextPoint.x - point.x;
      newX = 0.5 * (point.x + nextPoint.x);
      newY = 0.5 * (point.y + nextPoint.y);
      newY += dx * (Math.random() * 2 - 1);

      const newPoint: Point = { x: newX, y: newY };

      // min, max
      if (newY < minY) {
        minY = newY;
      } else if (newY > maxY) {
        maxY = newY;
      }

      // put between points
      newPoint.next = nextPoint;
      point.next = newPoint;

      point = nextPoint;
    }
  }

  // normalize to values between 0 and 1
  if (maxY !== minY) {
    const normalizeRate = 1 / (maxY - minY);
    point = firstPoint;
    while (point) {
      point.y = normalizeRate * (point.y - minY);
      point = point.next;
    }
  }
  // unlikely that max = min, but could happen if using zero iterations. In this case, set all points equal to 1.
  else {
    point = firstPoint;
    while (point) {
      point.y = 1;
      point = point.next;
    }
  }

  return firstPoint;
}

class Smoke {
  private settings: SmokeSettings;

  element: Element;

  displayCanvas: HTMLCanvasElement | null;

  exportCanvas: HTMLCanvasElement;

  // eslint-disable-next-line react/static-property-placement
  context: CanvasRenderingContext2D | null;

  exportContext: CanvasRenderingContext2D | null;

  displayWidth?: number;

  displayHeight?: number;

  constructor(element: Element, options: ISmokeSettings) {
    this.element = element;
    this.settings = {
      gradientStart: '#000000',
      gradientEnd: '#222222',
      smokeOpacity: 0.1,
      numCircles: 1,
      minRadFactor: 0,
      iterations: 8,
      drawsPerFrame: 10,
      lineWidth: 2,
      speed: 1,
      bgColorInner: '#ffffff',
      bgColorOuter: '#666666',
      ...options,
    };
    const radius = (getElementHeight(this.element) * 0.8) / 2;
    if (this.settings.maxMaxRad === 'auto' || !this.settings.maxMaxRad) {
      this.settings.maxMaxRad = radius;
    }
    if (this.settings.minMaxRad === 'auto' || !this.settings.minMaxRad) {
      this.settings.minMaxRad = radius;
    }
    this.initCanvas();
    this.generate();
  }

  initCanvas() {
    this.displayCanvas = this.element.querySelector('canvas');
    this.displayWidth = this.element.clientWidth;
    this.displayHeight = this.element.clientHeight;
    this.displayCanvas.width = this.displayWidth;
    this.displayCanvas.height = this.displayHeight;
    this.context = this.displayCanvas.getContext('2d');
  }

  generate() {
    this.drawCount = 0;
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.clearRect(0, 0, this.displayWidth, this.displayHeight);
    this.fillBackground();

    this.setCircles();

    if (timer) {
      clearInterval(timer);
    }
    timer = setInterval(this.onTimer.bind(this), this.settings.speed);
  }

  fillBackground() {
    const outerRad =
      Math.sqrt(
        this.displayWidth * this.displayWidth +
        this.displayHeight * this.displayHeight,
      ) / 2;
    const gradient = new SmokeNiceBG(
      this.displayWidth * 0.75,
      (this.displayHeight / 2) * 0.75,
      0,
      this.displayWidth / 2,
      this.displayHeight / 4,
      outerRad,
    );

    gradient.addColorStop(0, ...getGradientStart(this.settings.bgColorInner));
    gradient.addColorStop(1, ...getGradientStart(this.settings.bgColorOuter));
    gradient.fillRect(
      this.context,
      0,
      0,
      this.displayWidth,
      this.displayHeight,
    );
  }

  setCircles() {
    let maxR;
    let minR;

    this.circles = [];

    for (let i = 0; i < this.settings.numCircles; i += 1) {
      maxR =
        this.settings.minMaxRad +
        Math.random() * (this.settings.maxMaxRad - this.settings.minMaxRad);
      minR = this.settings.minRadFactor * maxR;

      // define gradient
      if (!this.context) {
        return;
      }
      const grad = this.context.createRadialGradient(0, 0, minR, 0, 0, maxR);
      const gradientStart = hexToRGBA(
        this.settings.gradientStart,
        this.settings.smokeOpacity,
      );
      const gradientEnd = hexToRGBA(
        this.settings.gradientEnd,
        this.settings.smokeOpacity,
      );

      grad.addColorStop(1, gradientStart);
      grad.addColorStop(0, gradientEnd);

      const newCircle = {
        centerX: -maxR,
        centerY: this.displayHeight / 2 - 50,
        maxRad: maxR,
        minRad: minR,
        color: grad, // can set a gradient or solid color here.
        param: 0,
        changeSpeed: 1 / 250,
        phase: Math.random() * TWO_PI, // the phase to use for a single fractal curve.
        globalPhase: Math.random() * TWO_PI, // the curve as a whole will rise and fall by a
        pointList1: setLinePoints(this.settings.iterations),
        pointList2: setLinePoints(this.settings.iterations),
      };
      this.circles.push(newCircle);
    }
  }

  onTimer() {
    let i;
    let j;
    let c;
    let rad;
    let point1;
    let point2;
    let x0;
    let y0;
    let cosParam;

    const xSqueeze = 0.75; // cheap 3D effect by shortening in x direction.

    let yOffset;

    // draw circles
    for (j = 0; j < this.settings.drawsPerFrame; j += 1) {
      this.drawCount += 1;

      for (i = 0; i < this.settings.numCircles; i += 1) {
        c = this.circles[i];
        c.param += c.changeSpeed;
        if (c.param >= 1) {
          c.param = 0;

          c.pointList1 = c.pointList2;
          c.pointList2 = setLinePoints(this.settings.iterations);
        }
        cosParam = 0.5 - 0.5 * Math.cos(Math.PI * c.param);

        this.context.strokeStyle = c.color;
        this.context.lineWidth = this.settings.lineWidth;
        this.context.beginPath();
        point1 = c.pointList1;
        point2 = c.pointList2;

        // slowly rotate
        c.phase += 0.0002;

        let theta = c.phase;
        rad =
          c.minRad +
          (point1.y + cosParam * (point2.y - point1.y)) * (c.maxRad - c.minRad);

        // move center
        c.centerX += 0.5;
        c.centerY += 0.04;
        yOffset =
          40 * Math.sin(c.globalPhase + (this.drawCount / 1000) * TWO_PI);
        // stop when off screen
        if (c.centerX > this.displayWidth + this.settings.maxMaxRad) {
          clearInterval(timer);
          timer = null;
        }

        // we are drawing in new position by applying a transform. We are doing this so the gradient will move with the drawing.
        this.context.setTransform(
          xSqueeze,
          0,
          0,
          1,
          c.centerX,
          c.centerY + yOffset,
        );

        // Drawing the curve involves stepping through a linked list of points defined by a fractal subdivision process.
        // It is like drawing a circle, except with varying radius.
        x0 = xSqueeze * rad * Math.cos(theta);
        y0 = rad * Math.sin(theta);
        this.context.lineTo(x0, y0);
        while (point1.next) {
          point1 = point1.next;
          point2 = point2.next;
          theta =
            TWO_PI * (point1.x + cosParam * (point2.x - point1.x)) + c.phase;
          rad =
            c.minRad +
            (point1.y + cosParam * (point2.y - point1.y)) *
            (c.maxRad - c.minRad);
          x0 = xSqueeze * rad * Math.cos(theta);
          y0 = rad * Math.sin(theta);
          this.context.lineTo(x0, y0);
        }
        this.context.closePath();
        this.context.stroke();
      }
    }
  }

  public setOption<K extends keyof SmokeSettings>(optionName: K, optionValue: SmokeSettings[K]) {
    this.settings[optionName] = optionValue;
  }

  public download(width: number, height: number) {
    // off screen canvas used only when exporting image
    this.exportCanvas = document.createElement('canvas');
    this.exportCanvas.width = this.displayWidth;
    this.exportCanvas.height = this.displayHeight;

    this.exportContext = this.exportCanvas.getContext('2d');
    this.exportContext.drawImage(
      this.displayCanvas,
      0,
      0,
      width,
      height,
      0,
      0,
      width,
      height,
    );
    // we will open a new window with the image contained within:
    // retrieve canvas image as data URL:
    const dataURL = this.exportCanvas.toDataURL('image/png');
    // open a new window of appropriate size to hold the image:
    const imageWindow = window.open(
      '',
      'fractalLineImage',
      `left=0,top=0,width=${width},height=${height},toolbar=0,resizable=0`,
    );
    if (imageWindow === null) {
      throw new Error('couldn\'t instantiate new window');
    }
    // write some html into the new window, creating an empty image:
    imageWindow.document.write(
      `<title>Export Image</title><img id='exportImage' alt='' height='${height}' width='${width}' style='position:absolute;left:0;top:0'/>`,
    );
    imageWindow.document.close();
    // copy the image into the empty img in the newly opened window:
    const exportImage = imageWindow.document.getElementById('exportImage') as HTMLImageElement;
    exportImage.src = dataURL;
  }
}

export { Smoke, SmokeNiceBG };
