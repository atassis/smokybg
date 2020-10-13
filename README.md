# Smokybg

This is a rewritten analog of [waterpipe.js jQuery plugin](https://github.com/dragdropsite/waterpipe.js/), but rewritten in typescript and usable as a common npm module with types (not perfectly typed tho)

You can install it as 
```shell script
npm i smokybg
```
Usage
```typescript
import { Smoke } from 'smokybg';

const element = document.getElementById('smoky-bg');

const options = {
   kek: 'lol'
};

new Smoke(element, options);
```

If anyone will use this- I will provide wider documentation for this and make a better API
