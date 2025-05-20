---
area: Sistemas de Costos y Presupuesto
tags:
---

```dataviewjs
const curr = dv.current()

  

const {NodeHandler,MetadataWriter,UIHandler} = await cJS()

  

NodeHandler.configure(dv,curr.area,curr.tags)

  

function getAllChildrenRecursive(page, level = 0) {

    const children = NodeHandler.getVisibleChildren(page);

    let result = [{

        name: page.file.name,

        level: level,

        path: page.file.path,

        tags: page.tags || [],

        hasChildren: children.length > 0,

        lastReview: page.ultima_revision || 'Never'

    }];

    for (const child of children) {

        result = result.concat(getAllChildrenRecursive(child, level + 1));

    }

    return result;

}

  

let rootNodes = NodeHandler.getRoots();

const allPages = NodeHandler.pages;

  
  

rootNodes = rootNodes.filter(root => NodeHandler.getVisibleChildren(root).length > 0);

  

const isolatedLeafs = allPages.filter(page => {

    const hasChildren = NodeHandler.getVisibleChildren(page).length > 0;

    const hasParents = page.nodos && page.nodos.length > 0;

    return !hasChildren && !hasParents;

});

  
  

dv.header(1, "📚 Node Structure");

dv.paragraph("");

  

for (const root of rootNodes) {

    const rootData = getAllChildrenRecursive(root);

    const tableData = rootData.map(node => {

        const indent = '  '.repeat(node.level);

        const prefix = node.hasChildren ? '📁 ' : '📄 ';

        const tags = node.tags.length > 0 ? node.tags.join(', ') : '-';

        const clickableName = `[[${node.path}|${node.name}]]`;

        return [

            indent + prefix + clickableName,

            tags,

            node.lastReview

        ];

    });

  

    dv.header(2, `📁 ${root.file.name}`);

    dv.table(

        ["Node", "Tags", "Last Review"],

        tableData,

        {

            align: ["left", "left", "left"],

            width: ["50%", "25%", "25%"]

        }

    );

    dv.paragraph("");

    dv.paragraph("");

}

  

if (isolatedLeafs.length > 0) {

    dv.header(2, "📄 Isolated Nodes");

    dv.paragraph("These nodes have no connections to other nodes in the structure.");

    dv.paragraph("");

    const isolatedTableData = isolatedLeafs.map(node => {

        const tags = node.tags?.length > 0 ? node.tags.join(', ') : '-';

        const clickableName = `[[${node.file.path}|${node.file.name}]]`;

        const prefix = '📄 ';

        return [

            prefix + clickableName,

            tags,

            node.ultima_revision || 'Never'

        ];

    });

  

    dv.table(

        ["Node", "Tags", "Last Review"],

        isolatedTableData,

        {

            align: ["left", "left", "left"],

            width: ["50%", "25%", "25%"]

        }

    );

}
```
