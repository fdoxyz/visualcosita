var Metalsmith = require('metalsmith'),
    layouts = require('metalsmith-layouts'),
    markdown = require('metalsmith-markdown'),
    collections = require('metalsmith-collections'),
    permalinks = require('metalsmith-permalinks'),
    excerpts = require('metalsmith-excerpts'),
    branch = require('metalsmith-branch'),
    feed = require('metalsmith-feed'),
    serve = require('metalsmith-serve'),
    watch = require('metalsmith-watch'),
    moment = require('moment');

var deploy = (process.argv.length >= 2) && (process.argv[2] === "deploy");
var siteMetadata = {
    site: {
        title: "Visualcosita",
        url: "http://visualcosita.xyz",
        author: "Fernando Valverde <fdov88@gmail.com>",
        debug: true
    }
};
var siteCollections = {
    posts: {
        pattern: 'content/post/**.html',
        sortBy: 'date',
        reverse: true
    },
    spanishPosts: {
        pattern: 'es/post/**.html',
        sortBy: 'date',
        reverse: true
    }
};
var layoutOptions = {
    engine: 'jade',
    moment: moment
};

//TODO: Find a cleaner way to deploy options with a single readable pipe

if (deploy) {
    //Production pipe
    console.log("Building site, keep your fingers crossed...");
    Metalsmith(__dirname)
        .metadata(siteMetadata)
        .destination('./build')
        .use(markdown())
        .use(excerpts())
        .use(collections(siteCollections))
        .use(branch('content/post/**.html')
            .use(permalinks({
              pattern: 'post/:title'
            }))
        )
        .use(branch('es/post/**.html')
            .use(permalinks({
                pattern: 'es/post/:title'
            }))
        )
        .use(layouts(layoutOptions))
        .use(feed({collection: 'posts'}))
        .build(function(err) {
            if (err) {
                console.log("Aaaaaaaand the deploy failed:");
                console.log(err);
            }
            console.log("Everything went better than expected!");
        });
} else {
    //Development pipe
    console.log("You better work bitch...");
    Metalsmith(__dirname)
    .metadata(siteMetadata)
    .destination('./build')
    .use(markdown())
    .use(excerpts())
    .use(collections(siteCollections))
    .use(branch('content/post/**.html')
        .use(permalinks({
          pattern: 'post/:title'
        }))
    )
    .use(branch('es/post/**.html')
        .use(permalinks({
            pattern: 'es/post/:title'
        }))
    )
    .use(layouts(layoutOptions))
    .use(serve({
      port: 5000,
      verbose: true
    }))
    .use(watch({
      pattern: '**/*',
      livereload: true
    }))
    .use(feed({collection: 'posts'}))
    .build(function(err) {
        if (err) {
            console.log("A wild error has appeard!");
            console.log(err);
        }
        console.log("If you're tired of starting over, stop giving up!");
    });
}
