import { Asset, IntuifaceElement, Property, Watchable } from '@intuiface/core';

@Asset({
    name: 'Message',
    category: 'OpenAI',
    behaviors: []
})
export class Message extends Watchable {


@Property({
   displayName: 'Role',
   defaultValue: '',
   type: String
})
public role: string = "";

@Property({
   displayName: 'Content',
   defaultValue: '',
   type: String
})
public content: string = "";
}