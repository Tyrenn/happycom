// eslint-disable-next-line @typescript-eslint/triple-slash-reference
import { HTMLFileWriter } from 'utils/htmlFileWriter.js';
import {TypeModelParser} from '../src/parser/typeModelParser.js'
import { CommentRouterParser } from 'parser/commentRouteParser.js';
import {HTMLRouterRenderer} from 'renderer/htmlRouteRenderer.js';
import { Model } from 'utils/types.js';
import { HTMLModelRenderer } from 'renderer/htmlModelRenderer.js';
import { HTMLMenuRenderer } from 'renderer/htmlMenuRenderer.js';
import {resolve} from 'node:path';

async function start(){
	
	// Parse all .ts files in directory models
	const models = await new TypeModelParser('.ts').parseDirectory(resolve(process.cwd(), './test/models'));

	// Parse all .ts files in directory routes
	const routers = await new CommentRouterParser('.ts').parseDirectory(resolve(process.cwd(), './test/routes'));
	
	// Render routes with model ref
	const htmlRouterRenderer = new HTMLRouterRenderer( models.reduce((acc : Model[], current) => [...acc, ...current.models], []));
	const routersRendered = htmlRouterRenderer.renderRouters(routers); // Will populate its usedModels attribute

	// Filtering only used models
	const modelsRendered = new HTMLModelRenderer([...htmlRouterRenderer.usedModels]).renderModelGroup(models);

	const menuRendered = new HTMLMenuRenderer().render(new Map([
		["Routers", routersRendered.map(p => ({ name : p.name, path : `../router/${p.name.toLowerCase()}.html`}))],
		["Models", modelsRendered.map(p => ({ name : p.name, path : `../model/${p.name.toLowerCase()}.html`}))]
	]));

	const htmlFileWriter = new HTMLFileWriter();
	await htmlFileWriter.addCSS(resolve(process.cwd(), './resources/default.css'));

	for(const page of routersRendered){
		htmlFileWriter.writeFile(
				`${menuRendered}\n`
			+	`<div class="page">\n`
			+	`	${page.html}\n`
			+	`</div>\n`,
			`./test/result/router/${page.name.toLowerCase()}.html`, page.name.toUpperCase());
	}

	for(const page of modelsRendered){
		htmlFileWriter.writeFile(
				`${menuRendered}\n`
			+	`<div class="page">\n`
			+	`	${page.html}\n`
			+	`</div>\n`,
			`./test/result/model/${page.name.toLocaleLowerCase()}.html`, page.name.toUpperCase());
	}
}

start();