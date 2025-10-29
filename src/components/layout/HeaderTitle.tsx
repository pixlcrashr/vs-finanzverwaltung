import { component$, Slot, useStylesScoped$ } from "@builder.io/qwik";
import styles from "./HeaderTitle.scss?inline";

export default component$(() => {
  useStylesScoped$(styles);

  return (
    <div class="header-title">
      <h1 class="subtitle is-6"><Slot/></h1>
    </div>
  );
});
