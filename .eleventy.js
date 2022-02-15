const fs = require("fs");

module.exports = function(config) {
    config.addPassthroughCopy('src/favicon.ico');
    config.addPassthroughCopy('src/manifest.json');
    config.addPassthroughCopy('src/fonts');
    config.addPassthroughCopy('src/styles');
    config.addPassthroughCopy('src/scripts');
    config.addPassthroughCopy('src/**/*.(html|gif|jpg|png|svg|mp4|webm|zip)');

    config.setDataDeepMerge(true);

     config.addFilter('addLoadingLazy', (content) => {
        content.replace(/<img(?!.*loading)/g, '<img loading="lazy"');
    });

    const slugify = require('slugify');

    config.addFilter('slug', (input) => {
        const options = {
            replacement: '-',
            remove: /[&,\/+()$~%.'":*?<>{}]/g,
            strict: true,
            lower: true
        };
        return slugify(input, options);
    });

    // Даты

    config.addFilter('ruDate', (value) => {
        return value.toLocaleString('ru', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).replace(' г.', '');
    });

    config.addFilter('shortDate', (value) => {
        return value.toLocaleString('ru', {
            month: 'short',
            day: 'numeric'
        }).replace('.', '');
    });

    config.addFilter('isoDate', (value) => {
        return value.toISOString();
    });

    config.addCollection("videoTags", (collections) => {
        const tagsSet = new Set()
        collections.getFilteredByGlob("**/videos/*.md").forEach((item) => {
            if (!item.data.tags) return
            item.data.tags
                .filter((tag) => !['videos'].includes(tag))
                .forEach((tag) => tagsSet.add(tag))
        })
        return [...tagsSet].sort((a, b) => a.localeCompare(b))
    });

    config.addCollection("articleTags", (collections) => {
        const tagsSet = new Set()
        collections.getFilteredByGlob("**/articles/*.md").forEach((item) => {
            if (!item.data.tags) return
            item.data.tags
                .filter((tag) => !['articles'].includes(tag))
                .forEach((tag) => tagsSet.add(tag))
        })
        return [...tagsSet].sort((a, b) => a.localeCompare(b))
    });

    config.addFilter('inCategory', (collection, category) => {
        if (!category) {
            return collection;
        }
        return collection.filter((item) => item.data.tags.includes(category));
    });

    // Трансформации

    config.addTransform('htmlmin', (content, outputPath) => {
        if(outputPath && outputPath.endsWith('.html')) {
            let htmlmin = require('html-minifier');
            let result = htmlmin.minify(
                content, {
                    removeComments: true,
                    collapseWhitespace: true
                }
            );
            return result;
        }
        return content;
    });

    // Override Browsersync defaults (used only with --serve)
    config.setBrowserSyncConfig({
        callbacks: {
            ready: function(err, browserSync) {
                const content_404 = fs.readFileSync('dist/404.html');

                browserSync.addMiddleware("*", (req, res) => {
                    // Provides the 404 content without redirect.
                    res.writeHead(404, {"Content-Type": "text/html; charset=UTF-8"});
                    res.write(content_404);
                    res.end();
                });
            },
        },
        ui: false,
        ghostMode: false
    });

    return {
        dir: {
            input: 'src',
            output: 'dist',
        },
        dataTemplateEngine: 'njk',
        htmlTemplateEngine: 'njk',
        passthroughFileCopy: true,
        templateFormats: [
            'html', 'md', 'njk'
        ],
    };
};
