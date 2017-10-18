const https = require('https')
const request = require('request')
const crypto = require('crypto');

//////////////////////////////////////////////////////////
/// Azure Cosmos DB node.js REST example, TablesDB API ///
//////////////////////////////////////////////////////////


// Azure Cosmos DB account > Connection String > ACCOUNT_NAME
var account = "stepan-infront"

// Azure Cosmos DB account > Data Explorer > TABLES
var table = "kid_status"

// Azure Cosmos DB account > Connection String > ACCOUNT KEY
var secret = "ASecretIsASecret=="


function hashMe(secret, toHash) {
	var secretBuf = new Buffer(secret, 'base64')
	var dataBuf = new Buffer(toHash)
	const hmac = crypto.createHmac('sha256', secretBuf)
	hmac.update(dataBuf)
	return hmac.digest("base64")
}

function getAuthorizationTokenUsingMasterKey(verb, resourceType, resourceId, date, masterKey) {  

    var text = (verb || "").toLowerCase() + "\n" +   
               (resourceType || "").toLowerCase() + "\n" +   
               (resourceId || "") + "\n" +   
               date.toLowerCase() + "\n" +   
               "" + "\n";  

    var body = new Buffer(text, "utf8");  
    var signature = hashMe(masterKey, body)
    var MasterToken = "master";  
    var TokenVersion = "1.0";
    return encodeURIComponent("type=" + MasterToken + "&ver=" + TokenVersion + "&sig=" + signature);
}  

function getTable() {

    var date = new Date().toUTCString()
    var path = "/dbs/TablesDB/colls/" + table
    var auth =  getAuthorizationTokenUsingMasterKey("GET", "colls", "dbs/TablesDB/colls/" + table, date, secret)

    var kid_options = {
        hostname: account + ".documents.azure.com",
        port: 443,
        path: path,
        method: "GET",
        headers: {
            "Content-Type": "application/query+json",
            "x-ms-documentdb-isquery": "true",
            "Accept": "application/json",
            "x-ms-date": date,
            "Authorization": auth,
            "x-ms-version": "2015-12-16"
        }	
    }

    console.log("kid_options=", kid_options)


    var req = https.request(kid_options, (res) => {
      console.log('statusCode:', res.statusCode);
      console.log('headers:', res.headers);

      res.on('data', (d) => {
        process.stdout.write(d);
      });
    });

    req.on('error', (e) => {
      console.error(e);
    });

    req.end()
}

function getRow(partitionKey, id) {

    var date = new Date().toUTCString()
    var path = "dbs/TablesDB/colls/" + table + "/docs/" + id
    var spath = path

    var auth =  getAuthorizationTokenUsingMasterKey("GET", "docs", spath, date, secret)

    var kid_options = {
        hostname: account + ".documents.azure.com",
        port: 443,
        path: "/" + path,
        method: "GET",
        headers: {
            "Content-Type": "application/query+json",
            "x-ms-documentdb-isquery": "true",
            "Accept": "application/json",
            "x-ms-date": date,
            "Authorization": auth,
            "x-ms-version": "2015-12-16",
            "x-ms-documentdb-partitionkey": "[\"" + partitionKey + "\"]"
        }	
    }

    var req = https.request(kid_options, (res) => {
      console.log('statusCode:', res.statusCode);
      res.on('data', (d) => {
        process.stdout.write(d);
      });
    });

    req.on('error', (e) => {
      console.error(e);
    });

    req.end()
}


function insertRow(partitionKey, id) {

    var data = {
        "$pk": partitionKey,
        "$id": id.toString(),
        "id": id.toString(),
        "is_read": {
            "$t": 8,
            "$v": true
        }
    }
    var payload = JSON.stringify(data)

    var date = new Date().toUTCString()
    var path = "dbs/TablesDB/colls/" + table + "/docs"
    var spath = "dbs/TablesDB/colls/" + table

    var auth =  getAuthorizationTokenUsingMasterKey("POST", "docs", spath, date, secret)

    var kid_options = {
        hostname: account + ".documents.azure.com",
        port: 443,
        path: "/" + path,
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-ms-documentdb-isquery": "true",
            "Accept": "application/json",
            "x-ms-date": date,
            "Authorization": auth,
            "x-ms-version": "2015-12-16",
            "x-ms-documentdb-partitionkey": "[\"" + partitionKey + "\"]",
            "Content-Length": Buffer.byteLength(payload)
        }	
    }
    
//    console.log(kid_options)
//    console.log(payload, payload.length)
    
    var url = "https://" + kid_options.hostname + ":" + kid_options.port + kid_options.path
    
    var op2 = {
        url: url,
        headers: kid_options.headers,
        body : payload
        
    }
    console.log(op2)
    
    
    request.post(
        op2,
        function (error, response, body) {
            console.log(response.statusCode)
            console.log(body)
        }        
    )
}

//getTable()

insertRow("NO0003", "123069")
//insertRow("NO0003", "123061")

//getRow("NO0003", "123060")
//getRow("NO0003", "123061")


