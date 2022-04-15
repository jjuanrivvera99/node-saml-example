const express = require("express");
const cors = require(`cors`);
const bodyParser = require("body-parser");
require("body-parser-xml")(bodyParser);

const fs = require(`fs`);

const { parseSamlRequest } = require(`./parseSamlRequest`);
const { getAuthnResponse } = require(`./getAuthnResponse`);
const axios = require(`axios`);
var saml = require("saml").Saml20;

const {
  isObject,
  printObjectKeys,
  getRandomId,
  getCurrentTime,
  getFutureTime
} = require(`./utils.js`);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.xml());
app.use("/", parseSamlRequest);

app.get(`/`, async (req, res, next) => {
  console.log(`1`);
  console.log(`req.authnRequest = `);
  console.log(req.authnRequest);

  var options1 = {
    cert:
      "MIIDazCCAlOgAwIBAgIUIHmKY06TpTnFEsfVQ2lEgvh2FSEwDQYJKoZIhvcNAQELBQAwRTELMAkGA1UEBhMCVUsxEzARBgNVBAgMClNvbWUtU3RhdGUxITAfBgNVBAoMGEludGVybmV0IFdpZGdpdHMgUHR5IEx0ZDAeFw0yMjAxMjAwNzI3MTBaFw0zMjAxMjAwNzI3MTBaMEUxCzAJBgNVBAYTAlVLMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDQazJziUNrbQnlbivI0/QmsNR706ecNYqnTwSnGHlwKab08NPUYBq8LzZ1zwGjRXqtKbS1Kx7/VrVQDXBV4+trC2/MslzUOl5J1tNL2C5elP9Uv/sAweOUP+rawEq5sowEVCZ2Q0Gr0TTD6f0Gw7GJ1m60UnciJDr8LW1LgO4LCt3coYbv9jYy8ZmXpzD3IHPqZquuy16CKnvlZBXRZgqanZ7z1MktWoEsqBKcYww3J53LIi9rZLTdc1w46sYu32/bSLZMzFt/Z4Pup4JYz6pK1Wi0R4bIMheoEU3IR/WUH8cfWckYKZWJ9tR4rBXDpcXCMonFyJ/W9KtmOmaFDuLTAgMBAAGjUzBRMB0GA1UdDgQWBBT/IjZuG71bcYLFKJiYXaijBPD22zAfBgNVHSMEGDAWgBT/IjZuG71bcYLFKJiYXaijBPD22zAPBgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQCPOLpwVG9ezW2D+ZmsatE8N+61l7vNfhkvJ9VG+21lp6/BGb+2kenHxKin8fE9YnlXYUC5gwLH2g+bTLMw4O1HPNIQvVFvd9Q1dfkQM7cF4j9zJ8K7CZ+ZAIV6aUHo4WNz374TKdWpYmTTgj92i0TvkKGzrN9kQgNx+W4myR8YQRrd8BnQpGydkkGYnQegYhtptylgmClRfQO4xq9Q/45ltZIzaaNIBltLXbNWFwlgFnHQxCJb3haLWNFKEv26iyw4AnaWL8phwRqhn+QMQmfv+R2lj+p5E+FcUIP58V80uL4tVO2HGdLfGLpLhrTNSMzVefxTFkkjIOD+DU4ke/rO",
    key:
      "MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDQazJziUNrbQnlbivI0/QmsNR706ecNYqnTwSnGHlwKab08NPUYBq8LzZ1zwGjRXqtKbS1Kx7/VrVQDXBV4+trC2/MslzUOl5J1tNL2C5elP9Uv/sAweOUP+rawEq5sowEVCZ2Q0Gr0TTD6f0Gw7GJ1m60UnciJDr8LW1LgO4LCt3coYbv9jYy8ZmXpzD3IHPqZquuy16CKnvlZBXRZgqanZ7z1MktWoEsqBKcYww3J53LIi9rZLTdc1w46sYu32/bSLZMzFt/Z4Pup4JYz6pK1Wi0R4bIMheoEU3IR/WUH8cfWckYKZWJ9tR4rBXDpcXCMonFyJ/W9KtmOmaFDuLTAgMBAAECggEAWk0Hx+1CC8prjj9ksxe6YgUdmyUCKvk7wO/ImUlOXF1/nAK4FP0quDxQgUyWbhJNa7d1N0WeoY0E89FOybf9qRyEbREejUlYzu9ID0V0GcC+vA6OBy76lqH29J56AektJzb6jyTm0DXNgdDgs0yYoJsKzhAo098Uu2xHPX54JMnhIpniFaljuSoUv7XjmYCeV0JL+bgGD9Z2EgV5v96Ezq02CsJVmjOg5hnwB+Chn3yKUY0IoKHx0CHVREjPzXnf/lducEtC/z3/a0nXjZ9evurYDgQOlrl0c/rjaFEGb1/6Z3P1QpePWTYe0WXtklm4gkyOY2sFkWEzSiFWRL9eQQKBgQDyG/rTpAIWX31bX8ka26jP7HzvF9bqzlqqImwfhWbxfnyuV05pOmxI7D4sox/xQU4PNcXc4nBESa0tFnhUwUGVqrujFtqqZEfUQPAmB3Yc3C6e3uNYZEdHMruhVSZhEL1TUg7WQ2UWHoOu9/ROHqilCMhBtFq9rO2sTeghWcN0YQKBgQDcYGG0znEx/NHagbx20Ju2taDu2hXpPa8KCsYEcHiyA4+QkVeSOXnhbuHE/vsqLYCJuSGzbe4B76yRJuHNyoj3wAXL/5dhFAvorp2PJyg7wbUkQMRYjv5lDPv0hzbVEiKPblq/IVt5homj7MXjwLo0rP//ouuiWP33OvjSdkNjswKBgBnVdHk6yeI7RDQIz3unLqcpE9erUopxhGkdDS573JUuKv2rYTmHO2C4nJXEvjbPAhZLZZaBLvuKZQknmaVpjab7tdPcL275DlUOrNFSAH9p2yummtmmsZheSHkZjePTlnAalGy2ekXW8bQszwu658HcYwnnxbrxhdbZ5UgRvPJhAoGAfjMLgNj/5ZpcKn9FB91qbnUQlfd5uLnENUH6J6yo0XhMjINO3MPhUgGHdKJ3/q1UAIpuDCyVsbIo5m6XvJuRWB80sp/JdqReNX9ZZxMLbTz+mKYmSniIoiGPX3bXJale9ThC61UU50DuLVt373b8qxGvABuySKQhu6SfvRZQfRUCgYBn/KQnK1StUgNDrinGm9Qp0fYrC3z18UDxZSIDuhccLrcQNTsVPIK+cmY3N1O3mameyMFXgSPUCpXX+U2aThZ6wz+6Smi8qWvr8kd1x+8bxMq2pglmuTcVWPSVelhIA76UjFPGwK0wcRZ5ljGqGILs+Gay3B443r+vXZ+8wk7n8A==",
    issuer: "urn:issuer",
    lifetimeInSeconds: 600,
    audiences: "urn:myapp",
    attributes: {
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress":
        "foo@bar.com",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name": "Foo Bar"
    },
    nameIdentifier: "foo",
    sessionIndex: "_faed468a-15a0-4668-aed6-3d9c478cc8fa"
  };

  var signedAssertion1 = saml.create(options1);
  console.log(signedAssertion1);

  // {
  //   responseId,
  //     assertionId,
  //     issueInstant,
  //     issueExpire,
  //     destination,
  //     inResponseTo,
  //     issuer,
  //     statusValue;
  // }
  let data = null;
  const samlIssuer = `https://7slk2.sse.codesandbox.io/`;
  if (req.authnRequest) {
    const authnResponseParams = {
      responseId: getRandomId(),
      assertionId: getRandomId(),
      issueInstant: getCurrentTime(),
      issueExpire: getFutureTime(10),
      destination: req.authnRequest.acsUrl,
      inResponseTo: req.authnRequest.id,
      audienceRestriction: req.authnRequest.issuer,
      // use req.authnRequest.destination as the issuer
      // because the url where Github send us the samlRequest (destination) is the place where we send the samlResponse back from (issuer)
      issuer: samlIssuer,
      statusValue: `urn:oasis:names:tc:SAML:2.0:status:Success`
    };

    console.log(`sending authResponse to Github`);

    const newSAMLResponseFileName = `./src/SAMlResponse_${getRandomId().substring(
      0,
      4
    )}.saml.xml`;

    fs.writeFile(
      newSAMLResponseFileName,
      getAuthnResponse(authnResponseParams),
      (err) => {
        if (err) {
          console.log(err);
          return;
        }

        console.log(`SAML file is written`);
      }
    );

    const authnResponse = new Buffer(
      getAuthnResponse(authnResponseParams)
    ).toString("base64");

    console.log(`authnResponse = `);
    console.log(authnResponse);

    await axios
      .post(
        authnResponseParams.destination,
        // `https://receiveRequestServer.dungngbp.repl.co`,
        authnResponse,
        {
          headers: {
            // Overwrite Axios's automatically set Content-Type
            "Content-Type": "application/xml"
          },
          params: {
            RelayState: req.authnRequest.relayState,
            SAMLResponse: req.authnRequest.samlRequest
          }
        }
      )
      .then(function (response) {
        //console.log(response);
        console.log(
          `response === undefined? ${response === undefined ? "true" : "false"}`
        );

        console.log(`Object.keys(response) = `);
        console.log(Object.keys(response));

        console.log(`response.status = ${response.status}`);
        console.log(`response.statusText = ${response.statusText}`);

        // console.log(`response.data = `);
        // this is where we get the html file
        // console.log(response.data);

        if (response.status === 200) {
          console.log(`authentication succeeds!`);
          data = response.data;
        }
      });
    //   res.type("xml");
    //   res.status(200).send(getAuthnResponse(authnResponseParams));
  }

  if (data) {
    console.log(`Sending the data `);
    res.set("Content-Type", "text/html");
    res.send(data);
  } else {
    console.log("message");
    // res.send("No SAML being sent yet");
    var options = {
      cert:
        "MIIDazCCAlOgAwIBAgIUIHmKY06TpTnFEsfVQ2lEgvh2FSEwDQYJKoZIhvcNAQELBQAwRTELMAkGA1UEBhMCVUsxEzARBgNVBAgMClNvbWUtU3RhdGUxITAfBgNVBAoMGEludGVybmV0IFdpZGdpdHMgUHR5IEx0ZDAeFw0yMjAxMjAwNzI3MTBaFw0zMjAxMjAwNzI3MTBaMEUxCzAJBgNVBAYTAlVLMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDQazJziUNrbQnlbivI0/QmsNR706ecNYqnTwSnGHlwKab08NPUYBq8LzZ1zwGjRXqtKbS1Kx7/VrVQDXBV4+trC2/MslzUOl5J1tNL2C5elP9Uv/sAweOUP+rawEq5sowEVCZ2Q0Gr0TTD6f0Gw7GJ1m60UnciJDr8LW1LgO4LCt3coYbv9jYy8ZmXpzD3IHPqZquuy16CKnvlZBXRZgqanZ7z1MktWoEsqBKcYww3J53LIi9rZLTdc1w46sYu32/bSLZMzFt/Z4Pup4JYz6pK1Wi0R4bIMheoEU3IR/WUH8cfWckYKZWJ9tR4rBXDpcXCMonFyJ/W9KtmOmaFDuLTAgMBAAGjUzBRMB0GA1UdDgQWBBT/IjZuG71bcYLFKJiYXaijBPD22zAfBgNVHSMEGDAWgBT/IjZuG71bcYLFKJiYXaijBPD22zAPBgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQCPOLpwVG9ezW2D+ZmsatE8N+61l7vNfhkvJ9VG+21lp6/BGb+2kenHxKin8fE9YnlXYUC5gwLH2g+bTLMw4O1HPNIQvVFvd9Q1dfkQM7cF4j9zJ8K7CZ+ZAIV6aUHo4WNz374TKdWpYmTTgj92i0TvkKGzrN9kQgNx+W4myR8YQRrd8BnQpGydkkGYnQegYhtptylgmClRfQO4xq9Q/45ltZIzaaNIBltLXbNWFwlgFnHQxCJb3haLWNFKEv26iyw4AnaWL8phwRqhn+QMQmfv+R2lj+p5E+FcUIP58V80uL4tVO2HGdLfGLpLhrTNSMzVefxTFkkjIOD+DU4ke/rO",
      key:
        "MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDQazJziUNrbQnlbivI0/QmsNR706ecNYqnTwSnGHlwKab08NPUYBq8LzZ1zwGjRXqtKbS1Kx7/VrVQDXBV4+trC2/MslzUOl5J1tNL2C5elP9Uv/sAweOUP+rawEq5sowEVCZ2Q0Gr0TTD6f0Gw7GJ1m60UnciJDr8LW1LgO4LCt3coYbv9jYy8ZmXpzD3IHPqZquuy16CKnvlZBXRZgqanZ7z1MktWoEsqBKcYww3J53LIi9rZLTdc1w46sYu32/bSLZMzFt/Z4Pup4JYz6pK1Wi0R4bIMheoEU3IR/WUH8cfWckYKZWJ9tR4rBXDpcXCMonFyJ/W9KtmOmaFDuLTAgMBAAECggEAWk0Hx+1CC8prjj9ksxe6YgUdmyUCKvk7wO/ImUlOXF1/nAK4FP0quDxQgUyWbhJNa7d1N0WeoY0E89FOybf9qRyEbREejUlYzu9ID0V0GcC+vA6OBy76lqH29J56AektJzb6jyTm0DXNgdDgs0yYoJsKzhAo098Uu2xHPX54JMnhIpniFaljuSoUv7XjmYCeV0JL+bgGD9Z2EgV5v96Ezq02CsJVmjOg5hnwB+Chn3yKUY0IoKHx0CHVREjPzXnf/lducEtC/z3/a0nXjZ9evurYDgQOlrl0c/rjaFEGb1/6Z3P1QpePWTYe0WXtklm4gkyOY2sFkWEzSiFWRL9eQQKBgQDyG/rTpAIWX31bX8ka26jP7HzvF9bqzlqqImwfhWbxfnyuV05pOmxI7D4sox/xQU4PNcXc4nBESa0tFnhUwUGVqrujFtqqZEfUQPAmB3Yc3C6e3uNYZEdHMruhVSZhEL1TUg7WQ2UWHoOu9/ROHqilCMhBtFq9rO2sTeghWcN0YQKBgQDcYGG0znEx/NHagbx20Ju2taDu2hXpPa8KCsYEcHiyA4+QkVeSOXnhbuHE/vsqLYCJuSGzbe4B76yRJuHNyoj3wAXL/5dhFAvorp2PJyg7wbUkQMRYjv5lDPv0hzbVEiKPblq/IVt5homj7MXjwLo0rP//ouuiWP33OvjSdkNjswKBgBnVdHk6yeI7RDQIz3unLqcpE9erUopxhGkdDS573JUuKv2rYTmHO2C4nJXEvjbPAhZLZZaBLvuKZQknmaVpjab7tdPcL275DlUOrNFSAH9p2yummtmmsZheSHkZjePTlnAalGy2ekXW8bQszwu658HcYwnnxbrxhdbZ5UgRvPJhAoGAfjMLgNj/5ZpcKn9FB91qbnUQlfd5uLnENUH6J6yo0XhMjINO3MPhUgGHdKJ3/q1UAIpuDCyVsbIo5m6XvJuRWB80sp/JdqReNX9ZZxMLbTz+mKYmSniIoiGPX3bXJale9ThC61UU50DuLVt373b8qxGvABuySKQhu6SfvRZQfRUCgYBn/KQnK1StUgNDrinGm9Qp0fYrC3z18UDxZSIDuhccLrcQNTsVPIK+cmY3N1O3mameyMFXgSPUCpXX+U2aThZ6wz+6Smi8qWvr8kd1x+8bxMq2pglmuTcVWPSVelhIA76UjFPGwK0wcRZ5ljGqGILs+Gay3B443r+vXZ+8wk7n8A==",
      issuer: "urn:issuer",
      lifetimeInSeconds: 600,
      audiences: "urn:myapp",
      attributes: {
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress":
          "foo@bar.com",
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name": "Foo Bar"
      },
      nameIdentifier: "foo",
      sessionIndex: "_faed468a-15a0-4668-aed6-3d9c478cc8fa"
    };

    var signedAssertion = saml.create(options);
    res.send(signedAssertion);
  }

  next();
});

app.post(`/`, (req, res, next) => {
  console.log(`req.authnRequest = `);
  //console.log(req.authnRequest);
  res.send("Pepe");
});

app.listen(process.env.PORT || PORT, () =>
  console.log(`App is running at ${process.env.PORT || PORT}`)
);
