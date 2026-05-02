using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Windows.Forms;

namespace HeatTransfer
{
    public partial class MainForm : Form
    {
        private const int MinimumBallTemperature = -20;
        private const int BoilingWaterTemperature = 100;
        private const int MaximumSimulationTime = 180;
        private const int AnimationStep = 20;
        private const int BallEndPointY = 300;

        private const double BallRadiusMeters = 0.01;
        private const double SteelSpecificHeatJoulesPerKgCelsius = 450.0;
        private const double SteelBallMassKg = 0.0103;
        private const double HeatTransferCoefficient = 50.2;

        private int temp;
        private int time;
        private int startTime = 1;

        private readonly Dictionary<int, int> resultItems = new Dictionary<int, int>();

        public MainForm()
        {
            InitializeComponent();
            ConfigureInterface();
        }

        private void Form1_Load(object sender, EventArgs e)
        {
        }

        private void MainForm_Paint(object sender, PaintEventArgs e)
        {
        }

        private void btnStart_Click(object sender, EventArgs e)
        {
            ResetSimulationState();

            int parsedTemperature;
            if (!int.TryParse(txtSteelBallTemp.Text, out parsedTemperature) ||
                parsedTemperature < MinimumBallTemperature ||
                parsedTemperature > BoilingWaterTemperature)
            {
                MessageBox.Show("Enter a steel ball temperature from -20 C to 100 C.", "Invalid input");
                txtSteelBallTemp.Clear();
                txtSteelBallTemp.Focus();
                return;
            }
            this.temp = parsedTemperature;

            int parsedTime;
            if (!int.TryParse(txtChooseTime.Text, out parsedTime) ||
                parsedTime < 1 ||
                parsedTime > MaximumSimulationTime)
            {
                MessageBox.Show("Enter a simulation time from 1 to 180 seconds.", "Invalid input");
                txtChooseTime.Clear();
                txtChooseTime.Focus();
                return;
            }
            this.time = parsedTime;

            btnStart.Enabled = false;
            btnReset.Enabled = false;

            ShowResult();
            tmrAnimation.Start();
        }

        private List<ResultItem> CalculateResults()
        {
            double ballSurfaceArea = 4 * Math.PI * Math.Pow(BallRadiusMeters, 2);
            double heatTransferRate = HeatTransferCoefficient * ballSurfaceArea /
                                      (SteelBallMassKg * SteelSpecificHeatJoulesPerKgCelsius);

            List<ResultItem> result = new List<ResultItem>();
            for (int i = 1; i <= time; i++)
            {
                double calculatedTemperature = BoilingWaterTemperature -
                    ((BoilingWaterTemperature - temp) * Math.Exp(-heatTransferRate * i));
                int roundedTemperature = (int)Math.Round(calculatedTemperature);
                ResultItem item = new ResultItem(i, roundedTemperature);

                result.Add(item);
                resultItems.Add(i, roundedTemperature);
            }

            return result;
        }

        private void ShowResult()
        {
            List<ResultItem> resultItemList = CalculateResults();

            dgvResult.DataSource = resultItemList;
            FormatResultGrid();

            string resultPath = Path.Combine(Application.StartupPath, "result.csv");
            using (StreamWriter writer = new StreamWriter(resultPath))
            {
                writer.WriteLine("Time (s),Ball temperature (C)");
                foreach (ResultItem data in resultItemList)
                {
                    writer.WriteLine(data.ToCsv());
                }
            }
        }

        private void btnReset_Click(object sender, EventArgs e)
        {
            Reset();
        }

        private void Reset()
        {
            tmrAnimation.Stop();
            tmrTempAnimation.Stop();
            ResetSimulationState();
            txtChooseTime.Clear();
            txtSteelBallTemp.Clear();
            dgvResult.DataSource = null;
            lblDisplayTime.Text = "";
            btnStart.Enabled = true;
            btnReset.Enabled = true;
            txtSteelBallTemp.Focus();
        }

        private void tmrAnimation_Tick(object sender, EventArgs e)
        {
            if (animation1.ballPositionY < BallEndPointY)
            {
                animation1.ballPositionY += AnimationStep;
                animation1.Refresh();
            }
            else
            {
                tmrAnimation.Stop();
                tmrTempAnimation.Start();
            }
        }

        private void tmrTempAnimation_Tick(object sender, EventArgs e)
        {
            if (startTime <= time)
            {
                lblDisplayTime.Text = startTime.ToString();
                int currentTemperature = resultItems[startTime];
                animation1.displayTemp("Ball temp: " + currentTemperature.ToString() + " C", currentTemperature);
                if (dgvResult.SelectedRows.Count > 0)
                {
                    dgvResult.SelectedRows[0].Selected = false;
                }
                dgvResult.Rows[startTime - 1].Selected = true;
                startTime++;
            }
            else
            {
                tmrTempAnimation.Stop();
                btnStart.Enabled = true;
                btnReset.Enabled = true;
            }
        }

        private void aboutToolStripMenuItem1_Click(object sender, EventArgs e)
        {
            MessageBox.Show("Heat Transfer simulates a steel ball warming in boiling water. Enter the ball's starting temperature and a simulation length, then start the run to view the animated ball, second-by-second temperatures, and exported CSV results.",
                "About Heat Transfer");
        }

        private void ConfigureInterface()
        {
            tmrAnimation.Interval = 25;
            tmrAnimation.Stop();
            tmrTempAnimation.Stop();

            BackColor = Color.FromArgb(244, 248, 250);
            Font = new Font("Segoe UI", 10F);

            lbltitle.Text = "Steel Ball Heat Transfer";
            lbltitle.Font = new Font("Segoe UI", 24F, FontStyle.Bold);
            lbltitle.ForeColor = Color.FromArgb(31, 45, 56);
            lblChooseTime.Text = "Simulation time (seconds):";
            lblSteelBallTemp.Text = "Initial steel ball temperature (C):";
            lblTime.Text = "Elapsed time (seconds):";
            lblDisplayTime.Text = "";
            lblDisplayTemp.Visible = false;
            btnStart.Text = "Start Simulation";
            lblBoilingWatherTemp.Text = "Boiling water temperature: 100 C";
            lblWater.Text = "Water amount: 150 mL";

            StyleButton(btnStart, Color.FromArgb(24, 119, 242), Color.White);
            StyleButton(btnReset, Color.FromArgb(224, 231, 238), Color.FromArgb(31, 45, 56));

            txtSteelBallTemp.BorderStyle = BorderStyle.FixedSingle;
            txtChooseTime.BorderStyle = BorderStyle.FixedSingle;

            dgvResult.AllowUserToAddRows = false;
            dgvResult.AllowUserToDeleteRows = false;
            dgvResult.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;
            dgvResult.BorderStyle = BorderStyle.None;
            dgvResult.CellBorderStyle = DataGridViewCellBorderStyle.SingleHorizontal;
            dgvResult.ColumnHeadersBorderStyle = DataGridViewHeaderBorderStyle.None;
            dgvResult.ColumnHeadersDefaultCellStyle.BackColor = Color.FromArgb(31, 45, 56);
            dgvResult.ColumnHeadersDefaultCellStyle.ForeColor = Color.White;
            dgvResult.ColumnHeadersDefaultCellStyle.Font = new Font("Segoe UI", 11F, FontStyle.Bold);
            dgvResult.DefaultCellStyle.BackColor = Color.White;
            dgvResult.DefaultCellStyle.ForeColor = Color.FromArgb(31, 45, 56);
            dgvResult.DefaultCellStyle.SelectionBackColor = Color.FromArgb(218, 241, 251);
            dgvResult.DefaultCellStyle.SelectionForeColor = Color.FromArgb(31, 45, 56);
            dgvResult.EnableHeadersVisualStyles = false;
            dgvResult.GridColor = Color.FromArgb(224, 231, 238);
            dgvResult.MultiSelect = false;
            dgvResult.ReadOnly = true;
            dgvResult.RowHeadersVisible = false;
            dgvResult.SelectionMode = DataGridViewSelectionMode.FullRowSelect;
        }

        private static void StyleButton(Button button, Color backColor, Color foreColor)
        {
            button.BackColor = backColor;
            button.FlatAppearance.BorderSize = 0;
            button.FlatStyle = FlatStyle.Flat;
            button.Font = new Font("Segoe UI", 12F, FontStyle.Bold);
            button.ForeColor = foreColor;
            button.UseVisualStyleBackColor = false;
        }

        private void FormatResultGrid()
        {
            if (dgvResult.Columns.Count < 2)
            {
                return;
            }

            dgvResult.Columns[0].HeaderText = "Time (s)";
            dgvResult.Columns[1].HeaderText = "Ball Temp (C)";
        }

        private void ResetSimulationState()
        {
            startTime = 1;
            resultItems.Clear();
            lblDisplayTime.Text = "";
            dgvResult.DataSource = null;
            animation1.ballPositionY = 0;
            animation1.ResetAnimation();
        }
    }
}
