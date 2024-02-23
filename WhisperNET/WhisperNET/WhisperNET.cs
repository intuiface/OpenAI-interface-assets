using NAudio.Wave;
using Newtonsoft.Json;
using System;
using System.ComponentModel;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;

namespace WhisperNET
{
    public class WhisperNET : INotifyPropertyChanged
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

        #region private properties

        private string _openAIKey;
        private WaveInEvent waveSource = null;
        private WaveFileWriter waveFile = null;
        private string tempFileName;

        #endregion

        #region Public Properties

        public string apiKey
        {
            get { return _openAIKey; }
            set
            {
                if (_openAIKey != value)
                {
                    _openAIKey = value;
                    NotifyPropertyChanged("apiKey");
                }
            }
        }

        #endregion


        #region Events

        public delegate void TextEventHandler(object sender, TextEventArgs args);
        public event TextEventHandler transcriptionReceived;

        public delegate void ErrorMessageReceivedEventHandler(object sender, ErrorMessageEventArgs args);
        public event ErrorMessageReceivedEventHandler ErrorMessageEvent;

        #endregion

        #region Constructor

        public WhisperNET() { }

        #endregion

        #region Public Actions

        public async void startRecording()
        {
            await StartRecordingAsync();
        }


        private async Task StartRecordingAsync()
        {
            await Task.Run(() =>
            {
                waveSource = new WaveInEvent();
                waveSource.WaveFormat = new WaveFormat(44100, 1); // CD quality audio
                waveSource.DataAvailable += new EventHandler<WaveInEventArgs>(WaveSource_DataAvailable);
                waveSource.RecordingStopped += new EventHandler<StoppedEventArgs>(WaveSource_RecordingStopped);

                tempFileName = Path.GetTempFileName();
                waveFile = new WaveFileWriter(tempFileName, waveSource.WaveFormat);

                waveSource.StartRecording();
                Console.WriteLine("Recording started...");
            });
        }

        public async Task<string> stopRecording()
        {
            waveSource.StopRecording();

            // Wait a bit for the recording to be properly finalized
            await Task.Delay(1000); // Adjust this delay as needed

            string transcription = await SendRecordingToOpenAIAsync(tempFileName);
            File.Delete(tempFileName); // Clean up the temporary file

            //raise trigger with transcript text
            if (transcriptionReceived != null)
            {
                transcriptionReceived(this, new TextEventArgs(transcription));
            }
            return transcription;
        }

        #endregion



        private void WaveSource_DataAvailable(object sender, WaveInEventArgs e)
        {
            if (waveFile != null)
            {
                waveFile.Write(e.Buffer, 0, e.BytesRecorded);
                waveFile.Flush();
            }
        }

        private void WaveSource_RecordingStopped(object sender, StoppedEventArgs e)
        {
            if (waveSource != null)
            {
                waveSource.Dispose();
                waveSource = null;
            }

            if (waveFile != null)
            {
                waveFile.Dispose();
                waveFile = null;
            }

            Console.WriteLine("Recording stopped.");
        }



        private async Task<string> SendRecordingToOpenAIAsync(string filePath)
        {
            using (var httpClient = new HttpClient())
            using (var content = new MultipartFormDataContent())
            {
                httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

                // Adding model parameter
                var modelContent = new StringContent("whisper-1");
                content.Add(modelContent, "model");

                var fileContent = new ByteArrayContent(File.ReadAllBytes(filePath));
                fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse("audio/wav");
                content.Add(fileContent, "file", Path.GetFileName(filePath));

                var response = await httpClient.PostAsync("https://api.openai.com/v1/audio/transcriptions", content);
                if (response.IsSuccessStatusCode)
                {
                    var jsonContent = await response.Content.ReadAsStringAsync();

                    // Deserialize JSON to a dynamic object to extract the "text" property
                    var result = JsonConvert.DeserializeObject<dynamic>(jsonContent);

                    // Access the "text" property directly
                    string transcript = result.text;

                    return transcript;
                }
                else
                {
                    //Raise error trigger
                    if (this.ErrorMessageEvent != null)
                        this.ErrorMessageEvent(this, new ErrorMessageEventArgs("Failed to transcribe audio: " + response.ReasonPhrase));

                    return "";
                }
            }
        }

    }
}