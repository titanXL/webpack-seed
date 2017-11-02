var path = require('path');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CleanWebpackPlugin = require('clean-webpack-plugin');

var extractPlugin = new ExtractTextPlugin({
	filename: 'main.css'
});

module.exports = {
	entry: './src/js/app.js',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'bundle.js'
		// publicPath: '/dist'
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				use: [
					{
						loader: 'babel-loader',
						options: {
							presets: ['env']
						}
					}
				]
			},
			{
				test: /\.scss$/,
				use: extractPlugin.extract({
					use: ['css-loader', 'sass-loader']
				})
			},
            {
                test: /\.css$/,
                use: extractPlugin.extract({
                    use: [ 'css-loader'],
					fallback: 'style-loader'
                })
            },
			{
				test: /\.less$/,
				use: extractPlugin.extract({
					use: ['css-loader', 'less-loader']
				})
			},
			{
				test: /\.html$/,
				use: ['html-loader?interpolate']
			},
			{
				test: /\.(jpg|png|svg)$/,
				use: [
					{
						loader: 'file-loader',
						options: {
							name: '[name].[ext]',
							outputPath: 'img/',
							publicPath: 'img/'
						}
					}
				]
			},
            {
                // Match woff2 in addition to patterns like .woff?v=1.1.1.
                test: /\.(eot|ttf|woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'file-loader',
                options: {
                    // Limit at 50k. Above that it emits separate files
                    limit: 50000,
                    // Output below fonts directory
                    name: '[name].[ext]',
					publicPath: 'fonts/',
					outputPath: 'fonts/'
                },
            },

		]
	},
	plugins: [
		extractPlugin,
		new HtmlWebpackPlugin({
			template: 'src/index.html'
		}),
		new CleanWebpackPlugin(['dist'])
	]
};
