<script>
  import logo from "./assets/svelte.png";
  import { Auth, API } from "aws-amplify";
  import { onMount } from "svelte";
  let username;
  let password;

  let user;
  let response = {};

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

  async function callGet() {
    console.log("Calling API GET");
    response = {};
    try {
      response = await API.get("Endpoint", "/hello", {});
    } catch (e) {
      response = e;
    }
  }

  async function callPost() {
    console.log("Calling API POST");
    response = {};
    response = await API.post("Endpoint", "/hello", { body: {} });
  }
</script>

<main>
  <img src={logo} alt="Svelte Logo" />
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
    <p><button on:click={callGet}>Call GET</button></p>
    <p><button on:click={callPost}>Call POST</button></p>
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
    min-height: 800px;
  }
</style>
