import { Action, Asset, IntuifaceElement, Parameter, Property, Trigger } from '@intuiface/core';
import { Message } from './Message';


class rawMessage {
    role: string;
    content: string;
}


/**
 * Custom Interface Asset ChatGPT4TS
 */
@Asset({
    name: 'ChatGPT4TS',
    displayName: 'ChatGPT - Player on all other platforms',
    category: 'OpenAI',
    behaviors: [],
})
export class ChatGPT4TS extends IntuifaceElement {

    //#region Public Properties

    /**
    * Choices List
    */
    @Property({
        displayName: 'Messages sent/received',
        readOnly: true,
        defaultValue: [],
        type: Array,
        itemType: Message
    })
    public listMessages: Array<Message> = [];


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

    /**
     * Trigger Response Received
     */
    @Trigger({
        name: 'responseReceived',
        displayName: 'Response received',
        description: ''
    })
    public responseReceived(@Parameter({
        name: 'response',
        displayName: 'Response',
        description: 'The response received from OpenAI',
        defaultValue: '',
        type: String
    }) response: string): void { }

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
        *Clears the chat history to start a new session
        */
    @Action({
        displayName: 'Clear chat session',
        description: 'Clears the existing chat session. The next ‘Send prompt’ will start a new chat.',
        validate: true
    })
    public clearChatSession() {
        this.listMessages = [];
    }

    /**
     * Ask GPT4 for a chat completion
     */
    @Action({
        displayName: 'Send Prompt',
        description: 'Sends a prompt to the GPT chat model you specify.',
        validate: true
    })
    public async textCompletion(
        @Parameter({
            name: 'message',
            displayName: 'Prompt',
            description: 'The user message to send to OpenAI',
            defaultValue: '',
            type: String
        }) message: string,
        @Parameter({
            name: 'model',
            displayName: 'Model',
            description: 'The OpenAI model to use',
            defaultValue: 'gpt-4',
            type: String
        }) model: string,
        @Parameter({
            name: 'temperature',
            displayName: 'Temperature',
            description: '',
            defaultValue: 1,
            type: Number
        }) temperature: number,
        @Parameter({
            name: 'maxTokens',
            displayName: 'Maximum Tokens',
            description: 'The maximum number of tokens to use in a request',
            defaultValue: 20,
            type: Number
        }) maxTokens: number): Promise<void> {

        try {


            const req = 'https://api.openai.com/v1/chat/completions';

            const headers: HeadersInit = {
                'Authorization': `Bearer ` + this.apiKey,
                'Content-Type': `application/json`
            }

            const userMessage = new Message();
            userMessage.role = 'user';
            userMessage.content = message;
            this.listMessages.push(userMessage);

            //create array of raw Messages (not Intuiface Class) to send to the API
            var rawListMessage: rawMessage[] = [];
            for (var i in this.listMessages) {
                const m = new rawMessage();
                m.role = this.listMessages[i].role;
                m.content = this.listMessages[i].content;
                rawListMessage.push(m);
            }


            const body = {
                'model': model,
                'messages': rawListMessage,
                'max_tokens': maxTokens,
                'temperature': temperature
            }

            const opts: RequestInit = {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            };

            const rawResponse = await fetch(req, opts);


           

            const json = await rawResponse.json();

            var response: string = '';

            //Catch error response from API 
            if(rawResponse.status != 200){
                this.errorReceived(json.error.message);
                return null;
            }

            //If we wanted to consider all choices returned by OpenAI
            //for (var i in json.choices)

            //For now, only consider the first response returned by OpenAI

            if (json.choices && json.choices.length > 0) {
                var c = new Message();
                c.content = json.choices[0].message.content.replaceAll('\n', '');
                c.role = json.choices[0].message.role;
                response = c.content;
                this.listMessages.push(c);

                this.notifyPropertyChanged('listMessages', this.listMessages);
                this.responseReceived(response);
            }
        } catch (error) {
            //raise error received trigger
            this.errorReceived(error.message);
        }
    }


    /**
   * Add a System message in the conversation
   */
    @Action({
        displayName: 'Specify system guidance',
        description: 'Adds a system message to every ‘Send prompt’.',
        validate: true
    })
    public addSystemMessage(
        @Parameter({
            name: 'message',
            displayName: 'Message',
            description: 'The system message to send to OpenAI',
            defaultValue: '',
            type: String
        }) message: string): void {
        const sysMessage = new Message();
        sysMessage.role = 'system';
        sysMessage.content = message;
        this.listMessages.push(sysMessage);

        this.notifyPropertyChanged('listMessages', this.listMessages);
    }
    //#endregion Actions
}
