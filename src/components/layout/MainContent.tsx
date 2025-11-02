import { component$, Slot, useStyles$ } from "@builder.io/qwik";
import styles from "./MainContent.scss?inline";



export default component$(() => {
  useStyles$(styles);

  return (
    <>
      <div class="main-content-wrapper">
        <div class="main-content">
          <Slot />
        </div>
      </div>
    </>
  );
});
