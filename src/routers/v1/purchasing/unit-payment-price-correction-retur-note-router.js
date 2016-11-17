var Router = require('restify-router').Router;
var router = new Router();
var db = require("../../../db");
var UnitPaymentPriceCorrectionNoteManager = require("dl-module").managers.purchasing.UnitPaymentPriceCorrectionNoteManager;
var resultFormatter = require("../../../result-formatter");
const apiVersion = '1.0.0';
var passport = require('../../../passports/jwt-passport');

var handlePdfRequest = function (request, response, next) {
    db.get().then(db => {
        var manager = new UnitPaymentPriceCorrectionNoteManager(db, request.user);

        var id = request.params.id;
        manager.pdfReturNote(id)
            .then(docBinary => {
                // var base64 = 'data:application/pdf;base64,' + docBinary.toString('base64')
                var dateFormat = "DD MMMM YYYY";
                var locale = 'id-ID';
                var moment = require('moment');
                moment.locale(locale);
                response.writeHead(200, {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename=Nota Retur - ${moment(new Date()).format(dateFormat)}.pdf`,
                    'Content-Length': docBinary.length
                });
                response.end(docBinary);
            })
            .catch(e => {
                var error = resultFormatter.fail(apiVersion, 400, e);
                response.send(400, error);
            });
    })
        .catch(e => {
            var error = resultFormatter.fail(apiVersion, 400, e);
            response.send(400, error);
        });
};

router.get('/:id', passport, (request, response, next) => {
    db.get().then(db => {
        if ((request.headers.accept || '').toString().indexOf("application/pdf") >= 0) {
            next();
        }
        else {
            var manager = new UnitPaymentPriceCorrectionNoteManager(db, request.user);
            var id = request.params.id;
            manager.getSingleById(id)
                .then(doc => {
                    var result = resultFormatter.ok(apiVersion, 200, doc);
                    response.send(200, result);
                })
                .catch(e => {
                    var error = resultFormatter.fail(apiVersion, 400, e);
                    response.send(400, error);
                });
        }
    })
        .catch(e => {
            var error = resultFormatter.fail(apiVersion, 400, e);
            response.send(400, error);
        });
}, handlePdfRequest);

module.exports = router;