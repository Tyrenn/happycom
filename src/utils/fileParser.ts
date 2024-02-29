import { stat, readdir, readFile } from 'node:fs/promises';
import {createInterface as createReadLineInterface} from 'readline';
import { existsSync, createReadStream } from 'node:fs';
import { extname } from 'node:path';


export class FileParser{

	authorizedExtensions? : string[];

	constructor(extensions? : string | string[]){
		if(extensions)
			this.authorizedExtensions = typeof extensions === "string" ? [extensions] : extensions;
	}

	parseFileByLine<T>(path : string, exec : (line : string) => T | Promise<T>) : Promise<void>{
		return new Promise((resolve, reject) => {

			if(!existsSync(path) || (this.authorizedExtensions && !this.authorizedExtensions?.includes(extname(path))))
				reject(new Error("Wrong File Path"));

			const lineReader = createReadLineInterface({
				input: createReadStream(path)
			});

			lineReader.on('line', exec);
			lineReader.on('close', () => {
				lineReader.close();
				resolve();
			});
		});
	}


	async parseFile(path : string, exec? : (file : string) => void | Promise<void>){
		if(!existsSync(path) || (this.authorizedExtensions && !this.authorizedExtensions?.includes(extname(path))))
			throw new Error("Wrong File Path");

		const file = (await readFile(path, 'utf-8'));

		if(exec){
			await exec(file);
		}

		return file;
	}


	async parseDirectory(path : string, exec : (path : string, contents : string[]) => void | Promise<void>){
		if(!existsSync(path))
			throw new Error("Wrong Directory");

		const pathstats = await stat(path);

		if(pathstats.isDirectory()){
			await exec(path, await readdir(path))
		}
	}
}