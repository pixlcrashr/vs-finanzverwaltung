import { component$ } from "@builder.io/qwik";

export default component$(() => {
  return (
    <nav class="navbar has-shadow">
      <div class="navbar-brand">
        <a class="navbar-item" style="float: left" href="/">
          <img height="32" width="32" src="/assets/logo.svg"/>
        </a>
      </div>
      <div class="navbar-end">
        <div class="navbar-item">
          <div class="buttons">
            <a class="button is-primary is-small"><strong>Login</strong></a>
          </div>
        </div>
      </div>
    </nav>
  );
})
