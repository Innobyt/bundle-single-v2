'use strict';

var express = require('express');
var controller = require('./gamerepo.controller');

var router = express.Router();

//testcode for cors cross domain response *calvyn

router.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
	res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Authorization, Accept');
	next();
});

router.options('*', function(req, res) {
    res.send(200);
});
// crud
router.post('/', controller.create);
router.get('/', controller.index);
router.get('/:gametitle', controller.show);
router.put('/', controller.update);
router.delete('/:id', controller.destroy);

// others
router.post('/has', controller.has_by_json);
router.post('/claim/:gametitle', controller.claim);

module.exports = router;
