const ModuleFederationPlugin = require("webpack").container.ModuleFederationPlugin;
const path = require('path');

module.exports = {
    module: {
        rules: [{
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/
        }]
    },
    output: {
        publicPath: "auto",
        path: path.resolve(__dirname, 'dist/SpeechSynthesisOpenAI')
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    plugins: [
        new ModuleFederationPlugin({
            name: "SpeechSynthesisOpenAI",
            filename: "SpeechSynthesisOpenAI.js",
            exposes: {
                "./SpeechSynthesisOpenAI": {
                    import : "./src/SpeechSynthesisOpenAI.ts",
                    name: 'SpeechSynthesisOpenAI.module'
                }
            },
            shared: {
                "@intuiface/core": {
                    singleton: true,
                    strictVersion: false
                }
            }
        })
    ],
    entry: './src/SpeechSynthesisOpenAI.ts'
};
