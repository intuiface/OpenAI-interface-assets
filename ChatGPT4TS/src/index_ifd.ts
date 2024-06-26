/* eslint-disable camelcase */
/* eslint-disable dot-notation */
// const fs = require('fs-extra');
import fs from 'fs-extra';

// create object to store metadatas
const globalThisAny = globalThis as any;
globalThisAny.intuiface_ifd_name = 'ChatGPT4TS';
globalThisAny.intuiface_ifd_classes = [];
globalThisAny.intuiface_ifd_properties = {};
globalThisAny.intuiface_ifd_actions = {};
globalThisAny.intuiface_ifd_params = {};
globalThisAny.intuiface_ifd_triggers = {};

/**
 * import the IA
 */
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
async function loadIA()
{
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const ia = await import('./ChatGPT4TS.js');

    const schemas: any = {};
    const resources: any = {};
    for (const name of globalThisAny.intuiface_ifd_classes)
    {
        schemas[name] =  {
            id: name,
            type: 'object',
            description: name,
            properties: globalThisAny.intuiface_ifd_properties[name]
        };

        resources[name] = {
            id: name,
            methods: globalThisAny.intuiface_ifd_actions[name],
            events: globalThisAny.intuiface_ifd_triggers[name]
        };
    }

    // set interface asset to import in composer
    resources['ChatGPT4TS']['if.interfaceAsset'] = true;
    resources['ChatGPT4TS']['title'] = globalThisAny.iaTitle;
    resources['ChatGPT4TS']['description'] = globalThisAny.iaDescription;

    // create the ifd as json object
    // and add metadatas filled from decorators
    globalThisAny.intuiface_ifd_file = {
        'version': `v1.0.${Date.now()}`,
        'name': 'ChatGPT4TS',
        'title': globalThisAny.iaTitle,
        'if.category': globalThisAny.iaCategory,
        'protocol': 'ts',
        'basePath': 'ChatGPT4TS',
        'if.dependencies': [
            'ChatGPT4TS.js',
            'ChatGPT4TS.module.js'
        ],
        'schemas': schemas,
        'resources': resources
    };


    // write the ifd file
    fs.outputFile('dist/ChatGPT4TS.ifd', JSON.stringify(globalThisAny.intuiface_ifd_file), 'utf8', (err: any) => {
        if (err) {
            console.log('An error occured while writing JSON Object to File.');
            return console.log(err);
        }

        console.log('IFD file has been saved.');
    });
}

void loadIA();
