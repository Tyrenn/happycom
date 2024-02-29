import { readFile } from 'node:fs/promises';
import { existsSync, writeFileSync } from 'node:fs';
import { extname } from 'node:path';

export class HTMLFileWriter{

	#css : string[] = [];

	constructor(){}

	private addTab(str : string, nbTab : number){
		let tabs : string = "";
		for(let i = 0; i < nbTab; i++){
			tabs += `\t` 
		}
		str.replaceAll('\n', `\n${tabs}`);
		return str;
	}

	async addCSS(path : string){
		if(!existsSync(path) && extname(path) !== 'css')
			throw new Error("Wrong File Path");

		this.#css.push(Buffer.from(await readFile(path, 'utf-8'), 'binary').toString('base64'));
	}

	writeFile(body : string, path : string, title? : string){
		writeFileSync(
			path,
				`<!DOCTYPE html>\n`
			+	`<html>\n`
			+	`<head>\n`
			+	`<meta charset="UTF-8">\n`
			+	`	${title ? '<title>'+title+'</title>' : ''}\n`
			+	`	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.6.0/styles/github.min.css">\n`
			+ 	`${this.#css.map(css => `	<link rel="stylesheet" type="text/css" href="data:text/css;base64,${css}"/>`).join('\n')}`
			+	`</head>\n`
			+	`<body>\n`
			+	`${this.addTab(body, 2)}\n`
			+	`</body>\n`
			+	`</html>`, 
			{flag:'w+'});
	}

}