import { Action, Asset, IntuifaceElement, Parameter, Property, Trigger } from '@intuiface/core';

/**
 * Custom Interface Asset WhisperTS
 */
@Asset({
    name: 'WhisperTS',
    displayName: 'Whisper - Player on all other platforms',
    description: 'Use the OpenAI Whisper model and OpenAI Audio API to transcribe audio spoken into the default microphone.',
    category: 'OpenAI',
    behaviors: [],
})
export class WhisperTS extends IntuifaceElement {

    //#region Public Properties   

    /**
     * API Key
     */
    @Property({
        displayName: 'OpenAI API Key',
        defaultValue: '',
        type: String,
    })
    public apiKey: string = '';


    /**
    * Language
    */
    //THIS PROPERTY IS REMOVED FOR NOW, BECAUSE OF THE COMPLEXITY TO USE SETTERS IN COMPOSER. 

    // @Property({
    //     displayName: 'ISO-639-1 language',
    //     description: 'Optional. The recording language. Leave empty for auto-detection.',
    //     defaultValue: '',
    //     type: String,
    // })
    // public language: string = '';

    //#endregion Public Properties

    private audioChunks: any = [];
    private rec: MediaRecorder;

    //#region Constructor
    /**
     * @constructor
     */
    public constructor() {
        super();
    }

    public initialize(configuration: any) {
        super.initialize(configuration);

        try {
            navigator.mediaDevices.getUserMedia({
                audio: true
            })
                .then(stream => {
                    this.handlerFunction(stream)
                })
        } catch (error) {
            this.errorReceived('MediaDevices unavailable or permission was refused.')
        }
    }



    //#endregion Constructor

    //#region Triggers

    /**
     * Trigger transcriptionReceived
     */
    @Trigger({
        name: 'transcriptionReceived',
        displayName: 'Transcription received',
        description: 'Raised when the transcribed text has been received.'
    })
    public transcriptionReceived(
        @Parameter({
            name: 'transcribedText',
            displayName: 'Transcribed text',
            description: 'The transcribed text received from OpenAI',
            defaultValue: '',
            type: String
        }) transcribedText: string): void { }

    /**
    * Trigger audioRecordingReady
    */
    @Trigger({
        name: 'audioRecordingReady',
        displayName: 'Audio recorded',
        description: 'Raised when audio has been recorded.'
    })
    public audioRecordingReady(
        @Parameter({
            name: 'audioRecording',
            displayName: 'Audio recording',
            description: '',
            defaultValue: '',
            type: String
        }) audioRecording: string): void { }

    /**
         * Trigger Errror Received
         */
    @Trigger({
        name: 'errorReceived',
        displayName: 'Error message received',
        description: ''
    })
    public errorReceived(@Parameter({
        name: 'errorMessage',
        displayName: 'Error message',
        description: 'The error message received from OpenAI',
        defaultValue: '',
        type: String
    }) errorMessage: string): void { }

    //#endregion Triggers

    //#region Actions

    /**
     * Action Example
     */
    @Action({
        displayName: 'Start recording',
        description: 'Start recording audio through the device’s default microphone.',
        validate: true
    })
    public startRecording(): void {
        if (this.rec == undefined)
        {
            this.errorReceived('The recording can\'t be started');
            return;
        }
          
        console.log('Start Recording')

        this.audioChunks = [];
        this.rec.start();
    }

    @Action({
        displayName: 'Stop recording and transcribe',
        description: 'Stop the recording and send it to the OpenAI audio transcription API.',
        validate: true
    })
    public stopRecording(): void {
        if (this.rec == undefined)
        {
            this.errorReceived('The recording can\'t be stopped');
            return;
        }
        console.log('Start Recording')

        this.rec.stop();
    }
    //#endregion Actions

    //#region Private functions


    private handlerFunction(stream: any): void {

        this.rec = new MediaRecorder(stream);

        //keep stacking audio chunks while recording is on-going. 
        this.rec.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.audioChunks.push(event.data);
            }
        };

        //when recording is finished, create the audio blob and send it to OpenAI API. 
        this.rec.onstop = () => {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });

            //Raise trigger to provide access to audio recording
            this.audioRecordingReady(URL.createObjectURL(audioBlob));



            const reader = new FileReader();
            reader.onloadend = () => {
                const audioFile = new File([reader.result], 'audio.wav', { type: 'audio/wav' });
                // Use the audio file as needed
                console.log(audioFile);
                this.sendToOpenAI(audioFile);
            };

            reader.readAsArrayBuffer(audioBlob);

            this.audioChunks = [];
        };


    }

    private async sendToOpenAI(audioFile: File): Promise<void> {
        const req = 'https://api.openai.com/v1/audio/transcriptions';

        const headers: HeadersInit = {
            'Authorization': `Bearer ` + this.apiKey
        }

        const formData = new FormData();
        formData.append('file', audioFile);
        formData.append('model', 'whisper-1');

        //TODO: add this parameter again later to improve transcription results. 
        // if (this.language != '') {
        //     formData.append('language', this.language);
        // }

        const opts: RequestInit = {
            method: 'POST',
            headers,
            body: formData
        };

        const rawResponse = await fetch(req, opts);

        const json = await rawResponse.json();

        //Catch error response from API 
        if (rawResponse.status != 200) {
            this.errorReceived(json.error.message);
            return null;
        }

        this.transcriptionReceived(json.text);
    }


    //#endregion
}
