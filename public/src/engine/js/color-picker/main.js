
/** 
const colorPicker = new iro.ColorPicker('#picker', {
  width: 180,
  color: 'hsla(341, 100%, 85%, 1)',
  padding: 10,
  borderWidth: 2.5,
  handleRadius: 10,
  wheelLightness: false,
  layout: [
    {
      component: iro.ui.Wheel,
      options: {},
    },
    {
      component: iro.ui.Slider,
      options: {
        sliderType: 'hue',
      },
    },
    {
      component: iro.ui.Slider,
      sliderType: 'value',
    },
    {
      component: iro.ui.Slider,
      options: {
        sliderType: 'saturation',
      },
    },
  ],
});

let isSmallViewport = window.innerWidth < 600;

window.addEventListener('resize', function () {
  if (window.innerWidth < 600) {
    if (!isSmallViewport) {
      colorPicker.resize(300);
      isSmallViewport = true;
    }
  } else {
    if (isSmallViewport) {
      colorPicker.resize(350);
      isSmallViewport = false;
    }
  }
});
if (isSmallViewport) {
  colorPicker.resize(300);
}
document.addEventListener('DOMContentLoaded', () => {
  if (document.documentElement.classList.contains('todesktop')) {
    colorPicker.resize(275);
  }
});

colorPicker.on('color:change', function (color) {

  console.log(document.getElementById("picker"));
  console.log('color: ' + color.rgbString);
  
});

function updateColor(color) {
  if (chroma.valid(color)) {
    colorPicker.color.set(color);
  }
}
window.updateColor = updateColor;

function formatValues(palette, format) {
  if (format === 'rgb') {
    return palette.map((color) => {
      return chroma(color).css();
    });
  }
  if (format === 'rgba') {
    return palette.map((color) => {
      return chroma(color).css('rgba');
    });
  }
  if (format === 'hex8') {
    return palette.map((color) => {
      return `${color}ff`;
    });
  }
  if (format === 'hsl') {
    return palette.map((color) => {
      return chroma(color).css('hsl');
    });
  }
  if (format === 'hsla') {
    return palette.map((color) => {
      return chroma(color).css('hsla');
    });
  }
  if (format === 'oklch') {
    return palette.map((color) => {
      return formatArrayToOklch(chroma(color).oklch());
    });
  }
}

function getOklch(rgbaVal) {
  let alpha = null;

  // Check if rgbaVal starts with "rgb" and contains an alpha value
  if (rgbaVal.startsWith('rgb')) {
    const rgbaMatches = rgbaVal.match(/rgba?\(([^)]+)\)/);

    if (rgbaMatches) {
      const rgbaComponents = rgbaMatches[1].split(',').map((s) => s.trim());
      if (rgbaComponents.length === 4) {
        // Check for alpha
        alpha = parseFloat(rgbaComponents[3]);
      }
    }
  }

  if (alpha !== null && alpha !== 1) {
    return formatArrayToOklch(chroma(rgbaVal).oklch(), alpha);
  } else {
    return formatArrayToOklch(chroma(rgbaVal).oklch());
  }
}
window.getOklch = getOklch;

function formatArrayToOklch(arr, alpha = null) {
  const val1 = (arr[0] * 100).toFixed(1) + '%';
  const val2 = parseFloat(arr[1]).toFixed(3);
  const val3 = parseFloat(arr[2]).toFixed(2);

  if (alpha !== null) {
    const alphaPercentage = Math.round(alpha * 100) + '%';
    return `oklch(${val1} ${val2} ${val3} / ${alphaPercentage})`;
  } else {
    return `oklch(${val1} ${val2} ${val3})`;
  }
}

function tintPalette(color, format = 'hex', qty = 12) {
  let palette = chroma.scale([color, 'white']).mode('lch').colors(qty);

  // remove last one, which will be white, and first one, which will be our starting color
  palette.pop();
  palette.shift();

  if (format !== 'hex') {
    palette = formatValues(palette, format);
  }

  return palette;
}
window.tintPalette = tintPalette;

function shadePalette(color, format = 'hex', qty = 12) {
  let palette = chroma.scale([color, 'black']).mode('lch').colors(qty);
  palette.pop();
  palette.shift();

  if (format !== 'hex') {
    palette = formatValues(palette, format);
  }

  return palette;
}
window.shadePalette = shadePalette;

function tonePalette(color, format = 'hex', qty = 12) {
  let palette = chroma.scale([color, '#808080']).mode('lch').colors(qty);
  palette.pop();
  palette.shift();

  if (format !== 'hex') {
    palette = formatValues(palette, format);
  }

  return palette;
}
window.tonePalette = tonePalette;

function warmPalette(color, format = 'hex', qty = 12) {
  const fullWarm = chroma.mix(color, chroma.temperature(1000), 0.75);
  let palette = chroma.scale([color, fullWarm]).mode('lch').colors(qty);
  palette.pop();
  palette.shift();

  if (format !== 'hex') {
    palette = formatValues(palette, format);
  }

  return palette;
}
window.warmPalette = warmPalette;

function coolPalette(color, format = 'hex', qty = 12) {
  const fullCool = chroma.mix(color, chroma.temperature(30000), 0.85);
  let palette = chroma.scale([color, fullCool]).mode('lch').colors(qty);
  palette.pop();
  palette.shift();

  if (format !== 'hex') {
    palette = formatValues(palette, format);
  }

  return palette;
}
window.coolPalette = coolPalette;

function complementaryPalette(color, format = 'hex', qty = 12, mix = 'white') {
  let palette = chroma
    .scale([chroma(color).set('hsl.h', chroma(color).get('hsl.h') + 180), mix])
    .mode('lch')
    .colors(qty);
  palette.pop();
  palette.shift();

  if (format !== 'hex') {
    palette = formatValues(palette, format);
  }

  return palette;
}
window.complementaryPalette = complementaryPalette;

function analogousPalette(color, format = 'hex', qty = 12) {
  const minus60Degrees = chroma(color).get('hsl.h') - 60;
  const plus60Degrees = chroma(color).get('hsl.h') + 60;
  let palette = chroma
    .scale([
      chroma(color).set('hsl.h', minus60Degrees),
      chroma(color).set('hsl.h', plus60Degrees),
    ])
    .mode('lch')
    .colors(qty);
  palette.pop();
  palette.shift();

  if (format !== 'hex') {
    palette = formatValues(palette, format);
  }

  return palette;
}
window.analogousPalette = analogousPalette;

// Inspired from Question: https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript with Answer: https://stackoverflow.com/a/30810322 by Dean Taylor: https://stackoverflow.com/users/406712/dean-taylor
function copyTextToClipboard(text, el) {
  navigator.clipboard.writeText(text).then(
    function () {
      const originalText = el.innerText;
      el.classList.add('bounce2');
      el.innerText = '👍';
      setTimeout(() => {
        el.classList.remove('bounce2');
        el.innerText = originalText;
      }, 1200);
    },
    function (err) {
      console.error('Async: Could not copy text: ', err);
    }
  );
}
window.copyTextToClipboard = copyTextToClipboard;

function toggleDropper() {
  const eyeDropper = new EyeDropper();

  eyeDropper.open().then((result) => {
    updateColor(result.sRGBHex);
  });
}
window.toggleDropper = toggleDropper;

window.colorPickerInstance = colorPicker;
*/
