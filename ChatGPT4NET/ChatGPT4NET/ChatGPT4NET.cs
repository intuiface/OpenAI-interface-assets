using OpenAI_API.Chat;
using OpenAI_API.Models;
using OpenAI_API;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ChatGPT4NET
{
    public class ChatGPT4NET : INotifyPropertyChanged
    {
        #region INotifyPropertyChanged


        public event PropertyChangedEventHandler PropertyChanged;


        private void NotifyPropertyChanged(String info)
        {
            if (PropertyChanged != null)
            {
                PropertyChanged(this, new PropertyChangedEventArgs(info));
            }
        }

        #endregion

        #region private attributes

        private string m_strAPIKey = "";
        private ObservableCollection<Message> m_lstMessages;

        private OpenAIAPI m_refApi;

        #endregion

        #region Public Properties

        public string APIKey
        {
            get { return m_strAPIKey; }
            set
            {
                if (m_strAPIKey != value)
                {
                    m_strAPIKey = value;
                    NotifyPropertyChanged("APIKey");
                }
            }
        }

        public ObservableCollection<Message> Messages
        {
            get { return m_lstMessages; }
            set
            {
                if (m_lstMessages != value)
                {
                    m_lstMessages = value;
                    NotifyPropertyChanged("Messages");
                }
            }
        }
        #endregion

        #region COnstructor


        public ChatGPT4NET()
        {
            Messages = new ObservableCollection<Message>();
            m_refApi = new OpenAIAPI(this.APIKey);
        }


        #endregion

        #region Events

        public delegate void MessageReceivedEventHandler(object sender, MessageReceivedEventArgs args);
        public event MessageReceivedEventHandler MessageReceivedEvent;

        public delegate void ErrorMessageReceivedEventHandler(object sender, ErrorMessageEventArgs args);
        public event ErrorMessageReceivedEventHandler ErrorMessageEvent;

        #endregion

        #region Public Actions

        public void clearChatSession()
        { Messages.Clear(); }


        public async void textCompletion(string message_, string model_, double temperature_, int maxTokens_)
        {
            try
            {
                //add new message to list of stored nmessages
                Message userMessage = new Message();
                userMessage.Role = "user";
                userMessage.Content = message_;
                this.Messages.Add(userMessage);

                m_refApi.Auth = new APIAuthentication(this.APIKey);

                var RawMessages = new List<ChatMessage>();
                foreach (var item in this.Messages)
                {
                    RawMessages.Add(new ChatMessage() { Role = ChatMessageRole.FromString(item.Role), Content = item.Content });
                }

                // Send async request to OpenAI. 
                var result = await m_refApi.Chat.CreateChatCompletionAsync(new ChatRequest()
                {
                    //Model = Model.GPT4,
                    Model = model_,
                    Temperature = temperature_,
                    MaxTokens = maxTokens_,
                    Messages = RawMessages.ToArray()
                });

                var reply = result.Choices[0].Message;
                Console.WriteLine($"{reply.Role}: {reply.Content.Trim()}");

                //raise trigger
                if (MessageReceivedEvent != null)
                    MessageReceivedEvent(this, new MessageReceivedEventArgs(reply.Content.Trim()));

                //add assistant message to list of messages
                this.Messages.Add(new Message()
                {
                    Content = reply.Content.Trim(),
                    Role = reply.Role
                });
            }
            catch (Exception ex)
            {
                if (ErrorMessageEvent != null)
                    ErrorMessageEvent(this, new ErrorMessageEventArgs(ex.Message));
                
            }
           


        }

        public void addSystemMessage(string message_)
        {
            this.Messages.Add(new Message()
            {
                Content = message_,
                Role = "system"
            });

        }




        #endregion
    }
}