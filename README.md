# Welcome to Happycom

The best way to generate API documentation from your comments.


## Usage

This package renders comments to documentation, for now only in a nice HTML form. Planning to add OpenAPI and Swagger renderers.
To start, check the 


## Comments form

```js
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