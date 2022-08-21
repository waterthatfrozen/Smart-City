const axios = require('axios').default;
const sql = require('mssql');
const dotenv = require('dotenv');
dotenv.config();

exports.helloWorld = function (_req, res) {
    res.status(200).send({
        message: "Hello World!",
        timestamp: new Date().toISOString()
    });
};

exports.testSendData = function (req, res) {
    try {
        res.status(200).send({
            message: "received data successfully",
            received_body: req.body
        });
    } catch (error) {
        res.status(500).send({
            message: "error on receiving data",
            error: error
        });
    }
};

exports.testSelectData = function (req, res) {
    var selectQuery = "SELECT * FROM dbo.test_message";
    if (req.query.id) {
        var queryId = req.query.id;
        queryId = queryId.split(' ');
        selectQuery = selectQuery + " WHERE messageId = " + queryId[0];
    }
    sql.query(selectQuery, function (err, result) {
        if (err) {
            res.status(500).send({
                message: "error on selecting data",
                error: err
            });
        } else {
            res.status(200).send({
                message: "Executed SELECT query successfully",
                received_body: result.recordset
            });
        }
    });
};

exports.testInsertData = function (req, res) {
    if (!req.body) {
        res.status(400).send({
            message: "message is required"
        });
    } else {
        try {
            var insertMessage = req.body;
            console.log(insertMessage);
            // replace ' with '' in insertMessage
            // insertMessage = insertMessage.replace(/'/g, "''");
            var insertQuery = "INSERT INTO dbo.test_message (messageText) VALUES ('" + JSON.stringify(insertMessage) + "')";
            sql.query(insertQuery, function (err, result) {
                if (err) {
                    throw err;
                } else {
                    res.status(200).send({
                        message: "Executed INSERT query successfully",
                        response: result
                    });
                }
            });
        } catch (err) {
            res.status(500).send({
                message: "error on inserting data",
                error: err
            });
        }
    }
};

exports.testUpdateData = function (req, res) {
    if (!req.body.message || !req.body.id) {
        res.status(400).send({
            message: "Both message and id are required"
        });
    } else {
        try {
            var updateMessage = req.body.message;
            // replace ' with '' in updateMessage
            updateMessage = updateMessage.replace(/'/g, "''");
            var updateId = req.body.id;
            updateId = updateId.split(' ');
            var updateQuery = "UPDATE dbo.test_message SET messageText = '" + updateMessage + "' WHERE messageId = " + updateId[0];
            sql.query(updateQuery, function (err, result) {
                if (err) {
                    throw err;
                } else {
                    res.status(200).send({
                        message: "Executed UPDATE query successfully",
                        response: result
                    });
                }
            });
        } catch (err) {
            res.status(500).send({
                message: "error on updating data",
                error: err
            });
        }
    }
};

exports.testDeleteData = function (req, res) {
    if (!req.query.id) {
        res.status(400).send({
            message: "id is required"
        });
    } else {
        try {
            var deleteId = req.query.id;
            deleteId = deleteId.split(' ');
            var deleteQuery = "DELETE FROM dbo.test_message WHERE messageId = " + deleteId[0];
            sql.query(deleteQuery, function (err, result) {
                if (err) {
                    throw err;
                } else {
                    res.status(200).send({
                        message: "Executed DELETE query successfully",
                        response: result
                    });
                }
            });
        } catch (err) {
            res.status(500).send({
                message: "error on deleting data",
                error: err
            });
        }
    }
};