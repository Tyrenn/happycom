import { stat } from 'node:fs/promises';
import { FileParser } from '../utils/fileParser.js';
import { Model, ModelGroup, ModelParser} from 'utils/types.js';
import { resolve } from 'node:path';

export interface TypescriptModelParserContext{
	processingModel : boolean;
	currentGroup : ModelGroup | undefined;
	currentModel : Model | undefined;

}

export class TypeModelParser implements ModelParser{
	tsfileParser : FileParser;

	context : TypescriptModelParserContext = {
		processingModel : false,
		currentModel : undefined,
		currentGroup : undefined
	}

	constructor(extension? : string | string[]){
		this.tsfileParser = new FileParser(extension);
	}

	parseLine = async (line: string) => {
		if(!this.context?.currentGroup)
			this.context.currentGroup = {name : '', models : []};

		if(this.context.processingModel && this.context.currentModel){
			this.context.currentModel.view += line + '\n';
			if(line.includes('}')){
				this.context.currentGroup.models.push(this.context.currentModel);
				this.context.processingModel = false;
			}
		}
		else if(!this.context.processingModel){
			if(!line.includes("interface") && !line.includes('enum') && !line.includes('type'))
				return this.context;
			
			/**
					.*(interface|enum)\s*([^\s]*)\s*{		// Interfaces
				|	.*(type)\s*([^\s]*)\s*=\s*(.*);			// One line type
				|  .*(type)\s*([^\s]*)\s*=\s*{				// Type
			 */
			const interfaceName = (/.*(interface|enum)\s*([^\s]*)\s*{/gm).exec(line);
			const oneLineTypeName = (/.*type\s*([^\s]*)\s*=\s*(.*);/gm).exec(line);
			const typeName = (/.*type\s*([^\s]*)\s*=\s*{/gm).exec(line);


			if(interfaceName && interfaceName.length > 2){
				this.context.currentModel =  {
					name : interfaceName[2],
					view : `${interfaceName[1]} ${interfaceName[2]}{\n`
				}
				this.context.processingModel = true;
			}
			else if(oneLineTypeName && oneLineTypeName.length > 2){
				this.context.currentModel =  {
					name : oneLineTypeName[1],
					view : `type ${oneLineTypeName[1]} = ${oneLineTypeName[2]}\n`
				}
				this.context.processingModel = true;
			}
			else if(typeName && typeName.length > 1){
				this.context.currentModel =  {
					name : typeName[1],
					view : `type ${typeName[1]} = {\n`
				}
				this.context.processingModel = true;
			}
		}

		return this.context;
	}

	parseText = async (text : string) => {
		this.context = {
			processingModel : false,
			currentModel : undefined,
			currentGroup : {name : '', models : []}
		}

		const lines = text.split('\n');
		for(const line of lines){
			await this.parseLine(line);
		}

		return this.context.currentGroup
	}

	parseFile = async (filepath : string) => {

		const filestat = await stat(filepath);
		if(!filestat.isFile() || /.*\.ts/.test(filepath))
			throw new Error("Wrong File Path");
		
		this.context = {
			processingModel : false,
			currentModel : undefined,
			currentGroup : {name : filepath.split('/').pop()?.split('.')[0] ?? '', models : []}
		};
		
		await this.tsfileParser.parseFileByLine(filepath, (line : string) => this.parseLine(line));

		return this.context.currentGroup;
	}

	parseDirectory = async (path : string) => {

		let modelGroups : ModelGroup[] = [];

		const directoryExec = async (processedPath : string, contents : string[]) => {
			this.context = {
				processingModel : false,
				currentModel : undefined,
				currentGroup : undefined,
			};
		
			for(const c of contents){
				const cstat = await stat(processedPath + '/' + c);

				if(cstat.isFile() && /.*\.ts/.test(c)){
					this.context.currentGroup = {
						name : c.split('.')[0],
						models : []
					};
					
					await this.tsfileParser.parseFileByLine(resolve(processedPath + '/' + c), this.parseLine);
					
					if(this.context.currentGroup.models.length > 0)
						modelGroups.push(this.context.currentGroup);

					this.context.currentGroup = undefined;
				}
				else if(cstat.isDirectory()){
					await this.tsfileParser.parseDirectory(resolve(processedPath + '/' + c), directoryExec);
				}
			}
		}

		await this.tsfileParser.parseDirectory(path, directoryExec);

		return modelGroups;
	}

}