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
            name: "ChatGPT4TS",
            filename: "ChatGPT4TS.js",
            exposes: {
                "./ChatGPT4TS": {
                    import : "./src/ChatGPT4TS.ts",
                    name: 'ChatGPT4TS.module'
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
