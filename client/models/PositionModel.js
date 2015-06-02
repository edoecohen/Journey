var PositionModel = Backbone.Model.extend({

	url: '/api/positionQuery/getStats',

	defaults: {
		title: null,
		degrees: null,
		FOS: null
	},


	goToJourney: function(journeyClicked){

		console.log(this.fetch({data: $.param({name: journeyClicked})}));

  },

	parse: function(response) {

    console.log('RESPONSE', response);
    console.log("THIS MODEL", this);

    this.set('degrees', response.degrees);
    this.set('fieldsOfStudy', response.fieldsOfStudy);

    clientRouter.navigate("/viewJourney/" + 13  , true )
    // clientRouter.viewJourney(this);

    return response;
  },

});


