// eslint-disable-next-line @typescript-eslint/triple-slash-reference
import { stat } from 'node:fs/promises';
import { FileParser } from '../utils/fileParser.js';
import { Router, RouterParser, Route, Response} from '../utils/types.js';


export interface CommentRouterParserContext{
	processingComment : boolean;
	processingTag? : string | undefined;
	currentRouter? : Router | undefined;
	currentRoute? : Route | undefined;
	currentResponse? : Response | undefined;
	plainLineTabNb? : number | undefined;
}


export class CommentRouterParser implements RouterParser{
	tsfileParser : FileParser;
	context : CommentRouterParserContext = {
		processingComment : false,
		processingTag : undefined,
		currentRouter : undefined,
		currentRoute : undefined,
		currentResponse : undefined,
		plainLineTabNb : undefined
	}

	constructor(extensions? : string | string[]){
		this.tsfileParser = new FileParser(extensions);
	}


	numberOfTabs(line : string) {
		let count = 0;
		let index = 0;
		while (line.charAt(index++) === "\t") {
			count++;
		}
		return count;
	}

	removeNTabs(line : string, nb : number){
		for(let i = 0; i < nb; i++){
			line = line.replace('\t', '');
		}
		return line;
	}


	parseLine = async (line : string) => {
		// If no router need to create one to store context
		if(!this.context.currentRouter)
			this.context.currentRouter = {name : '', routes : []};

		if(!this.context.processingComment){
			if(line.includes("/*"))
				this.context.processingComment = true;

			return this.context;
		}

		// Tag could be router or route
		const match = /.*@(router|body|route|response|querystring)\s*.*/gm.exec(line);

		// New tag
		if(match && match?.length > 1){
			this.context.plainLineTabNb = undefined;

			// END Previous process
			if(this.context.processingTag === 'response' && this.context.currentResponse && this.context.currentRoute){
				this.context.currentRoute.responses.push({...this.context.currentResponse});
				this.context.currentResponse = undefined;
			}

			// Process tag line
			this.context.processingTag = match[1];

			if(this.context.processingTag === 'router'){
				const routerMatch = /.*@router\s+([A-Za-z0-9]+).*/.exec(line);
				if(routerMatch && routerMatch.length > 1){
					this.context.currentRouter = {
						name : routerMatch[1],
						routes : []
					}
				}
			}
			if(this.context.processingTag === 'route'){
				const routeMatch = /.*@route\s+(GET|POST|PATCH|PUT|OPTIONS|DELETE)\s+([A-Za-z0-9/:]+)\s+([A-Za-z0-9\s]+).*/.exec(line);
				if(routeMatch && routeMatch.length > 3){
					this.context.currentRoute = {
						method : routeMatch[1] as 'GET' | 'POST' | 'PATCH' | 'OPTION' | 'PUT' | 'DELETE',
						path : routeMatch[2],
						summary : routeMatch[3],
						description : '',
						body : '',
						querystring : '',
						responses : []
					}
				}
			}
			if(this.context.processingTag === 'response'){
				const responseMatch = /.*@response\s+(\d+)(.*)/.exec(line);
				if(responseMatch && responseMatch.length > 2){
					this.context.currentResponse = {
						status : parseInt(responseMatch[1]),
						summary : responseMatch[2],
						content : ''
					}
				}
			}

			return this.context;
		}

		if(line.includes('*/')){
			this.context.processingComment = false;
			this.context.processingTag = undefined;
			if(this.context.currentResponse && this.context.currentRoute){
				this.context.currentRoute.responses.push({...this.context.currentResponse});
				this.context.currentResponse = undefined;
			}
			if(this.context.currentRoute && this.context.currentRouter){
				this.context.currentRouter.routes.push({...this.context.currentRoute});
				this.context.currentRoute = undefined;
			}
		}

		// Already a tag but not new
		if(this.context.processingTag){
			if(!this.context.plainLineTabNb && !/^[\s\t]*$/.test(line)){
				this.context.plainLineTabNb = this.numberOfTabs(line);
			}

			if(this.context.processingTag === "route" && this.context.currentRoute)
				this.context.currentRoute.description += this.removeNTabs(line, this.context.plainLineTabNb ?? 0) + "\n";
			
			if(this.context.processingTag === "body" && this.context.currentRoute && !/.*```.*/.test(line))
				this.context.currentRoute.body += this.removeNTabs(line, this.context.plainLineTabNb ?? 0) + "\n";

			if(this.context.processingTag === "querystring" && this.context.currentRoute && !/.*```.*/.test(line))
				this.context.currentRoute.querystring += this.removeNTabs(line, this.context.plainLineTabNb ?? 0) + "\n";

			if(this.context.processingTag === "response" && this.context.currentResponse && !/.*```.*/.test(line))
				this.context.currentResponse.content += this.removeNTabs(line, this.context.plainLineTabNb ?? 0) + "\n";
		}

		return this.context;	
	}


	async parseText(text : string) : Promise<Router | undefined>{
		this.context = {
			processingComment : false,
			processingTag : undefined,
			currentRouter : {name : '', routes : []},
			currentRoute : undefined,
			currentResponse : undefined,
			plainLineTabNb : undefined
		};

		const lines = text.split('\n');
		for(const line of lines){
			await this.parseLine(line);
		}

		return this.context.currentRouter;
	}


	/**
	 * Reset context and parse a file to a Router object
	 * @returns 
	 */
	async parseFile(filepath : string){
		this.context = {
			processingComment : false,
			processingTag : undefined,
			currentRouter : {name : '', routes : []},
			currentRoute : undefined,
			currentResponse : undefined,
			plainLineTabNb : undefined
		};
		
		await this.tsfileParser.parseFileByLine(filepath, (line : string) => this.parseLine(line));

		return this.context.currentRouter;
	}

	/**
	 * Reset context and parse a file to a Router object
	 * @param path 
	 * @returns 
	 */
	async parseDirectory(path : string) : Promise<Router[]>{
		const routers : Router[] = [];
		
		const directoryExec = async (path : string, contents : string []) => {
			this.context = {
				processingComment : false,
				processingTag : undefined,
				currentRouter : undefined,
				currentRoute : undefined,
				currentResponse : undefined,
				plainLineTabNb : undefined
			};
		
			for(const c of contents){
				const cstat = await stat(path + '/' + c);

				if(cstat.isFile() && /.*\.ts/.test(c)){
					this.context.currentRouter = {
						name : c.split('.')[0],
						routes : []
					};
					
					await this.tsfileParser.parseFileByLine(path + '/' + c, this.parseLine);
					
					if(this.context?.currentRouter?.routes?.length > 0)
						routers.push({...this.context.currentRouter});
					this.context.currentRouter = undefined;
				}
				else if(cstat.isDirectory()){
					await this.tsfileParser.parseDirectory(path + '/' + c, directoryExec);
				}
			}
		}

		await this.tsfileParser.parseDirectory(path, directoryExec);

		return routers;
	}
}