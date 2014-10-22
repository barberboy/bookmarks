/**
 * search.js
 * ---------
 * Routes for the advanced search feature.
 */
var express = require('express');
var Bookmark = require('../models/Bookmark.js');

// New router instance for the search route.
var search = express.Router();

// Middleware to retrieve the list of hostnames and pass to template.
search.use(function(req, res, next) {
    Bookmark.distinct('url.hostname', function(err, hostnames) {
        res.locals.hostnames = hostnames;
        next(err);
    });
});
// Route for the search query.
search.get('/', function(req, res, next) {
    // Build up the base query object
    var query = Bookmark.find();

    // Filter by hostname
    var hn = req.query.hostname;
    if (hn) {
        try {
            hn = new RegExp(hn);
        }
        catch (e) {
            // Do a sub-string match on hostname if the RexExp is not invalid.
            console.warn("Bad regex pattern: %s", e);
        }
        query.and({
            'url.hostname': hn
        });
    }

    // Do a sub-string match on title, description, OR href
    var q = req.query.q;
    if (q) {
        try {
            q = new RegExp(q, 'i');
        }
        catch (e) {
            console.warn("Bad regex pattern: %s", e);
        }
        query.or([{
            title: q
        }, {
            description: q
        }, {
            href: q
        }]);
    }

    // Sort by create time, descending
    query.sort('-created');

    // Execute the query!
    query.exec(function(err, bookmarks) {
        if (err) {
            return next(err);
        }

        var response = {
            bookmarks: bookmarks,
        };

        if (req.query.format === 'json') {
            return res.json(response);
        }
        else if (req.query.format === 'jsonp') {
            return res.jsonp(response);
        }
        else {
            // Add additional information into the context.
            response.title = "Bookmarks - Search Results",
                response.query = req.query;
            return res.render('search', response);
        }
    });
});

// Export the search router object.
exports.search = search;