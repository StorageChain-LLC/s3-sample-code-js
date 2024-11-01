const { HttpRequest } = require('@aws-sdk/protocol-http');
const { NodeHttpHandler } = require('@aws-sdk/node-http-handler');

async function executeCustomRoute(s3Creds, path, method = 'GET', body = null) {
  const endpointDetails = await s3Creds.s3Client.config.endpoint();
  const request = new HttpRequest({
    method,
    protocol: endpointDetails?.protocol,
    hostname: endpointDetails?.hostname,
    path: `/${path}`,

    headers: {
      host: endpointDetails?.hostname,
      Authorization: `Credential=${s3Creds.accessKeyId}/${s3Creds.secretAccessKey}`,
    },
  });

  if (body) {
    request.body = JSON.stringify(body);
    request.headers['Content-Type'] = 'application/json';
  }

  const handler = new NodeHttpHandler();

  try {
    const { response } = await handler.handle(request);

    const responseBody = await new Promise((resolve, reject) => {
      let responseData = '';
      response.body.on('data', (chunk) => (responseData += chunk));
      response.body.on('end', () => resolve(responseData));
      response.body.on('error', reject);
    });

    return {
      statusCode: response.statusCode,
      body: JSON.parse(responseBody),
    };
  } catch (error) {
    console.error('Error executing custom route:', error);
    throw error;
  }
}

const getSignedUrl = async (s3Creds, bucketName, objectWithPath) => {
  const parts = objectWithPath.split('/');
  const objectName = parts.pop();

  let prefix = '';

  if (parts?.length > 0) {
    prefix = parts.join('/') + '/';
  }

  const encodedObjectName = encodeURIComponent(objectName);
  const response = await executeCustomRoute(
    s3Creds,
    `${bucketName}/${prefix}${encodedObjectName}/signed-url`
  );

  return response?.body?.signedURL;
};

// async function executeCustomRoute(
//   s3Client,
//   path,
//   method = 'GET',
//   body = null,
//   accessKeyId,
//   secretAccessKey
// ) {
//   const endpointDetails = await s3Client.config.endpoint();

//   const request = new HttpRequest({
//     method,
//     protocol: endpointDetails.protocol,
//     hostname: endpointDetails.hostname,
//     path: `/${path}`,
//     headers: {
//       host: endpointDetails.hostname,
//       Authorization: `Credential=${accessKeyId}/${secretAccessKey}`,
//     },
//   });
//   if (body) {
//     request.body = JSON.stringify(body);
//     request.headers['Content-Type'] = 'application/json';
//   }
//   const handler = new NodeHttpHandler();
//   try {
//     const { response } = await handler.handle(request);
//     const responseBody = await new Promise((resolve, reject) => {
//       let responseData = '';
//       response.body.on('data', (chunk) => (responseData += chunk));
//       response.body.on('end', () => resolve(responseData));
//       response.body.on('error', reject);
//     });
//     return {
//       statusCode: response.statusCode,
//       body: JSON.parse(responseBody),
//     };
//   } catch (error) {
//     console.error('Error executing custom route:', error);
//     throw error;
//   }
// }

// const getSignedUrl = async (
//   s3Client,
//   bucketName,
//   objectName,
//   accessKeyId,
//   secretAccessKey
// ) => {
//   const response = await executeCustomRoute(
//     s3Client,
//     `${bucketName}/${objectName}/signed-url`,
//     accessKeyId,
//     secretAccessKey
//   );
//   return response?.body?.signedURL;
// };

module.exports = getSignedUrl;
