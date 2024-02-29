

export interface SimpleModel{
	name : string;
	value : number;
}

export type DeepModel = {
	name : string;
	models : Array<SimpleModel>;
	othermodels? : SimpleModel[];
}