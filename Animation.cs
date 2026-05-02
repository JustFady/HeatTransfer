using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Windows.Forms;

namespace HeatTransfer
{
    public partial class Animation : UserControl
    {
        private const int MinimumTemperature = -20;
        private const int MaximumTemperature = 100;

        private readonly Label lblTemp;
        private Color ballColor = Color.FromArgb(45, 68, 89);

        public int ballPositionY { get; set; }

        public Animation()
        {
            InitializeComponent();
            DoubleBuffered = true;

            lblTemp = new Label();
            lblTemp.AutoSize = false;
            lblTemp.Location = new Point(290, 305);
            lblTemp.Size = new Size(220, 34);
            lblTemp.Font = new Font("Segoe UI", 12F, FontStyle.Bold);
            lblTemp.ForeColor = Color.FromArgb(30, 43, 54);
            lblTemp.BackColor = Color.FromArgb(218, 241, 251);
            lblTemp.TextAlign = ContentAlignment.MiddleCenter;
            lblTemp.Visible = false;
            Controls.Add(lblTemp);
        }

        public void displayTemp(string text)
        {
            displayTemp(text, MinimumTemperature);
        }

        public void displayTemp(string text, int temperature)
        {
            lblTemp.Text = text;
            lblTemp.Visible = !string.IsNullOrWhiteSpace(text);
            ballColor = GetBallColor(temperature);
            Invalidate();
        }

        public void ResetAnimation()
        {
            ballColor = Color.FromArgb(45, 68, 89);
            displayTemp(string.Empty);
        }

        private void Animation_Paint(object sender, PaintEventArgs e)
        {
            e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
            DrawBeaker(e.Graphics);
            DrawWater(e.Graphics);
            DrawBall(e.Graphics);
        }

        private void DrawBeaker(Graphics graphics)
        {
            Rectangle beaker = GetBeakerBounds();
            using (Pen glassPen = new Pen(Color.FromArgb(56, 67, 78), 3))
            {
                graphics.DrawLine(glassPen, beaker.Left, beaker.Top, beaker.Left, beaker.Bottom);
                graphics.DrawLine(glassPen, beaker.Left, beaker.Bottom, beaker.Right, beaker.Bottom);
                graphics.DrawLine(glassPen, beaker.Right, beaker.Top, beaker.Right, beaker.Bottom);
            }

            using (Pen rimPen = new Pen(Color.FromArgb(120, 139, 153), 2))
            {
                graphics.DrawArc(rimPen, beaker.Left, beaker.Top - 18, beaker.Width, 36, 0, 180);
            }
        }

        private void DrawWater(Graphics graphics)
        {
            Rectangle beaker = GetBeakerBounds();
            Rectangle water = new Rectangle(beaker.Left + 12, beaker.Top + 120, beaker.Width - 24, beaker.Height - 132);

            using (LinearGradientBrush waterBrush = new LinearGradientBrush(
                water,
                Color.FromArgb(184, 232, 249),
                Color.FromArgb(108, 189, 222),
                LinearGradientMode.Vertical))
            using (Pen waterPen = new Pen(Color.FromArgb(84, 158, 191), 1))
            {
                graphics.FillRectangle(waterBrush, water);
                graphics.DrawRectangle(waterPen, water);
            }

            using (Pen wavePen = new Pen(Color.FromArgb(80, 255, 255, 255), 2))
            {
                int waveY = water.Top + 12;
                for (int x = water.Left + 12; x < water.Right - 24; x += 36)
                {
                    graphics.DrawArc(wavePen, x, waveY, 36, 14, 0, 180);
                }
            }
        }

        private void DrawBall(Graphics graphics)
        {
            int ballSize = 54;
            int x = GetBeakerBounds().Left + (GetBeakerBounds().Width - ballSize) / 2;
            Rectangle ball = new Rectangle(x, ballPositionY, ballSize, ballSize);

            using (GraphicsPath path = new GraphicsPath())
            {
                path.AddEllipse(ball);
                using (PathGradientBrush brush = new PathGradientBrush(path))
                {
                    brush.CenterColor = ControlPaint.Light(ballColor);
                    brush.SurroundColors = new[] { ballColor };
                    brush.CenterPoint = new PointF(ball.Left + 18, ball.Top + 16);
                    graphics.FillPath(brush, path);
                }
            }

            using (Pen outlinePen = new Pen(Color.FromArgb(35, 42, 49), 2))
            {
                graphics.DrawEllipse(outlinePen, ball);
            }
        }

        private Rectangle GetBeakerBounds()
        {
            int width = Math.Min(430, Math.Max(280, ClientSize.Width - 140));
            int height = Math.Min(510, Math.Max(360, ClientSize.Height - 150));
            int x = (ClientSize.Width - width) / 2;
            int y = Math.Max(80, ClientSize.Height - height - 45);
            return new Rectangle(x, y, width, height);
        }

        private static Color GetBallColor(int temperature)
        {
            double percent = (temperature - MinimumTemperature) /
                (double)(MaximumTemperature - MinimumTemperature);
            percent = Math.Max(0, Math.Min(1, percent));

            int r = Interpolate(45, 224, percent);
            int g = Interpolate(68, 82, percent);
            int b = Interpolate(89, 54, percent);
            return Color.FromArgb(r, g, b);
        }

        private static int Interpolate(int start, int end, double percent)
        {
            return (int)Math.Round(start + ((end - start) * percent));
        }
    }
}
