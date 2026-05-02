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

  var form = document.getElementById("simulation-form");
  var resetButton = document.getElementById("reset-button");
  var downloadButton = document.getElementById("download-button");
  var temperatureInput = document.getElementById("temperature");
  var durationInput = document.getElementById("duration");
  var message = document.getElementById("message");
  var elapsed = document.getElementById("elapsed");
  var ball = document.getElementById("ball");
  var temperatureLabel = document.getElementById("temperature-label");
  var resultsBody = document.getElementById("results-body");

  var results = [];
  var activeTimer = null;
  var activeIndex = 0;

  function calculateResults(initialTemperature, duration) {
    var ballSurfaceArea = 4 * Math.PI * Math.pow(BALL_RADIUS_METERS, 2);
    var heatTransferRate = HEAT_TRANSFER_COEFFICIENT * ballSurfaceArea /
      (STEEL_BALL_MASS * STEEL_SPECIFIC_HEAT);
    var rows = [];

    for (var second = 1; second <= duration; second += 1) {
      var calculatedTemperature = WATER_TEMP -
        ((WATER_TEMP - initialTemperature) * Math.exp(-heatTransferRate * second));
      rows.push({
        time: second,
        temperature: Math.round(calculatedTemperature)
      });
    }

    return rows;
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

      var timeCell = document.createElement("td");
      timeCell.textContent = String(row.time);

      var temperatureCell = document.createElement("td");
      temperatureCell.textContent = String(row.temperature);

      tr.appendChild(timeCell);
      tr.appendChild(temperatureCell);
      resultsBody.appendChild(tr);
    });
  }

  function setBallTemperature(temperature) {
    var percent = Math.max(0, Math.min(1, (temperature - MIN_TEMP) / (MAX_TEMP - MIN_TEMP)));
    var r = interpolate(45, 224, percent);
    var g = interpolate(68, 82, percent);
    var b = interpolate(89, 54, percent);
    ball.style.background = "radial-gradient(circle at 35% 30%, rgb(" +
      interpolate(139, 245, percent) + ", " +
      interpolate(160, 167, percent) + ", " +
      interpolate(176, 126, percent) + "), rgb(" + r + ", " + g + ", " + b + ") 68%)";
  }

  function interpolate(start, end, percent) {
    return Math.round(start + ((end - start) * percent));
  }

  function setActiveRow(index) {
    Array.prototype.forEach.call(resultsBody.querySelectorAll("tr"), function (row) {
      row.classList.toggle("active", Number(row.dataset.index) === index);
    });

    var activeRow = resultsBody.querySelector('tr[data-index="' + index + '"]');
    if (activeRow) {
      activeRow.scrollIntoView({ block: "nearest" });
    }
  }

  function updateFrame() {
    if (activeIndex >= results.length) {
      clearInterval(activeTimer);
      activeTimer = null;
      message.textContent = "Simulation complete.";
      return;
    }

    var row = results[activeIndex];
    var percent = results.length <= 1 ? 1 : activeIndex / (results.length - 1);
    var top = 6 + Math.round(percent * 300);

    elapsed.textContent = row.time + " s";
    ball.style.top = top + "px";
    temperatureLabel.textContent = "Ball temp: " + row.temperature + " C";
    setBallTemperature(row.temperature);
    setActiveRow(activeIndex);
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

    resetAnimationOnly();
    results = calculateResults(initialTemperature, duration);
    renderResults(results);
    message.textContent = "Simulation running.";
    temperatureLabel.textContent = "Ball temp: " + initialTemperature + " C";
    setBallTemperature(initialTemperature);

    updateFrame();
    activeTimer = window.setInterval(updateFrame, 1000);
  }

  function resetAnimationOnly() {
    if (activeTimer) {
      clearInterval(activeTimer);
      activeTimer = null;
    }

    activeIndex = 0;
    elapsed.textContent = "0 s";
    ball.style.top = "0";
    setBallTemperature(Number(temperatureInput.value) || 20);
    Array.prototype.forEach.call(resultsBody.querySelectorAll("tr"), function (row) {
      row.classList.remove("active");
    });
  }

  function resetAll() {
    resetAnimationOnly();
    results = [];
    resultsBody.innerHTML = "";
    temperatureInput.value = "20";
    durationInput.value = "60";
    temperatureLabel.textContent = "Ball temp: 20 C";
    message.textContent = "";
    setBallTemperature(20);
  }

  function downloadCsv() {
    var rows = results.length ? results : calculateResults(Number(temperatureInput.value), Number(durationInput.value));
    var csv = "Time (s),Ball temperature (C)\n" + rows.map(function (row) {
      return row.time + "," + row.temperature;
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

  form.addEventListener("submit", startSimulation);
  resetButton.addEventListener("click", resetAll);
  downloadButton.addEventListener("click", downloadCsv);
  setBallTemperature(20);
})();
