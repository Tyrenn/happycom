# Happycom `//😃`

> The best way to generate API documentation from your comments `//😃`

This package provides parser and renderers able to scan directories and files seeking for special tags in comments that describe your API routes and models, and to generate a nice styled HTML documentation based on it.

Happycom has been designed for typescript projects as it will parse typescript interfaces, classes, enum and comment syntax. However, the API part without Model parsing should work for every `/** */` comment based syntax.

For now only few tag exists and the only possible generated form is HTML. I might add OpenAPI and Swagger renderers.

## Usage

The package exports two types of objects : Parser and Renderers.

Parsers help you parse your files seeking for models using `typeModelParser.ts` and api comment tags using `commentRouteParser.ts`. Both will build object consumable by Renderers.

Renderers take Parsers generated object to build text, for now HTML text only. Giving the `htmlRouteRenderer.ts` a list of model will include model definitions in routes payload description.

> For a more complete example, check out the github repository test folder ! And leave a star ⭐

## Comments form

```ts
/**
	@route [POST|GET|DELETE|PATCH...]  uri/of/route Route action summary

	Route further description

	@body
	{
		param : type // The body object if any.
	}

	@response [200|400|402...] Short response type name
	// Any response form
	{
		ok : true;
		data : type; // Response type.
	}
*/
```