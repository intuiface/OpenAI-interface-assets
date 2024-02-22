using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ChatGPT4NET
{
    public class MessageReceivedEventArgs : EventArgs
    {
        public string MessageReceived { get; set; }

        public MessageReceivedEventArgs(string s_)
        {
            this.MessageReceived = s_;
        }
    }
}
