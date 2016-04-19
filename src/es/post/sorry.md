---
title: Sorry
date: 2016-04-19
layout: post.jade
lang: es
tags: habladas playaditas metalsmith blog
---

Resulta que no sólo escribir es más difícil de lo que esperaba, sino que traducirlo añade bastante más trabajo. Así que imagino que han visto, no todos los posts están en ambos lenguajes. Hay algunos que están en la lista de espera por ser traducidos, pero no todos, como por ejemplo éste. Va dirigido a los que leen esta página web en español (tampoco son muchos tristemente).

#### Ya que estamos aquí

Puedo decir que pronto vendrá un post (en ambos idiomas, cruzemos los dedos) sobre el proceso de montar este SSL. Sí, la barrita verde de arriba que no habías notado que [ahora está protegiendo nuestra conexión <3](https://twitter.com/SwiftOnSecurity/status/704331207178190850)

Por otro lado, si a alguien le interesa [el plugin del post anterior](https://visualcosita.xyz/es/post/metalsmith-polyglot/), esta es una buena oportunidad para ver cómo se comportaría cuando empiezo a separar contenidos en dos idiomas. Algunos puntos a favor:

* El plugin no requiere traducciones de un artículo para todos los idiomas, normal.
* Puedo escribir en N idiomas sin que ninguno traduzca la publicación de otro idioma, el contenido totalmente en paralelo.
* Puedo escribir en forma de espejo, con el mismo contenido localizado para varios idiomas.
* Puedo elegir mezclar los anteriores, yo aparentemente mezclo el primero y el tercero.

```html
//TODO: Arreglar el CSS de las <ul>, está bien feo y da verguenza
```

#### No todo lo que brilla es oro

Dicho esto, existen problemas que no hacen de éste un plugin beneficioso para todos.

* La localización para regiones del mismo idioma es menos agradables a la vista en la url.
* Existen muchas cosas, como la personalización de archivos no traducidos a un idioma en los metadatos que todavía no está implementada.
* Probablemente la más importante es que **no utiliza** la librería [i18n](https://github.com/mashpie/i18n-node), que según entiendo es casi estándar (?) pero no lo es (???)

En todo caso todavía existe mucho trabajo que se le puede meter al plugin, no está ni cerca de estar 'pulidito'. Por ejemplo el link del homepage arriba ahorita está redireccionando a la versión default que en inglés porque no hay links universales al homepage propio de un idioma.

El plugin se siente un poco 'tieso', pero al fin y al cabo lo hice pensando en este caso de uso. Con suerte a alguien le sirve por facilidad como a mí. No tener que abstraer strings y simplemente escribir por un lado o por otro con la posibilidad de publicar un artículo (o varios) localizados a múltiples idiomas es lo único que me interesaba.

Algo triste es que no le he dado la oportunidad [otras opciones](https://github.com/doup/metalsmith-i18n) porque no las veo funcionando para lo que yo quería. Pero en especial me pareció tan sencillo montar un plugin para hacerlo a mi manera que tuve que hacerlo.

#### ¿Le falta mucho para terminar?

No. Nada más me gustó publicar una tontería como [metalsmith-polyglot](https://github.com/fdoxyz/metalsmith-polyglot), últimamente me he dado cuenta que las [descargas en npm](https://www.npmjs.com/package/metalsmith-polyglot) fluctúan y eso trama un poco, pero son cosas mías.

Algo que sí quiero es seguir montando proyectos con [CI (Continuous Integration)](https://en.wikipedia.org/wiki/Continuous_integration), así que eso es lo único que podría precedir le espera al plugin.

Ya saben, no esperen todo el contenido en español. Dénse una vueltita por la versión de inglés de vez en mes, considérense advertidos.
