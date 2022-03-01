import App from './App.svelte'
import Amplify from "aws-amplify";


Amplify.configure({
  Auth: {
    identityPoolId: "ap-southeast-2:9516c777-b834-4b85-ad80-5aa1ac6422ca",
    region: "ap-southeast-2",
    userPoolId: "ap-southeast-2_eA1Ul6xTa",
    userPoolWebClientId: "6gg9nfd5vjfmhl9ejck88mo5oh",
    mandatorySignIn: true,
    authenticationFlowType: "USER_PASSWORD_AUTH"
  },
  API: {
    endpoints: [
      {
        name: "Endpoint",
        endpointType: "REST",
        endpoint:
          "https://3m4eesj849.execute-api.ap-southeast-2.amazonaws.com/prod",
        authorizationType: "AWS_IAM",
        region: "ap-southeast-2"
      }
    ]
  },
});

const app = new App({
  target: document.getElementById('app')
})

export default app
