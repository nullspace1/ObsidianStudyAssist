---
area: Administracion Gerencial
reset: 254
intervals:
  - "-1"
  - "3"
  - "7"
  - "15"
grace: 3
tags:
  - primer-parcial
---

```dataviewjs
const {NodeHandler,MetadataWriter,UIHandler,Estudiador} = await cJS()

const curr = dv.current()

const META_PATH = 'Resources/EstudiadorData.md'

const CURR_PATH = curr.file.path

const DEFAULT_DATA = [{name: 'stack',value: []},{name: 'currentPage',value: null},{name: 'visited',value: []}, {name: 'reset', value: curr.reset}, {name: 'area', value: curr.area}]

const TODAY = new Date().toISOString().split('T')[0];

  

NodeHandler.configure(dv,curr.area,curr.tags)

Estudiador.configure(NodeHandler.pages)

MetadataWriter.configure(dv,app)

UIHandler.configure(app,this)

const visited = MetadataWriter.read(META_PATH,'visited')

NodeHandler.pages = Estudiador.getPagesToStudy(NodeHandler.pages,visited,curr.intervals)

for (const page of Estudiador.getOverduePages(curr.intervals,curr.grace)){

    await MetadataWriter.write(page.file.path,[{name: 'intervalIndex', value: 0}])

}

  

dv.paragraph(UIHandler.button('Next Page',

    async () => {

        await MetadataWriter.write(CURR_PATH,[{name: 'reset', value: MetadataWriter.read(CURR_PATH,'reset') + 1}])

    }, []))

  

dv.paragraph(UIHandler.button('Reset Session',

    async () => {

        await MetadataWriter.write(META_PATH, DEFAULT_DATA)

    }, []))

  
  

if (curr.area != MetadataWriter.read(META_PATH,'area')) {

    await MetadataWriter.write(META_PATH,DEFAULT_DATA)

}

  

let pagePath = MetadataWriter.read(META_PATH,'currentPage');

let page = pagePath ? dv.page(pagePath) : null;

  

if (curr.reset != MetadataWriter.read(META_PATH,'reset') || page == null) {

    await MetadataWriter.write(META_PATH,[{name: 'reset',value:curr.reset}])

    const stack = MetadataWriter.read(META_PATH,'stack')

    if (stack == null || stack.length == 0) {

        const roots = NodeHandler.getRoots()

  

        if (roots.length > 0) {

            page = NodeHandler.randomPage(roots)

            await MetadataWriter

            .write(META_PATH,[

            {

            name: 'stack',

            value: NodeHandler.getVisibleChildren(page).map(p => p.file.path).concat(NodeHandler.getSiblings(page).map(p => p.file.path))

            }

            ])

        } else {

            page = null

        }

  

    } else {

        page = dv.page(stack.shift())

        await MetadataWriter

        .write(META_PATH,[

        {

        name: 'stack',

        value: NodeHandler.getVisibleChildren(page).map(p => p.file.path).concat(stack)

        }

        ])

    }


    if (page != null) {

        if (visited != null) {

            visited.push(page.file.path)

        }

        await MetadataWriter

            .write(META_PATH,[

            {

            name:'currentPage',

            value: page.file.path

            },

            {

            name: 'visited',

            value: visited == null ? [page.file.path] : visited

            }

            ])

  

                await MetadataWriter

            .write(page.file.path, [

            {

            name: 'ultima_revision',

            value: TODAY

            },

            {

            name: 'intervalIndex',

            value: page.intervalIndex + 1

            }

            ])

    } else {

        await MetadataWriter

            .write(META_PATH,[

            {

            name:'currentPage',

            value: null

            }

            ])

    }

}

  

if (page == null) {

    dv.header(1,'Sin mas paginas para revisar esta sesion.')

    dv.header(2,'Recuerde reiniciar la sesion si cree que falta revisar alguna pagina.')

    dv.table(['Nombre','Siguiente Fecha de Estudio'], NodeHandler.unfilteredPages.map(p => [p.file.name, Estudiador.nextStudyDate(p,curr.intervals)]))

} else {

  

    dv.paragraph('Paginas restantes: ' + NodeHandler.pages.length)

  

    if (page.preguntas && page.preguntas.length > 0) {

        dv.header(1, "Preguntas");

        dv.paragraph(page.preguntas);

    }

  

    dv.header(2, `[[${page.file.name}]]`);

    dv.paragraph(`![[${page.file.name}]]`);

  

  const nodos = page.nodos;

  

  if (nodos && nodos.length > 0) {

    dv.header(3, "Nodos Padre");

    dv.paragraph(nodos);

  }

  

  const backlinks = NodeHandler.getAllChildren(page)

  

  if (backlinks.length > 0) {

    dv.header(3, "Nodos Hijo");

    dv.paragraph(backlinks.map(back => back.file.link));

  }

  

  if (page.relacionado) {

    dv.header(3, "Relacionados");

    dv.paragraph(page.relacionado);

  }

  

  dv.paragraph("-----------")

  

  dv.paragraph(`Proxima review: ${Estudiador.nextStudyDate(page,curr.intervals)}`)

}

  

dv.paragraph(UIHandler.button('Reset all indices',

    async () => {

        const pages = NodeHandler.unfilteredPages

        for (const page of pages) {

            await MetadataWriter.write(page.file.path, [{name: 'intervalIndex', value: 0}])

        }

        await MetadataWriter.write(META_PATH, DEFAULT_DATA)

        await MetadataWriter.write(CURR_PATH,[{name: 'reset', value: MetadataWriter.read(CURR_PATH,'reset') + 1}] )

    }

, []))
```
