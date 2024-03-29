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
            name: "VisionTS",
            filename: "VisionTS.js",
            exposes: {
                "./VisionTS": {
                    import : "./src/VisionTS.ts",
                    name: 'VisionTS.module'
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
