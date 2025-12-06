const path = require('path');
const webpack = require('webpack');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ESBuildMinifyPlugin } = require('esbuild-loader');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const WebpackBar = require('webpackbar');
const {
    docsAddonDevMiddleware,
    docsAddonWebpackPlugin,
} = require('@lark-opdev/block-docs-addon-webpack-utils');

const cwd = process.cwd();
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

const config = {
    entry: './src/index.tsx',
    devtool: isProduction ? false : 'inline-source-map',
    mode: isDevelopment ? 'development' : 'production',
    stats: 'errors-only',
    output: {
        path: path.resolve(__dirname, './dist'),
        clean: true,
        publicPath: isDevelopment ? '/block/' : './',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                include: [/node_modules\/@lark-open/],
                use: ['source-map-loader'],
                enforce: 'pre',
            },
            {
                test: /\.[jt]sx?$/,
                include: [path.join(cwd, 'src')],
                exclude: /node_modules/,
                use: [
                    {
                        loader: require.resolve('esbuild-loader'),
                        options: {
                            loader: 'tsx',
                            target: 'es2015',
                        },
                    },
                    {
                        loader: 'babel-loader',
                        options: {
                            babelrc: false,
                            configFile: false,
                            plugins: ['macros'],
                            presets: [
                                [
                                    '@babel/preset-react',
                                    {
                                        runtime: 'automatic'
                                    }
                                ],
                                '@babel/preset-typescript'
                            ],
                        },
                    },
                ],
            },
            {
                test: /\.m?js/,
                resolve: {
                    fullySpecified: false,
                },
            },
            {
                test: /\.po$/,
                use: {
                    loader: "@lingui/loader",
                },
            },
            {
                oneOf: [
                    {
                        test: /\.css$/,
                        use: [
                            isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
                            'css-loader',
                        ],
                    },
                    {
                        test: /\.less$/,
                        use: [
                            isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
                            'css-loader',
                            'less-loader',
                        ],
                    },
                    {
                        test: /\.(png|jpg|jpeg|gif|ico|svg)$/,
                        type: 'asset/resource',
                        generator: {
                            filename: 'assets/[name][ext][query]',
                        },
                    },
                ],
            },
        ],
    },
    plugins: [
        ...(isDevelopment
            ? [new ReactRefreshWebpackPlugin(), new WebpackBar()]
            : [new MiniCssExtractPlugin()]),
        new webpack.DefinePlugin({
            'process.env': JSON.stringify(process.env),
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        }),

        new webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer'],
            React: 'react',
        }),

        new docsAddonWebpackPlugin({
        }),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: './src/index.html',
            publicPath: isDevelopment ? '/block/' : './',
        }),
    ],
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
        fallback: {
            'process': require.resolve('process/browser'),
            'buffer': require.resolve('buffer'),
        },
    },
    optimization: {
        minimize: isProduction,
        minimizer: [new ESBuildMinifyPlugin({
            target: 'es2015', css: true,
            drop: isProduction ? ['console'] : [],
        })],
        moduleIds: 'deterministic',
        runtimeChunk: true,
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                vendor: {
                    name: 'vendor',
                    test: /[\\/]node_modules[\\/]/,
                    chunks: 'all',
                },
            },
        },
    },
    devServer: isProduction
        ? undefined
        : {
            headers: {
                'Access-Control-Allow-Private-Network': true
            },
            hot: true,
            client: {
                logging: 'error',
            },
            setupMiddlewares: (middlewares, devServer) => {
                if (!devServer || !devServer.app) {
                    throw new Error('webpack-dev-server is not defined');
                }
                docsAddonDevMiddleware(devServer).then((middleware) => {
                    devServer.app.use(middleware);
                });
                return middlewares;
            },
        },
    cache: {
        type: 'filesystem',
        buildDependencies: {
            config: [__filename],
        },
    },
};
module.exports = config;
