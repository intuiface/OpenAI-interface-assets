import { Action, Asset, IntuifaceElement, Parameter, Property, Trigger } from '@intuiface/core';

/**
 * Custom Interface Asset SpeechSynthesisTS
 */
@Asset({
    name: 'SpeechSynthesisOpenAI',
    displayName: 'Text to Speech - OpenAI',
    category: 'Speech',
    behaviors: [],
})
export class SpeechSynthesisOpenAI extends IntuifaceElement {

    //#region 

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

    /**
     * API Key
     */
    @Property({
        displayName: 'OpenAI API Key',
        defaultValue: '',
        type: String,
    })
    public apiKey: string = '';

    //#endregion

    //#region Triggers

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

    //#endregion

//#region Actions


    @Action({
        displayName: "Create Speech"
    })
    public async createSpeech(
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
        if (!this.apiKey) {
            console.error("OpenAI Key is not set.");
            this.errorReceived("OpenAI Key is not set.")
            return;
        }

        try {
            const response = await fetch("https://api.openai.com/v1/audio/speech", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
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

    //#endregion

    //#region Private helpers

    private bufferToBase64(buffer: ArrayBuffer): string {
        var bytes = new Uint8Array(buffer);
        var len = buffer.byteLength;
        var binary = "";
        for (var i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };

    //#endregion

}


// import { Action, Asset, IntuifaceElement, Parameter, Property, Trigger } from '@intuiface/core';

// /**
//  * Custom Interface Asset SpeechSynthesisOpenAI
//  */
// @Asset({
//     name: 'SpeechSynthesisOpenAI',
//     category: 'Speech',
//     behaviors: [],
// })
// export class SpeechSynthesisOpenAI extends IntuifaceElement {

//     //#region Public Properties

//     /**
//      * Property example
//      * This property will be displayed and can be used in Composer
//      * It can be bind to a trigger or an action
//      * It can be modified with an action (if the property is not read-only)
//      */
//     @Property({
//         displayName: 'propertyExample',
//         description: 'A property declaration example.',
//         defaultValue: 0,
//         minValue: 0,
//         maxValue: 10,
//         type: Number
//     })
//     public propertyExample: number = 0;

//     //#endregion Public Properties

//     //#region Private Properties

//     /**
//      * A private property example
//      */
//     private _privateStr: String = null;

//     //#endregion Private Properties

//     //#region Constructor
//     /**
//      * @constructor
//      */
//     public constructor()
//     {
//         super();
//     }

//     //#endregion Constructor

//     //#region Life Cycle

//     /**
//      *  * Each element or collection has the same life cycle :
//      * 1 - Constructor : Can be use to declare properties, set default values.
//      * 2 - Initialize : Initialize the element with the configuration. The configuration contains the values of each properties defined in Composer.
//      * 3 - Dispose : Dispose the element, remove all listeners, clear memory.
//      * 
//      * It is important to call the `super()` in each method to ensure the correct behavior of the element. 
//      * 
//      * All these functions can be removed if not used.
//      */

//     /**
//      * Initialize the element with the configuration.
//      * This is an example of how to use the initialize method.
//      */
//     public override initialize(configuration?: any): void
//     {
//         // call the super to apply the configuration (default values declared in Composer)
//         super.initialize(configuration);
    
//         // Add here any code you want to be executed after the Interface Asset has been loaded,
//         // and after the property values have been set by Composer / Player
//     }


//     /**
//      * Dispose the element.
//      * This is an example of how to use the dispose method.
//      */
//     public override dispose(): void
//     {
//         // Add here any code you want to be executed when the experience is stopping.
//         // For example: stop an infinite timer, close a Serial Port, ...

//         // then call the super
//         super.dispose();
//     }


//     //#endregion Life Cycle

//     //#region Triggers

//     /**
//      * Trigger Example
//      * This trigger will be raised when the propertyExample changed
//      * You need to call this method to raise the trigger.
//      * For the example, this method is called in the action below.
//      * 
//      * The trigger has a parameter that can be used in Composer.
//      */
//     @Trigger({
//         name: 'exampleTrigger',
//         displayName: 'A Trigger Example',
//         description: 'Raised when the property example changed'
//     })
//     public exampleTrigger(
//         @Parameter({
//             name: 'triggerParam',
//             displayName: 'Trigger parameter',
//             description: 'A trigger parameter example.',
//             defaultValue: '',
//             type: String
//         }) triggerParam: string
//     ): void {}

//     //#endregion Triggers

//     //#region Actions

//     /**
//      * Action Example
//      * This action will change the propertyExample value.
//      * It will raise the trigger exampleTrigger if the value of the property changed.
//      * An action is called if defined in Composer.
//      * 
//      * This action has a parameter and a validation.
//      * The parameter is a number between 0 and 10.
//      * If the parameter is not defined or not valid, the action will be called with the default value (1 in this case).
//      */
//     @Action({
//         displayName: 'Action Example',
//         description: 'An Action example with a parameter and validation',
//         validate: true
//     })
//     public actionExample(
//         @Parameter({
//             name: 'actionParam',
//             displayName: 'Action parameter',
//             description: 'An action parameter example.',
//             defaultValue: 1,
//             minValue: 0,
//             maxValue: 10,
//             type: Number
//         }) actionParam: number): void
//     {
//         if (this.propertyExample !== actionParam) {
//             this.propertyExample = actionParam;
//             // raise the trigger
//             this.exampleTrigger('An example parameter string value');
//         }
//     }
//     //#endregion Actions
// }
