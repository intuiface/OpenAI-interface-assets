import { Action, Asset, IntuifaceElement, Parameter, Property, Trigger } from '@intuiface/core';

/**
 * Custom Interface Asset SpeechSynthesisTS
 */
@Asset({
    name: 'SpeechSynthesisTS',
    displayName: 'Text to Speech',
    category: 'OpenAI',
    behaviors: [],
})
export class SpeechSynthesisTS extends IntuifaceElement {

    @Property({
        displayName: 'Available Voices',
        type: Array,
        itemType: String,
        description: 'List of available voices for speech generation.',
        readOnly: true
    })
    public avilableVoices: string[] = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];


    @Property({
        displayName: 'Speech Result',
        type: String,
        description: 'Contains the speech data returned from the API.',
        readOnly: true
    })
    public SpeechResult: string = '';

    @Trigger({
        name: "onSpeechGenerated",
        displayName: "Speech Generated",
        description: "Triggered when the speech response has been received and processed."
    })
    public onSpeechGenerated(): void {
        // This method is intentionally empty; the trigger is used to notify external listeners.
    }

    /**
        * Trigger Errror Received
        */
    @Trigger({
        name: 'errorReceived',
        displayName: 'Error message received',
        description: 'Raised when the OpenAI API has returned an error.'
    })
    public errorReceived(@Parameter({
        name: 'errorMessage',
        displayName: 'Error message',
        description: 'The error message received from OpenAI',
        defaultValue: '',
        type: String
    }) errorMessage: string): void { }

    @Action({
        displayName: "Create Speech"
    })
    public async createSpeech(
        @Parameter({
            name: "openAIKey",
            displayName: "OpenAI API Key",
            type: String,
            description: "The OpenAI API key to use."
        })
        openAIKey: string,

        @Parameter({
            name: "model",
            displayName: "Model",
            type: String,
            description: "The model to use for speech generation."
        })
        model: string,

        @Parameter({
            name: "inputText",
            displayName: "Input Text",
            type: String,
            description: "The text to convert to speech."
        })
        inputText: string,

        @Parameter({
            name: "voice",
            displayName: "Voice",
            type: String,
            description: "The voice to use for speech generation."
        })
        voice: string
    ): Promise<void> {
        if (!openAIKey) {
            console.error("OpenAI Key is not set.");
            this.errorReceived("OpenAI Key is not set.")
            return;
        }

        try {
            const response = await fetch("https://api.openai.com/v1/audio/speech", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${openAIKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model,
                    voice,
                    input: inputText
                })
            });

            if (!response.ok) {
                const error = await response.text();
                console.error("Error generating speech:", error);
                this.errorReceived("Error generating speech: " + error);
                return;
            }

            // Convert response to Base64 and set it as the result
            const arrayBuffer = await response.arrayBuffer();
            //const base64Audio = Buffer.from(arrayBuffer).toString("base64");
            const base64Audio = this.bufferToBase64(arrayBuffer);
            this.SpeechResult = 'data:audio/mp3;base64,' + base64Audio;
            console.log("Speech generated successfully, Base64 data set.");
            this.onSpeechGenerated();
        } catch (error) {
            console.error("Failed to generate speech:", error);
            this.errorReceived("Failed to generate speech: " + error);
        }
    }

    private bufferToBase64(buffer: ArrayBuffer): string {
        var bytes = new Uint8Array(buffer);
        var len = buffer.byteLength;
        var binary = "";
        for (var i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };



    // //#region Public Properties

    // /**
    //  * Property example
    //  */
    // @Property({
    //     displayName: 'propertyExample',
    //     description: 'A property declaration example.',
    //     defaultValue: 0,
    //     minValue: 0,
    //     maxValue: 10,
    //     type: Number
    // })
    // public propertyExample: number = 0;

    // //#endregion Public Properties

    // //#region Constructor
    // /**
    //  * @constructor
    //  */
    // public constructor()
    // {
    //     super();
    // }

    // //#endregion Constructor

    // //#region Triggers

    // /**
    //  * Trigger Example
    //  */
    // @Trigger({
    //     name: 'exampleTrigger',
    //     displayName: 'A Trigger Example',
    //     description: 'Raised when the property example changed'
    // })
    // public exampleTrigger(
    //     @Parameter({
    //         name: 'triggerParam',
    //         displayName: 'Trigger parameter',
    //         description: 'A trigger parameter example.',
    //         defaultValue: '',
    //         type: String
    //     }) triggerParam: string
    // ): void {}

    // //#endregion Triggers

    // //#region Actions

    // /**
    //  * Action Example
    //  */
    // @Action({
    //     displayName: 'Action Example',
    //     description: 'An Action example with a parameter and validation',
    //     validate: true
    // })
    // public actionExample(
    //     @Parameter({
    //         name: 'actionParam',
    //         displayName: 'Action parameter',
    //         description: 'An action parameter example.',
    //         defaultValue: 1,
    //         minValue: 0,
    //         maxValue: 10,
    //         type: Number
    //     }) actionParam: number): void
    // {
    //     if (this.propertyExample !== actionParam) {
    //         this.propertyExample = actionParam;
    //         // raise the trigger
    //         this.exampleTrigger('An example parameter string value');
    //     }
    // }
    // //#endregion Actions

}
