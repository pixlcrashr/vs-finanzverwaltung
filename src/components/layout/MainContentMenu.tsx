import { component$, Signal, Slot, useStyles$ } from "@builder.io/qwik";
import styles from './MainContentMenu.scss?inline';



interface MainContentMenuProps {
  isShown: Readonly<Signal<boolean>>;
}

export default component$<MainContentMenuProps>(({
  isShown
}) => {
  useStyles$(styles);

  return (
    <>
      <div class={["main-content-menu", {
        "is-active": isShown.value
      }]}>
        <div class="main-content-menu-wrapper">
          <Slot name="header" />
          <Slot name="content" />
        </div>
      </div>
    </>
  );
});
