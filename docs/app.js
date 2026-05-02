(function () {
  "use strict";

  var MIN_TEMP = -20;
  var MAX_TEMP = 100;
  var MAX_TIME = 180;
  var WATER_TEMP = 100;
  var BALL_RADIUS_METERS = 0.01;
  var STEEL_SPECIFIC_HEAT = 450.0;
  var STEEL_BALL_MASS = 0.0103;
  var HEAT_TRANSFER_COEFFICIENT = 50.2;
  var BALL_AIR_TOP = 0;
  var BALL_WATER_TOP = 266;
  var DROP_DURATION_SECONDS = 2;

  var form = document.getElementById("simulation-form");
  var resetButton = document.getElementById("reset-button");
  var downloadButton = document.getElementById("download-button");
  var temperatureInput = document.getElementById("temperature");
  var durationInput = document.getElementById("duration");
  var speedInput = document.getElementById("speed");
  var message = document.getElementById("message");
  var elapsed = document.getElementById("elapsed");
  var currentTemp = document.getElementById("current-temp");
  var finalTemp = document.getElementById("final-temp");
  var ball = document.getElementById("ball");
  var temperatureLabel = document.getElementById("temperature-label");
  var resultsBody = document.getElementById("results-body");
  var chart = document.getElementById("chart");
  var surfaceArea = document.getElementById("surface-area");
  var trialCoefficient = document.getElementById("trial-coefficient");

  var results = [];
  var activeTimer = null;
  var activeIndex = 0;
  var activeTrialCoefficient = HEAT_TRANSFER_COEFFICIENT;

  function getSurfaceArea() {
    return 4 * Math.PI * Math.pow(BALL_RADIUS_METERS, 2);
  }

  function getHeatTransferRate(coefficient) {
    return coefficient * getSurfaceArea() /
      (STEEL_BALL_MASS * STEEL_SPECIFIC_HEAT);
  }

  function calculateResults(initialTemperature, duration, coefficient) {
    var heatTransferRate = getHeatTransferRate(coefficient);
    var phase = Math.random() * Math.PI * 2;
    var drift = 50;
    var driftVelocity = (Math.random() - 0.5) * 2.8;
    var rows = [];

    rows.push({
      time: 0,
      temperature: initialTemperature,
      delta: WATER_TEMP - initialTemperature,
      modelTemperature: initialTemperature,
      ballTop: BALL_AIR_TOP,
      ballLeftPercent: 50
    });

    for (var second = 1; second <= duration; second += 1) {
      var immersedTime = Math.max(0, second - DROP_DURATION_SECONDS);
      var calculatedTemperature = WATER_TEMP -
        ((WATER_TEMP - initialTemperature) * Math.exp(-heatTransferRate * immersedTime));
      var measurementNoise = randomNormal() * 0.28;
      var bathTurbulence = Math.sin(second * 0.45 + phase) * 0.18;
      var measuredTemperature = clamp(calculatedTemperature + measurementNoise + bathTurbulence, MIN_TEMP, WATER_TEMP);
      var motion = getBallMotion(second, duration, phase, drift, driftVelocity);

      drift = motion.nextDrift;
      driftVelocity = motion.nextVelocity;

      rows.push({
        time: second,
        temperature: measuredTemperature,
        delta: WATER_TEMP - measuredTemperature,
        modelTemperature: calculatedTemperature,
        ballTop: motion.top,
        ballLeftPercent: motion.leftPercent
      });
    }

    return rows;
  }

  function createTrialCoefficient() {
    return HEAT_TRANSFER_COEFFICIENT * (0.92 + (Math.random() * 0.16));
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

  function getBallMotion(second, duration, phase, drift, velocity) {
    if (second <= DROP_DURATION_SECONDS) {
      var fallPercent = second / DROP_DURATION_SECONDS;
      return {
        top: BALL_AIR_TOP + ((BALL_WATER_TOP - BALL_AIR_TOP) * easeIn(fallPercent)),
        leftPercent: 50 + Math.sin(second * 1.4 + phase) * 2,
        nextDrift: drift,
        nextVelocity: velocity
      };
    }

    var nextVelocity = (velocity * 0.82) + ((Math.random() - 0.5) * 4.2);
    var nextDrift = clamp(drift + nextVelocity, 22, 78);
    var bob = Math.sin(second * 0.7 + phase) * 24;
    var slowRise = Math.sin(second / Math.max(12, duration) * Math.PI * 2) * 10;

    return {
      top: BALL_WATER_TOP + bob + slowRise,
      leftPercent: nextDrift,
      nextDrift: nextDrift,
      nextVelocity: nextVelocity
    };
  }

  function easeIn(percent) {
    return percent * percent;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function validateInputs(initialTemperature, duration) {
    if (Number.isNaN(initialTemperature) || initialTemperature < MIN_TEMP || initialTemperature > MAX_TEMP) {
      return "Enter a steel ball temperature from -20 C to 100 C.";
    }

    if (Number.isNaN(duration) || duration < 1 || duration > MAX_TIME) {
      return "Enter a simulation time from 1 to 180 seconds.";
    }

    return "";
  }

  function renderResults(rows) {
    resultsBody.innerHTML = "";

    rows.forEach(function (row, index) {
      var tr = document.createElement("tr");
      tr.dataset.index = String(index);

      appendCell(tr, row.time.toFixed(0));
      appendCell(tr, row.temperature.toFixed(1));
      appendCell(tr, row.delta.toFixed(1));
      resultsBody.appendChild(tr);
    });
  }

  function appendCell(row, text) {
    var cell = document.createElement("td");
    cell.textContent = text;
    row.appendChild(cell);
  }

  function drawChart(rows, activeRow) {
    var context = chart.getContext("2d");
    var width = chart.width;
    var height = chart.height;
    var margin = { top: 26, right: 30, bottom: 48, left: 64 };
    var plotWidth = width - margin.left - margin.right;
    var plotHeight = height - margin.top - margin.bottom;
    var maxTime = rows.length ? rows[rows.length - 1].time : 1;
    var minTemp = Math.min(MIN_TEMP, getMinimumTemperature(rows));
    var maxTemp = WATER_TEMP;

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
    context.fillText("Ball temperature vs. time", margin.left, 20);
  }

  function drawGrid(context, margin, plotWidth, plotHeight, maxTime, minTemp, maxTemp) {
    context.strokeStyle = "#d7e1e8";
    context.lineWidth = 1;
    context.fillStyle = "#5e6b74";
    context.font = "12px Arial";

    for (var i = 0; i <= 5; i += 1) {
      var x = margin.left + (plotWidth * i / 5);
      var timeLabel = Math.round(maxTime * i / 5);
      context.beginPath();
      context.moveTo(x, margin.top);
      context.lineTo(x, margin.top + plotHeight);
      context.stroke();
      context.fillText(String(timeLabel), x - 8, margin.top + plotHeight + 24);
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
    var waterY = getY(WATER_TEMP, margin, plotHeight, minTemp, maxTemp);
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
    }, WATER_TEMP);
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
    var percent = Math.max(0, Math.min(1, (temperature - MIN_TEMP) / (MAX_TEMP - MIN_TEMP)));
    var r = interpolate(45, 216, percent);
    var g = interpolate(68, 82, percent);
    var b = interpolate(89, 58, percent);
    var highlightR = interpolate(139, 245, percent);
    var highlightG = interpolate(160, 165, percent);
    var highlightB = interpolate(176, 124, percent);
    ball.style.background = "radial-gradient(circle at 35% 30%, rgb(" +
      highlightR + ", " + highlightG + ", " + highlightB + "), rgb(" +
      r + ", " + g + ", " + b + ") 68%)";
  }

  function interpolate(start, end, percent) {
    return Math.round(start + ((end - start) * percent));
  }

  function setActiveRow(index) {
    Array.prototype.forEach.call(resultsBody.querySelectorAll("tr"), function (row) {
      row.classList.toggle("active", Number(row.dataset.index) === index);
    });
  }

  function updateFrame() {
    if (activeIndex >= results.length) {
      clearInterval(activeTimer);
      activeTimer = null;
      message.textContent = "Simulation complete.";
      return;
    }

    var row = results[activeIndex];
    elapsed.textContent = row.time.toFixed(0) + " s";
    currentTemp.textContent = row.temperature.toFixed(1) + " C";
    temperatureLabel.textContent = "T = " + row.temperature.toFixed(1) + " C";
    ball.style.top = row.ballTop.toFixed(1) + "px";
    ball.style.left = "calc(" + row.ballLeftPercent.toFixed(1) + "% - 28px)";
    setBallTemperature(row.temperature);
    setActiveRow(activeIndex);
    drawChart(results, row);
    activeIndex += 1;
  }

  function startSimulation(event) {
    event.preventDefault();

    var initialTemperature = Number(temperatureInput.value);
    var duration = Number(durationInput.value);
    var validationMessage = validateInputs(initialTemperature, duration);

    if (validationMessage) {
      message.textContent = validationMessage;
      return;
    }

    activeTrialCoefficient = createTrialCoefficient();
    buildPreview(initialTemperature, duration, activeTrialCoefficient);
    resetAnimationOnly();
    finalTemp.textContent = results[results.length - 1].temperature.toFixed(1) + " C";
    message.textContent = "Simulation running.";
    updateFrame();
    activeTimer = window.setInterval(updateFrame, Number(speedInput.value));
  }

  function resetAnimationOnly() {
    if (activeTimer) {
      clearInterval(activeTimer);
      activeTimer = null;
    }

    activeIndex = 0;
    elapsed.textContent = "0 s";
    ball.style.top = BALL_AIR_TOP + "px";
    ball.style.left = "calc(50% - 28px)";
    setBallTemperature(Number(temperatureInput.value) || 20);
    Array.prototype.forEach.call(resultsBody.querySelectorAll("tr"), function (row) {
      row.classList.remove("active");
    });
  }

  function resetAll() {
    temperatureInput.value = "20";
    durationInput.value = "60";
    speedInput.value = "100";
    message.textContent = "";
    activeTrialCoefficient = HEAT_TRANSFER_COEFFICIENT;
    resetAnimationOnly();
    buildPreview(20, 60, activeTrialCoefficient);
  }

  function downloadCsv() {
    var initialTemperature = Number(temperatureInput.value);
    var duration = Number(durationInput.value);
    var validationMessage = validateInputs(initialTemperature, duration);

    if (validationMessage) {
      message.textContent = validationMessage;
      return;
    }

    var rows = results.length ? results : calculateResults(initialTemperature, duration, activeTrialCoefficient);
    var csv = "Time (s),Measured ball temperature (C),Model ball temperature (C),Delta to water (C),Ball X (%),Ball Y (px),Trial h (W/m^2 C)\n" + rows.map(function (row) {
      return row.time.toFixed(0) + "," +
        row.temperature.toFixed(1) + "," +
        row.modelTemperature.toFixed(1) + "," +
        row.delta.toFixed(1) + "," +
        row.ballLeftPercent.toFixed(1) + "," +
        row.ballTop.toFixed(1) + "," +
        activeTrialCoefficient.toFixed(2);
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

  function buildPreview(initialTemperature, duration, coefficient) {
    results = calculateResults(initialTemperature, duration, coefficient);
    renderResults(results);
    currentTemp.textContent = initialTemperature.toFixed(1) + " C";
    finalTemp.textContent = results[results.length - 1].temperature.toFixed(1) + " C";
    temperatureLabel.textContent = "T = " + initialTemperature.toFixed(1) + " C";
    trialCoefficient.textContent = coefficient.toFixed(2) + " W/m^2 C";
    setBallTemperature(initialTemperature);
    drawChart(results, results[0]);
    setActiveRow(0);
  }

  function handleInputChange() {
    var initialTemperature = Number(temperatureInput.value);
    var duration = Number(durationInput.value);
    var validationMessage = validateInputs(initialTemperature, duration);

    resetAnimationOnly();

    if (validationMessage) {
      message.textContent = validationMessage;
      return;
    }

    message.textContent = "";
    activeTrialCoefficient = HEAT_TRANSFER_COEFFICIENT;
    buildPreview(initialTemperature, duration, activeTrialCoefficient);
  }

  form.addEventListener("submit", startSimulation);
  resetButton.addEventListener("click", resetAll);
  downloadButton.addEventListener("click", downloadCsv);
  temperatureInput.addEventListener("input", handleInputChange);
  durationInput.addEventListener("input", handleInputChange);

  surfaceArea.textContent = getSurfaceArea().toFixed(6) + " m^2";
  resetAll();
})();
