Error from middleware: NoSuchKey: The specified key does not exist.
at S3RestXmlProtocol.handleError (C:\Users\Ahmed Habeeb\Documents\vsCode\js\farming_assistant_collage\Backend\node_modules\@aws-sdk\core\dist-cjs\submodules\protocols\index.js:1864:27)
at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
at async S3RestXmlProtocol.deserializeResponse (C:\Users\Ahmed Habeeb\Documents\vsCode\js\farming_assistant_collage\Backend\node_modules\@smithy\core\dist-cjs\submodules\protocols\index.js:341:13)
at async C:\Users\Ahmed Habeeb\Documents\vsCode\js\farming_assistant_collage\Backend\node_modules\@smithy\core\dist-cjs\submodules\schema\index.js:25:24
at async C:\Users\Ahmed Habeeb\Documents\vsCode\js\farming_assistant_collage\Backend\node_modules\@aws-sdk\middleware-sdk-s3\dist-cjs\index.js:350:20
at async C:\Users\Ahmed Habeeb\Documents\vsCode\js\farming_assistant_collage\Backend\node_modules\@smithy\core\dist-cjs\submodules\retry\index.js:172:50
at async C:\Users\Ahmed Habeeb\Documents\vsCode\js\farming_assistant_collage\Backend\node_modules\@aws-sdk\middleware-sdk-s3\dist-cjs\index.js:64:28
at async C:\Users\Ahmed Habeeb\Documents\vsCode\js\farming_assistant_collage\Backend\node_modules\@aws-sdk\middleware-sdk-s3\dist-cjs\index.js:91:20
at async C:\Users\Ahmed Habeeb\Documents\vsCode\js\farming_assistant_collage\Backend\node_modules\@aws-sdk\core\dist-cjs\submodules\client\index.js:119:26
at async S3Repository.get (file:///C:/Users/Ahmed%20Habeeb/Documents/vsCode/js/farming_assistant_collage/Backend/repositories/s3Cloud.repository.js:55:12) {
'$fault': 'client',
  '$retryable': undefined,
'$metadata': {
httpStatusCode: 404,
requestId: '18B70824B196D0D7',
extendedRequestId: undefined,
cfId: undefined,
attempts: 1,
totalRetryDelay: 0
},
Code: 'NoSuchKey',
Key: 'test-key',
BucketName: 'plants',
Resource: '/plants/test-key',
RequestId: '18B70824B196D0D7',
HostId: ''
}
