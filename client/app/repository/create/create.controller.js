(function() {
	'use strict';

	angular.module('gamerepoApp')
	  .controller('CreateCtrl', CreateCtrl);
	
	CreateCtrl.$inject=['$scope', 'repository'];

	// CreateCtrl requires 1 actions of CRUD, C as in create
	function CreateCtrl($scope, repository) {

		// initialize gameRepo controller and services
		$scope.initialize = function(){
			$scope.formData = new repository();
		};

		// post, gameRepo creation ('C' in Crud)
		$scope.submit = function() {
			$scope.formData.$save(function(){ $scope.initialize(); });
		};
		
		$scope.filesChanged = function(elm){
			var reader = new FileReader();
			reader.onload = function(e){
				$scope.formData.gamekeys = e.target.result;
				$scope.$apply();
			};
			reader.readAsText(elm.files[0]);
		};

		$scope.initialize();
	}
})();