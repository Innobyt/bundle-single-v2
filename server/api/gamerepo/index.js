'use strict';

var express = require('express');
var controller = require('./gamerepo.controller');

var router = express.Router();

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
