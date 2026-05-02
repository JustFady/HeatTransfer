(function () {
  "use strict";

  var Limits = {
    minTemp: -20,
    maxTemp: 100,
    maxTime: 180
  };

  var Physics = {
    waterTemp: 100,
    ballRadius: 0.01,
    ballMass: 0.0103,
    steelSpecificHeat: 450.0,
    nominalHeatCoefficient: 50.2,
    waterDensity: 958.4,
    waterViscosity: 0.000282,
    waterConductivity: 0.679,
    prandtl: 1.75,
    ballDiameter: 0.02,
    dropDuration: 2,
    airTop: 0,
    waterTop: 266
  };

  var Field = {
    columns: 34,
    rows: 22,
    ambientTemp: 100,
    diffusion: 0.08,
    plumeStrength: 0.42
  };

  var ui = {
    form: document.getElementById("simulation-form"),
    startButton: document.getElementById("start-button"),
    pauseButton: document.getElementById("pause-button"),
    stopButton: document.getElementById("stop-button"),
    resetButton: document.getElementById("reset-button"),
    downloadButton: document.getElementById("download-button"),
    temperatureInput: document.getElementById("temperature"),
    durationInput: document.getElementById("duration"),
    speedInput: document.getElementById("speed"),
    message: document.getElementById("message"),
    elapsed: document.getElementById("elapsed"),
    currentTemp: document.getElementById("current-temp"),
    finalTemp: document.getElementById("final-temp"),
    heatFlux: document.getElementById("heat-flux"),
    fluidSpeed: document.getElementById("fluid-speed"),
    runStatus: document.getElementById("run-status"),
    ball: document.getElementById("ball"),
    temperatureLabel: document.getElementById("temperature-label"),
    resultsBody: document.getElementById("results-body"),
    chart: document.getElementById("chart"),
    fieldCanvas: document.getElementById("field-canvas"),
    surfaceArea: document.getElementById("surface-area"),
    trialCoefficient: document.getElementById("trial-coefficient"),
    reynoldsNumber: document.getElementById("reynolds-number"),
    nusseltNumber: document.getElementById("nusselt-number")
  };

  var state = {
    rows: [],
    timer: null,
    activeIndex: 0,
    status: "ready",
    trial: createNominalTrial(),
    field: createField(),
    phase: 0
  };

  function surfaceArea() {
    return 4 * Math.PI * Math.pow(Physics.ballRadius, 2);
  }

  function heatTransferRate(coefficient) {
    return coefficient * surfaceArea() /
      (Physics.ballMass * Physics.steelSpecificHeat);
  }

  function createNominalTrial() {
    return {
      coefficient: Physics.nominalHeatCoefficient,
      baseVelocity: 0.028,
      phase: 0,
      noiseScale: 0
    };
  }

  function createTrial() {
    return {
      coefficient: Physics.nominalHeatCoefficient * (0.9 + (Math.random() * 0.2)),
      baseVelocity: 0.018 + (Math.random() * 0.035),
      phase: Math.random() * Math.PI * 2,
      noiseScale: 0.24 + (Math.random() * 0.18)
    };
  }

  function createField() {
    var cells = [];
    var velocities = [];
    var count = Field.columns * Field.rows;

    for (var i = 0; i < count; i += 1) {
      cells.push(Field.ambientTemp);
      velocities.push({ x: 0, y: 0 });
    }

    return {
      cells: cells,
      velocities: velocities
    };
  }

  function resetField() {
    state.field = createField();
    drawField(null);
  }

  function validateInputs(initialTemperature, duration) {
    if (Number.isNaN(initialTemperature) || initialTemperature < Limits.minTemp || initialTemperature > Limits.maxTemp) {
      return "Enter a steel ball temperature from -20 C to 100 C.";
    }

    if (Number.isNaN(duration) || duration < 1 || duration > Limits.maxTime) {
      return "Enter a simulation time from 1 to 180 seconds.";
    }

    return "";
  }

  function buildTrialRows(initialTemperature, duration, trial) {
    var rows = [];
    var drift = 50;
    var driftVelocity = (Math.random() - 0.5) * 2.4;

    for (var second = 0; second <= duration; second += 1) {
      var immersedTime = Math.max(0, second - Physics.dropDuration);
      var modelTemperature = Physics.waterTemp -
        ((Physics.waterTemp - initialTemperature) * Math.exp(-heatTransferRate(trial.coefficient) * immersedTime));
      var measuredTemperature = clamp(
        modelTemperature + (randomNormal() * trial.noiseScale) + (Math.sin(second * 0.45 + trial.phase) * 0.16),
        Limits.minTemp,
        Physics.waterTemp
      );
      var motion = getBallMotion(second, duration, trial.phase, drift, driftVelocity);
      var reynolds = getReynolds(trial.baseVelocity, second, trial.phase);
      var nusselt = getNusselt(reynolds);
      var heatFlux = trial.coefficient * Math.max(0, Physics.waterTemp - modelTemperature);

      drift = motion.nextDrift;
      driftVelocity = motion.nextVelocity;

      rows.push({
        time: second,
        temperature: measuredTemperature,
        modelTemperature: modelTemperature,
        delta: Physics.waterTemp - measuredTemperature,
        heatFlux: heatFlux,
        reynolds: reynolds,
        nusselt: nusselt,
        fluidSpeed: reynolds * Physics.waterViscosity / (Physics.waterDensity * Physics.ballDiameter),
        ballTop: motion.top,
        ballLeftPercent: motion.leftPercent,
        immersed: second >= Physics.dropDuration
      });
    }

    return rows;
  }

  function getBallMotion(second, duration, phase, drift, velocity) {
    if (second <= Physics.dropDuration) {
      var fallPercent = second / Physics.dropDuration;
      return {
        top: Physics.airTop + ((Physics.waterTop - Physics.airTop) * easeIn(fallPercent)),
        leftPercent: 50 + Math.sin(second * 1.4 + phase) * 2,
        nextDrift: drift,
        nextVelocity: velocity
      };
    }

    var nextVelocity = (velocity * 0.84) + ((Math.random() - 0.5) * 4.6);
    var nextDrift = clamp(drift + nextVelocity, 20, 80);
    var bob = Math.sin(second * 0.68 + phase) * 24;
    var vortexBob = Math.sin(second / Math.max(12, duration) * Math.PI * 4 + phase) * 9;

    return {
      top: Physics.waterTop + bob + vortexBob,
      leftPercent: nextDrift,
      nextDrift: nextDrift,
      nextVelocity: nextVelocity
    };
  }

  function getReynolds(baseVelocity, second, phase) {
    var velocity = baseVelocity * (1 + (Math.sin(second * 0.36 + phase) * 0.25));
    return Math.max(1, Physics.waterDensity * velocity * Physics.ballDiameter / Physics.waterViscosity);
  }

  function getNusselt(reynolds) {
    return 2 + (0.6 * Math.sqrt(reynolds) * Math.pow(Physics.prandtl, 1 / 3));
  }

  function randomNormal() {
    var u = 0;
    var v = 0;
    while (u === 0) {
      u = Math.random();
    }
    while (v === 0) {
      v = Math.random();
    }
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function easeIn(percent) {
    return percent * percent;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function renderRows(rows) {
    ui.resultsBody.innerHTML = "";

    rows.forEach(function (row, index) {
      var tr = document.createElement("tr");
      tr.dataset.index = String(index);
      appendCell(tr, row.time.toFixed(0));
      appendCell(tr, row.temperature.toFixed(1));
      appendCell(tr, row.delta.toFixed(1));
      appendCell(tr, row.heatFlux.toFixed(1));
      appendCell(tr, row.reynolds.toFixed(0));
      appendCell(tr, row.nusselt.toFixed(1));
      ui.resultsBody.appendChild(tr);
    });
  }

  function appendCell(row, text) {
    var cell = document.createElement("td");
    cell.textContent = text;
    row.appendChild(cell);
  }

  function renderFrame(row) {
    ui.elapsed.textContent = row.time.toFixed(0) + " s";
    ui.currentTemp.textContent = row.temperature.toFixed(1) + " C";
    ui.heatFlux.textContent = row.heatFlux.toFixed(1) + " W/m^2";
    ui.fluidSpeed.textContent = (row.fluidSpeed * 1000).toFixed(1) + " mm/s";
    ui.temperatureLabel.textContent = "T = " + row.temperature.toFixed(1) + " C";
    ui.ball.style.top = row.ballTop.toFixed(1) + "px";
    ui.ball.style.left = "calc(" + row.ballLeftPercent.toFixed(1) + "% - 28px)";
    setBallTemperature(row.temperature);
    setActiveRow(state.activeIndex);
    updateField(row);
    drawField(row);
    drawChart(state.rows, row);
  }

  function setActiveRow(index) {
    Array.prototype.forEach.call(ui.resultsBody.querySelectorAll("tr"), function (row) {
      row.classList.toggle("active", Number(row.dataset.index) === index);
    });
  }

  function updateField(row) {
    var next = state.field.cells.slice();
    var velocities = state.field.velocities;
    var ballX = Math.round((row.ballLeftPercent / 100) * (Field.columns - 1));
    var ballY = Math.round(((row.ballTop - 132) / 300) * (Field.rows - 1));

    for (var y = 0; y < Field.rows; y += 1) {
      for (var x = 0; x < Field.columns; x += 1) {
        var index = getFieldIndex(x, y);
        var current = state.field.cells[index];
        var neighbors = getNeighborAverage(x, y);
        var swirl = Math.sin((x * 0.45) + (state.phase * 0.03)) * Math.cos((y * 0.4) - (state.phase * 0.02));
        next[index] = current + ((neighbors - current) * Field.diffusion) + (swirl * 0.012);
        velocities[index] = {
          x: Math.cos((y * 0.5) + (state.phase * 0.05)) * row.fluidSpeed * 1000,
          y: -Math.sin((x * 0.35) + (state.phase * 0.04)) * row.fluidSpeed * 700
        };
      }
    }

    if (row.immersed) {
      for (var py = -2; py <= 2; py += 1) {
        for (var px = -2; px <= 2; px += 1) {
          var cx = clamp(ballX + px, 0, Field.columns - 1);
          var cy = clamp(ballY + py, 0, Field.rows - 1);
          var distance = Math.max(1, Math.sqrt((px * px) + (py * py)));
          var plumeIndex = getFieldIndex(cx, cy);
          next[plumeIndex] = next[plumeIndex] - ((Physics.waterTemp - row.modelTemperature) * Field.plumeStrength / distance);
        }
      }
    }

    state.field.cells = next.map(function (temperature) {
      return clamp(temperature, Math.max(Limits.minTemp, row.modelTemperature - 6), Physics.waterTemp);
    });
    state.phase += 1;
  }

  function getNeighborAverage(x, y) {
    var total = 0;
    var count = 0;

    for (var oy = -1; oy <= 1; oy += 1) {
      for (var ox = -1; ox <= 1; ox += 1) {
        var nx = x + ox;
        var ny = y + oy;
        if (nx >= 0 && nx < Field.columns && ny >= 0 && ny < Field.rows) {
          total += state.field.cells[getFieldIndex(nx, ny)];
          count += 1;
        }
      }
    }

    return total / count;
  }

  function getFieldIndex(x, y) {
    return y * Field.columns + x;
  }

  function drawField(row) {
    var context = ui.fieldCanvas.getContext("2d");
    var width = ui.fieldCanvas.width;
    var height = ui.fieldCanvas.height;
    var cellWidth = width / Field.columns;
    var cellHeight = height / Field.rows;

    context.clearRect(0, 0, width, height);

    for (var y = 0; y < Field.rows; y += 1) {
      for (var x = 0; x < Field.columns; x += 1) {
        var index = getFieldIndex(x, y);
        context.fillStyle = getTemperatureColor(state.field.cells[index]);
        context.fillRect(x * cellWidth, y * cellHeight, Math.ceil(cellWidth), Math.ceil(cellHeight));
      }
    }

    drawVelocityVectors(context, cellWidth, cellHeight);

    if (row && row.immersed) {
      context.fillStyle = "rgba(255, 255, 255, 0.74)";
      context.font = "13px Arial";
      context.fillText("cool thermal wake + recirculation field", 14, 24);
    }
  }

  function drawVelocityVectors(context, cellWidth, cellHeight) {
    context.strokeStyle = "rgba(22, 35, 45, 0.42)";
    context.lineWidth = 1;

    for (var y = 2; y < Field.rows; y += 4) {
      for (var x = 2; x < Field.columns; x += 4) {
        var velocity = state.field.velocities[getFieldIndex(x, y)];
        var startX = (x + 0.5) * cellWidth;
        var startY = (y + 0.5) * cellHeight;
        var endX = startX + clamp(velocity.x, -9, 9);
        var endY = startY + clamp(velocity.y, -9, 9);
        context.beginPath();
        context.moveTo(startX, startY);
        context.lineTo(endX, endY);
        context.stroke();
      }
    }
  }

  function getTemperatureColor(temperature) {
    var percent = clamp((temperature - 55) / 45, 0, 1);
    var r = Math.round(45 + (215 * percent));
    var g = Math.round(118 + (76 * percent));
    var b = Math.round(178 - (126 * percent));
    return "rgb(" + r + ", " + g + ", " + b + ")";
  }

  function drawChart(rows, activeRow) {
    var context = ui.chart.getContext("2d");
    var width = ui.chart.width;
    var height = ui.chart.height;
    var margin = { top: 26, right: 30, bottom: 48, left: 64 };
    var plotWidth = width - margin.left - margin.right;
    var plotHeight = height - margin.top - margin.bottom;
    var maxTime = rows.length ? rows[rows.length - 1].time : 1;
    var minTemp = Math.min(Limits.minTemp, getMinimumTemperature(rows));
    var maxTemp = Physics.waterTemp;

    context.clearRect(0, 0, width, height);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    drawGrid(context, margin, plotWidth, plotHeight, maxTime, minTemp, maxTemp);
    drawCurve(context, rows, margin, plotWidth, plotHeight, maxTime, minTemp, maxTemp);

    if (activeRow) {
      drawActivePoint(context, activeRow, margin, plotWidth, plotHeight, maxTime, minTemp, maxTemp);
    }

    context.fillStyle = "#16232d";
    context.font = "16px Arial";
    context.fillText("Measured ball temperature vs. time", margin.left, 20);
  }

  function drawGrid(context, margin, plotWidth, plotHeight, maxTime, minTemp, maxTemp) {
    context.strokeStyle = "#d7e1e8";
    context.lineWidth = 1;
    context.fillStyle = "#5e6b74";
    context.font = "12px Arial";

    for (var i = 0; i <= 5; i += 1) {
      var x = margin.left + (plotWidth * i / 5);
      context.beginPath();
      context.moveTo(x, margin.top);
      context.lineTo(x, margin.top + plotHeight);
      context.stroke();
      context.fillText(String(Math.round(maxTime * i / 5)), x - 8, margin.top + plotHeight + 24);
    }

    for (var j = 0; j <= 5; j += 1) {
      var y = margin.top + (plotHeight * j / 5);
      var tempLabel = maxTemp - ((maxTemp - minTemp) * j / 5);
      context.beginPath();
      context.moveTo(margin.left, y);
      context.lineTo(margin.left + plotWidth, y);
      context.stroke();
      context.fillText(tempLabel.toFixed(0), 18, y + 4);
    }

    context.strokeStyle = "#16232d";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(margin.left, margin.top);
    context.lineTo(margin.left, margin.top + plotHeight);
    context.lineTo(margin.left + plotWidth, margin.top + plotHeight);
    context.stroke();
    context.fillStyle = "#16232d";
    context.fillText("Time (s)", margin.left + plotWidth / 2 - 24, margin.top + plotHeight + 40);
    context.save();
    context.translate(18, margin.top + plotHeight / 2 + 34);
    context.rotate(-Math.PI / 2);
    context.fillText("Temperature (C)", 0, 0);
    context.restore();
  }

  function drawCurve(context, rows, margin, plotWidth, plotHeight, maxTime, minTemp, maxTemp) {
    if (!rows.length) {
      return;
    }

    context.strokeStyle = "#d75a3a";
    context.lineWidth = 3;
    context.beginPath();
    rows.forEach(function (row, index) {
      var point = getChartPoint(row, margin, plotWidth, plotHeight, maxTime, minTemp, maxTemp);
      if (index === 0) {
        context.moveTo(point.x, point.y);
      } else {
        context.lineTo(point.x, point.y);
      }
    });
    context.stroke();

    context.strokeStyle = "#1e6fa8";
    context.setLineDash([6, 6]);
    context.beginPath();
    var waterY = getY(Physics.waterTemp, margin, plotHeight, minTemp, maxTemp);
    context.moveTo(margin.left, waterY);
    context.lineTo(margin.left + plotWidth, waterY);
    context.stroke();
    context.setLineDash([]);
    context.fillStyle = "#1e6fa8";
    context.fillText("Water bath 100 C", margin.left + plotWidth - 112, waterY - 8);
  }

  function drawActivePoint(context, row, margin, plotWidth, plotHeight, maxTime, minTemp, maxTemp) {
    var point = getChartPoint(row, margin, plotWidth, plotHeight, maxTime, minTemp, maxTemp);
    context.fillStyle = "#16232d";
    context.beginPath();
    context.arc(point.x, point.y, 6, 0, Math.PI * 2);
    context.fill();
  }

  function getMinimumTemperature(rows) {
    return rows.reduce(function (minimum, row) {
      return Math.min(minimum, row.temperature);
    }, Physics.waterTemp);
  }

  function getChartPoint(row, margin, plotWidth, plotHeight, maxTime, minTemp, maxTemp) {
    return {
      x: margin.left + (plotWidth * row.time / Math.max(1, maxTime)),
      y: getY(row.temperature, margin, plotHeight, minTemp, maxTemp)
    };
  }

  function getY(temperature, margin, plotHeight, minTemp, maxTemp) {
    return margin.top + plotHeight - (plotHeight * (temperature - minTemp) / (maxTemp - minTemp));
  }

  function setBallTemperature(temperature) {
    var percent = clamp((temperature - Limits.minTemp) / (Limits.maxTemp - Limits.minTemp), 0, 1);
    var r = interpolate(45, 216, percent);
    var g = interpolate(68, 82, percent);
    var b = interpolate(89, 58, percent);
    var highlightR = interpolate(139, 245, percent);
    var highlightG = interpolate(160, 165, percent);
    var highlightB = interpolate(176, 124, percent);
    ui.ball.style.background = "radial-gradient(circle at 35% 30%, rgb(" +
      highlightR + ", " + highlightG + ", " + highlightB + "), rgb(" +
      r + ", " + g + ", " + b + ") 68%)";
  }

  function interpolate(start, end, percent) {
    return Math.round(start + ((end - start) * percent));
  }

  function startSimulation(event) {
    event.preventDefault();

    var input = readInputs();
    var validationMessage = validateInputs(input.initialTemperature, input.duration);
    if (validationMessage) {
      ui.message.textContent = validationMessage;
      return;
    }

    if (state.status === "running") {
      ui.message.textContent = "Simulation is already running. Use Pause or Stop first.";
      return;
    }

    stopTimer();
    state.status = "running";
    state.activeIndex = 0;
    state.trial = createTrial();
    resetField();
    state.rows = buildTrialRows(input.initialTemperature, input.duration, state.trial);
    renderRows(state.rows);
    updateTrialReadouts(state.rows);
    ui.message.textContent = "New trial running.";
    ui.runStatus.textContent = "Running";
    renderFrame(state.rows[state.activeIndex]);
    state.activeIndex += 1;
    state.timer = window.setInterval(stepSimulation, Number(ui.speedInput.value));
    updateControlState();
  }

  function stepSimulation() {
    if (state.activeIndex >= state.rows.length) {
      stopTimer();
      state.status = "complete";
      ui.message.textContent = "Simulation complete.";
      ui.runStatus.textContent = "Complete";
      updateControlState();
      return;
    }

    renderFrame(state.rows[state.activeIndex]);
    state.activeIndex += 1;
  }

  function pauseSimulation() {
    if (state.status === "running") {
      stopTimer();
      state.status = "paused";
      ui.message.textContent = "Simulation paused.";
      ui.runStatus.textContent = "Paused";
    } else if (state.status === "paused") {
      state.status = "running";
      ui.message.textContent = "Simulation running.";
      ui.runStatus.textContent = "Running";
      state.timer = window.setInterval(stepSimulation, Number(ui.speedInput.value));
    }

    updateControlState();
  }

  function stopSimulation() {
    if (state.status === "running" || state.status === "paused") {
      stopTimer();
      state.activeIndex = Math.max(0, state.activeIndex - 1);
      state.status = "stopped";
      ui.message.textContent = "Simulation stopped. Current trial data is preserved. Press Start for a new trial or Reset to clear.";
      ui.runStatus.textContent = "Stopped";
      updateControlState();
    }
  }

  function stopTimer() {
    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }
  }

  function resetAll() {
    stopTimer();
    state.status = "ready";
    state.activeIndex = 0;
    state.trial = createNominalTrial();
    ui.temperatureInput.value = "20";
    ui.durationInput.value = "60";
    ui.speedInput.value = "100";
    ui.message.textContent = "";
    ui.runStatus.textContent = "Ready";
    resetField();
    buildPreview();
    updateControlState();
  }

  function buildPreview() {
    var input = readInputs();
    var validationMessage = validateInputs(input.initialTemperature, input.duration);

    if (validationMessage) {
      ui.message.textContent = validationMessage;
      return;
    }

    state.rows = buildTrialRows(input.initialTemperature, input.duration, state.trial);
    renderRows(state.rows);
    updateTrialReadouts(state.rows);
    renderFrame(state.rows[0]);
  }

  function updateTrialReadouts(rows) {
    var finalRow = rows[rows.length - 1];
    var representativeRow = rows[Math.min(rows.length - 1, Math.max(1, Math.round(rows.length / 3)))];
    ui.finalTemp.textContent = finalRow.temperature.toFixed(1) + " C";
    ui.trialCoefficient.textContent = state.trial.coefficient.toFixed(2) + " W/m^2 C";
    ui.reynoldsNumber.textContent = representativeRow.reynolds.toFixed(0);
    ui.nusseltNumber.textContent = representativeRow.nusselt.toFixed(1);
  }

  function handleInputChange() {
    if (state.status === "running" || state.status === "paused") {
      stopSimulation();
    }

    if (state.status === "stopped" || state.status === "complete") {
      ui.message.textContent = "Inputs changed. Preview reset with nominal parameters.";
    }

    state.status = "ready";
    state.activeIndex = 0;
    state.trial = createNominalTrial();
    ui.runStatus.textContent = "Ready";
    ui.message.textContent = "";
    resetField();
    buildPreview();
    updateControlState();
  }

  function updateControlState() {
    ui.startButton.textContent = state.status === "stopped" || state.status === "complete" ? "Start New Trial" : "Start";
    ui.pauseButton.disabled = !(state.status === "running" || state.status === "paused");
    ui.pauseButton.textContent = state.status === "paused" ? "Resume" : "Pause";
    ui.stopButton.disabled = !(state.status === "running" || state.status === "paused");
  }

  function readInputs() {
    return {
      initialTemperature: Number(ui.temperatureInput.value),
      duration: Number(ui.durationInput.value)
    };
  }

  function downloadCsv() {
    if (!state.rows.length) {
      buildPreview();
    }

    var csv = "Time (s),Measured ball temperature (C),Model ball temperature (C),Delta to water (C),Heat flux (W/m^2),Reynolds,Nusselt,Fluid speed (m/s),Ball X (%),Ball Y (px),Trial h (W/m^2 C)\n" +
      state.rows.map(function (row) {
        return row.time.toFixed(0) + "," +
          row.temperature.toFixed(1) + "," +
          row.modelTemperature.toFixed(1) + "," +
          row.delta.toFixed(1) + "," +
          row.heatFlux.toFixed(1) + "," +
          row.reynolds.toFixed(0) + "," +
          row.nusselt.toFixed(1) + "," +
          row.fluidSpeed.toFixed(4) + "," +
          row.ballLeftPercent.toFixed(1) + "," +
          row.ballTop.toFixed(1) + "," +
          state.trial.coefficient.toFixed(2);
      }).join("\n");
    var blob = new Blob([csv], { type: "text/csv" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "result.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  ui.form.addEventListener("submit", startSimulation);
  ui.pauseButton.addEventListener("click", pauseSimulation);
  ui.stopButton.addEventListener("click", stopSimulation);
  ui.resetButton.addEventListener("click", resetAll);
  ui.downloadButton.addEventListener("click", downloadCsv);
  ui.temperatureInput.addEventListener("input", handleInputChange);
  ui.durationInput.addEventListener("input", handleInputChange);
  ui.speedInput.addEventListener("change", function () {
    if (state.status === "running") {
      stopTimer();
      state.timer = window.setInterval(stepSimulation, Number(ui.speedInput.value));
    }
  });

  ui.surfaceArea.textContent = surfaceArea().toFixed(6) + " m^2";
  resetAll();
})();
