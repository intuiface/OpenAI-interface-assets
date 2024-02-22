using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WhisperNET
{
    public class TextEventArgs : EventArgs
    {
        public string transcribedText { get; set; }

        public TextEventArgs(string s_)
        {
            transcribedText = s_;
        }

    }
}
