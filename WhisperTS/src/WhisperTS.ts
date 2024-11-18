import { Action, Asset, IntuifaceElement, Parameter, Property, SystemInfoService, Trigger } from '@intuiface/core';
import UAParser from 'ua-parser-js';

/**
 * Custom Interface Asset WhisperTS
 */
@Asset({
    name: 'WhisperTS',
    displayName: 'Whisper',
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
    //user agent info to determine if we are on iOS or not (installed Player or in Safari browser)
    //private _userAgent: string = navigator.userAgent || navigator.vendor || (window as any).opera;
    //private isiOS =  /Macintosh|iPad|iPhone|iPod/.test(this._userAgent) && !(window as any).MSStream;    

    private parser = new UAParser(navigator.userAgent);
    private isSafari = this.parser.getBrowser().name.includes('Safari') || this.parser.getBrowser().name.includes('WebKit'); 

    private isiOS = false;
    private osInitialized = false;

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
                .catch((err) => {
                    this.errorReceived(`${err.name}: ${err.message}`);
                });
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
    public async startRecording(): Promise<void> {

        if (!this.osInitialized){
            this.isiOS = (await (SystemInfoService as any).getInstance().getOS() == 'iOS');
            this.osInitialized = true;
        }

        if (this.rec == null) {
            this.errorReceived('The recording can\'t be started');
            return;
        }

        console.log('Start Recording')

        this.audioChunks = [];
        
        if (this.isSafari || this.isiOS)
            this.rec.start(1000);
        else
            this.rec.start();
    }

    @Action({
        displayName: 'Stop recording and transcribe',
        description: 'Stop the recording and send it to the OpenAI audio transcription API.',
        validate: true
    })
    public stopRecording(): void {
        if (!this.rec) {
            this.errorReceived('The recording can\'t be stopped');
            return;
        }
        console.log('Stop Recording');
        this.rec.stop();
    }
    //#endregion Actions

    //#region Private functions


    private handlerFunction(stream: any): void {

        this.rec = new MediaRecorder(stream);
        // add an useless audio context to force keeping stream
        const audioCtx = new AudioContext();
        audioCtx.createMediaStreamSource(stream);

        //keep stacking audio chunks while recording is on-going.
        this.rec.ondataavailable = (event) => {
            console.log(`On data Available : ${event.data.size}`);
            if (event.data.size > 0) {
                this.audioChunks.push(event.data);
            }
        };

        //add error management
        this.rec.onerror = (event: any) => {
            this.errorReceived(`Error recording stream: ${event.error.name as string}`);
        };

        //when recording is finished, create the audio blob and send it to OpenAI API.
        this.rec.onstop = () => {
            if (this.audioChunks.length <= 0) {
                this.errorReceived('Empty audio chunks');
                return;
            }
            // if safari browser then use the mimeType of the MediaRecorder
            // otherwise for the audio/wav
            const mimeType = (this.isSafari || this.isiOS) ? this.rec.mimeType : 'audio/wav';
            // get the blob from chunks with the right type
            const audioBlob = new Blob(this.audioChunks, { type: mimeType });
            // Raise trigger to provide access to audio recording
            const audioURL = URL.createObjectURL(audioBlob);
            this.audioRecordingReady(audioURL);

            const reader = new FileReader();
            reader.onloadend = () => {
                // get the file from the mime type
                const filename = `audio.${mimeType.replace('audio/', '')}`;
                // create a file to send to openAI
                const audioFile = new File([reader.result], filename, { type: mimeType });
                // Use the audio file as needed
                void this.sendToOpenAI(audioFile);
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

        try {
            const rawResponse = await fetch(req, opts);

            const json = await rawResponse.json();

            //Catch error response from API 
            if (rawResponse.status != 200) {
                this.errorReceived(json.error.message);
                return null;
            }

            this.transcriptionReceived(json.text);
        } catch (error) {
            //catch an error if the Fetch failed.
            this.errorReceived(error.message);
        }
    }


    //#endregion
}
