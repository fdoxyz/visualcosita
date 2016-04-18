---
title: Sorry
date: 2016-04-19
layout: post.jade
lang: es
tags: habladas playaditas
---

Resulta que no sólo escribir es más difícil de lo que esperaba, sino que traducirlo añade bastante más trabajo. Así que imagino que han visto, no todos los posts están en ambos lenguajes. Hay algunos que están en la lista de espera por ser traducidos, pero no todos, como por ejemplo este que va dirigido a los que leen esta página web en español (tampoco son muchos tristemente).

#### Ya que estamos aquí

Puedo decir que pronto vendrá un post (en ambos idiomas, cruzemos los dedos) sobre el proceso de montar este SSL. Sí, la barrita verde de arriba que no habías notado que [ahora está protegiendo nuestra conexión <3](https://twitter.com/SwiftOnSecurity/status/704331207178190850)

Por otro lado, si a alguien le interesa [el plugin del post anterior](https://visualcosita.xyz/es/post/metalsmith-polyglot/) esta es una buena oportunidad para ver cómo se comportaría cuando empiezo a separar contenidos en dos idiomas. Existen entradas marcadas por el título en el [Front Matter](https://jekyllrb.com/docs/frontmatter/) (y el nombre del archivo) para un idioma y para otro no.

Un par de facilidades que resuelve el plugin:

* Puedo escribir en N idiomas sin que el contenido tenga que ser un espejo del otro.
* Puedo escribir en forma de espejo, con el mismo contenido localizado para varios idiomas.
* Puedo elegir mezclar los primeros dos

```html
//TODO: Arreglar el CSS de las <ul>, está bien feo
```

#### No todo lo que brilla es oro

Dicho esto, existen problemas que no hacen de éste un plugin beneficioso para todos. Por ejemplo, la traducción a localizaciones específicas para regiones del mismo idioma se convierten en un poco menos agradables a la vista en la url. Todavía existe mucho trabajo que se le puede meter al plugin, no está ni cerca de estar pulidito (El link del homepage arriba, que ahorita está redireccionando a la versión default que es inglés). El plugin se siente un poco 'tieso', pero al fin y al cabo lo hice pensando en este caso de uso específico.

Nadie sabe qué le deparará a [metalsmith-polyglot](https://github.com/fdoxyz/metalsmith-polyglot), pero últimamente me he dado cuenta que las [descargas en npm](https://www.npmjs.com/package/metalsmith-polyglot) fluctúan un poco. Además, es mi primer paquete publicado ahí, así que no tengo idea si ha tenido un buen o mal recibimiento (tengo sospechas de que malo, pero fácilmente pueden ser tramas mías). Lo que sí quiero es seguir montando proyectos con [CI (Continuous Integration)](https://en.wikipedia.org/wiki/Continuous_integration) así que eso es lo único que tal vez pueda precedir para el plugin.

Así que, no esperen todo el contenido en español, dénse una vueltita en la versión de inglés de vez en mes.
