import { Action, Asset, IntuifaceElement, Parameter, Property, Trigger } from '@intuiface/core';

/**
 * Custom Interface Asset VisionTS
 */
@Asset({
    name: 'VisionTS',
    displayName: 'Vision - Player on all other platforms',
    description: 'Use an OpenAI GPT model and OpenAI Chat Completion API to generate a detailed description of any image.',
    category: 'OpenAI',
    behaviors: [],
})
export class VisionTS extends IntuifaceElement {

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

    //#endregion Public Properties

    //#region Constructor
    /**
     * @constructor
     */
    public constructor() {
        super();
    }

    //#endregion Constructor

    //#region Triggers

    @Trigger({
        name: 'responseReceived',
        displayName: 'Response received',
        description: 'Raised when the OpenAI API has returned a response to the latest prompt.'
    })
    public responseReceived(
        @Parameter({
            name: 'response',
            displayName: 'Response',
            description: 'The message from the Vision API',
            type: String
        }) response: string): void {
        // Implement the trigger's method
    }

    @Trigger({
        name: 'errorWithResponse',
        displayName: 'Error message received',
        description: 'Raised when the OpenAI API has returned an error.'
    })
    public errorWithResponse(
        @Parameter({
            name: 'error',
            displayName: 'Error message',
            description: 'The error message',
            type: String
        }) error: string): void {
        // Implement the trigger's method
    }

    //#endregion Triggers

    //#region Actions

    @Action({
        displayName: 'Analyze image'
    })
    public async analyzeImage(
        @Parameter({
            name: 'model',
            displayName: 'Model',
            description: 'OpenAI model',
            defaultValue: 'gpt-4-vision-preview',
            type: String
        })
        model: string,
        @Parameter({
            name: 'prompt',
            displayName: 'Prompt',
            type: String
        })
        prompt: string,
        @Parameter({
            name: 'image',
            displayName: 'Image',
            description: 'This field can either contain an image URL, a local image file path, or a base64 string.',
            type: String
        })
        image: string,
        @Parameter({
            name: 'tokens',
            displayName: 'Maximum Tokens',
            type: Number
        })
        tokens: number,
        @Parameter({
            name: 'detail',
            displayName: 'Detail',
            description: 'Use either \'low\', \'high\' or \'auto\'',
            type: String,
            defaultValue: 'auto'
        })
        detail: string): Promise<void> {

        //The image content to fill and to send to OpenAI endpoint. 
        let imageContent;

        //check if the detail parameter is received is one of the 3 valid options.
        // if not, use 'auto'
        const d = (detail != 'low' && detail != 'high' && detail != 'auto') ? 'auto' : detail;

        //First, check if the provided image is a public URL, a local filePath or a base64 image content. 
        if (this.isImageUrl(image)) {
            //If the user provided an image URL, simply pass that URL to OpenAI endpoint
            imageContent = {
                type: "image_url",
                image_url: {
                    url: image,
                    detail: d
                }
            };
        } else {

            //second, check if image is a local file path or already a base64 image content. 
            //NOTE: improve / double-check that code
            let base64Image;
            if (this.isBase64EncodedImage(image)) {
                //if the input is already a base64 encoded image, just use it. 
                base64Image = image;
            }
            else {
                //if it's a local file path, convert that local image to base64
                base64Image = await this.convertImageToBase64(image);
                if (!base64Image) {
                    this.errorWithResponse("Failed to convert image to Base64");
                    return;
                }
            }
            //fill in the imageContent with the base64 string. 
            imageContent = {
                type: "image_url",
                image_url: {
                    url: `${base64Image}`,
                    detail: d
                }
            };
        }

        const messages = [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: prompt
                    },
                    imageContent
                ]
            }
        ];

        //Send the request to OpenAI endpoint.
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    max_tokens: tokens
                })
            });

            const data = await response.json();
            if (data && data.choices && data.choices.length > 0) {
                this.responseReceived(data.choices[0].message.content);
            } else {
                this.errorWithResponse("No valid response received");
            }
        } catch (error) {
            console.error('Error calling OpenAI Vision API:', error);
            this.errorWithResponse(error.toString());
        }
    }


    //#endregion Actions

    //#region Private Methods / Helpers

    private isImageUrl(imagePath: string): boolean {
        //Check if the imagePath starts with http or https, but is not a local server URL (case of Electron)
        return (imagePath.startsWith('http://') || imagePath.startsWith('https://')) && (!imagePath.startsWith('http://localhost'));
    }

    private isBase64EncodedImage(str: string): boolean {
        // Regular expression to check if the string is a Base64 encoded image
        // This regex checks for the starting data:image MIME type, followed by optional charset definition,
        // then base64 marker and finally checks if the remaining part could be base64 by excluding invalid chars
        const regex = /^data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/]+={0,2}$/;

        return regex.test(str);
    }

    private async convertImageToBase64(imagePath: string): Promise<string | null> {
        try {

            //NOTE: is this really the correct way to load the image from a file path? 
            // use fs.readFile when Node.JS is available, but what to use when it's not, such as on Android? 
            const response = await fetch(imagePath);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64data = reader.result as string;
                    console.error(base64data); // Output the Base64 string to the console
                    resolve(base64data);
                };
                reader.onerror = () => reject(new Error('Failed to read the blob as Base64'));
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('Error converting image to Base64:', error);
            return null;
        }
    }

    //#endregion Private Methods / Helpers

}
