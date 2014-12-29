(function() {
	'use strict';

	angular.module('gamerepoApp')
	  .controller('ViewCtrl', ViewCtrl);

	ViewCtrl.$inject=['$scope', '$filter', '$stateParams', 'ngTableParams', 'repository'];
	// UpdateCtrl requires 2 actions of CRUD, 
	// 'R' as in retrieve, 'U' as in update
	function ViewCtrl($scope, $filter, $stateParams, ngTableParams, repository) {
		/*jshint validthis: true */

		$scope.gamekeys = repository.view({ gametitle: $stateParams.gametitle });
		$scope.gametitle = $stateParams.gametitle;
		var data = $scope.gamekeys;

		$scope.tableParams = new ngTableParams({
			page: 1,            // show first page
			count: 10,           // count per page
			filter: {
				keystatus: ''	 // initial filter
			}
		}, {
			total: data.length, // length of data
			getData: function($defer, params) {
			// use build-in angular filter
				var orderedData = params.filter() ?
				$filter('filter')(data, params.filter()) :
				data;

				$scope.users = orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count());

				params.total(orderedData.length); // set total for recalc pagination
				$defer.resolve($scope.users);
        
			}
		});
	}
})();