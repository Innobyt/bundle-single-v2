(function() {
	'use strict';

	angular.module('gamerepoApp')
	  .controller('UpdateCtrl', UpdateCtrl);
	
	UpdateCtrl.$inject=['$scope', '$stateParams', 'repository'];

	// CreateCtrl requires 1 actions of CRUD, C as in create
	function UpdateCtrl($scope, $stateParams, repository) {
		//get /:gametitle from url and populate to $scope.gametitle		
		$scope.gametitle = $stateParams.gametitle;

		var gametitle = $scope.gametitle;

		// initialize gameRepo controller and services
		$scope.initialize = function(){
			$scope.formData = new repository();
		};

		// put, gameRepo update ('U' in Crud)
		$scope.submit = function() {
			//pass in gametitle into formData
			$scope.formData.gamename = gametitle;
			$scope.formData.$update(function(){ $scope.initialize(); });
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

