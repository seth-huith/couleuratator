(function () {
  $(function () {
    const options = window.PUZZLE_OPTIONS || {};
    const defaultBaseColors = {
      A: '#126165', // GREEN
      B: '#f28a29', // ORANGE
      C: '#0a5cd9', // BLUE
      D: '#ecba03', // YELLOW
      E: '#b8170d', // RED
      F: '#48be2c', // LGREEN
      G: '#5fa9ea', // LBLUE
      H: '#681c36', // BROWN
      I: '#892ed1', // PURPLE
      J: '#ffd1b7', // PALE
      K: '#e099df', // PINK
      L: '#eb5e7e', // FRUIT
      M: '#463bc6', // BLURPLE
      N: '#6a696e', // GREY
      Z: '', // EMPTY
    };
    const baseColors = options.baseColors || defaultBaseColors;
    const updateHistory =
      typeof options.updateHistory === 'function'
        ? options.updateHistory
        : function (hashBottles) {
            if (window.location.href.match(/tubes/)) {
              const hashQuery = hashBottles.match(/^Z+$/)
                ? '?tab=tubes'
                : '?tab=tubes&q=' + hashBottles;
              history.pushState(
                {},
                '',
                window.location.origin + window.location.pathname + hashQuery
              );
            }
          };
    const buildPuzzleLink =
      typeof options.buildPuzzleLink === 'function'
        ? options.buildPuzzleLink
        : function (hash) {
            return (
              window.location.origin + window.location.pathname + '?q=' + hash + '&tab=tubes'
            );
          };

    $('a[data-bs-toggle="tab"]').click(function () {
      location.hash = '';
      history.pushState(
        {},
        '',
        window.location.origin + window.location.pathname + '?tab=' + $(this).data('tab')
      );
    });

    const bottle = $('#bottle-template').html();
    const bottleColor = $('#bottle-color-template').html();
    const bottleContainer = $('#bottles');
    const colorContainer = $('#bottle-colors');
    const modalContent = $('#color-modal .modal-body');
    let colors = baseColors;

    // INIT colors
    $.each(colors, function (key, value) {
      const node = $(bottleColor);
      node.attr('data-color', key);
      node.find('.color').css({ background: value });

      colorContainer.append(node);

      const button = $('<div class="color-button"></div>');
      button.attr('data-color', key);
      button.css({
        background: value
          ? value
          : 'repeating-linear-gradient(45deg, #39448a, #39448a 10.5px, #283163 10.5px, #283163 21px)',
      });

      modalContent.append(button);
    });

    $('#add-bottle').on('click', function () {
      bottleContainer.append(bottle);
      countColors();
    });
    $('#remove-bottle').on('click', function () {
      bottleContainer.find('.bottle').last().remove();
      countColors();
    });

    let colorCounts = {};
    const emptyColorCounts = function () {
      colorCounts = {};
      $.each(colors, function (key) {
        colorCounts[key] = 0;
      });
    };

    const countColors = function () {
      let hashBottles = '';
      emptyColorCounts();
      $('#bottles .bottle').each(function (index) {
        $(this)
          .find('.index')
          .html(index + 1);
      });

      $('#bottles .bottle .color').each(function () {
        const currentColor = $(this).data('color');
        if (currentColor !== 'Z') {
          colorCounts[currentColor]++;
        }
        hashBottles += currentColor;
      });

      $('#bottle-colors .color-div').each(function () {
        const colorKey = $(this).data('color');
        const colorCount = colorCounts[colorKey];

        $(this)
          .toggle(colorCount > 0)
          .find('.number')
          .toggleClass('text-success', colorCount === 4)
          .toggleClass('text-warning', colorCount !== 4 && colorCount > 0)
          .html(colorCount);
      });

      updateHistory(hashBottles);
    };

    const checkEntries = function (data) {
      let emptyTubes = 0;
      let incompleteTubes = 0;
      let incompleteColors = $('#bottle-colors .text-warning').length;
      let filledTubes = 0;

      $(data).each(function (key, values) {
        const tube = values;
        let empties = 0;
        $(tube).each(function (_, value) {
          if (value === 'Z') {
            empties++;
          }
        });

        if (empties > 0) {
          if (empties === 4) {
            emptyTubes++;
          } else {
            incompleteTubes++;
          }
        } else {
          filledTubes++;
        }
      });

      if (emptyTubes < 2 || incompleteTubes > 0 || incompleteColors > 0 || filledTubes === 0) {
        $('.color-errors .empty-tubes').toggle(emptyTubes < 2);
        $('.color-errors .incomplete-tubes').toggle(incompleteTubes > 0);
        $('.color-errors .incomplete-colors').toggle(incompleteColors > 0);
        $('.color-errors .missing-tubes').toggle(filledTubes === 0);
        $('.color-errors').show();
        $('#solve').hide();

        return false;
      }
    };

    const colorModal = new bootstrap.Modal(document.getElementById('color-modal'));
    const empty = 'Z';
    let colorElement = null;

    $('#bottles').on('click', '.color', function () {
      colorElement = $(this);
      colorModal.show();
    });
    $('#color-modal').on('click', '.color-button', function () {
      if (colorElement) {
        colorElement.data('color', $(this).data('color'));
        colorElement.css({ background: colors[$(this).data('color')] });
      }
      colorModal.hide();
      $('#color-json').hide();

      countColors();
      $('.color-errors').hide();
      $('#solve').hide();
    });

    /* -------------------- URL -----------------------*/
    const params = new URLSearchParams(window.location.search);
    const hash = params.get('q');
    const tab = params.get('tab');
    if (tab) {
      location.url = $('a[data-tab="' + tab + '"]').attr('href');
    }

    if (hash && hash.length > 0 && hash.match(/^Z+$/) === null) {
      const urlBottles = hash.match(/.{1,4}/g);

      $(urlBottles).each(function (index, chunk) {
        const newBottle = $(bottle);
        for (let i = 0; i < chunk.length; i++) {
          const square = newBottle.find('.color:nth-child(' + (i + 1) + ')');
          square.data('color', chunk[i]);
          square.css({ background: colors[chunk[i]] });
        }
        bottleContainer.append(newBottle);
      });
    } else {
      for (let i = 0; i < 12; i++) {
        bottleContainer.append(bottle);
      }
    }

    countColors();

    /* ------------------ SOLVING ------------------ */
    function isBottleSolved(bottle) {
      const color = bottle[0];

      if (color === empty) return true;

      for (let i = 1; i < bottle.length; i++) {
        if (bottle[i] === empty) return false;
        if (bottle[i] !== color) return false;
      }

      return true;
    }

    function isSolved(bottles) {
      for (let i = 0; i < bottles.length; i++) {
        if (isBottleSolved(bottles[i]) === false) return false;
      }

      return true;
    }

    function cloneStep(step) {
      return {
        moves: step.moves.map((x) => [...x]),
        bottles: step.bottles.map((x) => [...x]),
      };
    }

    function hashBottles(bottles) {
      let hashValue = '';
      for (let i = 0; i < bottles.length; i++) {
        hashValue += bottles[i].join('');
      }

      return hashValue;
    }

    function getBottleData(bottle) {
      let topColor = empty;
      let room = 0;
      let movable = 0;

      for (let z = 3; z >= 0; z--) {
        const previousColor = bottle[z === 3 ? z : z + 1];
        if (bottle[z] !== empty) {
          if (topColor === empty) topColor = bottle[z];
          if (topColor === bottle[z] && (topColor === previousColor || previousColor === empty)) movable++;
        } else {
          room++;
        }
      }

      return {
        colors: [...bottle],
        topColor: topColor,
        room: room,
        movable: movable,
      };
    }

    function isMovePossible(bottle1, bottle2) {
      if (bottle2.room === 0) {
        return false;
      }

      if (bottle1.movable === 0) {
        return false;
      }

      if (bottle1.movable === 4) {
        return false;
      }

      if (bottle1.movable > bottle2.room) {
        return false;
      }

      if (bottle2.room === 4 && bottle1.movable + bottle1.room === 4) {
        return false;
      }

      if (bottle1.topColor !== bottle2.topColor && bottle2.topColor !== empty) {
        return false;
      }

      return true;
    }

    function solve(bottles) {
      const stepQueue = [{ moves: [], bottles: bottles }];
      const visited = {};
      const bottleCount = bottles.length;
      let solved = null;
      let complexity = 0;
      const hardCap = 2000000;
      const start = Date.now();

      solving: while (stepQueue.length > 0 && complexity < hardCap) {
        const currentStep = stepQueue.pop();
        const currentHash = hashBottles(currentStep.bottles);

        if (visited[currentHash] === true) continue;

        visited[currentHash] = true;

        for (let i = 0; i < bottleCount; i++) {
          const bottle1 = getBottleData(currentStep.bottles[i]);

          if (isBottleSolved(bottle1.colors)) continue;
          if (bottle1.colors[0] === empty) continue;

          for (let j = 0; j < bottleCount; j++) {
            if (j === i) continue;

            const bottle2 = getBottleData(currentStep.bottles[j]);

            if (isMovePossible(bottle1, bottle2)) {
              const nextStep = cloneStep(currentStep);
              nextStep.moves.push([i, j]);
              let moved = 0;
              let removed = 0;
              for (let k = 0; k < 4; k++) {
                if (nextStep.bottles[i][3 - k] === bottle1.topColor && removed < bottle1.movable) {
                  nextStep.bottles[i][3 - k] = empty;
                  removed++;
                }

                if (nextStep.bottles[j][k] === empty && moved < bottle1.movable) {
                  nextStep.bottles[j][k] = bottle1.topColor;
                  moved++;
                }
              }

              if (isSolved(nextStep.bottles)) {
                solved = nextStep;
                break solving;
              }

              stepQueue.push(nextStep);
              complexity++;
            }
          }
        }
      }

      const finalHash = hashBottles(bottles);

      return {
        moves: solved ? solved.moves : [],
        time: (Date.now() - start) / 1000,
        complexity: complexity,
        puzzle: buildPuzzleLink(finalHash),
      };
    }

    $('#solve-button').on('click', function () {
      let data = [];
      $('#bottles .bottle').each(function () {
        let colorsInBottle = [];
        $(this)
          .find('.color')
          .each(function () {
            colorsInBottle.push($(this).data('color'));
          });
        data.push(colorsInBottle);
      });
      if (checkEntries(data) === false) {
        return;
      }

      const result = solve(data);
      console.log(result);

      if (result.complexity > 0) {
        $('.color-errors').hide();
        $('#solve').show();
        $('#solve-time').html(result.time);
        $('#solve-complexity').html(result.complexity);
        $('#solve-moves').html('');
        $('#solve-puzzle').attr('href', result.puzzle).html(result.puzzle);
        $(result.moves).each((index, move) => {
          $('#solve-moves').append(
            '<li><input type="checkbox" />' + (move[0] + 1) + ' -> ' + (move[1] + 1) + '</li>'
          );
        });
        if (result.moves.length === 0) {
          $('#solve-moves').append('<li>Aucune solution trouvée 😟</li>');
        }
      }
    });

    $('#solve-moves').on('change', 'input', function () {
      $(this).closest('li').toggleClass('checked', $(this).is(':checked'));
    });

    delete window.PUZZLE_OPTIONS;
  });
})();
