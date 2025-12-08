jscolor.presets.default = {
  format:'hex',
  required: false,
};

$(function() {
  const preview = $('#preview')[0];
  const raw = $('#raw-code')[0];
  const count = $('#character-count')[0];
  const maxLineLength = 54;

  const colorRegexp = /\[\[-\]([0-9a-fA-F]{6})\]([^[\n]*)/gi;
  const fontRegexp = /\[\[-\](\/?[IUBS])\]/gi;
  const emoteRegexp = /(\[\[-\]\#\d\d\])/gi;

  const baseColor = '#cadfff';
  const baseColorFull = '[[-] ' + baseColor.replace('#', '') + ']';
  const clipboard = new ClipboardJS('.btn');
  const emotes = {
    '[[-]#01]': '💦',
    '[[-]#02]': '💥',
    '[[-]#03]': '💔',
    '[[-]#04]': '🍻',
    '[[-]#05]': '🌹',
    '[[-]#06]': '❤',
    '[[-]#07]': '😀',
    '[[-]#08]': '😭',
    '[[-]#09]': '😌',
    '[[-]#10]': '😵',
    '[[-]#11]': '😋',
    '[[-]#12]': '😂',
    '[[-]#13]': '😄',
    '[[-]#14]': '😫',
    '[[-]#15]': '😁',
    '[[-]#16]': '😃',
    '[[-]#17]': '😰',
    '[[-]#18]': '😢',
    '[[-]#19]': '😳',
    '[[-]#20]': '😤',
    '[[-]#21]': '🌚',
    '[[-]#22]': '😣',
    '[[-]#23]': '😯',
    '[[-]#24]': '😡',
    '[[-]#25]': '😠',
    '[[-]#26]': '😟',
    '[[-]#27]': '😞',
    '[[-]#28]': '😝',
    '[[-]#29]': '😈',
    '[[-]#30]': '😚',
    '[[-]#31]': '😘',
    '[[-]#32]': '😗',
    '[[-]#33]': '😖',
    '[[-]#34]': '🙁',
    '[[-]#35]': '😔',
    '[[-]#36]': '😇',
    '[[-]#37]': '😴',
    '[[-]#38]': '😓',
    '[[-]#39]': '😒',
    '[[-]#40]': '😑',
    '[[-]#41]': '🔥',
    '[[-]#42]': '😏',
    '[[-]#43]': '😎',
    '[[-]#44]': '😍',
    '[[-]#45]': '💋',
    '[[-]#46]': '✨',
    '[[-]#47]': '🎂',
    '[[-]#48]': '❓',
    '[[-]#49]': '🐷',
    '[[-]#50]': '😊',
    '[[-]#51]': '😃',
    '[[-]#53]': '😉',
    '[[-]#54]': '😜',
    '[[-]#55]': '😨',
    '[[-]#56]': '😱',
    '[[-]#57]': '😪',
    '[[-]#58]': '😷',
    '[[-]#59]': '💤',
    '[[-]#60]': '🎵',
    '[[-]#61]': '💩',
    '[[-]#62]': '👍',
    '[[-]#63]': '👎',
    '[[-]#65]': '👊',
    '[[-]#66]': '✊',
    '[[-]#67]': '✌',
    '[[-]#68]': '👋',
    '[[-]#69]': '✋',
    '[[-]#70]': '👐',
    '[[-]#71]': '👇',
    '[[-]#72]': '👆',
    '[[-]#73]': '👉',
    '[[-]#74]': '👈',
    '[[-]#75]': '🙌',
    '[[-]#76]': '🙏',
    '[[-]#77]': '☝',
    '[[-]#78]': '👏',
    '[[-]#79]': '💪',
    '[[-]#80]': '👩‍❤️‍👨',
    '[[-]#81]': '👩‍❤️‍💋‍👨',
    '[[-]#82]': '🌹',
    '[[-]#83]': '👀',
    '[[-]#84]': '👌',
  };
  const ascii = '▀▁▂▃▄▅▆▇█▉▊▋▌▍▎▏'
    + '▐░▒▓▔▕▖▗▘▙▚▛▜▝▞▟'
    + '◢◣◥◤↑↓←→↖↗↙↘△▲▽▼▶▷◀◁';


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
    $(preview).html(
      $(raw).val()
        .replaceAll(colorRegexp, '<span style="color: #$1;">$2</span>')
        .replaceAll(fontRegexp, '<$1>')
        .replaceAll(emoteRegexp, (match) => emotes[match])
        .replaceAll(/\n/g, '</i></b></u></s><br>')
    );
    const charCount = $(raw).val().length;
    $(count).html(charCount);
    $(count).toggleClass('text-error', charCount > 300);
  }

  $(raw).on('keyup change', function(event) {
    updatePreview();
  });

  $('body').on('click', '.char-button', function() {
    appendText($(this).data('char'));
  })

  $('#single-generate').on('click', () => {
    const code = $('#single-color').val().replace('#', '');
    appendText('[[-]' + code + ']');
  })

  $('#gradient-apply').on('click', () => {
    // Gradient functionality to be implemented
    const startColor = $('#gradient-start-color').val();
    const endColor = $('#gradient-end-color').val();
    console.log('Gradient from', startColor, 'to', endColor);
  })

  $('#gradient-generate').on('click', () => {
    const start = new Color($('#gradient-start').val());
    const end = new Color($('#gradient-end').val());
    const text = $('#gradient-text').val();
    const textSize = text.length;

    if (textSize <= 0) {
      return;
    }

    const diff = {
      red: {
        start: parseInt(start.srgb.r * 255),
        end: parseInt(end.srgb.r * 255),
        step: parseInt((end.srgb.r - start.srgb.r) * 255 / textSize),
      },
      green: {
        start: parseInt(start.srgb.g * 255),
        end: parseInt(end.srgb.g * 255),
        step: parseInt((end.srgb.g - start.srgb.g) * 255 / textSize),
      },
      blue: {
        start: parseInt(start.srgb.b * 255),
        end: parseInt(end.srgb.b * 255),
        step: parseInt((end.srgb.b - start.srgb.b) * 255 / textSize),
      },
    }

    let rendered = '';
    for (let i = 0; i < textSize; i++) {
      const red = Number(diff.red.start + diff.red.step * i).toString(16).padStart(2, '0');
      const green = Number(diff.green.start + diff.green.step * i).toString(16).padStart(2, '0');
      const blue = Number(diff.blue.start + diff.blue.step * i).toString(16).padStart(2, '0');

      rendered += '[[-]' + red + green + blue + ']' + text[i];
    }

    rendered += baseColorFull;

    appendText(rendered);
  });
})
