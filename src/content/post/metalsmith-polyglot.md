---
title: metalsmith-polyglot
date: 2015-11-14
layout: post.jade
lang: en
tags: javascript blog metalsmith node.js markdown plugin translation
---

This is a simple plugin I made to link the translated content of my static website generated with Metalsmith. For newcomers, my short description of Metalsmith is *"a gulp-like pipe solution for processing/generating your files"*, though you might want to check out [their website](http://www.metalsmith.io/) for a more accurate description. In my [previous post](/post/sup-world) I talked about why I chose to use Metalsmith and a couple of getting-started tutorial suggestions. After `npm install metalsmith-polyglot` we can dive right into business.

#### The project structure

For translating a whole blog, the structure to organize the content was the first thing to settle before starting to write anything else. With a homepage and a bunch of posts the general structure will be easy, url paths like `visualcosita.xyz/post/title` and for translations just add the language code prefix `visualcosita.xyz/es/post/title`. Easy right? Here's my project structure:

```Makefile
src/
    content/
        index.md
        post/
            sup-world.md
            metalsmith-polyglot.md
    es/
        index.md
        post/
            sup-world.md
            metalsmith-polyglot.md
```

And part of my pipe:

```js
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
.use(layouts({
    engine: 'jade',
    moment: moment
}))
```

What's going on here? Nothing special, a collection for each language. If the branch caught you off-guard, it just helps to output the content with nice permalinks. Neither of the `index.md` will be parsed by the permalinks plugin, they are not necessary because `/` and `/es` paths work niceley without any help since they will be named `index.html`. Finally there is [Jade](http://jade-lang.com/) for templating.

Eveything works, life is awesome! Now I have both versions, the base language (en) and the translations to spanish working. **How do I link them up?** Modifying the url with JavaScript is an option, but what if I could avoid that and just *"know"* before hand where those files are? That'd be great. Even better, also take into account if the translation exists or not to avoid having a script redirect me to a `404`.

#### My solution

Parse the files, add some metadata to Metalsmith's pipe and also take advantage of the file structure in templating time to make a clean redirect. Stick `polyglot` right before the template engine, which might be handlebars or something else, in my case Jade.

```js
.use(branch('es/post/**.html')
    .use(permalinks({
        pattern: 'es/post/:title'
    }))
)
.use(polyglot())
.use(layouts({
    engine: 'jade',
    moment: moment
}))
```

What will this help me with? A new variable in the metadata of each file with the following structure:

```json
"post/sup-world.html": {
    ...
    translationPath : {
        en: "/",
        es: "/es/post/sup-world"
    },
    ...
}
```

So what's so useful about it? I can know beforehand -during template rendering- the path (if there is one) of the translation for a file. The template navigation for this website looks like this:

```js
li.navbar-item
    - var langString = (lang === "en") ? "ES" : "EN"
    - var translatedUrl = (lang === "en") ? translationPath.es : translationPath.en
    a(href="#{translatedUrl}" class="nav-link" id="langToggler") #{langString}
```

This is jade logic, but I think it should be pretty straight-foward. The `langString` is the text for the link, depending on the front matter inside the post. This is kinda specific to my scenario, but cooler ideas came to my mind if I wanted to build something scalable to more languages, and they are all compatible with polyglot's features. The jade variable `translatedUrl` takes the path from `translationPath.es` or `translationPath.en` inside the file's metadata. I use either one depending on what language I want to link to.

That's about all there is to it, more info can be found in the repo [fdoxyz/metalsmith-polyglot](https://github.com/fdoxyz/metalsmith-polyglot) about ways to customize polyglot's execution. Stuff like setting a different base language, disabling permalinks and custom redirects when no translation is found (by default redirects to the homepage of translated language requested). Besides, [this blog](https://github.com/fdoxyz/visualcosita) is open sourced, take a peek if you wish but keep in mind that much work is left to be done.
