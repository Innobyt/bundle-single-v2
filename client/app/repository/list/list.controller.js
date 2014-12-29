
(function() {
	'use strict';
	
	angular.module('gamerepoApp')
	  .controller('ListCtrl', ListCtrl);

	ListCtrl.$inject=['$scope', '$filter', 'ngTableParams', 'repository'];
	
	// CreateCtrl requires 1 actions of CRUD, C as in create
	function ListCtrl($scope, $filter, ngTableParams, repository) {
		$scope.list = repository.query();

		var data = $scope.list;
		$scope.tableParams = new ngTableParams({
				page: 1,            // show first page
				count: 10,          // count per page
				filter: {
					gamename: ''       // initial filter
				},
				sorting: {
					gamename: 'asc'     // initial sorting
				}
			}, {
				total: data.length, // length of data
				getData: function($defer, params) {
				// use build-in angular filter
					var filteredData = params.filter() ?
						$filter('filter')(data, params.filter()) :
						data;
					var orderedData = params.sorting() ?
						$filter('orderBy')(filteredData, params.orderBy()) :
						data;

					params.total(orderedData.length); // set total for recalc pagination
					$defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
				}
			});

	}
})();