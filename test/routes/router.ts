/** 
	@route POST /post A Post example

	A little description to add ?

	@body
	{
		content : SimpleModel; // POST routes can have body
	}

	@response 200 Ok
		DeepModel
	
	@response 401 Authentication Error
*/


/**
	@route GET /get Get route example

	@response 200 Deep Model !
	{
		data : DeepModel
	}
	@response 401 Authentication Error
*/
