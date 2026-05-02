# Heat Transfer

Heat Transfer is a Windows desktop app that simulates a steel ball warming up in boiling water. You enter the ball's starting temperature and how long to run the simulation, then the app shows the animation, a second-by-second temperature table, and a CSV export.

## Fastest Way To Run It

This app is built with Windows Forms, so it runs on Windows.

1. Download this repository as a ZIP from GitHub.
2. Extract the ZIP.
3. Double-click `run.bat`.
4. If Windows shows a security warning, choose **More info** and then **Run anyway**.

If the app has already been built, `run.bat` opens it right away. If it has not been built yet, `run.bat` builds it first.

## Dependencies

You only need these:

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

That workload includes the build tools needed for this project. The app does not use any NuGet packages or external libraries.

## Run From GitHub Actions

If you do not want to build the app yourself:

1. Open the GitHub repo.
2. Click the **Actions** tab.
3. Open the latest successful **Build Windows App** run.
4. Download the `HeatTransfer-Windows` artifact.
5. Unzip it.
6. Run `HeatTransfer.exe`.

The workflow file is included at `.github/workflows/build.yml`, so GitHub builds the Windows app automatically after pushes to `main`.

## Build It Yourself

### Option 1: Double-click build

Double-click:

```text
build.bat
```

The built app will be created here:

```text
bin\Release\HeatTransfer.exe
```

### Option 2: Visual Studio

1. Open Visual Studio.
2. Click **Open a project or solution**.
3. Select `HeatTransfer.sln`.
4. Press `F5` to build and run.

### Option 3: Command line

Open a Visual Studio Developer Command Prompt and run:

```powershell
msbuild HeatTransfer.sln /restore /p:Configuration=Release /p:Platform="Any CPU"
```

Then run:

```text
bin\Release\HeatTransfer.exe
```

## Use The App

1. Enter the starting steel ball temperature in Celsius.
   - Minimum: `-20`
   - Maximum: `100`
2. Enter how long the simulation should run in seconds.
   - Minimum: `1`
   - Maximum: `180`
3. Click **Start Simulation**.
4. Watch the ball animation and the result table.
5. Open `result.csv` from the app folder if you want the data in Excel.

Each new run replaces the previous `result.csv`.

## Features

- Validates temperature and time input
- Animates the ball entering the water
- Shows second-by-second calculated temperatures
- Highlights the current row during the simulation
- Exports results to `result.csv`
- Includes a GitHub Actions build for downloadable Windows artifacts

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

This is an educational simulation rather than a full computational fluid dynamics model.

## Project Structure

- `run.bat` builds if needed and starts the app.
- `build.bat` builds the Release version.
- `scripts/build.ps1` finds MSBuild and builds the solution.
- `scripts/run.ps1` starts the Release executable.
- `Program.cs` starts the Windows Forms application.
- `MainForm.cs` handles input validation, simulation results, table binding, animation timing, and CSV export.
- `Animation.cs` renders the beaker, water, steel ball, and current temperature label.
- `ResultItem.cs` represents one row of simulation output.
- `.github/workflows/build.yml` builds the app on GitHub Actions.

## Research Paper

Original project research paper:

https://www.overleaf.com/project/640ab8d6f1dd12875775fac0
