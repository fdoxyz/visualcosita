var Metalsmith = require('metalsmith'),
    layouts = require('metalsmith-layouts'),
    markdown = require('metalsmith-markdown'),
    collections = require('metalsmith-collections'),
    permalinks = require('metalsmith-permalinks'),
    excerpts = require('metalsmith-excerpts'),
    branch = require('metalsmith-branch'),
    serve = require('metalsmith-serve'),
    watch = require('metalsmith-watch'),
    moment = require('moment'),
    fs = require('fs');

if (process.env.NODE_ENV === 'development') {
    //Development pipe
    Metalsmith(__dirname)
        .metadata({
            site: {
                title: "Visualcosita",
                url: "http://visualcosita.xyz",
                debug: true
            }
        })
        .use(markdown())
        .use(collections({
          posts: {
            pattern: 'content/post/**.html',
            sortBy: 'publishDate',
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
        .destination('./build')
        .build(function(err) {
            if (err) {
                console.log(err);
            }
            console.log('Finished build succesfully');
        });
} else {
    //Production pipe
    Metalsmith(__dirname)
        .metadata({
            site: {
                title: "Visualcosita",
                url: "http://visualcosita.xyz",
                debug: false
            }
        })
        .use(markdown())
        .use(collections({
          posts: {
            pattern: 'content/post/**.html',
            sortBy: 'publishDate',
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
        .destination('./build')
        .build(function(err) {
            if (err) {
                console.log(err);
            }
            console.log('Finished build succesfully');
        });
}
