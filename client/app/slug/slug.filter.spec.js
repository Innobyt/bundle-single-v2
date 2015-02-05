'use strict';

describe('Filter: slug', function () {

  // load the filter's module
  beforeEach(module('gamerepoApp'));

  // initialize a new instance of the filter before each test
  var slug;
  beforeEach(inject(function ($filter) {
    slug = $filter('slug');
  }));

  it('should return the input prefixed with "slug filter:"', function () {
    var text = 'angularjs';
    expect(slug(text)).toBe('slug filter: ' + text);
  });

});
