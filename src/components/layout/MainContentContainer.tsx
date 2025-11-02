import { component$, Slot, useStyles$ } from "@builder.io/qwik";
import styles from './MainContentContainer.scss?inline';



export default component$(() => {
  useStyles$(styles);

  return (
    <>
      <div class="main-content-container">
        <Slot />
      </div>
    </>
  );
});
