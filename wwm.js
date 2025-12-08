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

  $(raw).on('keyup change', function(event) {
    updatePreview();
  });

  $('body').on('click', '.char-button', function() {
    appendText($(this).data('char'));
  })

  $('#single-generate').on('click', () => {
    const code = $('#single-color').val().replace('#', '').toLowerCase();
    appendText('#' + code);
  })

  $('#gradient-apply').on('click', () => {
    // Gradient functionality to be implemented
    const startColor = $('#start-color').val();
    const endColor = $('#end-color').val();
    console.log('Gradient from', startColor, 'to', endColor);
  })
})
