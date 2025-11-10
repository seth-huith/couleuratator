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

    $('#bottles').on('click', '.color', function (e) {
      colorElement = $(this);

      // Position modal at click location while clamping to viewport
      const modalDialog = $('#color-modal .modal-dialog');
      const modalWidth = modalDialog.outerWidth() || 272;
      const modalHeight = modalDialog.outerHeight() || 272;
      const margin = 12;

      const viewportWidth = $(window).width();
      const viewportHeight = $(window).height();

      const clamp = (value, min, max) => {
        if (min > max) {
          return (min + max) / 2;
        }
        return Math.min(Math.max(value, min), max);
      };

      const minX = (modalWidth / 2) + margin;
      const maxX = viewportWidth - (modalWidth / 2) - margin;
      const minY = (modalHeight / 2) + margin;
      const maxY = viewportHeight - (modalHeight / 2) - margin;

      const clientX = e.clientX !== undefined ? e.clientX : (e.originalEvent && e.originalEvent.touches ? e.originalEvent.touches[0].clientX : viewportWidth / 2);
      const clientY = e.clientY !== undefined ? e.clientY : (e.originalEvent && e.originalEvent.touches ? e.originalEvent.touches[0].clientY : viewportHeight / 2);

      const boundedX = clamp(clientX, minX, maxX);
      const boundedY = clamp(clientY, minY, maxY);

      modalDialog.css({
        'position': 'fixed',
        'left': boundedX + 'px',
        'top': boundedY + 'px',
        'margin': '0',
        'transform': 'translate(-50%, -50%)'
      });

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
        } else {
          // Initialize visual solver
          initVisualSolver(data, result.moves);
        }
      }
    });

    $('#solve-moves').on('change', 'input[type="checkbox"]', function () {
      const checkbox = $(this);
      const listItem = checkbox.closest('li');
      const stepIndex = $('#solve-moves li').index(listItem) + 1; // +1 because steps start at 1

      // Ignore if we're syncing from visualizer
      if (typeof visualState !== 'undefined' && visualState.syncingCheckboxes) {
        return;
      }

      if (checkbox.is(':checked')) {
        // Only allow checking the next unchecked step
        const previousCheckboxes = $('#solve-moves input[type="checkbox"]').slice(0, stepIndex - 1);
        const allPreviousChecked = previousCheckboxes.toArray().every(cb => $(cb).is(':checked'));

        if (!allPreviousChecked) {
          // Prevent checking if previous steps aren't checked
          checkbox.prop('checked', false);
          return;
        }

        listItem.addClass('checked');

        // Checking checkbox N means completing move N, so advance to step N+1
        if ($('#visual-solver').is(':visible') && typeof visualState !== 'undefined') {
          goToStep(stepIndex + 1);
        }
      } else {
        // Unchecking checkbox N means undoing move N, so go back to step N
        if (typeof visualState !== 'undefined') {
          visualState.syncingCheckboxes = true;
        }

        listItem.removeClass('checked');
        $('#solve-moves li').slice(stepIndex).each(function() {
          $(this).find('input[type="checkbox"]').prop('checked', false);
          $(this).removeClass('checked');
        });

        if (typeof visualState !== 'undefined') {
          visualState.syncingCheckboxes = false;
        }

        // Move visualizer to show the state before this move
        if ($('#visual-solver').is(':visible') && typeof visualState !== 'undefined') {
          goToStep(stepIndex);
        }
      }
    });

    /* ------------------ VISUAL SOLVER ------------------ */
    let visualState = {
      initialBottles: [],
      moves: [],
      currentStep: 1,
      playInterval: null,
      syncingCheckboxes: false
    };

    function applyMove(bottles, move) {
      const [from, to] = move;
      const newBottles = bottles.map(b => [...b]);

      // Find top color from source bottle
      let topColor = empty;
      let moveCount = 0;

      for (let i = 3; i >= 0; i--) {
        if (newBottles[from][i] !== empty) {
          topColor = newBottles[from][i];
          break;
        }
      }

      // Count how many of this color to move
      for (let i = 3; i >= 0; i--) {
        if (newBottles[from][i] === topColor) {
          moveCount++;
        } else if (newBottles[from][i] !== empty) {
          break;
        }
      }

      // Remove from source
      let removed = 0;
      for (let i = 3; i >= 0 && removed < moveCount; i--) {
        if (newBottles[from][i] === topColor) {
          newBottles[from][i] = empty;
          removed++;
        }
      }

      // Add to destination
      let added = 0;
      for (let i = 0; i < 4 && added < moveCount; i++) {
        if (newBottles[to][i] === empty) {
          newBottles[to][i] = topColor;
          added++;
        }
      }

      return newBottles;
    }

    function getBottlePosition(index, colorIndex = null) {
      const bottles = $('#visual-bottles .bottle');
      if (index >= bottles.length) return { x: 0, y: 0 };

      const bottle = bottles.eq(index);
      const bottleOffset = bottle.offset();
      const containerOffset = $('#visual-bottles-container').offset();

      // Get horizontal center of bottle
      const x = bottleOffset.left - containerOffset.left + bottle.width() / 2;

      let y;
      if (colorIndex !== null) {
        // Get position of specific color segment
        // Each segment is 40px tall, positioned from bottom
        // colorIndex 0 = bottom, 1 = second from bottom, etc.
        const segmentHeight = 40;
        const bottleHeight = 186;
        const indexHeight = 25; // height of index number at top

        // Calculate y position for the center of the specific segment
        // The bottle top is at bottleOffset.top
        // Segments are positioned from bottom, so we need to calculate from top
        const bottomOfSegment = bottleHeight - (colorIndex * segmentHeight);
        const centerOfSegment = bottomOfSegment - (segmentHeight / 2);

        y = bottleOffset.top - containerOffset.top + centerOfSegment;
      } else {
        // Get center of bottle
        y = bottleOffset.top - containerOffset.top + bottle.height() / 2;
      }

      return { x, y };
    }

    function drawArrow(fromIndex, toIndex, color, fromColorIndex, toColorIndex) {
      const svg = $('#move-arrows');
      svg.empty();

      // Create arrowhead marker and shadow filter
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

      // Shadow filter for shadow line
      const shadowFilter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
      shadowFilter.setAttribute('id', 'shadow-blur');
      shadowFilter.setAttribute('x', '-50%');
      shadowFilter.setAttribute('y', '-50%');
      shadowFilter.setAttribute('width', '200%');
      shadowFilter.setAttribute('height', '200%');

      const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
      feGaussianBlur.setAttribute('in', 'SourceGraphic');
      feGaussianBlur.setAttribute('stdDeviation', '2');

      shadowFilter.appendChild(feGaussianBlur);
      defs.appendChild(shadowFilter);

      const arrowShadow = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
      arrowShadow.setAttribute('id', 'arrow-drop-shadow');
      arrowShadow.setAttribute('x', '-20%');
      arrowShadow.setAttribute('y', '-20%');
      arrowShadow.setAttribute('width', '140%');
      arrowShadow.setAttribute('height', '140%');

      const feDropShadow = document.createElementNS('http://www.w3.org/2000/svg', 'feDropShadow');
      feDropShadow.setAttribute('dx', '0');
      feDropShadow.setAttribute('dy', '1');
      feDropShadow.setAttribute('stdDeviation', '0.8');
      feDropShadow.setAttribute('flood-color', '#000000');
      feDropShadow.setAttribute('flood-opacity', '0.25');

      arrowShadow.appendChild(feDropShadow);
      defs.appendChild(arrowShadow);

      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
      marker.setAttribute('id', 'arrowhead');
      marker.setAttribute('markerWidth', '8');
      marker.setAttribute('markerHeight', '8');
      marker.setAttribute('refX', '4');
      marker.setAttribute('refY', '4');
      marker.setAttribute('orient', 'auto');
      marker.setAttribute('markerUnits', 'strokeWidth');

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '4');
      circle.setAttribute('cy', '4');
      circle.setAttribute('r', '1.2');
      circle.setAttribute('fill', color || '#ffffff');
      circle.setAttribute('opacity', '0.95');

      marker.appendChild(circle);
      defs.appendChild(marker);
      svg.append(defs);

      const from = getBottlePosition(fromIndex, fromColorIndex);
      const to = getBottlePosition(toIndex, toColorIndex);

      // Adapt arrow position
      to.x += 3;
      to.y -= 4;

      // Calculate control point for curved arrow
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Control point for bezier curve (curved upward more)
      const curvature = Math.min(150, distance * 0.5);
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2 - curvature;

      // Create curved path data
      const pathData = `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;

      // Draw straight shadow line first (wider with drop shadow)
      const shadowLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      shadowLine.setAttribute('x1', from.x);
      shadowLine.setAttribute('y1', from.y);
      shadowLine.setAttribute('x2', to.x);
      shadowLine.setAttribute('y2', to.y);
      shadowLine.setAttribute('stroke', '#000000');
      shadowLine.setAttribute('stroke-width', '4');
      shadowLine.setAttribute('opacity', '0.35');
      shadowLine.setAttribute('filter', 'url(#shadow-blur)');
      svg.append(shadowLine);

      // Create main colored path
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      path.setAttribute('stroke', color || '#ffffff');
      path.setAttribute('stroke-width', '7');
      path.setAttribute('fill', 'none');
      path.setAttribute('marker-end', 'url(#arrowhead)');
      path.setAttribute('opacity', '0.95');
      path.setAttribute('filter', 'url(#arrow-drop-shadow)');

      svg.append(path);

      // Add glowing pulse that travels along the path
      const pulsePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pulsePath.setAttribute('d', pathData);
      pulsePath.setAttribute('stroke', '#ffffff');
      pulsePath.setAttribute('stroke-width', '9');
      pulsePath.setAttribute('fill', 'none');
      pulsePath.setAttribute('stroke-linecap', 'round');
      pulsePath.setAttribute('opacity', '0.55');
      pulsePath.setAttribute('stroke-dasharray', '30 400');
      pulsePath.setAttribute('stroke-dashoffset', '0');
      pulsePath.setAttribute('class', 'arrow-pulse');

      svg.append(pulsePath);

      // Add moving dotted line overlay
      const dottedPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      dottedPath.setAttribute('d', pathData);
      dottedPath.setAttribute('stroke', '#000000');
      dottedPath.setAttribute('stroke-width', '5');
      dottedPath.setAttribute('fill', 'none');
      dottedPath.setAttribute('stroke-dasharray', '1 10');
      dottedPath.setAttribute('stroke-dashoffset', '20');
      dottedPath.setAttribute('stroke-linecap', 'round');
      dottedPath.setAttribute('opacity', '0.35');
      dottedPath.setAttribute('class', 'dashed');

      svg.append(dottedPath);

      // Add circle at starting position
      // Removed the origin dot for a cleaner arrow
    }

    function renderVisualBottles(bottles, highlightFrom = -1, highlightTo = -1, transferColor = null) {
      const container = $('#visual-bottles');
      container.html('');

      const maxBottlesPerRow = 6;
      let currentRow = null;

      bottles.forEach((bottleColors, index) => {
        // Create a new row every 6 bottles
        if (index % maxBottlesPerRow === 0) {
          currentRow = $('<div class="bottle-row"></div>');
          container.append(currentRow);
        }

        const bottleDiv = $(bottle);
        bottleDiv.find('.color').each(function(i) {
          const colorKey = bottleColors[i];
          $(this).data('color', colorKey);
          $(this).css({ background: colors[colorKey] });
        });
        bottleDiv.find('.index').html(index + 1);

        currentRow.append(bottleDiv);
      });

      // Draw arrow if there's an active move
      if (highlightFrom >= 0 && highlightTo >= 0 && transferColor) {
        // Find the topmost non-empty color in source bottle
        let fromColorIndex = -1;
        for (let i = 3; i >= 0; i--) {
          if (bottles[highlightFrom][i] !== empty) {
            fromColorIndex = i;
            break;
          }
        }

        // Find where the color will land in destination bottle (topmost empty or top of stack)
        let toColorIndex = -1;
        for (let i = 0; i < 4; i++) {
          if (bottles[highlightTo][i] === empty) {
            toColorIndex = i;
            break;
          }
        }
        // If no empty found, colors will stack on top (shouldn't happen in valid moves)
        if (toColorIndex === -1) toColorIndex = 3;

        // Wait for DOM to update before drawing arrow
        setTimeout(() => {
          // Update SVG height to match content
          const containerHeight = $('#visual-bottles').outerHeight();
          $('#move-arrows').height(containerHeight);
          $('#visual-bottles-container').height(containerHeight);

          drawArrow(highlightFrom, highlightTo, transferColor, fromColorIndex, toColorIndex);
        }, 50);
      } else {
        $('#move-arrows').empty();
      }
    }

    function goToStep(step) {
      visualState.currentStep = step;

      // Show state BEFORE the current move (step N shows state before move N)
      let currentBottles = visualState.initialBottles.map(b => [...b]);
      let highlightFrom = -1;
      let highlightTo = -1;
      let transferColor = null;

      // Apply all moves up to (but not including) current step
      for (let i = 0; i < step - 1; i++) {
        currentBottles = applyMove(currentBottles, visualState.moves[i]);
      }

      // Get highlight info and transfer color for current move
      if (step >= 1 && step <= visualState.moves.length) {
        const move = visualState.moves[step - 1];
        highlightFrom = move[0];
        highlightTo = move[1];

        // Find the color being transferred from current state
        for (let i = 3; i >= 0; i--) {
          if (currentBottles[highlightFrom][i] !== empty) {
            transferColor = colors[currentBottles[highlightFrom][i]];
            break;
          }
        }
      }

      renderVisualBottles(currentBottles, highlightFrom, highlightTo, transferColor);

      $('#current-step').text(step);

      // Update move info
      if (step >= 1 && step <= visualState.moves.length) {
        const move = visualState.moves[step - 1];
        $('#current-move').text('Move: ' + (move[0] + 1) + ' → ' + (move[1] + 1));
      }

      // Update button states
      $('#step-first, #step-prev').prop('disabled', step === 1);
      $('#step-next, #step-last').prop('disabled', step === visualState.moves.length);

      // Synchronize checkboxes: check all moves that have been completed
      // At step N, we show state before move N, so moves 1 through N-1 are completed
      visualState.syncingCheckboxes = true;
      $('#solve-moves input[type="checkbox"]').each(function(index) {
        const shouldBeChecked = index < (step - 1);
        const isChecked = $(this).is(':checked');

        if (shouldBeChecked !== isChecked) {
          $(this).prop('checked', shouldBeChecked);
          $(this).closest('li').toggleClass('checked', shouldBeChecked);
        }
      });
      visualState.syncingCheckboxes = false;
    }

    function startPlayback() {
      $('#step-play').hide();
      $('#step-pause').show();

      visualState.playInterval = setInterval(() => {
        if (visualState.currentStep < visualState.moves.length) {
          goToStep(visualState.currentStep + 1);
        } else {
          stopPlayback();
        }
      }, 1500);
    }

    function stopPlayback() {
      $('#step-pause').hide();
      $('#step-play').show();

      if (visualState.playInterval) {
        clearInterval(visualState.playInterval);
        visualState.playInterval = null;
      }
    }

    function initVisualSolver(initialBottles, moves) {
      visualState.initialBottles = initialBottles.map(b => [...b]);
      visualState.moves = moves;
      visualState.currentStep = 1;
      visualState.syncingCheckboxes = false;

      $('#visual-solver').show();
      $('#total-steps').text(moves.length);

      // Initialize with first step, which will check the first checkbox
      goToStep(1);

      // Smooth scroll to visual solver
      setTimeout(() => {
        const visualSolver = document.getElementById('visual-solver');
        if (visualSolver) {
          visualSolver.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }

    // Visual solver controls
    $('#step-first').on('click', () => {
      stopPlayback();
      goToStep(1);
    });

    $('#step-prev').on('click', () => {
      stopPlayback();
      if (visualState.currentStep > 1) {
        goToStep(visualState.currentStep - 1);
      }
    });

    $('#step-next').on('click', () => {
      stopPlayback();
      if (visualState.currentStep < visualState.moves.length) {
        goToStep(visualState.currentStep + 1);
      }
    });

    $('#step-last').on('click', () => {
      stopPlayback();
      goToStep(visualState.moves.length);
    });

    $('#step-play').on('click', startPlayback);
    $('#step-pause').on('click', stopPlayback);

    // Keyboard controls - Space and Enter advance to next step
    $(document).on('keydown', function(e) {
      // Only handle keyboard if visual solver is visible
      if ($('#visual-solver').is(':visible')) {
        if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter') {
          e.preventDefault();
          if (visualState.currentStep < visualState.moves.length) {
            stopPlayback();
            goToStep(visualState.currentStep + 1);
          }
        }
        // Arrow keys for navigation
        else if (e.key === 'ArrowRight') {
          e.preventDefault();
          if (visualState.currentStep < visualState.moves.length) {
            stopPlayback();
            goToStep(visualState.currentStep + 1);
          }
        }
        else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          if (visualState.currentStep > 1) {
            stopPlayback();
            goToStep(visualState.currentStep - 1);
          }
        }
      }
    });

    // Click/tap on visualization area to advance
    $('#visual-bottles-container').on('click', function() {
      if (visualState.currentStep < visualState.moves.length) {
        stopPlayback();
        goToStep(visualState.currentStep + 1);
      }
    });

    delete window.PUZZLE_OPTIONS;
  });
})();
