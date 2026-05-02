# Heat Transfer Laboratory

A browser-based heat-transfer simulation for a steel ball dropped into boiling water. It runs on any operating system with no install.

## Run

Open this file in a browser:

```text
docs/index.html
```

To run it from GitHub: download the repo ZIP, extract it, then open `docs/index.html`.

## What It Does

- Simulates a steel ball heating in a 100 C water bath.
- Generates a new randomized trial every time you press **Start**.
- Shows ball motion, water-field visualization, measured vs model temperature, and trial data.
- Exports results as CSV and the chart as PNG.

## Controls

- **Start:** begin a new trial.
- **Pause / Resume:** freeze or continue the current trial.
- **Reset:** clear the run and return to the release position.
- **Download CSV:** export trial data.
- **Export Chart:** save the temperature chart.

## Inputs

- Initial ball temperature: `-20 C` to `100 C`
- Simulation time: `1` to `180` seconds

## Model Note

The app uses a reduced-order lumped-capacitance model with randomized experimental variation:

```text
T(t) = T_water - (T_water - T_initial) * e^(-hAt/mc)
```

It also includes a lightweight pseudo CFD-style water field for visualization. This is an educational simulator, not a full Navier-Stokes CFD solver.

## Publish Online

This repo can be published with GitHub Pages:

1. Go to repo **Settings**.
2. Open **Pages**.
3. Choose **Deploy from a branch**.
4. Select `main` and `/docs`.
5. Save.

## Windows Desktop Version

The original Windows Forms version is still included. On Windows, double-click:

```text
run.bat
```

If needed, install Visual Studio with the **.NET desktop development** workload and .NET Framework 4.8.

## Research Paper

https://www.overleaf.com/read/kpfvdpvcrghm#f19c0a
