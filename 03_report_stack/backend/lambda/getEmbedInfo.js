const AWS = require('aws-sdk');
const { getEmbedInfo } = require('./embedding/embedConfigService')

const secretName = 'VAS-MS-ACCOUNT-MARK';
const secretRegion = "ap-southeast-2";

exports.handler = async function(event, context) {
    const client = new AWS.SecretsManager({ region: secretRegion })
    const secret = await client.getSecretValue({ SecretId: secretName }).promise()
    const pbiCreds = JSON.parse(secret.SecretString)
    const config = {
        "authenticationMode": "MasterUser",
        "authorityUri": "https://login.microsoftonline.com/common/v2.0",
        "scope": "https://analysis.windows.net/powerbi/api",
        "apiUrl": "https://api.powerbi.com/",
        "clientId": pbiCreds.clientId,
        "workspaceId": pbiCreds.workspaceId,
        "pbiUsername": pbiCreds.pbiUsername,
        "pbiPassword": pbiCreds.pbiPassword,
        "reportId": "76f6bf00-74ac-4311-81fb-4a5e54a3e7a8",
    }
    const response = await getEmbedInfo(config)
    return {
        statusCode: 200,
        headers: { "Content-Type": "text/plain" },
        body: response
    };
};
