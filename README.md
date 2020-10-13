# Smokybg

This is a rewritten analog of [waterpipe.js jQuery plugin](https://github.com/dragdropsite/waterpipe.js/), but rewritten in typescript and usable as a common npm module with types (not perfectly typed tho)

## Install

```shell script
npm i smokybg
```
## Usage
```html
<div id="smoky-wrapper" style="width: 100%; height: 100%;"> 
    <canvas>Your browser does not support HTML5 canvas.</canvas>
</div>
```
```typescript
import { Smoke } from 'smokybg';

const element = document.getElementById('smoky-wrapper');

const options = {
   kek: 'lol'
};

new Smoke(element, options);
```

## Support
If anyone will use this- I will provide wider documentation for this and make a better API

## Examples
Here are some examples generated using waterpipe.js plugin. 

![alt tag](https://raw.github.com/dragdropsite/waterpipe.js/master/img/samples/sample-1.jpg)
![alt tag](https://raw.github.com/dragdropsite/waterpipe.js/master/img/samples/sample-3.jpg)
![alt tag](https://raw.github.com/dragdropsite/waterpipe.js/master/img/samples/sample-5.jpg)
![alt tag](https://raw.github.com/dragdropsite/waterpipe.js/master/img/samples/sample-6.jpg)
![alt tag](https://raw.github.com/dragdropsite/waterpipe.js/master/img/samples/sample-7.jpg)
![alt tag](https://raw.github.com/dragdropsite/waterpipe.js/master/img/samples/sample-9.jpg)
![alt tag](https://raw.github.com/dragdropsite/waterpipe.js/master/img/samples/sample-10.jpg)

## Options

| Option        | Type          | Default   | Description                                                                                                                                                                    |
|---------------|---------------|-----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| gradientStart | string        | '#000000' | Gradient start color in hex format.                                                                                                                                            |
| gradientEnd   | string        | '#222222' | Gradient end color in hex format.                                                                                                                                              |
| smokeOpacity  | number        | 0.1       | Smoke opacity 0 to 1.                                                                                                                                                          |
| numCircles    | int           | 1         | Number of circles (smokes).                                                                                                                                                    |
| maxMaxRad     | int or 'auto' | 'auto'    | Could be used to change circle radius size                                                                                                                                     |
| minMaxRad     | int or 'auto' | 'auto'    | Could be used to change circle radius size                                                                                                                                     |
| minRadFactor  | int           | 0         | It's a factor representing the size of the smallest radius with respect to the largest possible. Integer from 0 to 1.                                                          |
| iterations    | int           | 8         | The number of subdividing steps to take when creating a single fractal curve. Can use more, but anything over 10 (thus 1024 points) is overkill for a moderately sized canvas. |
| drawsPerFrame | int           | 10        | Number of curves to draw on every tick of the timer                                                                                                                            |
| lineWidth     | number        | 2         | Line width                                                                                                                                                                     |
| speed         | int           | 1         | Drawing speed (tick of timer in ms)                                                                                                                                            |
| bgColorInner  | string        | '#ffffff' | Background outer color in hex format                                                                                                                                           |
| bgColorOuter  | string        | '#666666' | Background inner color in hex format                                                                                                                                           |

## Methods

| Method    | Arguments   | Description                                                                                     |
|-----------|-------------|-------------------------------------------------------------------------------------------------|
| generate  |             | Generates background canvas                                                                     |
| setOption | optionName, | Set a new value to an option. Please check the above table for possible option names and values |
|           | optionValue |                                                                                                 |
| download  | width: int, | Download size in pixels                                                                         |
|           | height: int |                                                                                                 |

## License

Licensed under MIT license
