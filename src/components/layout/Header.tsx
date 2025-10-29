import { component$, Slot, useStylesScoped$ } from "@builder.io/qwik";
import styles from "./Header.scss?inline";

export default component$(() => {
  useStylesScoped$(styles);

  return (
    <div class="header">
      <Slot/>
    </div>
  );
});
