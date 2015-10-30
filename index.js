var Metalsmith = require('metalsmith'),
    layouts = require('metalsmith-layouts'),
    markdown = require('metalsmith-markdown'),
    collections = require('metalsmith-collections'),
    permalinks = require('metalsmith-permalinks'),
    excerpts = require('metalsmith-excerpts'),
    branch = require('metalsmith-branch'),
    serve = require('metalsmith-serve'),
    watch = require('metalsmith-watch'),
    fs = require('fs');


Metalsmith(__dirname)
    .metadata({
        site: {
            title: "Visualcosita",
            url: "http://visualcosita.xyz"
        }
    })
    .use(markdown())
    .use(excerpts())
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
    .use(layouts('jade'))
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
