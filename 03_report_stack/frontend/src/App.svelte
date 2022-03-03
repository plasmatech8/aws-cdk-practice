<script>
  import { onMount } from "svelte";
  import * as pbi from "powerbi-client";
  import { Auth, API } from "aws-amplify";

  import logo from "./assets/svelte.png";

  let username;
  let password;

  let user;
  let response = {};
  let reportFrame;

  onMount(() => {
    console.log("Mounted");
    updateUser();
  });

  async function updateUser() {
    try {
      user = await Auth.currentAuthenticatedUser();
    } catch (e) {
      console.log(e);
      user = null;
    }
  }

  async function signUp() {
    console.log("Signing Up");
    await Auth.signUp({
      username: username,
      password: password,
    });
    updateUser();
  }

  async function signIn() {
    console.log("Signing In");
    user = await Auth.signIn(username, password);
  }

  async function signOut() {
    console.log("Signing Out");
    const res = await Auth.signOut();
    updateUser();
  }

  async function get(resource, data) {
    console.log("Calling API GET");
    response = {};
    data.headers = {
      Authorization: user?.signInUserSession?.idToken?.jwtToken,
    };
    try {
      response = await API.get("Endpoint", resource, data);
    } catch (e) {
      response = e;
    }
  }

  async function post(resource, data) {
    console.log("Calling API POST");
    data.headers = {
      Authorization: user?.signInUserSession?.idToken?.jwtToken,
    };
    response = {};
    response = await API.post("Endpoint", resource, data);
  }

  async function showReport() {
    const permissions = pbi.models.Permissions.Read;
    const { accessToken, expiry, status } = response.body;
    const embedUrl = response.body.embedUrl[0].embedUrl;
    const config = {
      type: "report",
      tokenType: pbi.models.TokenType.Embed, //  pbi.models.TokenType.Aad,
      accessToken: accessToken,
      embedUrl: embedUrl,
      id: "76f6bf00-74ac-4311-81fb-4a5e54a3e7a8",
      permissions: permissions,
      settings: {
        filterPaneEnabled: false,
        navContentPaneEnabled: false,
      },
    };
    const powerbi = new pbi.service.Service(
      pbi.factories.hpmFactory,
      pbi.factories.wpmpFactory,
      pbi.factories.routerFactory
    );
    console.log(reportFrame);
    const report = powerbi.embed(reportFrame, config);
    report.off("loaded");
    report.off("rendered");
    report.on("error", function () {
      report.off("error");
    });
  }
</script>

<main>
  <img src={logo} alt="Svelte Logo" class="logo" />
  <h1>Hello world!</h1>
  <div>
    {#if !user}
      <label for="username">Username</label>
      <input type="text" id="username" name="username" bind:value={username} />
      <br />
      <label for="password">Password</label>
      <input
        type="password"
        id="password"
        name="password"
        bind:value={password}
      />
      <br />
      <button on:click={signUp}>Sign Up</button>
      <button on:click={signIn}>Sign In</button>
    {:else}
      <p>You are logged in as {user.username}</p>
      <br />
      <p><button on:click={signOut}>Sign Out</button></p>
    {/if}
  </div>
  <div>
    Hello:
    <button on:click={() => get("/hello", {})}>GET</button>
    <button on:click={() => post("/hello", { body: {} })}>POST</button>
  </div>
  <div>
    GetEmbedInfo:
    <button on:click={() => get("/getEmbedInfo", {})}>GET</button>
    <button on:click={() => post("/getEmbedInfo", { body: {} })}>POST</button>
  </div>
  <div class="grid">
    <div class="item">
      Call Response:
      <pre><code>{JSON.stringify(response, null, 4)}</code></pre>
    </div>
    <div class="item">
      User Object:
      <pre><code>{JSON.stringify(user, null, 4)}</code></pre>
    </div>
  </div>
  <div>
    <p>
      <button on:click={showReport}>Show Report</button>
    </p>
    <div bind:this={reportFrame} title="Report" class="reportFrame" />
  </div>
</main>

<style>
  :root {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  }

  main {
    text-align: center;
    padding: 1em;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4rem;
    font-weight: 100;
    line-height: 1.1;
    margin: 2rem auto;
    max-width: 14rem;
  }
  pre {
    text-align: left;
    background-color: black;
    color: white;
    white-space: pre-wrap;
    overflow: auto;
  }
  code {
    text-overflow: ellipsis;
  }

  .grid {
    display: grid;
    grid-template-columns: 50% 50%;
  }

  .item {
    padding: 0.5em;
    background: #efefef;
    border: 3px solid #333;
    min-height: 400px;
    max-height: 400px;
    overflow: scroll;
  }

  .reportFrame {
    width: 1000px;
    height: 600px;
  }

  .logo {
    height: 200px;
    width: 200px;
  }
</style>
