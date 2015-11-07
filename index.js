var Metalsmith = require('metalsmith'),
    layouts = require('metalsmith-layouts'),
    markdown = require('metalsmith-markdown'),
    collections = require('metalsmith-collections'),
    permalinks = require('metalsmith-permalinks'),
    excerpts = require('metalsmith-excerpts'),
    branch = require('metalsmith-branch'),
    serve = require('metalsmith-serve'),
    watch = require('metalsmith-watch'),
    moment = require('moment');

var deploy = (process.argv.length >= 2) && (process.argv[2] === "deploy");

if (!deploy) {
    //Development pipe
    console.log("You better work bitch...");
    Metalsmith(__dirname)
        .metadata({
            site: {
                title: "Visualcosita",
                url: "http://visualcosita.xyz",
                debug: true
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
          }
        }))
        .use(branch('content/post/**.html')
            .use(permalinks({
              pattern: 'post/:title'
            }))
        )
        .use(layouts({
            engine: 'jade',
            moment: moment
        }))
        .use(serve({
          port: 5000,
          verbose: true
        }))
        .use(watch({
          pattern: '**/*',
          livereload: true
        }))
        .build(function(err) {
            if (err) {
                console.log(err);
            }
            console.log("If you're tired of starting over, stop giving up!");
        });
} else {
    //Production pipe
    console.log("Building site, keep your fingers crossed...");
    Metalsmith(__dirname)
        .metadata({
            site: {
                title: "Visualcosita",
                url: "http://visualcosita.xyz",
                debug: false
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
          }
        }))
        .use(branch('content/post/**.html')
            .use(permalinks({
              pattern: 'post/:title'
            }))
        )
        .use(layouts({
            engine: 'jade',
            moment: moment
        }))
        .build(function(err) {
            if (err) {
                console.log(err);
            }
            console.log("Everything went better than expected!");
        });
}
