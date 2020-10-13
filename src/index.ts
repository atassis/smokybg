import { SmokeNiceBG } from "./smoky-background";

function getElementHeight(element: Element): number {
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

export type ISmokeSettings = Partial<Omit<SmokeSettings, 'maxMaxRad' | 'minMaxRad'> & {
  maxMaxRad: 'auto' | number;
  minMaxRad: 'auto' | number;
}>;

interface Circle {
  centerX: number;
  centerY: number;
  maxRad: number;
  minRad: number;
  color: string | CanvasGradient | CanvasPattern;
  param: number;
  changeSpeed: number;
  phase: number;
  globalPhase: number;
  pointList1: Point;
  pointList2: Point;
}

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

  canvas: HTMLCanvasElement | null;

  context: CanvasRenderingContext2D | null;

  displayWidth?: number;

  displayHeight?: number;

  timer?: number;

  drawCount: number = 0;

  circles: Circle[] = [];

  constructor(canvasElement: HTMLCanvasElement, options: ISmokeSettings = {}) {
    this.canvas = canvasElement;
    const radius = getElementHeight(this.canvas) * 0.4;

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
      maxMaxRad: !options.maxMaxRad || options.maxMaxRad === 'auto' ? radius : options.maxMaxRad,
      minMaxRad: !options.minMaxRad || options.minMaxRad === 'auto' ? radius : options.minMaxRad,
    };
    if (!this.canvas) {
      throw new Error('you have to provide an id of <canvas /> element')
    }
    this.displayWidth = this.canvas.clientWidth;
    this.displayHeight = this.canvas.clientHeight;
    this.context = this.canvas.getContext('2d');

    this.generate();
  }

  generate() {
    this.drawCount = 0;
    if (!this.context) {
      throw new Error('context is set to null!');
    }
    if (!this.displayWidth) {
      throw new Error('displayWidth is falsy!');
    }
    if (!this.displayHeight) {
      throw new Error('displayHeight is falsy!');
    }
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.clearRect(0, 0, this.displayWidth, this.displayHeight);
    this.fillBackground();

    this.setCircles();

    if (this.timer) {
      clearInterval(this.timer);
    }
    this.timer = setInterval(this.onTimer.bind(this), this.settings.speed);
  }

  fillBackground() {
    const { bgColorInner, bgColorOuter } = this.settings;
    if (!this.context) {
      throw new Error('context is set to null!');
    }
    if (!this.displayWidth) {
      throw new Error('displayWidth is falsy!');
    }
    if (!this.displayHeight) {
      throw new Error('displayHeight is falsy!');
    }
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

    gradient.addColorStop(0, ...getGradientStart(bgColorInner));
    gradient.addColorStop(1, ...getGradientStart(bgColorOuter));
    gradient.fillRect(
      this.context,
      0,
      0,
      this.displayWidth,
      this.displayHeight,
    );
  }

  setCircles() {
    const { gradientEnd, gradientStart, iterations, maxMaxRad, minMaxRad, minRadFactor, numCircles, smokeOpacity } = this.settings;
    let maxR;
    let minR;

    this.circles = [];

    for (let i = 0; i < numCircles; i += 1) {
      maxR = minMaxRad + Math.random() * (maxMaxRad - minMaxRad);
      minR = minRadFactor * maxR;

      // define gradient
      if (!this.context) {
        throw new Error('context is set to null!');
      }
      if (!this.displayHeight) {
        throw new Error('this.displayHeight is falsy!');
      }
      const grad = this.context.createRadialGradient(0, 0, minR, 0, 0, maxR);

      grad.addColorStop(1, hexToRGBA(gradientStart, smokeOpacity));
      grad.addColorStop(0, hexToRGBA(gradientEnd, smokeOpacity));

      this.circles.push({
        centerX: -maxR,
        centerY: this.displayHeight / 2 - 50,
        maxRad: maxR,
        minRad: minR,
        color: grad, // can set a gradient or solid color here.
        param: 0,
        changeSpeed: 1 / 250,
        phase: Math.random() * TWO_PI, // the phase to use for a single fractal curve.
        globalPhase: Math.random() * TWO_PI, // the curve as a whole will rise and fall by a
        pointList1: setLinePoints(iterations),
        pointList2: setLinePoints(iterations),
      });
    }
  }

  onTimer() {
    const { drawsPerFrame, iterations, lineWidth, maxMaxRad, numCircles } = this.settings;
    if (!this.context) {
      throw new Error('context is set to null!');
    }
    if (!this.displayWidth) {
      throw new Error('displayWidth is falsy!');
    }
    let rad;
    let x0;
    let y0;
    let cosParam;

    const xSqueeze = 0.75; // cheap 3D effect by shortening in x direction.

    let yOffset;

    // draw circles
    for (let j = 0; j < drawsPerFrame; j += 1) {
      this.drawCount += 1;

      for (let i = 0; i < numCircles; i += 1) {
        const circle= this.circles[i];
        circle.param += circle.changeSpeed;
        if (circle.param >= 1) {
          circle.param = 0;

          circle.pointList1 = circle.pointList2;
          circle.pointList2 = setLinePoints(iterations);
        }
        cosParam = 0.5 - 0.5 * Math.cos(Math.PI * circle.param);

        this.context.strokeStyle = circle.color;
        this.context.lineWidth = lineWidth;
        this.context.beginPath();
        let point1 = circle.pointList1;
        let point2 = circle.pointList2;

        // slowly rotate
        circle.phase += 0.0002;

        let theta = circle.phase;
        rad =
          circle.minRad +
          (point1.y + cosParam * (point2.y - point1.y)) * (circle.maxRad - circle.minRad);

        // move center
        circle.centerX += 0.5;
        circle.centerY += 0.04;
        yOffset =
          40 * Math.sin(circle.globalPhase + (this.drawCount / 1000) * TWO_PI);
        // stop when off screen
        if (circle.centerX > this.displayWidth + maxMaxRad) {
          clearInterval(this.timer);
          this.timer = undefined;
        }

        // we are drawing in new position by applying a transform. We are doing this so the gradient will move with the drawing.
        this.context.setTransform(
          xSqueeze,
          0,
          0,
          1,
          circle.centerX,
          circle.centerY + yOffset,
        );

        // Drawing the curve involves stepping through a linked list of points defined by a fractal subdivision process.
        // It is like drawing a circle, except with varying radius.
        x0 = xSqueeze * rad * Math.cos(theta);
        y0 = rad * Math.sin(theta);
        this.context.lineTo(x0, y0);
        while (point1.next) {
          point1 = point1.next;
          if (!point2.next) {
            throw new Error('point2 shouldn\'t be falsy in this condition!');
          }
          point2 = point2.next;
          theta =
            TWO_PI * (point1.x + cosParam * (point2.x - point1.x)) + circle.phase;
          rad =
            circle.minRad +
            (point1.y + cosParam * (point2.y - point1.y)) *
            (circle.maxRad - circle.minRad);
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
    const exportCanvas = document.createElement('canvas') as HTMLCanvasElement;

    exportCanvas.width = this.displayWidth as number;
    exportCanvas.height = this.displayHeight as number;

    const exportContext = exportCanvas.getContext('2d') as CanvasRenderingContext2D;
    exportContext.drawImage(
      this.canvas as HTMLCanvasElement,
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
    const dataURL = exportCanvas.toDataURL('image/png');
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
