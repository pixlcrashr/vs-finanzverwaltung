import { component$, QRL, Slot, useStylesScoped$ } from "@builder.io/qwik";
import styles from './MainContentMenuHeader.scss?inline';



interface MainContentMenuHeaderProps {
  onClose$: QRL<() => void>;
}

export default component$<MainContentMenuHeaderProps>(({ onClose$ }) => {
  useStylesScoped$(styles);

  return (
    <>
      <div class="main-content-menu-header">
        <h2><Slot /></h2>

        <div class="main-content-menu-close">
          <button class="delete is-medium" onClick$={() => onClose$()}></button>
        </div>
      </div>
    </>
  );
});
