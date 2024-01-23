import { Action, Asset, IntuifaceElement, Parameter, Property, Trigger } from '@intuiface/core';
import { Message } from './Message';


class rawMessage
{
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
export class ChatGPT4TS extends IntuifaceElement 
{

    //#region Public Properties

    /**
    * Choices List
    */
    @Property({
        displayName: 'List Messages',
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
        displayName: 'Open AI API Key',
        defaultValue: '',
        type: String,
    })
    public apiKey: string = '';

    //#endregion Public Properties

    //#region Constructor
    /**
     * @constructor
     */
    public constructor()
    {
        super();
    }

    //#endregion Constructor

    //#region Triggers

    /**
     * Trigger Example
     */
    @Trigger({
        name: 'responseReceived',
        displayName: 'Response received',
        description: 'Raised when GPT API has responded'
    })
    public responseReceived( @Parameter({
        name: 'response',
        displayName: 'Response',
        description: 'The response received from OpenAI',
        defaultValue: '',
        type: String
    }) response: string): void { }

    //#endregion Triggers

    //#region Actions


    /**
        *Clears the chat history to start a new session
        */
    @Action({
        displayName: 'Clear Chat Session',
        description: 'Clears the chat history.',
        validate: true
    })
    public clearChatSession()
    {
        this.listMessages = [];
    }

    /**
     * Ask GPT4 for a chat completion
     */
    @Action({
        displayName: 'Text Completion',
        description: 'Sends a request to OpenAI to complete text.',
        validate: true
    })
    public async textCompletion(
        @Parameter({
            name: 'model',
            displayName: 'Model',
            description: 'The OpenAI model to use',
            defaultValue: 'gpt-4',
            type: String
        }) model: string,
        @Parameter({
            name: 'message',
            displayName: 'message',
            description: 'The message to send to OpenAI',
            defaultValue: '',
            type: String
        }) message: string,
        @Parameter({
            name: '',
            displayName: 'temperature',
            description: '',
            defaultValue: '1',
            type: Number
        }) temperature: number,
        @Parameter({
            name: 'maxTokens',
            displayName: 'Maximum Tokens',
            description: 'The max tokens to use with OpenAI API',
            defaultValue: 20,
            type: Number
        }) maxTokens: number): Promise<void>
    {
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
        for (var i in this.listMessages)
        {
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

        var response:string = '';


        //If we wanted to consider all choices returned by OpenAI
        //for (var i in json.choices)

        //For now, only consider the first response returned by OpenAI

        if (json.choices.length > 0)
        {
            var c = new Message();
            c.content = json.choices[0].message.content.replaceAll('\n', '');
            c.role = json.choices[0].message.role;
            response = c.content;
            this.listMessages.push(c);
        }


        this.notifyPropertyChanged('listMessages', this.listMessages);
        this.responseReceived(response);
    }


    /**
   * Add a System message in the conversation
   */
    @Action({
        displayName: 'Add System Message',
        description: 'Inserts a system message in the current conversation.',
        validate: true
    })
    public addSystemMessage(
        @Parameter({
            name: 'message',
            displayName: 'message',
            description: 'The message to send to OpenAI',
            defaultValue: '',
            type: String
        }) message: string): void
    {
        const sysMessage = new Message();
        sysMessage.role = 'system';
        sysMessage.content = message;
        this.listMessages.push(sysMessage);

        this.notifyPropertyChanged('listMessages', this.listMessages);
    }
    //#endregion Actions
}
