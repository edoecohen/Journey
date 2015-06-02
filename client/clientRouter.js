var ClientRouter = Backbone.Router.extend ({

 	routes: {
 		'' : 'home',
 		'viewJourney/:id': 'viewJourney'
 	},

 	home: function () {
    console.log('in home view - called from router');
 		// var appView = new AppView();
 		// $(".mainContent").html(appView.el);

 	},

 	viewJourney: function(id) {
    var path = location.pathname;
    console.log('in viewJourney', id);
		// var journeyView = new JourneyView({model: model});
    $(".mainContent").html(journeyView.el);

 	}
});

var clientRouter = new ClientRouter();
Backbone.history.start();
