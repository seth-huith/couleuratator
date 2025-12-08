jscolor.presets.default = {
  format:'hex',
  required: false,
};

$(function() {
  const preview = $('#preview')[0];
  const raw = $('#raw-code')[0];
  const count = $('#character-count')[0];
  const maxLineLength = 54;

  const colorRegexp = /#([0-9a-f]{6})/gi;

  const clipboard = new ClipboardJS('.btn');
  const ascii = '▀▁▂▃▄▅▆▇█▉▊▋▌▍▎▏'
    + '▐░▒▓▔▕▖▗▘▙▚▛▜▝▞▟'
    + '◢◣◥◤↑↓←→↖↗↙↘△▲▽▼▶▷◀◁✚♥';

  // Undo history
  let undoHistory = [];
  const MAX_UNDO_HISTORY = 50;

  // Populate ASCII character buttons (18 per line)
  $.each(ascii.split(''), function (index, char) {
    $('#ascii').append('<button class="btn btn-sm btn-light emote-button" data-char="' + char + '" style="font-size: 12px; padding: 2px 6px; margin: 2px; width: 28px;">' + char + '</button>');
    if ((index + 1) % 18 === 0) {
      $('#ascii').append('<br>');
    }
  });


  function checkLineLength(text) {
    const lines = $(raw).val().split("\n");
    const lastLine = lines.length > 0 ? lines[lines.length - 1] : null;

    if ((lastLine.length + text.length) > maxLineLength) {
      $(raw).val($(raw).val() + "\n");
    }
  }

  function appendText(text) {
    checkLineLength(text);
    console.log(raw.selectionStart)
    if (raw.selectionStart) {
      const before = $(raw).val().substring(0, raw.selectionStart);
      const after = $(raw).val().substring(raw.selectionStart, raw.length);
      $(raw).val(before + text + after);
    } else {
      $(raw).val($(raw).val() + text);
    }

    $(raw).trigger('change');
    $(raw).focus();
  }

  function updatePreview() {
    console.log($(preview).html(), $(raw).val());
    const text = $(raw).val();
    let result = '';
    let currentColor = null;
    let lastIndex = 0;

    // Parse text and apply colors
    const matches = [...text.matchAll(colorRegexp)];

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const matchIndex = match.index;
      const color = match[1].toLowerCase();

      // Add text before this color tag
      const textBefore = text.substring(lastIndex, matchIndex);
      if (textBefore) {
        if (currentColor) {
          result += `<span style="color: #${currentColor};">${textBefore}</span>`;
        } else {
          result += textBefore;
        }
      }

      // Update current color
      currentColor = color;
      lastIndex = matchIndex + match[0].length;
    }

    // Add remaining text
    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      if (currentColor) {
        result += `<span style="color: #${currentColor};">${remainingText}</span>`;
      } else {
        result += remainingText;
      }
    }

    $(preview).html(result);
    const charCount = $(raw).val().length;
    $(count).html(charCount);
    $(count).toggleClass('text-error', charCount > 300);
  }

  // Save current state to undo history before changes
  function saveUndoState() {
    undoHistory.push($(raw).val());
    if (undoHistory.length > MAX_UNDO_HISTORY) {
      undoHistory.shift();
    }
  }

  $(raw).on('keyup change', function(event) {
    updatePreview();
  });

  // Undo button
  $('#undo-button').on('click', () => {
    if (undoHistory.length > 0) {
      const previousState = undoHistory.pop();
      $(raw).val(previousState);
      $(raw).trigger('change');
    }
  });

  $('body').on('click', '.char-button, .emote-button', function() {
    saveUndoState();
    appendText($(this).data('char'));
  })

  $('#single-generate').on('click', () => {
    saveUndoState();
    const code = $('#single-color').val().replace('#', '').toLowerCase();
    appendText('#' + code);
  })

  // Helper function to interpolate between two colors
  function interpolateColor(color1, color2, factor) {
    const c1 = {
      r: parseInt(color1.substring(1, 3), 16),
      g: parseInt(color1.substring(3, 5), 16),
      b: parseInt(color1.substring(5, 7), 16)
    };
    const c2 = {
      r: parseInt(color2.substring(1, 3), 16),
      g: parseInt(color2.substring(3, 5), 16),
      b: parseInt(color2.substring(5, 7), 16)
    };

    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
    const b = Math.round(c1.b + (c2.b - c1.b) * factor);

    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  // Helper function to convert HSL to RGB hex
  function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n =>
      l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

    const r = Math.round(255 * f(0));
    const g = Math.round(255 * f(8));
    const b = Math.round(255 * f(4));

    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  // Helper function to convert RGB hex to HSL
  function hexToHsl(hex) {
    const r = parseInt(hex.substring(1, 3), 16) / 255;
    const g = parseInt(hex.substring(3, 5), 16) / 255;
    const b = parseInt(hex.substring(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return {
      h: h * 360,
      s: s * 100,
      l: l * 100
    };
  }

  // Gradient direct: start → end
  $('#gradient-apply-direct').on('click', () => {
    const selectionStart = raw.selectionStart;
    const selectionEnd = raw.selectionEnd;

    // Only work if text is selected
    if (selectionStart === selectionEnd) {
      alert('Please select text first');
      return;
    }

    saveUndoState();

    const selectedText = $(raw).val().substring(selectionStart, selectionEnd);
    const startColor = $('#start-color-direct').val();
    const endColor = $('#end-color-direct').val();
    const textLength = selectedText.length;

    // Determine chunk size based on text length to save characters
    let chunkSize;
    if (textLength > 160) {
      chunkSize = 14;
    } else if (textLength > 120) {
      chunkSize = 11;
    } else if (textLength > 80) {
      chunkSize = 7;
    } else if (textLength > 50) {
      chunkSize = 5;
    } else if (textLength > 30) {
      chunkSize = 3;
    } else if (textLength > 20) {
      chunkSize = 2;
    } else {
      chunkSize = 1;
    }
    const numChunks = Math.ceil(textLength / chunkSize);

    let result = '';
    for (let i = 0; i < numChunks; i++) {
      const progress = i / (numChunks - 1);

      // Direct gradient from start to end
      const color = interpolateColor(startColor, endColor, progress);

      // Get the chunk of text
      const chunkStart = i * chunkSize;
      const chunkEnd = Math.min(chunkStart + chunkSize, textLength);
      const chunk = selectedText.substring(chunkStart, chunkEnd);

      result += color.toLowerCase() + chunk;
    }

    // Replace selected text with gradient version
    const before = $(raw).val().substring(0, selectionStart);
    const after = $(raw).val().substring(selectionEnd);
    $(raw).val(before + result + after);
    $(raw).trigger('change');
    $(raw).focus();
  })

  // Gradient through white: start → white → end
  $('#gradient-through-white').on('click', () => {
    const selectionStart = raw.selectionStart;
    const selectionEnd = raw.selectionEnd;

    // Only work if text is selected
    if (selectionStart === selectionEnd) {
      alert('Please select text first');
      return;
    }

    saveUndoState();

    const selectedText = $(raw).val().substring(selectionStart, selectionEnd);
    const startColor = $('#start-color-through-white').val();
    const endColor = $('#end-color-through-white').val();
    const white = '#ffffff';
    const textLength = selectedText.length;

    // Determine chunk size based on text length to save characters
    let chunkSize;
    if (textLength > 160) {
      chunkSize = 14;
    } else if (textLength > 120) {
      chunkSize = 11;
    } else if (textLength > 80) {
      chunkSize = 7;
    } else if (textLength > 50) {
      chunkSize = 5;
    } else if (textLength > 30) {
      chunkSize = 3;
    } else if (textLength > 20) {
      chunkSize = 2;
    } else {
      chunkSize = 1;
    }
    const numChunks = Math.ceil(textLength / chunkSize);

    let result = '';
    for (let i = 0; i < numChunks; i++) {
      const progress = i / (numChunks - 1);
      let color;

      if (progress <= 0.5) {
        // First half: start color → white
        color = interpolateColor(startColor, white, progress * 2);
      } else {
        // Second half: white → end color
        color = interpolateColor(white, endColor, (progress - 0.5) * 2);
      }

      // Get the chunk of text
      const chunkStart = i * chunkSize;
      const chunkEnd = Math.min(chunkStart + chunkSize, textLength);
      const chunk = selectedText.substring(chunkStart, chunkEnd);

      result += color.toLowerCase() + chunk;
    }

    // Replace selected text with gradient version
    const before = $(raw).val().substring(0, selectionStart);
    const after = $(raw).val().substring(selectionEnd);
    $(raw).val(before + result + after);
    $(raw).trigger('change');
    $(raw).focus();
  })

  // Gradient rainbow: cycle through rainbow colors from start to end
  $('#gradient-apply-rainbow').on('click', () => {
    const selectionStart = raw.selectionStart;
    const selectionEnd = raw.selectionEnd;

    // Only work if text is selected
    if (selectionStart === selectionEnd) {
      alert('Please select text first');
      return;
    }

    saveUndoState();

    const selectedText = $(raw).val().substring(selectionStart, selectionEnd);
    const startColor = $('#start-color-rainbow').val();
    const endColor = $('#end-color-rainbow').val();
    const textLength = selectedText.length;

    // Get HSL values for start and end colors
    const startHsl = hexToHsl(startColor);
    const endHsl = hexToHsl(endColor);

    // Determine chunk size based on text length to save characters
    let chunkSize;
    if (textLength > 160) {
      chunkSize = 14;
    } else if (textLength > 120) {
      chunkSize = 11;
    } else if (textLength > 80) {
      chunkSize = 7;
    } else if (textLength > 50) {
      chunkSize = 5;
    } else if (textLength > 30) {
      chunkSize = 3;
    } else if (textLength > 20) {
      chunkSize = 2;
    } else {
      chunkSize = 1;
    }
    const numChunks = Math.ceil(textLength / chunkSize);

    let result = '';
    for (let i = 0; i < numChunks; i++) {
      const progress = i / (numChunks - 1);

      // Interpolate hue from start to end (cycling through rainbow)
      const hue = startHsl.h + (endHsl.h - startHsl.h) * progress;
      const saturation = startHsl.s + (endHsl.s - startHsl.s) * progress;
      const lightness = startHsl.l + (endHsl.l - startHsl.l) * progress;
      const color = hslToHex(hue, saturation, lightness);

      // Get the chunk of text
      const chunkStart = i * chunkSize;
      const chunkEnd = Math.min(chunkStart + chunkSize, textLength);
      const chunk = selectedText.substring(chunkStart, chunkEnd);

      result += color.toLowerCase() + chunk;
    }

    // Replace selected text with gradient version
    const before = $(raw).val().substring(0, selectionStart);
    const after = $(raw).val().substring(selectionEnd);
    $(raw).val(before + result + after);
    $(raw).trigger('change');
    $(raw).focus();
  })
})
