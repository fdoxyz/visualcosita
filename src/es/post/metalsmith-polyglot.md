---
title: metalsmith-polyglot
date: 2015-11-14
layout: post.jade
lang: es
tags: javascript blog metalsmith node.js markdown plugin translation
---

Este es un plugin sencillo que programé para traducir el contenido de esta página web, creada con Metalsmith. Para los que no conocen Metalsmith, mi definición es *un generador de páginas estáticas que permite procesar directorios utilizando un pipeline* pero en la [página oficial](http://www.metalsmith.io/) explican mucho mejor sin duda. En mi [post anterior](/es/post/metalsmith-polyglot) explico por qué elegí Metalsmith y algunas sugerencias de tutoriales para comenzar. Así que, `npm install metalsmith-polyglot` y comenzemos a lo que vinimos.

#### La estructura del proyecto

Para traducir el contenido completo de un blog, la estructura para organizarlo es lo más fundamental y por lo tanto es lo primero por definir. La página consiste de artículos (posts) con direcciones del siguiente estilo `visualcosita.xyz/post/title` y sus traducciones serán `visualcosita.xyz/es/post/title`. Sencillo cierto? Esta es mi estructura

```
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

Esta es parte de mi pipe que utilizo para construir:

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

¿Qué está sucediendo? Se genera una colección para cada lenguaje, mientras que el 'branch' permite generar el resultado con permalinks. Ninguno de los `index.md` serán procesador por los permalinks, debido a que funcionan bien `/` y `/es` porque su nombre resultante serán `index.html`. Finalmente, las plantillas que se utilizan son Jade.

Por el momento todo funciona, excelente. Ahora tenemos dos versiones traducidas, una en lenguaje base (en) y la otra en español. **¿Cómo hacemos los links entre ellas?** Un JavaScript que realice una redirección modificando la url actual. Pero, ¿qué tal si pudiéramos saber cuál es la ubicación exacta del post traducido desde antes? Eso sería muy útil. Además podríamos saber si dada traducción existe o no y evitar que un script realice una redirección hacia un `404`.

#### Mi solución

Procesar los archivos y agregar metadatos al pipe de Metalsmith, de forma que se puede tomar ventaja de la estructura del directorio para agregar los links de redirección en tiempo de generación en las plantillas. Metemos `polyglot` justo antes del llamado de `layouts`, que puede ser handlebars o cualquier otro, en mi caso utilizo Jade.

```
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

¿En qué me ayuda esto? Ahora tengo una nueva variable en metadatos con la ubicación exacta del archivo traducido. La estructura de la nueva variable es la siguiente:

```
"post/sup-world.html": {
    ...
    translationPath : {
        en: "/",
        es: "/es/post/sup-world"
    },
    ...
}
```

¿Y cómo resulta útil? Puedo saber en tiempo de generación en plantillas el destino al que quiero redireccionar. Por ejemplo, la plantilla para la navegación de esta página web es la siguiente:

```
li.navbar-item
    - var langString = (lang === "en") ? "ES" : "EN"
    - var translatedUrl = (lang === "en") ? translationPath.es : translationPath.en
    a(href="#{translatedUrl}" class="nav-link" id="langToggler") #{langString}
```

Esto es lógica dentro de Jade, pero creo que es muy fácil de entender. La variable `langString` es el texto que se mostrará y depende del front matter dentro del archivo procesado actualmente. Esta solución es muy específica a mi blog, pero posibles problemas más generalizados también considero que se pueden resolver con esta facilidad que `polyglot` provee. `translatedUrl` utiliza la url de destino dependiendo del mensaje.

Y eso es todo, más info de las opciones disponibles están en el repo [fdoxyz/metalsmith-polyglot](https://github.com/fdoxyz/metalsmith-polyglot), y con con suerte después escribo más sobre las opciones (que todavía les falta bastante trabajo) para personalizar un poco el funcionamiento por defecto, como deshabilitar el uso de permalinks o agregar una dirección específica cuando no existen traducciones para dado archivo. Si les interesa, [este blog](https://github.com/fdoxyz/visualcosita) está en github, pero sepan que tiene mucho trabajo pendiente todavía.
