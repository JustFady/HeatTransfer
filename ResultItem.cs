using System.ComponentModel;

namespace HeatTransfer
{
    public class ResultItem
    {
        [DisplayName("Time (s)")]
        public int Time { get; private set; }

        [DisplayName("Ball Temp (C)")]
        public int BallTemperatureCelsius { get; private set; }

        public ResultItem(int time, int ballTemperatureCelsius)
        {
            Time = time;
            BallTemperatureCelsius = ballTemperatureCelsius;
        }

        public string ToCsv()
        {
            return Time + "," + BallTemperatureCelsius;
        }

        public override string ToString()
        {
            return ToCsv();
        }
    }
}
