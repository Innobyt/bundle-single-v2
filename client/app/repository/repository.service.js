'use strict';

angular
    .module('gamerepoApp')
    .factory('repository', repository);

repository.$inject = ['$resource'];

function repository($resource) {
    return $resource('/api/gamerepos/:gametitle', { gametitle: '@gametitle' },
    {
      'update': { method: 'PUT',},
      'view': { method: 'GET', isArray: true},
      'query': { method: 'GET', isArray: true }
    });
  }
