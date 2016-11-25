var path = require('path'),
    autoprefixer = require('autoprefixer');

module.exports = {
    context: __dirname,
    entry: {
        '_bones_app': './ui/start.js', // Core Application Bundle

        // General support packs with unique purpose
        '_pack_onload_styles': './ui/bundle_def/on_load_styles.js',

        // Page Bundles
        '_page_home': './ui/view/page/home.js',

        // Cog Bundles
        '_cog_core': './ui/bundle_def/cog_core.js',
        '_cog_screentip_t1': './ui/bundle_def/cog_screentip_tier1.js',
        '_cog_modal_t1': './ui/bundle_def/cog_modal_tier1.js',
        '_cog_input_t1': './ui/bundle_def/cog_input_tier1.js',
        '_cog_list_core': './ui/bundle_def/cog_list_core'
    },
    output: {
        path: './bundle/',
        filename: '[name].js',
        sourceMapFilename: '/bundle/[file].map'
    },
    plugins: [
        // Include additional build plugins...
    ],
    module: {
        loaders: [{
            test: /\.js(x)?$/,
            loader: 'babel-loader',
            exclude: /node_modules/,
            query: {
                presets: ['es2015']
            }
        },{
            test: /\.(png|jpg)$/,
            loader: 'url-loader?name=_img-[hash].[ext]'
        },{
            test: /\.scss$/,
            loader: 'style-loader!css-loader?sourceMap!postcss-loader?browser=last 2 version!sass-loader?sourceMap'
        },{
            test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
            loader: 'url-loader?limit=10000&minetype=application/font-woff&name=_font-[hash].[ext]'
        },{
            test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
            loader: 'file-loader?name=_font-[hash].[ext]'
        },{
            test: /\.dot$/,
            loader: 'dot-loader'
        }]
    },
    postcss: function () {
        return [autoprefixer];
    },
    resolve: {
        root: __dirname,
        modulesDirectories: ['node_modules', 'libs'],
        extensions: ['', '.js', '.scss', '.dot'],
        alias: {
            'mousetrap': path.join(__dirname, 'libs/mousetrap.js'), // https://craig.is/killing/mice
            'draggabilly': path.join(__dirname, 'libs/draggabilly.js'), // http://draggabilly.desandro.com/
            'jquery-color': path.join(__dirname, 'libs/jquery.color.js') // https://github.com/jquery/jquery-color
        }
    },
    externals: {
        jquery: 'jQuery'
    }
};
