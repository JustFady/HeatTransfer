# Heat Transfer

Heat Transfer is a Windows Forms simulation for a steel ball placed in boiling water. Enter the ball's starting temperature and the simulation duration, then watch the ball drop into the beaker while the app calculates and displays the ball temperature for each second.

## Features

- Validates steel ball temperatures from `-20 C` to `100 C`
- Validates simulation times from `1` to `180` seconds
- Animates the ball entering the water
- Shows second-by-second results in a read-only table
- Exports the latest run to `result.csv` beside the executable
- Includes an About menu item describing the simulation

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

## Requirements

- Windows
- Visual Studio 2017 or newer
- .NET Framework 4.6.1

## Open The Project

1. Install Visual Studio with the **.NET desktop development** workload.
2. Open Visual Studio.
3. Select **Open a project or solution**.
4. Choose `HeatTransfer.sln`.
5. If Visual Studio asks for the .NET Framework 4.6.1 targeting pack, install it.

## Run The App

1. In Visual Studio, make sure `HeatTransfer` is the startup project.
2. Press **Start** or press `F5`.
3. The Heat Transfer window should open.

## Use The Simulation

1. Type the starting steel ball temperature in Celsius.
   - Minimum: `-20`
   - Maximum: `100`
2. Type how long the simulation should run in seconds.
   - Minimum: `1`
   - Maximum: `180`
3. Click **Start Simulation**.
4. Watch the animation and review the result table.
5. Open `result.csv` from the build output folder if you want the data in Excel or another spreadsheet tool.

## Build From The Command Line

You can also build from a Visual Studio Developer Command Prompt:

```powershell
msbuild HeatTransfer.sln /p:Configuration=Release
```

The executable is generated under:

```text
bin\Release\HeatTransfer.exe
```

## Project Structure

- `Program.cs` starts the Windows Forms application.
- `MainForm.cs` handles input validation, simulation results, table binding, animation timing, and CSV export.
- `Animation.cs` renders the beaker, water, steel ball, and current temperature label.
- `ResultItem.cs` represents one row of simulation output.
- `MainForm.Designer.cs`, `Animation.Designer.cs`, and `.resx` files contain Visual Studio designer resources.

## Research Paper

Original project research paper:

https://www.overleaf.com/project/640ab8d6f1dd12875775fac0

## Notes

- `bin/` and `obj/` are generated build output folders and do not need to be edited by hand.
- Each run overwrites `result.csv` with the latest simulation data.
