exports.handler = async function(event, context) {
  console.log("request:", JSON.stringify(event, undefined, 2));
  const identity = context.identity

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain" },
    body: `Hello, CDK! You've hit ${event.path}!!!}`,
    identity
  };
};
