const path = require('path');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');


module.exports = {
    entry: './renderer.js',
    output: {
        path: path.resolve(__dirname, './'),
        filename: 'bundle.js'
    },
    target: 'electron-renderer',
    mode: 'development', // Set mode to 'development' to enable development defaults
    mode: 'production', // or 'development' based on your needs
    resolve: {
        extensions: ['.js', '.ts', '.coffee'], // Include extensions you're using
    },
    module: {
        rules: [
            // JavaScript and TypeScript files
            {
                test: /\.(js|ts)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader', // Transpile ES6+ to ES5
                        options: {
                            presets: [
                                '@babel/preset-env',
                                '@babel/preset-typescript', // For TypeScript
                            ],
                        },
                    },
                ],
            },
            // CoffeeScript files
            {
                test: /\.coffee$/,
                use: 'coffee-loader',
            },
            // LESS files
            {
                test: /\.less$/,
                use: ['style-loader', 'css-loader', 'less-loader'],
            },
            // SCSS/SASS files
            {
                test: /\.(scss|sass)$/,
                use: ['style-loader', 'css-loader', 'sass-loader'],
            },
            // Stylus files
            {
                test: /\.styl$/,
                use: ['style-loader', 'css-loader', 'stylus-loader'],
            },
        ],
    },
    optimization: {
        minimize: true,
        minimizer: [
            `...`, // Extend existing minimizers (TerserPlugin for JS)
            new CssMinimizerPlugin(), // Minify CSS
        ],
    },
    devtool: 'source-map',
};