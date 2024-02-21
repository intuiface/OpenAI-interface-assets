using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WhisperNET
{
    public class ErrorMessageEventArgs : EventArgs
    {
        public string ErrorMessage { get; set; }

        public ErrorMessageEventArgs(string message_)
        {
            this.ErrorMessage = message_;
        }
    }
}