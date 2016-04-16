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
    moment = require('moment'),
    polyglot = require('metalsmith-polyglot');

var deploy = (process.argv.length >= 2) && (process.argv[2] === "deploy");
console.log("Starting " + (deploy ? "deploy" : "debug"));

var metalsmith = Metalsmith(__dirname)
    .metadata({
        site: {
            title: "Visualcosita",
            url: "https://visualcosita.xyz",
            author: "Fernando Valverde <fdov88@gmail.com>",
            debug: !deploy
        }
    })
    .destination('./build')
    .use(markdown())
    .use(excerpts())
    .use(collections({
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
    }))
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
    .use(polyglot())
    .use(feed({
        collection: 'posts'
    }))
    .use(layouts({
        engine: 'jade',
        moment: moment
    }));

if (!deploy) {
    //For development serve & watch
    metalsmith
        .use(serve({
            port: 5000,
            verbose: true
        }))
        .use(watch({
            pattern: '**/*',
            livereload: true
        }));
}

metalsmith
    .build(function(err) {
            if (err) {
                console.log("Aaaaaaaand the pipe failed...");
                console.log(err);
            }
            console.log("If you're tired of starting over, stop giving up!");
        });
