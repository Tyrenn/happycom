export interface Model{
	name : string;
	view : string;
}

export interface ModelGroup{
	name : string;
	models : Model[];
}

export interface Router{
	name : string;
	routes : Route[];
}

export interface Response{
	status : number;
	summary : string;
	content : string;
}

export interface Route{
	method : 'GET' | 'POST' | 'PATCH' | 'OPTION' | 'PUT' | 'DELETE';
	path : string;
	summary : string;
	description : string;
	body : string;
	querystring : string;
	responses : Response[];
}

export interface HTMLPage{
	name : string;
	html : string;
}


/**
 * Router Parser Interface
	Give the ability to parse a text, a file or a directory to a Router object or collection of Router objects
 */
export interface RouterParser{

	parseText(text : string) : Promise<Router | undefined>;

	parseFile(path : string) : Promise<Router | undefined>;

	parseDirectory(path : string) : Promise<Router[]>;

}

export interface ModelParser{
	parseText(text : string) : Promise<ModelGroup | undefined>;

	parseFile(path : string) : Promise<ModelGroup | undefined>;

	parseDirectory(path : string) : Promise<ModelGroup[]>;

}

export interface RouterRenderer{


	renderRoute(route : Route) : string;

	renderRouters(routers : Router[]) : HTMLPage[];
}

export interface ModelRenderer{

	renderModel(model : Model) : string;

	renderModelGroup(groups : ModelGroup[]) : HTMLPage[];
}