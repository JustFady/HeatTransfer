# Heat Transfer Laboratory

Heat Transfer Laboratory is an educational heat-transfer simulator for a steel sphere dropped into a boiling-water bath. The main app runs directly in a browser on any operating system, and the original Windows Forms desktop app is still included for reference.

## Run Instantly

Open this file in any modern browser:

```text
docs/index.html
```

No install, build step, Visual Studio, .NET runtime, or package manager is required for the browser version.

## Run From GitHub

1. Click **Code** on the GitHub repo.
2. Click **Download ZIP**.
3. Extract the ZIP.
4. Open `docs/index.html`.

This works on Windows, macOS, Linux, ChromeOS, and mobile browsers.

## Publish With GitHub Pages

The browser app is ready for GitHub Pages because it lives in `docs/`.

1. Open the repo on GitHub.
2. Go to **Settings**.
3. Go to **Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch `main`.
6. Select folder `/docs`.
7. Click **Save**.

After GitHub Pages finishes, the simulator will be available as a public website.

## Browser App Features

- Cross-platform browser app with no external dependencies
- Start, Pause/Resume, Reset, CSV export, and chart export controls
- Randomized experimental trials so repeated runs are not identical
- Steel ball free-fall, water drift, bobbing, and heating animation
- Pseudo CFD-style water field with thermal wake colors and velocity vectors
- Measured vs model temperature curve with 100 C water reference line
- Data table with measured temperature, heat flux, Reynolds number, and Nusselt number
- Trial readouts for heat-transfer coefficient, Biot number, thermal time constant, fluid speed, and final temperature

## Use The Simulation

1. Enter the initial steel ball temperature in Celsius.
   - Minimum: `-20`
   - Maximum: `100`
2. Enter the simulation time in seconds.
   - Minimum: `1`
   - Maximum: `180`
3. Click **Start** to generate a new randomized trial.
4. Use **Pause** and **Resume** to freeze and continue the same trial.
5. Use **Reset** to clear the run, clear the table, and return the ball to the release position.
6. Click **Download CSV** to export trial data.
7. Click **Export Chart** to save the temperature curve as a PNG.

## Model

The simulator uses a reduced-order lumped-capacitance heat-transfer model:

```text
T(t) = T_water - (T_water - T_initial) * e^(-hAt/mc)
```

Where:

- `T_water` is fixed at `100 C`
- `T_initial` is the user-provided starting ball temperature
- `h` is the heat-transfer coefficient, randomized around a nominal value of `50.2 W/m^2 C`
- `A` is the steel ball surface area, based on a `0.01 m` radius
- `m` is the steel ball mass, currently `0.0103 kg`
- `c` is steel specific heat, currently `450 J/kg C`

Each trial adds small measurement noise, a fluctuating local heat-transfer coefficient, and a pseudo fluid-field visualization. The field is designed to approximate CFD behavior visually and analytically in the browser, but it is not a full Navier-Stokes CFD solver.

## Windows Desktop App

The original Windows Forms app is still included.

### Desktop Dependencies

- Windows 10 or Windows 11
- Visual Studio Community, Professional, or Enterprise
- Visual Studio **.NET desktop development** workload
- .NET Framework 4.8

Visual Studio Community is free:

https://visualstudio.microsoft.com/vs/community/

### Run The Desktop App

Double-click:

```text
run.bat
```

If the desktop app has not been built yet, `run.bat` builds it first.

### Build The Desktop App

Double-click:

```text
build.bat
```

Or use a Visual Studio Developer Command Prompt:

```powershell
msbuild HeatTransfer.sln /restore /p:Configuration=Release /p:Platform="Any CPU"
```

The executable is generated at:

```text
bin\Release\HeatTransfer.exe
```

## GitHub Actions

The workflow at `.github/workflows/build.yml` builds the Windows desktop app on pushes to `main`.

To download a built Windows artifact:

1. Open the repo on GitHub.
2. Click the **Actions** tab.
3. Open the latest successful **Build Windows App** run.
4. Download the `HeatTransfer-Windows` artifact.
5. Unzip it.
6. Run `HeatTransfer.exe`.

## Project Structure

- `docs/index.html` is the cross-platform browser simulator.
- `docs/styles.css` styles the browser simulator.
- `docs/app.js` contains the browser simulation, charting, field visualization, and export logic.
- `run.bat` builds if needed and starts the Windows desktop app.
- `build.bat` builds the Windows desktop Release version.
- `scripts/build.ps1` finds MSBuild and builds the solution.
- `scripts/run.ps1` starts the Release executable.
- `Program.cs`, `MainForm.cs`, `Animation.cs`, and `ResultItem.cs` make up the original Windows Forms app.
- `.github/workflows/build.yml` builds the Windows desktop app on GitHub Actions.

## Research Paper

Original project research paper:

https://www.overleaf.com/read/kpfvdpvcrghm#f19c0a
