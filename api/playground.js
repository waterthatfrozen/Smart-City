const axios = require('axios').default;
const sql = require('mssql');
const dotenv = require('dotenv');
dotenv.config();

const sqlConfig = {
    user: process.env.SQL_UNAME,
    password: process.env.SQL_PWD,
    server: process.env.SQL_SERVER,
    database: process.env.SQL_DB
};

sql.connect(sqlConfig, function (err) {
    if (err) {
        console.log(err);
    } else {
        console.log('Connected to SQL Server');
    }
});

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
        selectQuery = selectQuery + " WHERE messageId = " + req.query.id;
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
    if (!req.body.message) {
        res.status(400).send({
            message: "message is required"
        });
    } else {
        try {
            var insertQuery = "INSERT INTO dbo.test_message (messageText) VALUES ('" + req.body.message + "')";
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
            var updateQuery = "UPDATE dbo.test_message SET messageText = '" + req.body.message + "' WHERE messageId = " + req.body.id;
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
            var deleteQuery = "DELETE FROM dbo.test_message WHERE messageId = " + req.query.id;
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