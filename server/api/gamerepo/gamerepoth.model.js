'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var GamerepoThSchema = new Schema({
    threshold   : Number,
    gamename    : String,
    totalcount	: Number
});

module.exports = mongoose.model('gamerepoth', GamerepoThSchema);