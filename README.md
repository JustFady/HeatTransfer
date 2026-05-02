# Heat Transfer

Heat Transfer is an educational simulation of a steel ball warming up in boiling water. It now has two ways to run:

- **Browser version:** runs on any OS with no install.
- **Windows desktop version:** the original Windows Forms app.

## Fastest Way To View It

Open the browser version:

```text
docs/index.html
```

That file works directly in Chrome, Edge, Firefox, Safari, and other modern browsers. No Visual Studio, .NET, or build step is needed.

## Run On Any OS

1. Download this repository as a ZIP from GitHub.
2. Extract the ZIP.
3. Open `docs/index.html` in a browser.

This works on:

- Windows
- macOS
- Linux
- ChromeOS
- Mobile browsers

## Publish As A Website

This repo is ready for GitHub Pages because the browser app lives in `docs/`.

To publish it:

1. Open the repo on GitHub.
2. Go to **Settings**.
3. Go to **Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch `main`.
6. Select folder `/docs`.
7. Click **Save**.

After GitHub Pages finishes, the app will be available as a public website.

## Browser App Features

- Runs on any modern browser
- Validates temperature and time input
- Animates the ball entering the water and heating over time
- Shows second-by-second calculated temperatures and delta to the water bath
- Plots a temperature curve with a 100 C water reference line
- Displays the model equation and constants used by the calculation
- Adds trial-to-trial variation in heat-transfer coefficient and measurement noise
- Moves the ball through a free-fall drop and water drift path during playback
- Highlights the current result row during the simulation
- Downloads results as `result.csv`
- Requires no external dependencies

## Use The Simulation

1. Enter the starting steel ball temperature in Celsius.
   - Minimum: `-20`
   - Maximum: `100`
2. Enter how long the simulation should run in seconds.
   - Minimum: `1`
   - Maximum: `180`
3. Click **Start Simulation**.
4. Watch the animation and the result table.
5. Click **Download CSV** if you want the results in Excel or another spreadsheet tool.

## Windows Desktop App

The original Windows Forms app is still included.

### Desktop Dependencies

- Windows 10 or Windows 11
- Visual Studio Community, Professional, or Enterprise
- The Visual Studio **.NET desktop development** workload
- .NET Framework 4.8

Visual Studio Community is free:

https://visualstudio.microsoft.com/vs/community/

When installing Visual Studio, select:

```text
.NET desktop development
```

The desktop app does not use NuGet packages or external libraries.

### Run The Desktop App

Double-click:

```text
run.bat
```

If the app has already been built, `run.bat` opens it right away. If it has not been built yet, `run.bat` builds it first.

### Build The Desktop App

Double-click:

```text
build.bat
```

Or open a Visual Studio Developer Command Prompt and run:

```powershell
msbuild HeatTransfer.sln /restore /p:Configuration=Release /p:Platform="Any CPU"
```

The built desktop app is created here:

```text
bin\Release\HeatTransfer.exe
```

## GitHub Actions Build

The workflow at `.github/workflows/build.yml` builds the Windows desktop app automatically on pushes to `main`.

To download a built Windows app:

1. Open the GitHub repo.
2. Click the **Actions** tab.
3. Open the latest successful **Build Windows App** run.
4. Download the `HeatTransfer-Windows` artifact.
5. Unzip it.
6. Run `HeatTransfer.exe`.

## Model

The app uses a simple lumped heat-transfer model:

```text
T(t) = T_water - (T_water - T_initial) * e^(-kAt/mc)
```

Where:

- `T_water` is fixed at `100 C`
- `T_initial` is the user-provided starting ball temperature
- `k` is the configured heat transfer coefficient, currently `50.2`
- `A` is the steel ball surface area, based on a `0.01 m` radius
- `m` is the steel ball mass, currently `0.0103 kg`
- `c` is steel specific heat, currently `450 J/kg C`

Each browser simulation run adds small random experimental variation so repeated trials are not identical. This is an educational simulation rather than a full computational fluid dynamics model.

## Project Structure

- `docs/index.html` is the cross-platform browser app.
- `docs/styles.css` styles the browser app.
- `docs/app.js` runs the browser simulation logic.
- `run.bat` builds if needed and starts the Windows desktop app.
- `build.bat` builds the Windows desktop Release version.
- `scripts/build.ps1` finds MSBuild and builds the solution.
- `scripts/run.ps1` starts the Release executable.
- `Program.cs` starts the Windows Forms application.
- `MainForm.cs` handles desktop input validation, simulation results, table binding, animation timing, and CSV export.
- `Animation.cs` renders the desktop beaker, water, steel ball, and current temperature label.
- `ResultItem.cs` represents one row of desktop simulation output.
- `.github/workflows/build.yml` builds the desktop app on GitHub Actions.

## Research Paper

Original project research paper:

https://www.overleaf.com/read/kpfvdpvcrghm#f19c0a
