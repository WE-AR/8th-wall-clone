// craco.config.js
module.exports = {
    webpack: {
        configure: (webpackConfig, { env, paths }) => {
            webpackConfig.resolve.fallback = {
                ...webpackConfig.resolve.fallback,
                fs: false
            };
            return webpackConfig;
        }
    }
};
