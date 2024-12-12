const ModuleFederationPlugin = require("webpack").container.ModuleFederationPlugin;

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
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    plugins: [
        new ModuleFederationPlugin({
            name: "SpeechSynthesisTS",
            filename: "SpeechSynthesisTS.js",
            exposes: {
                "./SpeechSynthesisTS": {
                    import : "./src/SpeechSynthesisTS.ts",
                    name: 'SpeechSynthesisTS.module'
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
    entry: './src/index.js'
};
