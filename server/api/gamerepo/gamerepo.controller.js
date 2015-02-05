'use strict';

var gametitles = require('./gametitle.model');
var gamerepoth = require('./gamerepoth.model');
var nodemailer = require('nodemailer');

var email = {

    // create reusable transporter object using SMTP transport
    transporter: nodemailer.createTransport({

        auth: {
            user: 'email@innobyt.com',
            pass: 'emailpassword'
        },

        service: 'Gmail'
    }),

    // setup e-mail data
    options: function(options) {
        return {
            subject: '✔  Your Keys! Have Arrived!',
            from: this.transporter.user,
            text: options.text,
            to: options.to
        }
    },

    // send mail with defined transport object
    send: function(send) {
        email.transporter.sendMail(email.options({
            text: send.text,
            to: send.to
        }));
    }
};

var gamerepo_logic = {

    // create gametitle document, handle error || success response
    create: function(req, res) {
        gametitles.create(parse_form_gametitles(req.body), function(err, doc) {
            return err ? handleError(res, err) : res.json(201, {
                'result': 'success'
            });
        });
    },

    // insert gametitles document, handle error || success response
    insert: function(req, res) {
        this.create(req, res);
    }
};

// create a game-repo entry
exports.create = function(req, res) {

    // if document by property gamename found, do not create, else create
    gamerepoth.findOne({
        gamename: req.body.gamename
    }, function(err, found) {

        // handle error
        if (err) return handleError(res, err);

        return found
            // handle found
            ? handleError(res, {
                message: ' duplicate entry found'
            })
            // create gamerepoth document, handle error || create gamerepo document
            : gamerepoth.create(parse_form_gamerepoth(req.body), function(err, doc) {
                return err ? handleError(res, err) : gamerepo_logic.create(req, res);
            });
    });
};

// 7.2.2 Control flow pattern #2: Full parallel
var index_async = {

    // sent
    sent: false,

    // hold a global variable
    response_document: [],

    uccdk: function(arg, callback) {
        gametitles.count({
            'gamename': arg.gamename,
            'keystatus': 'true'
        }, function(err, count) {
            if (err) arg.uccdk = 'err';
            else arg.uccdk = count;
            callback(index_async.complete());
        });
    },

    ccdk: function(arg, callback) {
        gametitles.count({
            'gamename': arg.gamename,
            'keystatus': 'false'
        }, function(err, count) {
            if (err) arg.ccdk = 'err';
            else arg.ccdk = count;
            callback(index_async.complete());
        });
    },

    unclaimed_count_complete: function() {
        for (var i = 0; i < index_async.response_document.length; i++)
            if (!('uccdk' in index_async.response_document[i])) return false;
        return true;
    },

    claimed_count_complete: function() {
        for (var i = 0; i < index_async.response_document.length; i++)
            if (!('ccdk' in index_async.response_document[i])) return false;
        return true;
    },

    complete: function() {
        if (!index_async.sent &&
            index_async.claimed_count_complete() &&
            index_async.unclaimed_count_complete()) {
            index_async.sent = true;
            return true;
        }
        return false;
    },

    // initialize 7.2.2 Control flow pattern #2
    initialize: function() {
        index_async.sent = false;
        index_async.response_document = [];
    }
};

// index get a list of game-repo documents
exports.index = function(req, res) {

    // initialize 7.2.2 Control flow pattern #2
    index_async.initialize();

    gamerepoth.find({}, function(err, doc) {

        // handle error 
        if (err) return handleError(res, err);

        // assign copy of document
        index_async.response_document = make_duplicate_gamerepoth(doc);

        // 7.2.2 Control flow pattern #2
        index_async.response_document.forEach(function(item) {
            index_async.uccdk(item, function(complete) {
                if (complete) res.json(index_async.response_document);
            });
            index_async.ccdk(item, function(complete) {
                if (complete) res.json(index_async.response_document);
            });
        });
    });
};
 
 
/**
 * Finds document or documents, by specifying which document fields to include or exclude.
 * returns example : gamename: [{gamekey, keystatus}, {gamekey, keystatus}, {gamekey, keystatus}]
 * @param {object} req - request is an instance of http.IncomingMessage.
 * @param {object} res - and response is an instance of http.ServerResponse.
 */
exports.show = function(req, res) {

    var query = {
        'gamename': req.params.gametitle
    };

    var select = {
        '_id': 0,
        'gamekey': 1,
        'keystatus': 1
    };

    gametitles.find(query, select, function(err, doc) {
        return err // return
            ? handleError(res, err) // handle error
            : res.json(doc); // handle success
    });
};
/**
 * update adds gamekeys to gametitles collection in gamerepo database
 * put url:port/api/game-repo/ accepts post fields gamename (string),
 * gamekeys (CSV/String) 
 * @param {object} req  - is an instance of http.IncomingMessage..
 * @param {object} res  - and response is an instance of http.ServerResponse.
 */
exports.update = function(req, res) {

    // query object
    var query = {
        // user can only update 1 gamename at a time
        'gamename': parse_form_gametitles(req.body)[0].gamename,
        // get gamekeys as $in condition
        'gamekey': {
            $in: get_gamekeys_query(parse_form_gametitles(req.body))
        }
    };

    gamerepoth.findOne({
        gamename: query.gamename
    }, function(err, found) {

        // handle error
        if (err) return handleError(res, err);

        // handle found
        if (!found) return handleError(res, {
            message: ' could not update'
        });

        // insert gametitle document, handle error || create gamerepo document
        gametitles.find(query, function(err, found) {

            // handle error
            if (err) return handleError(res, err);

            return found.length
                // handle found
                ? handleError(res, {
                    message: ' duplicate entry found, could not update'
                })
                // create gamerepoth document, handle error || create gamerepo document
                : gamerepo_logic.insert(req, res);
        });
    });
};

// destroy an individual game-repo document
exports.destroy = function(req, res) {
    gametitles.findById(req.params.id, function(err, doc) {

        // handle error
        if (err) return handleError(res, err);

        // if document by _id found, remove, return error else 
        // attempt to remove document if error, return error, 
        // else, return success
        return !doc ? res.send(404) : doc.remove(function(err) {
            return err ? handleError(res, err) : res.send(204);
        });
    });
};

// has, accepts an array of gametitles, returns true || false
exports.has_by_json = function(req, res) {

    var gamelist = parse_multiformat_data(req.body.gamelist);

    gamerepoth.find({
        gamename: {
            $in: gamelist
        }
    }, function(err, found) {

        // handle error
        if (err) return handleError(res, err);

        // return result
        return found.length !== gamelist.length
            // gamelist in gametitles not found
            ? handleError(res, {
                result: false,
                error: ""
            })
            // all gametitles in gamelist found
            : res.send(200, {
                result: true,
                error: ""
            });
    });
};

/**
 * post url:port/api/game-repo/claim/:gametitle accepts post fields timestamp 
 * (String), 
 * sends email to customers, provided email, containing cd-keys.
 * @param {object} req  - is an instance of http.IncomingMessage..
 * @param {object} res  - and response is an instance of http.ServerResponse.
 */
exports.claim = function(req, res) {

    // create a query
    var query = {
        keystatus: true,
        gamenameSlug: req.params.gamenameSlug
    };

    // create update
    var update = {
        keystatus: false,
        timestamp: req.body.timestamp
    };

    gametitles.findOne(query, function(err, doc) {

        // handle error
        if (err) return handleError(res, err);

        // handle no avaliable gamekey
        if (!doc) return handleError(res, {
            message: ' no avaliable gamekey'
        });

        // claim redemptionkey
        gametitles.update({
            _id: doc._id
        }, update, function(err, updated) {

            // handle 
            if (err) handleError(res, {
                message: ' error, could not update'
            });

            // process threshold
            process_threshold(req.params.gamenameSlug);

            // handle return
            return !updated
                // handle update false
                ? handleError(res, err)
                // handle update true
                // return avaliable gamekey
                : res.send({
                    result: doc
                });

        });
    });
};

/**
 * processthreshold, will send an email to the admin, based on
 * 1-100%, if gamerepoth =< [(total unclaimed cd-keys / total cd-keys) x 100%]
 * @param {string} gamename - the name/title of the game
 */
function process_threshold(gamenameSlug) {
    // total unclaimed cd-keys
    gametitles.count({
        'gamenameSlug': gamenameSlug,
        'keystatus': 'true'
    }, function(err, unclaimed) {
        // total cd-keys
        gametitles.count({
            'gamenameSlug': gamenameSlug
        }, function(err, total) {

            var query = {
                'gamenameSlug': gamenameSlug
            };

            var select = {
                '_id': 0,
                'threshold': 1
            };

            // gamerepoth threshold
            gamerepoth.findOne(query, select, function(err, threshold) {
                var threshold = threshold.threshold;
                if (unclaimed / total * 100 <= threshold)
                    email.send({
                        text: gamenameSlug + ' is below threshold',
                        to: 'email@innobyt.com'
                    });
            });
        });
    });
}

function handleError(res, err) {
    return res.send(500, err);
}

// accepts, form body, and return required args
function parse_form_gamerepoth(args) {
    return {
        threshold: args.threshold,
        gamename: args.gamename,
        gamenameSlug: args.gamenameSlug,
        totalcount: tally_gametitles_entries(args)
    };
}
// returns an array of entries
function parse_form_gametitles(args) {

    // parse gamekeys as an array
    var gamekeys = parse_multiformat_data(args.gamekeys);


    // create an array of entries
    for (var i = 0, array_of_entries = []; i < gamekeys.length; i++) {
        array_of_entries.push({
            'gamename': args.gamename,
            'gamenameSlug': args.gamenameSlug,
            'gamekey': gamekeys[i],
            'keystatus': true
        });
    }

    return array_of_entries;
}

// accepts parse_form_gametitles results, returns a gamekey query array
function get_gamekeys_query(array_of_entries) {
    for (var i = 0, gamekey_query = []; i < array_of_entries.length; i++) {
        gamekey_query.push(array_of_entries[i].gamekey);
    }
    return gamekey_query;
}

// return totalcount of created entries
function tally_gametitles_entries(args) {
    return parse_form_gametitles(args).length;
}
/**
 * parse_multiformat_data converts a csv or comma separated string of
 * cd-keys into an array of cd-keys.
 * @param {string} cdkeys - csv or comma separated string of cd-keys
 */
function parse_multiformat_data(cdkeys) {

    // support unix/window compliance
    var adjust = cdkeys.replace(/\r\n/g, ",");
    adjust = adjust.replace(/\n/g, ",");
    adjust = adjust.replace(/,\s/g, ",");
    adjust = adjust.replace(/\s,/g, ",");
    adjust = adjust.split(",");

    // remove "" || " " || null || 'undefined'
    for (var i = 0; i < adjust.length; i++) {

        if (adjust[i] === "" ||
            adjust[i] === " " ||
            adjust[i] === 'undefined' ||
            adjust[i] === null) {
            adjust.splice(i, 1);
        }
    }

    return adjust;
}

/**
 * make duplicate gamerepoth documents, returns array of documents
 * @param {array} doc - mongodb/mongoose returned document/s
 */
function make_duplicate_gamerepoth(doc) {
    // create modifed return
    for (var i = 0, duplicate = []; i < doc.length; i++) {
        duplicate.push({
            'gamename': doc[i].gamename,
            'gamenameSlug': doc[i].gamenameSlug,
            'threshold': doc[i].threshold,
            'totalcount': doc[i].totalcount
        });
    }

    return duplicate;
}